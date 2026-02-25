import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const roleEnum = pgEnum("role", ["parent", "child"]);
export const reminderStatusEnum = pgEnum("reminder_status", ["pending", "confirmed", "missed"]);
export const eventTypeEnum = pgEnum("event_type", ["checkin", "medication", "alert", "utility", "memoir", "order"]);
export const eventSeverityEnum = pgEnum("event_severity", ["info", "warning", "critical"]);

export const users = pgTable("users", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  role: roleEnum("role").notNull().default("child"),
  linkCode: varchar("link_code", { length: 8 }).unique(),
  linkedParentId: integer("linked_parent_id"),
  timezone: text("timezone").default("Europe/Moscow"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const reminders = pgTable("reminders", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: integer("user_id").notNull(),
  parentId: integer("parent_id").notNull(),
  medicineName: text("medicine_name").notNull(),
  timeHour: integer("time_hour").notNull(),
  timeMinute: integer("time_minute").notNull(),
  status: reminderStatusEnum("status").notNull().default("pending"),
  isActive: boolean("is_active").notNull().default(true),
  lastTriggered: timestamp("last_triggered"),
  lastConfirmed: timestamp("last_confirmed"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const events = pgTable("events", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: integer("user_id").notNull(),
  parentId: integer("parent_id").notNull(),
  type: eventTypeEnum("type").notNull(),
  severity: eventSeverityEnum("severity").notNull().default("info"),
  title: text("title").notNull(),
  description: text("description"),
  isRead: boolean("is_read").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const utilityMetrics = pgTable("utility_metrics", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: integer("user_id").notNull(),
  parentId: integer("parent_id").notNull(),
  meterType: text("meter_type").notNull(),
  value: text("value").notNull(),
  photoUrl: text("photo_url"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const memoirs = pgTable("memoirs", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: integer("user_id").notNull(),
  parentId: integer("parent_id").notNull(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  audioUrl: text("audio_url"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const healthLogs = pgTable("health_logs", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  parentId: integer("parent_id").notNull(),
  systolic: integer("systolic"),
  diastolic: integer("diastolic"),
  note: text("note"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true, linkCode: true });
export const insertReminderSchema = createInsertSchema(reminders).omit({ id: true, createdAt: true, lastTriggered: true, lastConfirmed: true });
export const insertEventSchema = createInsertSchema(events).omit({ id: true, createdAt: true });
export const insertUtilityMetricSchema = createInsertSchema(utilityMetrics).omit({ id: true, createdAt: true });
export const insertMemoirSchema = createInsertSchema(memoirs).omit({ id: true, createdAt: true });
export const insertHealthLogSchema = createInsertSchema(healthLogs).omit({ id: true, createdAt: true });

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