import type { Express } from "express";
import { type Server } from "http";
import { storage } from "./storage";
import {
  insertUserSchema,
  insertReminderSchema,
  insertEventSchema,
  insertUtilityMetricSchema,
  insertMemoirSchema,
  insertHealthLogSchema,
} from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // ========== AUTH ==========
  const registerSchema = z.object({
    name: z.string().min(1),
    email: z.string().email(),
    password: z.string().min(4),
    role: z.enum(["parent", "child"]),
  });

  app.post("/api/auth/register", async (req, res) => {
    try {
      const data = registerSchema.parse(req.body);
      const existing = await storage.getUserByEmail(data.email);
      if (existing) {
        return res.status(400).json({ message: "Пользователь с таким email уже существует" });
      }
      const user = await storage.createUser(data);
      if (user.role === "parent") {
        const code = Math.random().toString(36).substring(2, 8).toUpperCase();
        await storage.updateUserLinkCode(user.id, code);
      }
      return res.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role } });
    } catch (e: any) {
      return res.status(400).json({ message: e.message });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      const user = await storage.getUserByEmail(email);
      if (!user || user.password !== password) {
        return res.status(401).json({ message: "Неверный email или пароль" });
      }
      return res.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role, linkedParentId: user.linkedParentId } });
    } catch (e: any) {
      return res.status(400).json({ message: e.message });
    }
  });

  // ========== LINK PARENT ==========
  app.post("/api/link-parent", async (req, res) => {
    try {
      const { childId, linkCode } = req.body;
      const parent = await storage.getUserByLinkCode(linkCode);
      if (!parent) {
        return res.status(404).json({ message: "Код не найден. Проверьте и попробуйте снова." });
      }
      await storage.linkParent(childId, parent.id);
      return res.json({ parentId: parent.id, parentName: parent.name });
    } catch (e: any) {
      return res.status(400).json({ message: e.message });
    }
  });

  // ========== REMINDERS ==========
  app.get("/api/reminders/:userId", async (req, res) => {
    const userId = parseInt(req.params.userId);
    const list = await storage.getReminders(userId);
    return res.json(list);
  });

  app.post("/api/reminders", async (req, res) => {
    try {
      const data = insertReminderSchema.parse(req.body);
      const reminder = await storage.createReminder(data);
      await storage.createEvent({
        userId: data.userId,
        parentId: data.parentId,
        type: "medication",
        severity: "info",
        title: `Добавлено напоминание: ${data.medicineName}`,
        description: `Время: ${String(data.timeHour).padStart(2, "0")}:${String(data.timeMinute).padStart(2, "0")}`,
      });
      return res.json(reminder);
    } catch (e: any) {
      return res.status(400).json({ message: e.message });
    }
  });

  app.patch("/api/reminders/:id/status", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { status } = req.body;
      const reminder = await storage.updateReminderStatus(id, status);
      return res.json(reminder);
    } catch (e: any) {
      return res.status(400).json({ message: e.message });
    }
  });

  app.delete("/api/reminders/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    await storage.deleteReminder(id);
    return res.json({ success: true });
  });

  // ========== EVENTS ==========
  app.get("/api/events/:userId", async (req, res) => {
    const userId = parseInt(req.params.userId);
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
    const list = await storage.getEvents(userId, limit);
    return res.json(list);
  });

  app.post("/api/events", async (req, res) => {
    try {
      const data = insertEventSchema.parse(req.body);
      const event = await storage.createEvent(data);
      return res.json(event);
    } catch (e: any) {
      return res.status(400).json({ message: e.message });
    }
  });

  app.patch("/api/events/:id/read", async (req, res) => {
    const id = parseInt(req.params.id);
    await storage.markEventRead(id);
    return res.json({ success: true });
  });

  app.get("/api/events/:userId/unread-count", async (req, res) => {
    const userId = parseInt(req.params.userId);
    const count = await storage.getUnreadEventsCount(userId);
    return res.json({ count });
  });

  // ========== UTILITY METRICS ==========
  app.get("/api/utility-metrics/:parentId", async (req, res) => {
    const parentId = parseInt(req.params.parentId);
    const list = await storage.getUtilityMetrics(parentId);
    return res.json(list);
  });

  app.post("/api/utility-metrics", async (req, res) => {
    try {
      const data = insertUtilityMetricSchema.parse(req.body);
      const metric = await storage.createUtilityMetric(data);
      await storage.createEvent({
        userId: data.userId,
        parentId: data.parentId,
        type: "utility",
        severity: "info",
        title: `Показания ${data.meterType} переданы`,
        description: `Значение: ${data.value}`,
      });
      return res.json(metric);
    } catch (e: any) {
      return res.status(400).json({ message: e.message });
    }
  });

  // ========== MEMOIRS ==========
  app.get("/api/memoirs/:parentId", async (req, res) => {
    const parentId = parseInt(req.params.parentId);
    const list = await storage.getMemoirs(parentId);
    return res.json(list);
  });

  app.post("/api/memoirs", async (req, res) => {
    try {
      const data = insertMemoirSchema.parse(req.body);
      const memoir = await storage.createMemoir(data);
      return res.json(memoir);
    } catch (e: any) {
      return res.status(400).json({ message: e.message });
    }
  });

  // ========== HEALTH LOGS ==========
  app.get("/api/health-logs/:parentId", async (req, res) => {
    const parentId = parseInt(req.params.parentId);
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 30;
    const list = await storage.getHealthLogs(parentId, limit);
    return res.json(list);
  });

  app.post("/api/health-logs", async (req, res) => {
    try {
      const data = insertHealthLogSchema.parse(req.body);
      const log = await storage.createHealthLog(data);
      await storage.createEvent({
        userId: 0,
        parentId: data.parentId,
        type: "checkin",
        severity: "info",
        title: "Давление записано",
        description: `${data.systolic}/${data.diastolic}${data.note ? ` — ${data.note}` : ""}`,
      });
      return res.json(log);
    } catch (e: any) {
      return res.status(400).json({ message: e.message });
    }
  });

  // ========== DASHBOARD SUMMARY ==========
  app.get("/api/dashboard/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const user = await storage.getUser(userId);
      if (!user) return res.status(404).json({ message: "Пользователь не найден" });

      const parent = await storage.getLinkedParent(userId);
      const recentEvents = await storage.getEvents(userId, 10);
      const unreadCount = await storage.getUnreadEventsCount(userId);
      const remindersList = await storage.getReminders(userId);

      let healthLogsList: any[] = [];
      let metricsList: any[] = [];
      let memoirsList: any[] = [];

      if (parent) {
        healthLogsList = await storage.getHealthLogs(parent.id, 7);
        metricsList = await storage.getUtilityMetrics(parent.id);
        memoirsList = await storage.getMemoirs(parent.id);
      }

      const hasCritical = recentEvents.some(e => e.severity === "critical" && !e.isRead);
      const hasWarning = recentEvents.some(e => e.severity === "warning" && !e.isRead);
      const overallStatus = hasCritical ? "critical" : hasWarning ? "warning" : "ok";

      return res.json({
        user: { id: user.id, name: user.name, email: user.email, role: user.role },
        parent: parent ? { id: parent.id, name: parent.name } : null,
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

  return httpServer;
}