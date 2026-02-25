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
  linkedParentId: integer("linked_parent_id").references((): any => users.id),
  timezone: text("timezone").default("Europe/Moscow"),
  createdAt: timestamp("created_at").defaultNow(),
});

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
  parentId: integer("parent_id").notNull(),
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

export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true, linkCode: true });
export const insertReminderSchema = createInsertSchema(reminders).omit({ id: true, createdAt: true, lastTriggered: true, lastConfirmed: true });
export const insertEventSchema = createInsertSchema(events).omit({ id: true, createdAt: true });
export const insertUtilityMetricSchema = createInsertSchema(utilityMetrics).omit({ id: true, createdAt: true });
export const insertMemoirSchema = createInsertSchema(memoirs).omit({ id: true, createdAt: true });
export const insertHealthLogSchema = createInsertSchema(healthLogs).omit({ id: true, createdAt: true });
export const insertSubscriptionSchema = createInsertSchema(subscriptions).omit({ id: true, createdAt: true });
export const insertWaitlistSchema = createInsertSchema(waitlist).omit({ id: true, createdAt: true });
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
export type InsertAiUsageLog = z.infer<typeof insertAiUsageLogSchema>;
export type AiUsageLog = typeof aiUsageLogs.$inferSelect;