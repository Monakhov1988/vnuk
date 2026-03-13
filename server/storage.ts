import { eq, desc, and, or, count, gte, isNull, sql } from "drizzle-orm";
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
  type UserMemory, type InsertUserMemory,
  type TopicSetting, type PersonalitySetting,
  type InsertAnalyticsEvent, type AnalyticsEvent,
  type InsertSearchQualityLog, type SearchQualityLog,
  users, reminders, events, utilityMetrics, memoirs, healthLogs, subscriptions, waitlist, chatMessages, aiUsageLogs, userMemory,
  topicSettings, personalitySettings, analyticsEvents, searchQualityLogs,
} from "@shared/schema";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserLinkCode(userId: number, code: string, expiresAt?: Date): Promise<User>;
  invalidateLinkCode(userId: number): Promise<void>;
  consumeLinkCode(code: string): Promise<User | undefined>;
  linkParent(childId: number, parentId: number): Promise<void>;
  getLinkedParent(childId: number): Promise<User | undefined>;
  getUserByLinkCode(code: string): Promise<User | undefined>;
  getUserByTelegramChatId(chatId: string): Promise<User | undefined>;
  updateUserTelegramChatId(userId: number, chatId: string): Promise<User>;
  updateUserName(userId: number, name: string): Promise<User>;
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

  getUserMemory(parentId: number, limit?: number): Promise<UserMemory[]>;
  createUserMemory(mem: InsertUserMemory): Promise<UserMemory>;
  deleteUserMemory(id: number): Promise<void>;
  findUserMemoryByFact(parentId: number, fact: string): Promise<UserMemory | undefined>;

  getActiveRemindersForTime(hour: number, minute: number): Promise<Reminder[]>;
  updateReminderLastTriggered(id: number, date: Date): Promise<void>;
  resetAllReminderStatuses(): Promise<void>;

  countChatMessagesToday(parentId: number): Promise<number>;

  getTopicSettings(parentId: number): Promise<TopicSetting[]>;
  upsertTopicSetting(parentId: number, topicId: string, depth: "basic" | "detailed" | "expert", enabled: boolean): Promise<TopicSetting>;
  bulkInitTopicSettings(parentId: number, topicIds: string[], depth: "basic" | "detailed" | "expert"): Promise<void>;
  deleteTopicSettings(parentId: number): Promise<void>;

  getPersonalitySettings(parentId: number): Promise<PersonalitySetting | undefined>;
  upsertPersonalitySettings(parentId: number, settings: Partial<Omit<PersonalitySetting, "id" | "parentId">>): Promise<PersonalitySetting>;

  getLastMessageTime(parentId: number): Promise<Date | null>;
  getAllActiveParents(): Promise<User[]>;
  getUsedIntentsLastDays(parentId: number, days: number): Promise<string[]>;
  setProactiveOptOut(parentId: number, value: boolean): Promise<void>;
  getRecentProactiveTexts(parentId: number, limit: number): Promise<string[]>;
  getLastProactiveTime(parentId: number): Promise<Date | null>;
  getProactiveCategoriesToday(parentId: number, dateStr: string): Promise<string[]>;
  getRecentProactiveResponses(parentId: number, limit: number): Promise<{ content: string; role: string }[]>;

  createAnalyticsEvent(event: InsertAnalyticsEvent): Promise<AnalyticsEvent>;
  getAnalyticsStats(variant?: string): Promise<{ variant: string; eventType: string; count: number }[]>;

  logSearchQuality(log: InsertSearchQualityLog): Promise<SearchQualityLog>;
  updateSearchQualityFeedback(id: number, feedback: string): Promise<void>;

  getEventsForPeriod(parentId: number, since: Date, until: Date): Promise<Event[]>;
  getChatActivityDays(parentId: number, since: Date): Promise<number>;
  getHealthLogsForPeriod(parentId: number, since: Date, until: Date): Promise<HealthLog[]>;
  getMemoirsForPeriod(parentId: number, since: Date, until: Date): Promise<Memoir[]>;
  getRemindersConfirmedCount(parentId: number, since: Date, until: Date): Promise<{ confirmed: number; missed: number; total: number }>;

  getParentEngagementStats(parentId: number): Promise<{
    daysActive30: number;
    totalMessages: number;
    memoirsCount: number;
    lastActiveDate: Date | null;
  }>;

  getChatMessageCountForDate(parentId: number, dateStr: string): Promise<number>;
  getRegistrationDate(parentId: number): Promise<Date | null>;
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

  async updateUserLinkCode(userId: number, code: string, expiresAt?: Date): Promise<User> {
    const expires = expiresAt || new Date(Date.now() + 24 * 60 * 60 * 1000);
    const [user] = await db.update(users).set({ linkCode: code, linkCodeExpiresAt: expires }).where(eq(users.id, userId)).returning();
    return user;
  }

  async invalidateLinkCode(userId: number): Promise<void> {
    await db.update(users).set({ linkCode: null, linkCodeExpiresAt: null }).where(eq(users.id, userId));
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

  async consumeLinkCode(code: string): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ linkCode: null, linkCodeExpiresAt: null })
      .where(
        and(
          eq(users.linkCode, code),
          or(
            isNull(users.linkCodeExpiresAt),
            gte(users.linkCodeExpiresAt, new Date())
          )
        )
      )
      .returning();
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

  async updateUserName(userId: number, name: string): Promise<User> {
    const [user] = await db.update(users).set({ name }).where(eq(users.id, userId)).returning();
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
    const updates: any = { status };
    if (status === "confirmed") {
      updates.lastConfirmed = new Date();
    }
    const [r] = await db.update(reminders).set(updates).where(eq(reminders.id, id)).returning();
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

  async getUserMemory(parentId: number, limit = 30): Promise<UserMemory[]> {
    return db.select().from(userMemory).where(eq(userMemory.parentId, parentId)).orderBy(desc(userMemory.createdAt)).limit(limit);
  }

  async createUserMemory(mem: InsertUserMemory): Promise<UserMemory> {
    const [m] = await db.insert(userMemory).values(mem).returning();
    return m;
  }

  async deleteUserMemory(id: number): Promise<void> {
    await db.delete(userMemory).where(eq(userMemory.id, id));
  }

  async findUserMemoryByFact(parentId: number, fact: string): Promise<UserMemory | undefined> {
    const [m] = await db.select().from(userMemory)
      .where(and(eq(userMemory.parentId, parentId), eq(userMemory.fact, fact)))
      .limit(1);
    return m;
  }

  async getActiveRemindersForTime(hour: number, minute: number): Promise<Reminder[]> {
    return db.select().from(reminders).where(
      and(
        eq(reminders.isActive, true),
        eq(reminders.timeHour, hour),
        eq(reminders.timeMinute, minute),
      )
    );
  }

  async updateReminderLastTriggered(id: number, date: Date): Promise<void> {
    await db.update(reminders).set({ lastTriggered: date }).where(eq(reminders.id, id));
  }

  async resetAllReminderStatuses(): Promise<void> {
    await db.update(reminders).set({ status: "pending" }).where(eq(reminders.isActive, true));
  }

  async countChatMessagesToday(parentId: number): Promise<number> {
    const [result] = await db.select({ cnt: count() }).from(chatMessages)
      .where(and(
        eq(chatMessages.parentId, parentId),
        eq(chatMessages.role, "user"),
        gte(chatMessages.createdAt, sql`(now() AT TIME ZONE 'Europe/Moscow')::date AT TIME ZONE 'Europe/Moscow'`)
      ));
    return Number(result?.cnt) || 0;
  }

  async getTopicSettings(parentId: number): Promise<TopicSetting[]> {
    return db.select().from(topicSettings).where(eq(topicSettings.parentId, parentId));
  }

  async upsertTopicSetting(parentId: number, topicId: string, depth: "basic" | "detailed" | "expert", enabled: boolean): Promise<TopicSetting> {
    const existing = await db.select().from(topicSettings)
      .where(and(eq(topicSettings.parentId, parentId), eq(topicSettings.topicId, topicId)))
      .limit(1);

    if (existing.length > 0) {
      const [updated] = await db.update(topicSettings)
        .set({ depth, enabled })
        .where(eq(topicSettings.id, existing[0].id))
        .returning();
      return updated;
    }

    const [created] = await db.insert(topicSettings)
      .values({ parentId, topicId, depth, enabled })
      .returning();
    return created;
  }

  async bulkInitTopicSettings(parentId: number, topicIds: string[], depth: "basic" | "detailed" | "expert"): Promise<void> {
    if (topicIds.length === 0) return;
    const values = topicIds.map(topicId => ({ parentId, topicId, depth, enabled: true }));
    await db.insert(topicSettings).values(values);
  }

  async deleteTopicSettings(parentId: number): Promise<void> {
    await db.delete(topicSettings).where(eq(topicSettings.parentId, parentId));
  }

  async getPersonalitySettings(parentId: number): Promise<PersonalitySetting | undefined> {
    const [result] = await db.select().from(personalitySettings)
      .where(eq(personalitySettings.parentId, parentId))
      .limit(1);
    return result;
  }

  async upsertPersonalitySettings(parentId: number, settings: Partial<Omit<PersonalitySetting, "id" | "parentId">>): Promise<PersonalitySetting> {
    const existing = await this.getPersonalitySettings(parentId);

    if (existing) {
      const [updated] = await db.update(personalitySettings)
        .set(settings)
        .where(eq(personalitySettings.parentId, parentId))
        .returning();
      return updated;
    }

    const [created] = await db.insert(personalitySettings)
      .values({ parentId, ...settings })
      .returning();
    return created;
  }
  async getLastMessageTime(parentId: number): Promise<Date | null> {
    const [msg] = await db.select({ createdAt: chatMessages.createdAt })
      .from(chatMessages)
      .where(eq(chatMessages.parentId, parentId))
      .orderBy(desc(chatMessages.createdAt))
      .limit(1);
    return msg?.createdAt ?? null;
  }

  async getAllActiveParents(): Promise<User[]> {
    return db.select().from(users)
      .where(and(
        eq(users.role, "parent"),
        sql`${users.telegramChatId} IS NOT NULL`
      ));
  }

  async getUsedIntentsLastDays(parentId: number, days: number): Promise<string[]> {
    const since = new Date();
    since.setDate(since.getDate() - days);
    const rows = await db.selectDistinct({ intent: chatMessages.intent })
      .from(chatMessages)
      .where(and(
        eq(chatMessages.parentId, parentId),
        eq(chatMessages.role, "assistant"),
        sql`${chatMessages.intent} IS NOT NULL`,
        gte(chatMessages.createdAt, since)
      ));
    return rows.map(r => r.intent).filter((i): i is string => !!i);
  }

  async setProactiveOptOut(parentId: number, value: boolean): Promise<void> {
    await db.update(users).set({ proactiveOptOut: value }).where(eq(users.id, parentId));
  }

  async getRecentProactiveTexts(parentId: number, limit: number): Promise<string[]> {
    const rows = await db.select({ content: chatMessages.content })
      .from(chatMessages)
      .where(and(
        eq(chatMessages.parentId, parentId),
        eq(chatMessages.role, "assistant"),
        sql`${chatMessages.intent} LIKE 'proactive:%'`
      ))
      .orderBy(desc(chatMessages.createdAt))
      .limit(limit);
    return rows.map(r => r.content);
  }

  async getLastProactiveTime(parentId: number): Promise<Date | null> {
    const rows = await db.select({ createdAt: chatMessages.createdAt })
      .from(chatMessages)
      .where(and(
        eq(chatMessages.parentId, parentId),
        eq(chatMessages.role, "assistant"),
        sql`${chatMessages.intent} LIKE 'proactive:%'`
      ))
      .orderBy(desc(chatMessages.createdAt))
      .limit(1);
    return rows[0]?.createdAt ?? null;
  }

  async getProactiveCategoriesToday(parentId: number, dateStr: string): Promise<string[]> {
    const rows = await db.select({ intent: chatMessages.intent })
      .from(chatMessages)
      .where(and(
        eq(chatMessages.parentId, parentId),
        eq(chatMessages.role, "assistant"),
        sql`${chatMessages.intent} LIKE 'proactive:%'`,
        sql`TO_CHAR(${chatMessages.createdAt} AT TIME ZONE 'Europe/Moscow', 'YYYY-MM-DD') = ${dateStr}`
      ))
      .orderBy(desc(chatMessages.createdAt));
    return rows.map(r => r.intent?.replace("proactive:", "") || "").filter(Boolean);
  }

  async getRecentProactiveResponses(parentId: number, limit: number): Promise<{ content: string; role: string }[]> {
    const proactiveMessages = await db.select({
      id: chatMessages.id,
      createdAt: chatMessages.createdAt,
    })
      .from(chatMessages)
      .where(and(
        eq(chatMessages.parentId, parentId),
        eq(chatMessages.role, "assistant"),
        sql`${chatMessages.intent} LIKE 'proactive:%'`
      ))
      .orderBy(desc(chatMessages.createdAt))
      .limit(limit);

    if (proactiveMessages.length === 0) return [];

    const responses: { content: string; role: string }[] = [];
    for (const pm of proactiveMessages) {
      if (!pm.createdAt) continue;
      const afterTime = pm.createdAt;
      const beforeTime = new Date(pm.createdAt.getTime() + 4 * 60 * 60 * 1000);
      const userReplies = await db.select({ content: chatMessages.content, role: chatMessages.role })
        .from(chatMessages)
        .where(and(
          eq(chatMessages.parentId, parentId),
          eq(chatMessages.role, "user"),
          gte(chatMessages.createdAt, afterTime),
          sql`${chatMessages.createdAt} < ${beforeTime}`
        ))
        .orderBy(chatMessages.createdAt)
        .limit(3);
      responses.push(...userReplies);
    }
    return responses;
  }

  async createAnalyticsEvent(event: InsertAnalyticsEvent): Promise<AnalyticsEvent> {
    const [created] = await db.insert(analyticsEvents).values(event).returning();
    return created;
  }

  async getAnalyticsStats(variant?: string): Promise<{ variant: string; eventType: string; count: number }[]> {
    const conditions = variant ? eq(analyticsEvents.variant, variant) : undefined;
    const rows = await db.select({
      variant: analyticsEvents.variant,
      eventType: analyticsEvents.eventType,
      count: count(),
    })
      .from(analyticsEvents)
      .where(conditions)
      .groupBy(analyticsEvents.variant, analyticsEvents.eventType);
    return rows.map(r => ({ variant: r.variant, eventType: r.eventType, count: Number(r.count) }));
  }

  async logSearchQuality(log: InsertSearchQualityLog): Promise<SearchQualityLog> {
    try {
      const [created] = await db.insert(searchQualityLogs).values(log).returning();
      return created;
    } catch (err) {
      console.error("[logSearchQuality] Failed:", err);
      return { id: 0, ...log, createdAt: new Date() } as SearchQualityLog;
    }
  }

  async updateSearchQualityFeedback(id: number, feedback: string): Promise<void> {
    try {
      await db.update(searchQualityLogs).set({ userFeedback: feedback }).where(eq(searchQualityLogs.id, id));
    } catch (err) {
      console.error("[updateSearchQualityFeedback] Failed:", err);
    }
  }

  async getEventsForPeriod(parentId: number, since: Date, until: Date): Promise<Event[]> {
    return db.select().from(events).where(
      and(
        eq(events.parentId, parentId),
        gte(events.createdAt, since),
        sql`${events.createdAt} < ${until}`
      )
    ).orderBy(desc(events.createdAt));
  }

  async getChatActivityDays(parentId: number, since: Date): Promise<number> {
    const [result] = await db.select({
      value: sql<number>`COUNT(DISTINCT DATE(${chatMessages.createdAt}))`,
    }).from(chatMessages).where(
      and(
        eq(chatMessages.parentId, parentId),
        eq(chatMessages.role, "user"),
        gte(chatMessages.createdAt, since)
      )
    );
    return Number(result?.value) || 0;
  }

  async getHealthLogsForPeriod(parentId: number, since: Date, until: Date): Promise<HealthLog[]> {
    return db.select().from(healthLogs).where(
      and(
        eq(healthLogs.parentId, parentId),
        gte(healthLogs.createdAt, since),
        sql`${healthLogs.createdAt} < ${until}`
      )
    ).orderBy(desc(healthLogs.createdAt));
  }

  async getMemoirsForPeriod(parentId: number, since: Date, until: Date): Promise<Memoir[]> {
    return db.select().from(memoirs).where(
      and(
        eq(memoirs.parentId, parentId),
        gte(memoirs.createdAt, since),
        sql`${memoirs.createdAt} < ${until}`
      )
    ).orderBy(desc(memoirs.createdAt));
  }

  async getRemindersConfirmedCount(parentId: number, since: Date, until: Date): Promise<{ confirmed: number; missed: number; total: number }> {
    const parentEvents = await db.select().from(events).where(
      and(
        eq(events.parentId, parentId),
        eq(events.type, "medication"),
        gte(events.createdAt, since),
        sql`${events.createdAt} < ${until}`
      )
    );
    const confirmed = parentEvents.filter(e => e.title?.includes("принято")).length;
    const missed = parentEvents.filter(e => e.severity === "warning" || e.severity === "critical").length;
    const sent = parentEvents.filter(e => e.title?.includes("Напоминание отправлено")).length;
    return { confirmed, missed, total: sent };
  }

  async getParentEngagementStats(parentId: number): Promise<{
    daysActive30: number;
    totalMessages: number;
    memoirsCount: number;
    lastActiveDate: Date | null;
  }> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [daysActiveResult] = await db.select({
      value: sql<number>`COUNT(DISTINCT DATE(${chatMessages.createdAt}))`,
    }).from(chatMessages).where(
      and(
        eq(chatMessages.parentId, parentId),
        eq(chatMessages.role, "user"),
        gte(chatMessages.createdAt, thirtyDaysAgo)
      )
    );

    const [totalMsgResult] = await db.select({
      value: count(),
    }).from(chatMessages).where(
      and(
        eq(chatMessages.parentId, parentId),
        eq(chatMessages.role, "user")
      )
    );

    const [memoirsResult] = await db.select({
      value: count(),
    }).from(memoirs).where(eq(memoirs.parentId, parentId));

    const [lastActiveResult] = await db.select({
      value: sql<Date | null>`MAX(${chatMessages.createdAt})`,
    }).from(chatMessages).where(
      and(
        eq(chatMessages.parentId, parentId),
        eq(chatMessages.role, "user")
      )
    );

    return {
      daysActive30: Number(daysActiveResult?.value) || 0,
      totalMessages: Number(totalMsgResult?.value) || 0,
      memoirsCount: Number(memoirsResult?.value) || 0,
      lastActiveDate: lastActiveResult?.value ?? null,
    };
  }

  async getChatMessageCountForDate(parentId: number, dateStr: string): Promise<number> {
    const [result] = await db.select({
      value: count(),
    }).from(chatMessages).where(
      and(
        eq(chatMessages.parentId, parentId),
        eq(chatMessages.role, "user"),
        sql`DATE(${chatMessages.createdAt} AT TIME ZONE 'Europe/Moscow') = ${dateStr}`
      )
    );
    return Number(result?.value) || 0;
  }

  async getRegistrationDate(parentId: number): Promise<Date | null> {
    const user = await db.select({ createdAt: users.createdAt }).from(users).where(eq(users.id, parentId)).limit(1);
    return user[0]?.createdAt ?? null;
  }
}

export const storage = new DatabaseStorage();