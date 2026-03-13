import type { Express, Request, Response, NextFunction } from "express";
import { type Server } from "http";
import rateLimit from "express-rate-limit";
import crypto from "crypto";
import { storage } from "./storage";
import { chatWithGrandchild, recognizeMeter, analyzeIntent, detectIntentLocal } from "./ai";
import { extractDishFromText, RECIPE_CLARIFICATIONS } from "./recipeUtils";
import { bot, formatAlertPush } from "./telegram";
import { sendChildNotification } from "./childBot";
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

async function hasActiveSubscription(userId: number): Promise<boolean> {
  const user = await storage.getUser(userId);
  if (!user) return false;

  const checkSub = async (uid: number): Promise<boolean> => {
    const sub = await storage.getSubscription(uid);
    if (!sub) return false;
    if (sub.status !== "active") return false;
    if (sub.expiresAt && new Date(sub.expiresAt) < new Date()) return false;
    return true;
  };

  if (await checkSub(userId)) return true;

  if (user.role === "child" && user.linkedParentId) {
    return checkSub(user.linkedParentId);
  }

  if (user.role === "parent") {
    const children = await storage.getChildrenByParentId(userId);
    for (const child of children) {
      if (await checkSub(child.id)) return true;
    }
  }

  return false;
}

function requireSubscription(req: Request, res: Response, next: NextFunction) {
  const userId = req.session.userId;
  if (!userId) {
    return res.status(401).json({ message: "Необходима авторизация" });
  }
  hasActiveSubscription(userId).then((active) => {
    if (!active) {
      return res.status(403).json({
        message: "Для доступа к этой функции необходима подписка. Оформите подписку в разделе «Тарифы».",
        code: "SUBSCRIPTION_REQUIRED",
      });
    }
    next();
  }).catch((err) => {
    console.error("[requireSubscription] Error:", err);
    return res.status(500).json({ message: "Ошибка проверки подписки" });
  });
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
      if (user.role === "parent" || user.role === "child") {
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
    if (user.linkCode) {
      response.linkCode = user.linkCode;
    }
    return res.json({ user: response });
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy(() => {
      res.json({ success: true });
    });
  });

  // ========== CHILD TELEGRAM LINKING ==========
  app.post("/api/child-telegram-token", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const user = await storage.getUser(userId);
      if (!user || user.role !== "child") {
        return res.status(400).json({ message: "Только для аккаунтов детей" });
      }
      if (user.telegramChatId) {
        return res.json({ alreadyLinked: true });
      }
      const token = "CHILDTG_" + crypto.randomBytes(4).toString("hex").toUpperCase();
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
      await storage.createChildTelegramToken(token, userId, expiresAt);
      return res.json({ token });
    } catch (e: any) {
      return res.status(400).json({ message: e.message });
    }
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
      const caller = await storage.getUser(childId);
      if (!caller || caller.role !== "child") {
        return res.status(400).json({ message: "Только аккаунт ребёнка может привязать родителя" });
      }
      const parent = await storage.consumeLinkCode(data.linkCode.trim().toUpperCase());
      if (!parent) {
        return res.status(404).json({ message: "Код не найден или истёк. Проверьте и попробуйте снова." });
      }
      if (parent.role !== "parent") {
        return res.status(400).json({ message: "Этот код принадлежит не родителю. Проверьте код." });
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

      if (log.systolic >= 160 || log.diastolic >= 100 || log.systolic <= 90) {
        const parent = await storage.getUser(parentId);
        const parentName = parent?.name || "Родитель";
        const anomalyType = log.systolic <= 90 ? "ниже" : "выше";
        const children = await storage.getChildrenByParentId(parentId);
        for (const child of children) {
          await storage.createEvent({
            userId: child.id,
            parentId,
            type: "checkin",
            severity: "warning",
            title: `Давление ${anomalyType} нормы: ${log.systolic}/${log.diastolic}`,
            description: `${parentName}: ${log.systolic}/${log.diastolic}${log.note ? ` — ${log.note}` : ""}`,
          });
          if (child.telegramChatId) {
            await sendChildNotification(
              child.telegramChatId,
              `❤️‍🩹 Давление ${parentName} сегодня: ${log.systolic}/${log.diastolic} — ${anomalyType} обычного.\n\nВозможно, стоит позвонить.`
            );
          }
        }
      }

      return res.json(log);
    } catch (e: any) {
      return res.status(400).json({ message: e.message });
    }
  });

  // ========== AI ENDPOINTS ==========
  const DAILY_MESSAGE_LIMITS: Record<string, number> = {
    none: Infinity,
    basic: Infinity,
    standard: Infinity,
    premium: Infinity,
  };

  const RATE_LIMIT_MESSAGE = "На сегодня наши разговоры закончились, но завтра я снова буду рядом! Если нужна срочная помощь — звони 112.";

  async function getEffectivePlan(userId: number): Promise<string> {
    const checkSub = async (uid: number): Promise<string | null> => {
      const sub = await storage.getSubscription(uid);
      if (!sub || sub.status !== "active") return null;
      if (sub.expiresAt && new Date(sub.expiresAt) < new Date()) return null;
      return sub.plan;
    };

    const directPlan = await checkSub(userId);
    if (directPlan) return directPlan;

    const user = await storage.getUser(userId);
    if (!user) return "none";

    if (user.role === "child" && user.linkedParentId) {
      const parentPlan = await checkSub(user.linkedParentId);
      if (parentPlan) return parentPlan;
    }

    if (user.role === "parent") {
      const children = await storage.getChildrenByParentId(userId);
      for (const child of children) {
        const childPlan = await checkSub(child.id);
        if (childPlan) return childPlan;
      }
    }

    return "none";
  }

  async function checkDailyMessageLimit(userId: number): Promise<{ allowed: boolean; remaining: number; limit: number }> {
    const plan = await getEffectivePlan(userId);
    const limit = DAILY_MESSAGE_LIMITS[plan] ?? DAILY_MESSAGE_LIMITS.none;
    if (limit === Infinity) return { allowed: true, remaining: Infinity, limit: Infinity };
    const todayCount = await storage.countChatMessagesToday(userId);
    const remaining = Math.max(0, limit - todayCount);
    return { allowed: remaining > 0, remaining, limit };
  }

  app.post("/api/ai/chat", requireAuth, async (req, res) => {
    try {
      const { messages } = req.body;
      if (!messages || !Array.isArray(messages)) {
        return res.status(400).json({ message: "Отправьте массив messages" });
      }
      const userId = req.session.userId!;
      const user = await storage.getUser(userId);
      const parent = user?.linkedParentId ? await storage.getUser(user.linkedParentId) : null;

      const parentId = user?.role === "parent" ? userId : (user?.linkedParentId ?? userId);
      const lastUserMsg = messages[messages.length - 1]?.content || "";
      const emergencyIntents = ["emergency", "scam", "home_danger", "lost", "financial_risk"];
      const isEmergency = emergencyIntents.includes(detectIntentLocal(lastUserMsg, false));

      if (!isEmergency) {
        const rateLimitCheck = await checkDailyMessageLimit(parentId);
        if (!rateLimitCheck.allowed) {
          return res.json({
            reply: RATE_LIMIT_MESSAGE,
            hasAlert: false,
            intent: "rate_limited",
            imageUrl: null,
          });
        }
      }

      const extractedDish = extractDishFromText(lastUserMsg);
      const clarification = extractedDish ? RECIPE_CLARIFICATIONS[extractedDish] : null;
      if (clarification) {
        return res.json({
          reply: clarification,
          hasAlert: false,
          intent: "recipe",
          imageUrl: null,
        });
      }

      await storage.createChatMessage({
        parentId,
        role: "user",
        content: lastUserMsg,
        intent: null,
        hasAlert: false,
      });

      const parentName = user?.role === "parent" ? user.name : (parent?.name || undefined);
      const result = await chatWithGrandchild(messages, parentName, userId);

      const serverIntent = detectIntentLocal(lastUserMsg, false);
      const emergencyIntentsForAlert = ["emergency", "scam", "home_danger", "lost", "financial_risk"];
      const localEmergency = emergencyIntentsForAlert.includes(serverIntent);
      const shouldAlert = result.hasAlert || localEmergency;
      const alertIntent = result.hasAlert ? result.intent : serverIntent;

      if (shouldAlert) {
        if (!result.hasAlert) {
          console.log(`[routes] Server-side emergency override: intent=${serverIntent}, text="${lastUserMsg.slice(0, 80)}"`);
        }
        const alertTitle = alertIntent === "scam"
          ? "Возможная попытка мошенничества!"
          : alertIntent === "financial_risk"
          ? "Подозрительное финансовое решение!"
          : alertIntent === "home_danger"
          ? "Опасная ситуация дома!"
          : alertIntent === "lost"
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
            if (child.telegramChatId) {
              await sendChildNotification(
                child.telegramChatId,
                formatAlertPush(alertIntent, user.name || "Родитель", alertDescription),
                "Markdown"
              );
            }
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

      await storage.createChatMessage({
        parentId,
        role: "assistant",
        content: result.reply,
        intent: result.intent,
        hasAlert: result.hasAlert,
      });

      let imageUrl = result.imageUrl || null;
      if (!imageUrl && result.imageBuffer) {
        imageUrl = `data:image/jpeg;base64,${result.imageBuffer.toString("base64")}`;
      }

      return res.json({
        reply: result.reply,
        hasAlert: result.hasAlert,
        intent: result.intent,
        imageUrl,
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
      if (user.linkCode) {
        userResponse.linkCode = user.linkCode;
      }
      if (!isParent) {
        userResponse.hasTelegram = !!user.telegramChatId;
      }

      const parent = isParent
        ? { id: user.id, name: user.name }
        : parentId ? { id: parentId, name: (await storage.getUser(parentId))?.name } : null;

      let engagementStats = null;
      if (parentId) {
        engagementStats = await storage.getParentEngagementStats(parentId);
      }

      let botUsernameValue: string | null = null;
      let childBotUsernameValue: string | null = null;
      try {
        const { botUsername } = await import("./telegram");
        botUsernameValue = botUsername;
      } catch {}
      try {
        const { childBotUsername } = await import("./childBot");
        childBotUsernameValue = childBotUsername;
      } catch {}

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
        engagementStats,
        botUsername: botUsernameValue,
        childBotUsername: childBotUsernameValue,
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

  // ========== TOPICS & PERSONALITY SETTINGS ==========
  app.get("/api/topics", async (_req, res) => {
    try {
      const { TOPIC_CATALOG, TOPIC_CATEGORIES } = await import("./topicCatalog");
      return res.json({ categories: TOPIC_CATEGORIES, topics: TOPIC_CATALOG });
    } catch (e: any) {
      return res.status(500).json({ message: e.message });
    }
  });

  app.get("/api/topic-settings/:parentId", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const parentId = parseInt(req.params.parentId as string);
      if (isNaN(parentId) || parentId <= 0) {
        return res.status(400).json({ message: "Некорректный parentId" });
      }
      const resolvedParentId = await resolveParentId(userId);
      if (resolvedParentId !== parentId) {
        return res.status(403).json({ message: "Нет доступа к настройкам этого пользователя" });
      }
      const settings = await storage.getTopicSettings(parentId);
      return res.json(settings);
    } catch (e: any) {
      return res.status(500).json({ message: e.message });
    }
  });

  const topicSettingsUpdateSchema = z.object({
    settings: z.array(z.object({
      topicId: z.string(),
      depth: z.enum(["basic", "detailed", "expert"]),
      enabled: z.boolean(),
    })),
  });

  app.put("/api/topic-settings/:parentId", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const parentId = parseInt(req.params.parentId as string);
      if (isNaN(parentId) || parentId <= 0) {
        return res.status(400).json({ message: "Некорректный parentId" });
      }
      const resolvedParentId = await resolveParentId(userId);
      if (resolvedParentId !== parentId) {
        return res.status(403).json({ message: "Нет доступа к настройкам этого пользователя" });
      }
      const data = validateBody(topicSettingsUpdateSchema, req, res);
      if (!data) return;
      const results: any[] = [];
      for (const s of data.settings) {
        const result = await storage.upsertTopicSetting(parentId, s.topicId, s.depth, s.enabled);
        results.push(result);
      }
      return res.json(results);
    } catch (e: any) {
      return res.status(500).json({ message: e.message });
    }
  });

  app.get("/api/personality-settings/:parentId", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const parentId = parseInt(req.params.parentId as string);
      if (isNaN(parentId) || parentId <= 0) {
        return res.status(400).json({ message: "Некорректный parentId" });
      }
      const resolvedParentId = await resolveParentId(userId);
      if (resolvedParentId !== parentId) {
        return res.status(403).json({ message: "Нет доступа к настройкам этого пользователя" });
      }
      const settings = await storage.getPersonalitySettings(parentId);
      return res.json(settings || {
        parentId,
        formality: "ты",
        humor: 3,
        softness: 4,
        verbosity: 3,
        useEmoji: true,
        encouragement: 4,
      });
    } catch (e: any) {
      return res.status(500).json({ message: e.message });
    }
  });

  const personalitySettingsUpdateSchema = z.object({
    formality: z.enum(["ты", "вы"]).optional(),
    humor: z.number().min(0).max(5).optional(),
    softness: z.number().min(0).max(5).optional(),
    verbosity: z.number().min(0).max(5).optional(),
    useEmoji: z.boolean().optional(),
    encouragement: z.number().min(0).max(5).optional(),
  });

  app.put("/api/personality-settings/:parentId", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const parentId = parseInt(req.params.parentId as string);
      if (isNaN(parentId) || parentId <= 0) {
        return res.status(400).json({ message: "Некорректный parentId" });
      }
      const resolvedParentId = await resolveParentId(userId);
      if (resolvedParentId !== parentId) {
        return res.status(403).json({ message: "Нет доступа к настройкам этого пользователя" });
      }
      const data = validateBody(personalitySettingsUpdateSchema, req, res);
      if (!data) return;
      const result = await storage.upsertPersonalitySettings(parentId, data);
      return res.json(result);
    } catch (e: any) {
      return res.status(500).json({ message: e.message });
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

  // ========== ANALYTICS ==========
  const analyticsSchema = z.object({
    sessionId: z.string().min(1),
    variant: z.enum(["A", "B", "C"]),
    eventType: z.string().min(1),
    eventData: z.string().optional(),
    utmSource: z.string().optional(),
    utmMedium: z.string().optional(),
    utmCampaign: z.string().optional(),
    utmContent: z.string().optional(),
  });

  app.post("/api/analytics/event", async (req, res) => {
    try {
      const data = validateBody(analyticsSchema, req, res);
      if (!data) return;
      await storage.createAnalyticsEvent({
        sessionId: data.sessionId,
        variant: data.variant,
        eventType: data.eventType,
        eventData: data.eventData ?? null,
        utmSource: data.utmSource ?? null,
        utmMedium: data.utmMedium ?? null,
        utmCampaign: data.utmCampaign ?? null,
        utmContent: data.utmContent ?? null,
      });
      return res.json({ success: true });
    } catch {
      return res.json({ success: true });
    }
  });

  app.get("/api/analytics/stats", requireAuth, async (req, res) => {
    try {
      const variant = req.query.variant as string | undefined;
      const stats = await storage.getAnalyticsStats(variant);
      return res.json(stats);
    } catch (e: any) {
      return res.status(500).json({ message: e.message });
    }
  });

  return httpServer;
}