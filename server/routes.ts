import type { Express, Request, Response, NextFunction } from "express";
import { type Server } from "http";
import rateLimit from "express-rate-limit";
import crypto from "crypto";
import { storage } from "./storage";
import { chatWithGrandchild, recognizeMeter, analyzeIntent } from "./ai";
import {
  insertReminderSchema,
  insertEventSchema,
  insertUtilityMetricSchema,
  insertMemoirSchema,
  insertHealthLogSchema,
} from "@shared/schema";
import { z } from "zod";
import bcrypt from "bcrypt";

function generateLinkCode(): string {
  return crypto.randomBytes(3).toString("hex").toUpperCase();
}

function validateBody<T>(schema: z.ZodSchema<T>, req: Request, res: Response): T | null {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    const msg = result.error.errors.map(e => e.message).join("; ");
    res.status(400).json({ message: `Ошибка валидации: ${msg}` });
    return null;
  }
  return result.data;
}

function parseIdParam(req: Request, res: Response): number | null {
  const id = parseInt(req.params.id as string);
  if (isNaN(id) || id <= 0) {
    res.status(400).json({ message: "Некорректный ID" });
    return null;
  }
  return id;
}

function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId) {
    return res.status(401).json({ message: "Необходима авторизация" });
  }
  next();
}

async function resolveParentId(userId: number): Promise<number | null> {
  const user = await storage.getUser(userId);
  if (!user) return null;
  return user.role === "parent" ? user.id : (user.linkedParentId ?? null);
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // ========== RATE LIMITERS ==========
  const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: { message: "Слишком много попыток входа. Подождите 15 минут." },
    standardHeaders: true,
    legacyHeaders: false,
  });

  const registerLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 3,
    message: { message: "Слишком много регистраций. Подождите час." },
    standardHeaders: true,
    legacyHeaders: false,
  });

  const linkLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: { message: "Слишком много попыток привязки. Подождите 15 минут." },
    standardHeaders: true,
    legacyHeaders: false,
  });

  // ========== AUTH ==========
  const registerSchema = z.object({
    name: z.string().min(1, "Имя обязательно"),
    email: z.string().email("Некорректный email"),
    password: z.string().min(4, "Пароль минимум 4 символа"),
    role: z.enum(["parent", "child"]),
  });

  const loginSchema = z.object({
    email: z.string().email("Некорректный email"),
    password: z.string().min(1, "Введите пароль"),
  });

  app.post("/api/auth/register", registerLimiter, async (req, res) => {
    try {
      const data = validateBody(registerSchema, req, res);
      if (!data) return;
      const existing = await storage.getUserByEmail(data.email);
      if (existing) {
        return res.status(400).json({ message: "Пользователь с таким email уже существует" });
      }
      const hashedPassword = await bcrypt.hash(data.password, 10);
      const user = await storage.createUser({ ...data, password: hashedPassword });
      let linkCode: string | undefined;
      if (user.role === "parent") {
        linkCode = generateLinkCode();
        await storage.updateUserLinkCode(user.id, linkCode);
      }
      req.session.userId = user.id;
      req.session.userRole = user.role;
      const response: any = { id: user.id, name: user.name, email: user.email, role: user.role };
      if (linkCode) response.linkCode = linkCode;
      return res.json({ user: response });
    } catch (e: any) {
      return res.status(400).json({ message: e.message });
    }
  });

  app.post("/api/auth/login", loginLimiter, async (req, res) => {
    try {
      const data = validateBody(loginSchema, req, res);
      if (!data) return;
      const user = await storage.getUserByEmail(data.email);
      if (!user) {
        return res.status(401).json({ message: "Неверный email или пароль" });
      }
      const valid = await bcrypt.compare(data.password, user.password);
      if (!valid) {
        return res.status(401).json({ message: "Неверный email или пароль" });
      }
      req.session.userId = user.id;
      req.session.userRole = user.role;
      return res.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role, linkedParentId: user.linkedParentId } });
    } catch (e: any) {
      return res.status(400).json({ message: e.message });
    }
  });

  app.get("/api/auth/me", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Не авторизован" });
    }
    const user = await storage.getUser(req.session.userId);
    if (!user) {
      return res.status(401).json({ message: "Пользователь не найден" });
    }
    const response: any = { id: user.id, name: user.name, email: user.email, role: user.role, linkedParentId: user.linkedParentId };
    if (user.role === "parent" && user.linkCode) {
      response.linkCode = user.linkCode;
    }
    return res.json({ user: response });
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy(() => {
      res.json({ success: true });
    });
  });

  // ========== LINK PARENT ==========
  const linkSchema = z.object({
    linkCode: z.string().min(4).max(8),
  });

  app.post("/api/link-parent", requireAuth, linkLimiter, async (req, res) => {
    try {
      const data = validateBody(linkSchema, req, res);
      if (!data) return;
      const childId = req.session.userId!;
      const parent = await storage.getUserByLinkCode(data.linkCode.trim().toUpperCase());
      if (!parent) {
        return res.status(404).json({ message: "Код не найден. Проверьте и попробуйте снова." });
      }
      if (parent.linkCodeExpiresAt && new Date(parent.linkCodeExpiresAt) < new Date()) {
        return res.status(400).json({ message: "Код истёк. Попросите родителя сгенерировать новый код." });
      }
      await storage.linkParent(childId, parent.id);
      return res.json({ parentId: parent.id, parentName: parent.name });
    } catch (e: any) {
      return res.status(400).json({ message: e.message });
    }
  });

  // ========== REMINDERS ==========
  app.get("/api/reminders", requireAuth, async (req, res) => {
    const userId = req.session.userId!;
    const list = await storage.getReminders(userId);
    return res.json(list);
  });

  app.post("/api/reminders", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const parentId = await resolveParentId(userId);
      if (!parentId) {
        return res.status(400).json({ message: "Сначала привяжите родителя" });
      }
      const parsed = insertReminderSchema.parse({ ...req.body, userId, parentId });
      const reminder = await storage.createReminder(parsed);
      await storage.createEvent({
        userId,
        parentId,
        type: "medication",
        severity: "info",
        title: `Добавлено напоминание: ${reminder.medicineName}`,
        description: `Время: ${String(reminder.timeHour).padStart(2, "0")}:${String(reminder.timeMinute).padStart(2, "0")}`,
      });
      return res.json(reminder);
    } catch (e: any) {
      return res.status(400).json({ message: e.message });
    }
  });

  const reminderStatusSchema = z.object({
    status: z.enum(["confirmed", "missed", "pending"]),
  });

  app.patch("/api/reminders/:id/status", requireAuth, async (req, res) => {
    try {
      const id = parseIdParam(req, res);
      if (id === null) return;
      const data = validateBody(reminderStatusSchema, req, res);
      if (!data) return;
      const userId = req.session.userId!;
      const parentId = await resolveParentId(userId);
      const reminder = await storage.getReminder(id);
      if (!reminder || (reminder.userId !== userId && reminder.parentId !== parentId)) {
        return res.status(403).json({ message: "Нет доступа к этому напоминанию" });
      }
      const updated = await storage.updateReminderStatus(id, data.status);
      return res.json(updated);
    } catch (e: any) {
      return res.status(400).json({ message: e.message });
    }
  });

  app.delete("/api/reminders/:id", requireAuth, async (req, res) => {
    const id = parseIdParam(req, res);
    if (id === null) return;
    const userId = req.session.userId!;
    const parentId = await resolveParentId(userId);
    const reminder = await storage.getReminder(id);
    if (!reminder || (reminder.userId !== userId && reminder.parentId !== parentId)) {
      return res.status(403).json({ message: "Нет доступа к этому напоминанию" });
    }
    await storage.deleteReminder(id);
    return res.json({ success: true });
  });

  // ========== EVENTS ==========
  app.get("/api/events", requireAuth, async (req, res) => {
    const userId = req.session.userId!;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
    const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;
    const list = await storage.getEvents(userId, limit, offset);
    return res.json(list);
  });

  app.post("/api/events", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const data = insertEventSchema.parse({ ...req.body, userId });
      const event = await storage.createEvent(data);
      return res.json(event);
    } catch (e: any) {
      return res.status(400).json({ message: e.message });
    }
  });

  app.patch("/api/events/:id/read", requireAuth, async (req, res) => {
    const id = parseIdParam(req, res);
    if (id === null) return;
    const userId = req.session.userId!;
    const event = await storage.getEvent(id);
    if (!event || event.userId !== userId) {
      return res.status(403).json({ message: "Нет доступа к этому событию" });
    }
    await storage.markEventRead(id);
    return res.json({ success: true });
  });

  app.get("/api/events/unread-count", requireAuth, async (req, res) => {
    const userId = req.session.userId!;
    const count = await storage.getUnreadEventsCount(userId);
    return res.json({ count });
  });

  // ========== UTILITY METRICS ==========
  app.get("/api/utility-metrics", requireAuth, async (req, res) => {
    const userId = req.session.userId!;
    const user = await storage.getUser(userId);
    if (!user?.linkedParentId) return res.json([]);
    const list = await storage.getUtilityMetrics(user.linkedParentId);
    return res.json(list);
  });

  app.post("/api/utility-metrics", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const parentId = await resolveParentId(userId);
      if (!parentId) {
        return res.status(400).json({ message: "Сначала привяжите родителя" });
      }
      const data = insertUtilityMetricSchema.parse({ ...req.body, userId, parentId });
      const metric = await storage.createUtilityMetric(data);
      await storage.createEvent({
        userId,
        parentId,
        type: "utility",
        severity: "info",
        title: `Показания ${metric.meterType} переданы`,
        description: `Значение: ${metric.value}`,
      });
      return res.json(metric);
    } catch (e: any) {
      return res.status(400).json({ message: e.message });
    }
  });

  // ========== MEMOIRS ==========
  app.get("/api/memoirs", requireAuth, async (req, res) => {
    const userId = req.session.userId!;
    const user = await storage.getUser(userId);
    if (!user?.linkedParentId) return res.json([]);
    const list = await storage.getMemoirs(user.linkedParentId);
    return res.json(list);
  });

  app.post("/api/memoirs", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const user = await storage.getUser(userId);
      if (!user?.linkedParentId) {
        return res.status(400).json({ message: "Сначала привяжите родителя" });
      }
      const data = insertMemoirSchema.parse({ ...req.body, userId, parentId: user.linkedParentId });
      const memoir = await storage.createMemoir(data);
      return res.json(memoir);
    } catch (e: any) {
      return res.status(400).json({ message: e.message });
    }
  });

  // ========== HEALTH LOGS ==========
  app.get("/api/health-logs", requireAuth, async (req, res) => {
    const userId = req.session.userId!;
    const user = await storage.getUser(userId);
    if (!user?.linkedParentId) return res.json([]);
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 30;
    const list = await storage.getHealthLogs(user.linkedParentId, limit);
    return res.json(list);
  });

  app.post("/api/health-logs", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const parentId = await resolveParentId(userId);
      if (!parentId) {
        return res.status(400).json({ message: "Сначала привяжите родителя" });
      }
      const data = insertHealthLogSchema.parse({ ...req.body, parentId });
      const log = await storage.createHealthLog(data);
      await storage.createEvent({
        userId,
        parentId,
        type: "checkin",
        severity: "info",
        title: "Давление записано",
        description: `${log.systolic}/${log.diastolic}${log.note ? ` — ${log.note}` : ""}`,
      });
      return res.json(log);
    } catch (e: any) {
      return res.status(400).json({ message: e.message });
    }
  });

  // ========== AI ENDPOINTS ==========
  app.post("/api/ai/chat", requireAuth, async (req, res) => {
    try {
      const { messages } = req.body;
      if (!messages || !Array.isArray(messages)) {
        return res.status(400).json({ message: "Отправьте массив messages" });
      }
      const userId = req.session.userId!;
      const user = await storage.getUser(userId);
      const parent = user?.linkedParentId ? await storage.getUser(user.linkedParentId) : null;

      const RECIPE_CLARIFICATIONS: Record<string, string> = {
        "борщ": "А какой борщ хочешь? Классический, украинский, с курицей или вегетарианский? 🍲",
        "суп": "А какой суп? Куриный, грибной, гороховый, щи, харчо? 🍲",
        "пирог": "А какой пирог? С яблоками, с мясом, с ягодами, с капустой, с творогом? 🥧",
        "салат": "А какой салат? Оливье, цезарь, винегрет, овощной, с курицей? 🥗",
        "каша": "А какая каша? Овсяная, гречневая, рисовая, манная, пшённая? 🥣",
        "блины": "А какие блины? Тонкие на молоке, дрожжевые, с начинкой, на кефире? 🥞",
        "пельмени": "А какие пельмени? Классические с мясом, с курицей, домашние, ленивые? 🥟",
        "вареники": "А какие вареники? С картошкой, с вишней, с творогом, ленивые? 🥟",
        "котлеты": "А какие котлеты? Из фарша классические, куриные, рыбные, по-киевски? 🍖",
        "запеканка": "А какая запеканка? Творожная, картофельная, с мясом, макаронная? 🍽",
        "пирожки": "А какие пирожки? С мясом, с капустой, с картошкой, с яблоками? 🥧",
        "торт": "А какой торт? Наполеон, медовик, шоколадный, бисквитный, птичье молоко? 🎂",
        "печенье": "А какое печенье? Овсяное, песочное, шоколадное, с изюмом? 🍪",
        "оладьи": "А какие оладьи? На кефире, с яблоками, банановые, пышные? 🥞",
        "плов": "А какой плов? Узбекский классический, с курицей, со свининой, овощной? 🍚",
      };

      const lastUserMsg = messages[messages.length - 1]?.content?.toLowerCase()?.trim()?.replace(/[?.!,]$/g, "") || "";
      const dishBase = lastUserMsg.replace(/^рецепт\s+/, "").trim();
      const DISH_FORMS: Record<string, string> = {
        "борща": "борщ", "борщу": "борщ", "борщом": "борщ",
        "супа": "суп", "супу": "суп", "супом": "суп", "супчик": "суп", "супчика": "суп",
        "пирога": "пирог", "пирогу": "пирог", "пирогом": "пирог",
        "салата": "салат", "салату": "салат", "салатик": "салат", "салатика": "салат",
        "каши": "каша", "кашу": "каша", "кашей": "каша", "кашку": "каша",
        "блинов": "блины", "блинчики": "блины", "блинчиков": "блины",
        "пельменей": "пельмени", "пельмешки": "пельмени",
        "вареников": "вареники",
        "котлет": "котлеты", "котлетки": "котлеты", "котлеток": "котлеты",
        "запеканки": "запеканка", "запеканку": "запеканка",
        "пирожков": "пирожки",
        "торта": "торт", "тортик": "торт", "тортика": "торт",
        "печенья": "печенье", "печеньки": "печенье",
        "оладий": "оладьи", "оладушки": "оладьи",
        "плова": "плов",
      };
      const normalizedDish = DISH_FORMS[dishBase] || dishBase;
      const clarification = RECIPE_CLARIFICATIONS[normalizedDish];
      if (clarification) {
        return res.json({
          reply: clarification,
          hasAlert: false,
          intent: "recipe",
          imageUrl: null,
        });
      }

      const parentName = user?.role === "parent" ? user.name : (parent?.name || undefined);
      const result = await chatWithGrandchild(messages, parentName, userId);

      if (result.hasAlert) {
        const alertTitle = result.intent === "scam"
          ? "Возможная попытка мошенничества!"
          : result.intent === "home_danger"
          ? "Опасная ситуация дома!"
          : result.intent === "lost"
          ? "Родитель потерялся на улице!"
          : "Родитель сообщил о проблеме со здоровьем!";
        const alertDescription = messages[messages.length - 1]?.content || "";

        if (user?.role === "parent") {
          const children = await storage.getChildrenByParentId(userId);
          for (const child of children) {
            await storage.createEvent({
              userId: child.id,
              parentId: userId,
              type: "alert",
              severity: "critical",
              title: alertTitle,
              description: alertDescription,
            });
          }
          if (children.length === 0) {
            await storage.createEvent({
              userId,
              parentId: userId,
              type: "alert",
              severity: "critical",
              title: alertTitle,
              description: alertDescription,
            });
          }
        } else {
          const parentId = await resolveParentId(userId);
          await storage.createEvent({
            userId,
            parentId: parentId || userId,
            type: "alert",
            severity: "critical",
            title: alertTitle,
            description: alertDescription,
          });
        }
      }

      return res.json({
        reply: result.reply,
        hasAlert: result.hasAlert,
        intent: result.intent,
        imageUrl: result.imageUrl || null,
      });
    } catch (e: any) {
      return res.status(500).json({ message: "Ошибка AI: " + e.message });
    }
  });

  app.post("/api/ai/recognize-meter", requireAuth, async (req, res) => {
    try {
      const { imageBase64 } = req.body;
      if (!imageBase64) {
        return res.status(400).json({ message: "Отправьте изображение в base64" });
      }
      const userId = req.session.userId!;
      const result = await recognizeMeter(imageBase64, userId);
      return res.json(result);
    } catch (e: any) {
      return res.status(500).json({ message: "Ошибка распознавания: " + e.message });
    }
  });

  app.post("/api/ai/analyze-intent", requireAuth, async (req, res) => {
    try {
      const { text } = req.body;
      if (!text) {
        return res.status(400).json({ message: "Отправьте text" });
      }
      const result = await analyzeIntent(text);
      return res.json(result);
    } catch (e: any) {
      return res.status(500).json({ message: "Ошибка анализа: " + e.message });
    }
  });

  // ========== DASHBOARD SUMMARY ==========
  app.get("/api/dashboard", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const user = await storage.getUser(userId);
      if (!user) return res.status(404).json({ message: "Пользователь не найден" });

      const isParent = user.role === "parent";
      const parentId = isParent ? user.id : (await storage.getLinkedParent(userId))?.id;

      const recentEvents = await storage.getEvents(userId, 10, 0);
      const unreadCount = await storage.getUnreadEventsCount(userId);

      const remindersList = isParent
        ? await storage.getRemindersByParent(user.id)
        : await storage.getReminders(userId);

      let healthLogsList: any[] = [];
      let metricsList: any[] = [];
      let memoirsList: any[] = [];

      if (parentId) {
        healthLogsList = await storage.getHealthLogs(parentId, 7);
        metricsList = await storage.getUtilityMetrics(parentId);
        memoirsList = await storage.getMemoirs(parentId);
      }

      const hasCritical = recentEvents.some(e => e.severity === "critical" && !e.isRead);
      const hasWarning = recentEvents.some(e => e.severity === "warning" && !e.isRead);
      const overallStatus = hasCritical ? "critical" : hasWarning ? "warning" : "ok";

      const userResponse: any = { id: user.id, name: user.name, email: user.email, role: user.role };
      if (isParent && user.linkCode) {
        userResponse.linkCode = user.linkCode;
      }

      const parent = isParent
        ? { id: user.id, name: user.name }
        : parentId ? { id: parentId, name: (await storage.getUser(parentId))?.name } : null;

      return res.json({
        user: userResponse,
        parent,
        overallStatus,
        unreadCount,
        recentEvents,
        reminders: remindersList,
        healthLogs: healthLogsList,
        utilityMetrics: metricsList,
        memoirs: memoirsList,
      });
    } catch (e: any) {
      return res.status(500).json({ message: e.message });
    }
  });

  // ========== SUBSCRIPTIONS ==========
  app.get("/api/subscription", requireAuth, async (req, res) => {
    const userId = req.session.userId!;
    const sub = await storage.getSubscription(userId);
    return res.json(sub || null);
  });

  const subscriptionSchema = z.object({
    plan: z.enum(["basic", "standard", "premium"]),
  });

  app.post("/api/subscription", requireAuth, async (req, res) => {
    try {
      const data = validateBody(subscriptionSchema, req, res);
      if (!data) return;
      const userId = req.session.userId!;
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30);
      const sub = await storage.createSubscription({ userId, plan: data.plan, status: "active", expiresAt });
      return res.json(sub);
    } catch (e: any) {
      return res.status(400).json({ message: e.message });
    }
  });

  // ========== WAITLIST ==========
  const waitlistSchema = z.object({
    email: z.string().email("Некорректный email"),
  });

  app.post("/api/waitlist", async (req, res) => {
    try {
      const data = validateBody(waitlistSchema, req, res);
      if (!data) return;
      const entry = await storage.addToWaitlist(data.email);
      const count = await storage.getWaitlistCount();
      return res.json({ success: true, position: count });
    } catch (e: any) {
      if (e.message?.includes("unique")) {
        return res.json({ success: true, message: "Вы уже в списке!" });
      }
      return res.status(400).json({ message: e.message });
    }
  });

  return httpServer;
}