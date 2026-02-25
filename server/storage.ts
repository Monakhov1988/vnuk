import { eq, desc, and, count, gte, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import {
  type User, type InsertUser,
  type Reminder, type InsertReminder,
  type Event, type InsertEvent,
  type UtilityMetric, type InsertUtilityMetric,
  type Memoir, type InsertMemoir,
  type HealthLog, type InsertHealthLog,
  type Subscription, type InsertSubscription,
  type Waitlist, type InsertWaitlist,
  type ChatMessage, type InsertChatMessage,
  type InsertAiUsageLog,
  users, reminders, events, utilityMetrics, memoirs, healthLogs, subscriptions, waitlist, chatMessages, aiUsageLogs,
} from "@shared/schema";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserLinkCode(userId: number, code: string): Promise<User>;
  linkParent(childId: number, parentId: number): Promise<void>;
  getLinkedParent(childId: number): Promise<User | undefined>;
  getUserByLinkCode(code: string): Promise<User | undefined>;
  getUserByTelegramChatId(chatId: string): Promise<User | undefined>;
  updateUserTelegramChatId(userId: number, chatId: string): Promise<User>;
  getChildrenByParentId(parentId: number): Promise<User[]>;

  getReminder(id: number): Promise<Reminder | undefined>;
  getReminders(userId: number): Promise<Reminder[]>;
  getRemindersByParent(parentId: number): Promise<Reminder[]>;
  createReminder(reminder: InsertReminder): Promise<Reminder>;
  updateReminderStatus(id: number, status: "pending" | "confirmed" | "missed"): Promise<Reminder>;
  deleteReminder(id: number): Promise<void>;

  getEvent(id: number): Promise<Event | undefined>;
  getEvents(userId: number, limit?: number, offset?: number): Promise<Event[]>;
  createEvent(event: InsertEvent): Promise<Event>;
  markEventRead(id: number): Promise<void>;
  getUnreadEventsCount(userId: number): Promise<number>;

  getUtilityMetrics(parentId: number): Promise<UtilityMetric[]>;
  createUtilityMetric(metric: InsertUtilityMetric): Promise<UtilityMetric>;

  getMemoirs(parentId: number): Promise<Memoir[]>;
  createMemoir(memoir: InsertMemoir): Promise<Memoir>;

  getHealthLogs(parentId: number, limit?: number): Promise<HealthLog[]>;
  createHealthLog(log: InsertHealthLog): Promise<HealthLog>;

  getSubscription(userId: number): Promise<Subscription | undefined>;
  createSubscription(sub: InsertSubscription): Promise<Subscription>;
  updateSubscriptionStatus(id: number, status: "active" | "expired" | "cancelled"): Promise<Subscription>;

  addToWaitlist(email: string): Promise<Waitlist>;
  getWaitlistCount(): Promise<number>;

  getChatMessages(parentId: number, limit?: number): Promise<ChatMessage[]>;
  createChatMessage(msg: InsertChatMessage): Promise<ChatMessage>;

  logAiUsage(log: InsertAiUsageLog): Promise<void>;
  countAiUsageToday(userId: number, endpoint: string): Promise<number>;
}

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool);

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUserLinkCode(userId: number, code: string): Promise<User> {
    const [user] = await db.update(users).set({ linkCode: code }).where(eq(users.id, userId)).returning();
    return user;
  }

  async linkParent(childId: number, parentId: number): Promise<void> {
    await db.update(users).set({ linkedParentId: parentId }).where(eq(users.id, childId));
  }

  async getLinkedParent(childId: number): Promise<User | undefined> {
    const child = await this.getUser(childId);
    if (!child?.linkedParentId) return undefined;
    return this.getUser(child.linkedParentId);
  }

  async getUserByLinkCode(code: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.linkCode, code));
    return user;
  }

  async getUserByTelegramChatId(chatId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.telegramChatId, chatId));
    return user;
  }

  async updateUserTelegramChatId(userId: number, chatId: string): Promise<User> {
    const [user] = await db.update(users).set({ telegramChatId: chatId }).where(eq(users.id, userId)).returning();
    return user;
  }

  async getChildrenByParentId(parentId: number): Promise<User[]> {
    return db.select().from(users).where(eq(users.linkedParentId, parentId));
  }

  async getReminder(id: number): Promise<Reminder | undefined> {
    const [r] = await db.select().from(reminders).where(eq(reminders.id, id));
    return r;
  }

  async getReminders(userId: number): Promise<Reminder[]> {
    return db.select().from(reminders).where(eq(reminders.userId, userId)).orderBy(reminders.timeHour, reminders.timeMinute);
  }

  async getRemindersByParent(parentId: number): Promise<Reminder[]> {
    return db.select().from(reminders).where(eq(reminders.parentId, parentId)).orderBy(reminders.timeHour, reminders.timeMinute);
  }

  async createReminder(reminder: InsertReminder): Promise<Reminder> {
    const [r] = await db.insert(reminders).values(reminder).returning();
    return r;
  }

  async updateReminderStatus(id: number, status: "pending" | "confirmed" | "missed"): Promise<Reminder> {
    const [r] = await db.update(reminders).set({ status }).where(eq(reminders.id, id)).returning();
    return r;
  }

  async deleteReminder(id: number): Promise<void> {
    await db.delete(reminders).where(eq(reminders.id, id));
  }

  async getEvent(id: number): Promise<Event | undefined> {
    const [e] = await db.select().from(events).where(eq(events.id, id));
    return e;
  }

  async getEvents(userId: number, limit = 50, offset = 0): Promise<Event[]> {
    return db.select().from(events).where(eq(events.userId, userId)).orderBy(desc(events.createdAt)).limit(limit).offset(offset);
  }

  async createEvent(event: InsertEvent): Promise<Event> {
    const [e] = await db.insert(events).values(event).returning();
    return e;
  }

  async markEventRead(id: number): Promise<void> {
    await db.update(events).set({ isRead: true }).where(eq(events.id, id));
  }

  async getUnreadEventsCount(userId: number): Promise<number> {
    const [result] = await db.select({ value: count() }).from(events).where(and(eq(events.userId, userId), eq(events.isRead, false)));
    return result?.value ?? 0;
  }

  async getUtilityMetrics(parentId: number): Promise<UtilityMetric[]> {
    return db.select().from(utilityMetrics).where(eq(utilityMetrics.parentId, parentId)).orderBy(desc(utilityMetrics.createdAt));
  }

  async createUtilityMetric(metric: InsertUtilityMetric): Promise<UtilityMetric> {
    const [m] = await db.insert(utilityMetrics).values(metric).returning();
    return m;
  }

  async getMemoirs(parentId: number): Promise<Memoir[]> {
    return db.select().from(memoirs).where(eq(memoirs.parentId, parentId)).orderBy(desc(memoirs.createdAt));
  }

  async createMemoir(memoir: InsertMemoir): Promise<Memoir> {
    const [m] = await db.insert(memoirs).values(memoir).returning();
    return m;
  }

  async getHealthLogs(parentId: number, limit = 30): Promise<HealthLog[]> {
    return db.select().from(healthLogs).where(eq(healthLogs.parentId, parentId)).orderBy(desc(healthLogs.createdAt)).limit(limit);
  }

  async createHealthLog(log: InsertHealthLog): Promise<HealthLog> {
    const [l] = await db.insert(healthLogs).values(log).returning();
    return l;
  }

  async getSubscription(userId: number): Promise<Subscription | undefined> {
    const [sub] = await db.select().from(subscriptions).where(eq(subscriptions.userId, userId)).orderBy(desc(subscriptions.createdAt)).limit(1);
    return sub;
  }

  async createSubscription(sub: InsertSubscription): Promise<Subscription> {
    const [s] = await db.insert(subscriptions).values(sub).returning();
    return s;
  }

  async updateSubscriptionStatus(id: number, status: "active" | "expired" | "cancelled"): Promise<Subscription> {
    const [s] = await db.update(subscriptions).set({ status }).where(eq(subscriptions.id, id)).returning();
    return s;
  }

  async addToWaitlist(email: string): Promise<Waitlist> {
    const [w] = await db.insert(waitlist).values({ email }).returning();
    return w;
  }

  async getWaitlistCount(): Promise<number> {
    const [result] = await db.select({ value: count() }).from(waitlist);
    return result?.value ?? 0;
  }

  async getChatMessages(parentId: number, limit = 50): Promise<ChatMessage[]> {
    return db.select().from(chatMessages).where(eq(chatMessages.parentId, parentId)).orderBy(desc(chatMessages.createdAt)).limit(limit);
  }

  async createChatMessage(msg: InsertChatMessage): Promise<ChatMessage> {
    const [m] = await db.insert(chatMessages).values(msg).returning();
    return m;
  }

  async logAiUsage(log: InsertAiUsageLog): Promise<void> {
    try {
      await db.insert(aiUsageLogs).values(log);
    } catch (err) {
      console.error("[logAiUsage] Failed to log AI usage:", err);
    }
  }

  async countAiUsageToday(userId: number, endpoint: string): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const [result] = await db.select({ cnt: count() }).from(aiUsageLogs)
      .where(and(
        eq(aiUsageLogs.userId, userId),
        eq(aiUsageLogs.endpoint, endpoint),
        gte(aiUsageLogs.createdAt, today)
      ));
    return Number(result?.cnt) || 0;
  }
}

export const storage = new DatabaseStorage();