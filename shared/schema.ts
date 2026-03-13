import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, timestamp, pgEnum, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const roleEnum = pgEnum("role", ["parent", "child"]);
export const reminderStatusEnum = pgEnum("reminder_status", ["pending", "confirmed", "missed"]);
export const eventTypeEnum = pgEnum("event_type", ["checkin", "medication", "alert", "utility", "memoir", "order"]);
export const eventSeverityEnum = pgEnum("event_severity", ["info", "warning", "critical"]);
export const subscriptionPlanEnum = pgEnum("subscription_plan", ["basic", "standard", "premium"]);
export const subscriptionStatusEnum = pgEnum("subscription_status", ["active", "expired", "cancelled"]);

export const users = pgTable("users", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  role: roleEnum("role").notNull().default("child"),
  linkCode: varchar("link_code", { length: 8 }).unique(),
  linkCodeExpiresAt: timestamp("link_code_expires_at"),
  linkedParentId: integer("linked_parent_id").references((): any => users.id),
  telegramChatId: text("telegram_chat_id"),
  timezone: text("timezone").default("Europe/Moscow"),
  proactiveOptOut: boolean("proactive_opt_out").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const childTelegramTokens = pgTable("child_telegram_tokens", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  token: varchar("token", { length: 32 }).notNull().unique(),
  childId: integer("child_id").notNull().references(() => users.id),
  expiresAt: timestamp("expires_at").notNull(),
  used: boolean("used").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export type ChildTelegramToken = typeof childTelegramTokens.$inferSelect;

export const subscriptions = pgTable("subscriptions", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: integer("user_id").notNull().references(() => users.id),
  plan: subscriptionPlanEnum("plan").notNull(),
  status: subscriptionStatusEnum("status").notNull().default("active"),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_subscriptions_user").on(table.userId),
]);

export const reminders = pgTable("reminders", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: integer("user_id").notNull().references(() => users.id),
  parentId: integer("parent_id").notNull().references(() => users.id),
  medicineName: text("medicine_name").notNull(),
  timeHour: integer("time_hour").notNull(),
  timeMinute: integer("time_minute").notNull(),
  status: reminderStatusEnum("status").notNull().default("pending"),
  isActive: boolean("is_active").notNull().default(true),
  lastTriggered: timestamp("last_triggered"),
  lastConfirmed: timestamp("last_confirmed"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_reminders_user").on(table.userId),
  index("idx_reminders_parent").on(table.parentId),
]);

export const events = pgTable("events", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: integer("user_id").notNull().references(() => users.id),
  parentId: integer("parent_id").notNull().references(() => users.id),
  type: eventTypeEnum("type").notNull(),
  severity: eventSeverityEnum("severity").notNull().default("info"),
  title: text("title").notNull(),
  description: text("description"),
  isRead: boolean("is_read").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_events_user").on(table.userId),
  index("idx_events_created").on(table.createdAt),
]);

export const utilityMetrics = pgTable("utility_metrics", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: integer("user_id").notNull().references(() => users.id),
  parentId: integer("parent_id").notNull().references(() => users.id),
  meterType: text("meter_type").notNull(),
  value: text("value").notNull(),
  photoUrl: text("photo_url"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_utility_parent").on(table.parentId),
]);

export const memoirs = pgTable("memoirs", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: integer("user_id").notNull().references(() => users.id),
  parentId: integer("parent_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  content: text("content").notNull(),
  audioUrl: text("audio_url"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_memoirs_parent").on(table.parentId),
]);

export const healthLogs = pgTable("health_logs", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  parentId: integer("parent_id").notNull().references(() => users.id),
  systolic: integer("systolic"),
  diastolic: integer("diastolic"),
  note: text("note"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_health_parent").on(table.parentId),
]);

export const waitlist = pgTable("waitlist", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  email: text("email").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const chatMessages = pgTable("chat_messages", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  parentId: integer("parent_id").notNull().references(() => users.id),
  role: text("role").notNull(),
  content: text("content").notNull(),
  intent: text("intent"),
  hasAlert: boolean("has_alert").default(false),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_chat_parent").on(table.parentId),
  index("idx_chat_created").on(table.createdAt),
]);

export const aiUsageLogs = pgTable("ai_usage_logs", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: integer("user_id").references(() => users.id),
  endpoint: text("endpoint").notNull(),
  model: text("model").notNull(),
  tokensIn: integer("tokens_in").notNull().default(0),
  tokensOut: integer("tokens_out").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_ai_usage_user").on(table.userId),
  index("idx_ai_usage_created").on(table.createdAt),
]);

export const userMemory = pgTable("user_memory", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  parentId: integer("parent_id").notNull().references(() => users.id),
  category: text("category").notNull(),
  fact: text("fact").notNull(),
  source: text("source").notNull().default("extracted"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_memory_parent").on(table.parentId),
]);

export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true, linkCode: true });
export const insertReminderSchema = createInsertSchema(reminders).omit({ id: true, createdAt: true, lastTriggered: true, lastConfirmed: true });
export const insertEventSchema = createInsertSchema(events).omit({ id: true, createdAt: true });
export const insertUtilityMetricSchema = createInsertSchema(utilityMetrics).omit({ id: true, createdAt: true });
export const insertMemoirSchema = createInsertSchema(memoirs).omit({ id: true, createdAt: true });
export const insertHealthLogSchema = createInsertSchema(healthLogs).omit({ id: true, createdAt: true });
export const insertSubscriptionSchema = createInsertSchema(subscriptions).omit({ id: true, createdAt: true });
export const insertWaitlistSchema = createInsertSchema(waitlist).omit({ id: true, createdAt: true });
export const insertChatMessageSchema = createInsertSchema(chatMessages).omit({ id: true, createdAt: true });
export const insertAiUsageLogSchema = createInsertSchema(aiUsageLogs).omit({ id: true, createdAt: true });

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertReminder = z.infer<typeof insertReminderSchema>;
export type Reminder = typeof reminders.$inferSelect;
export type InsertEvent = z.infer<typeof insertEventSchema>;
export type Event = typeof events.$inferSelect;
export type InsertUtilityMetric = z.infer<typeof insertUtilityMetricSchema>;
export type UtilityMetric = typeof utilityMetrics.$inferSelect;
export type InsertMemoir = z.infer<typeof insertMemoirSchema>;
export type Memoir = typeof memoirs.$inferSelect;
export type InsertHealthLog = z.infer<typeof insertHealthLogSchema>;
export type HealthLog = typeof healthLogs.$inferSelect;
export type InsertSubscription = z.infer<typeof insertSubscriptionSchema>;
export type Subscription = typeof subscriptions.$inferSelect;
export type InsertWaitlist = z.infer<typeof insertWaitlistSchema>;
export type Waitlist = typeof waitlist.$inferSelect;
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;
export type ChatMessage = typeof chatMessages.$inferSelect;
export const topicDepthEnum = pgEnum("topic_depth", ["basic", "detailed", "expert"]);

export const topicSettings = pgTable("topic_settings", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  parentId: integer("parent_id").notNull().references(() => users.id),
  topicId: text("topic_id").notNull(),
  depth: topicDepthEnum("depth").notNull().default("basic"),
  enabled: boolean("enabled").notNull().default(true),
}, (table) => [
  index("idx_topic_settings_parent").on(table.parentId),
]);

export const personalitySettings = pgTable("personality_settings", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  parentId: integer("parent_id").notNull().references(() => users.id).unique(),
  formality: text("formality").notNull().default("ты"),
  humor: integer("humor").notNull().default(3),
  softness: integer("softness").notNull().default(4),
  verbosity: integer("verbosity").notNull().default(3),
  useEmoji: boolean("use_emoji").notNull().default(true),
  encouragement: integer("encouragement").notNull().default(4),
});

export const insertTopicSettingSchema = createInsertSchema(topicSettings).omit({ id: true });
export const insertPersonalitySettingSchema = createInsertSchema(personalitySettings).omit({ id: true });

export type TopicSetting = typeof topicSettings.$inferSelect;
export type InsertTopicSetting = z.infer<typeof insertTopicSettingSchema>;
export type PersonalitySetting = typeof personalitySettings.$inferSelect;
export type InsertPersonalitySetting = z.infer<typeof insertPersonalitySettingSchema>;

export const insertUserMemorySchema = createInsertSchema(userMemory).omit({ id: true, createdAt: true });
export type InsertAiUsageLog = z.infer<typeof insertAiUsageLogSchema>;
export type AiUsageLog = typeof aiUsageLogs.$inferSelect;
export type InsertUserMemory = z.infer<typeof insertUserMemorySchema>;
export type UserMemory = typeof userMemory.$inferSelect;

export const analyticsEvents = pgTable("analytics_events", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  sessionId: text("session_id").notNull(),
  variant: text("variant").notNull(),
  eventType: text("event_type").notNull(),
  eventData: text("event_data"),
  utmSource: text("utm_source"),
  utmMedium: text("utm_medium"),
  utmCampaign: text("utm_campaign"),
  utmContent: text("utm_content"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_analytics_variant").on(table.variant),
  index("idx_analytics_created").on(table.createdAt),
]);

export const insertAnalyticsEventSchema = createInsertSchema(analyticsEvents).omit({ id: true, createdAt: true });
export type InsertAnalyticsEvent = z.infer<typeof insertAnalyticsEventSchema>;
export type AnalyticsEvent = typeof analyticsEvents.$inferSelect;

export const searchQualityLogs = pgTable("search_quality_logs", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  parentId: integer("parent_id"),
  toolName: text("tool_name").notNull(),
  query: text("query").notNull(),
  sourcesCount: integer("sources_count").notNull().default(0),
  mergeStrategy: text("merge_strategy"),
  validationResult: text("validation_result"),
  responseTimeMs: integer("response_time_ms"),
  tokensTotal: integer("tokens_total").default(0),
  userFeedback: text("user_feedback"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_sqlog_tool").on(table.toolName),
  index("idx_sqlog_created").on(table.createdAt),
  index("idx_sqlog_parent").on(table.parentId),
]);

export const insertSearchQualityLogSchema = createInsertSchema(searchQualityLogs).omit({ id: true, createdAt: true });
export type InsertSearchQualityLog = z.infer<typeof insertSearchQualityLogSchema>;
export type SearchQualityLog = typeof searchQualityLogs.$inferSelect;