import { int, mysqlEnum, mysqlTable, text, timestamp, tinyint, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Optional for custom auth. */
  openId: varchar("openId", { length: 64 }).unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }).notNull().unique(),
  /** Hashed password for custom authentication */
  password: varchar("password", { length: 255 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// WhatsApp Mock API Tables

/**
 * Contacts table - stores phone contacts
 */
export const contacts = mysqlTable("contacts", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  phoneNumber: varchar("phoneNumber", { length: 20 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  profilePicture: text("profilePicture"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Contact = typeof contacts.$inferSelect;
export type InsertContact = typeof contacts.$inferInsert;

/**
 * Messages table - stores all messages sent/received
 */
export const messages = mysqlTable("messages", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  contactId: int("contactId").references(() => contacts.id, { onDelete: "set null" }),
  phoneNumber: varchar("phoneNumber", { length: 20 }).notNull(),
  direction: mysqlEnum("direction", ["inbound", "outbound"]).notNull(),
  content: text("content").notNull(),
  status: mysqlEnum("status", ["sent", "delivered", "read", "failed"]).default("sent").notNull(),
  messageType: mysqlEnum("messageType", ["text", "image", "video", "audio", "document"]).default("text").notNull(),
  mediaUrl: text("mediaUrl"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Message = typeof messages.$inferSelect;
export type InsertMessage = typeof messages.$inferInsert;

/**
 * Webhooks table - stores webhook configurations
 */
export const webhooks = mysqlTable("webhooks", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  url: text("url").notNull(),
  events: text("events").notNull(), // JSON array of event types
  secret: varchar("secret", { length: 64 }),
  isActive: tinyint("isActive").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Webhook = typeof webhooks.$inferSelect;
export type InsertWebhook = typeof webhooks.$inferInsert;

/**
 * Webhook logs table - stores webhook delivery attempts
 */
export const webhookLogs = mysqlTable("webhookLogs", {
  id: int("id").autoincrement().primaryKey(),
  webhookId: int("webhookId").notNull().references(() => webhooks.id, { onDelete: "cascade" }),
  event: varchar("event", { length: 50 }).notNull(),
  payload: text("payload").notNull(),
  responseStatus: int("responseStatus"),
  responseBody: text("responseBody"),
  success: tinyint("success").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type WebhookLog = typeof webhookLogs.$inferSelect;
export type InsertWebhookLog = typeof webhookLogs.$inferInsert;