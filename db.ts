import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.email) {
    throw new Error("User email is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      email: user.email,
    };
    const updateSet: Record<string, unknown> = {};

  const textFields = ["name", "loginMethod", "openId", "password"] as const;
  type TextField = (typeof textFields)[number];

  const assignNullable = (field: TextField) => {
    const value = user[field];
    if (value === undefined) return;
    const normalized = value ?? null;
    values[field] = normalized;
    updateSet[field] = normalized;
  };

  // Email is required, handle separately
  values.email = user.email;
  updateSet.email = user.email;

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.email, email)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function createUser(user: InsertUser) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(users).values(user);
  const newUser = await db.select().from(users).where(eq(users.id, Number(result[0].insertId))).limit(1);
  if (!newUser[0]) throw new Error("Failed to create user");
  return newUser[0];
}

// WhatsApp Mock API Query Helpers

import { contacts, messages, webhooks, webhookLogs, Contact, Message, Webhook, WebhookLog, InsertContact, InsertMessage, InsertWebhook, InsertWebhookLog } from "../drizzle/schema";
import { desc, and } from "drizzle-orm";

// Contacts
export async function getContactsByUserId(userId: number): Promise<Contact[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(contacts).where(eq(contacts.userId, userId)).orderBy(desc(contacts.createdAt));
}

export async function getContactById(id: number): Promise<Contact | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(contacts).where(eq(contacts.id, id)).limit(1);
  return result[0];
}

export async function createContact(contact: InsertContact): Promise<Contact> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(contacts).values(contact);
  const newContact = await getContactById(Number(result[0].insertId));
  if (!newContact) throw new Error("Failed to create contact");
  return newContact;
}

export async function updateContact(id: number, data: Partial<InsertContact>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(contacts).set(data).where(eq(contacts.id, id));
}

export async function deleteContact(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(contacts).where(eq(contacts.id, id));
}

// Messages
export async function getMessagesByUserId(userId: number, limit = 100): Promise<Message[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(messages).where(eq(messages.userId, userId)).orderBy(desc(messages.createdAt)).limit(limit);
}

export async function getMessagesByPhoneNumber(userId: number, phoneNumber: string): Promise<Message[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(messages).where(and(eq(messages.userId, userId), eq(messages.phoneNumber, phoneNumber))).orderBy(desc(messages.createdAt));
}

export async function createMessage(message: InsertMessage): Promise<Message> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(messages).values(message);
  const newMessage = await db.select().from(messages).where(eq(messages.id, Number(result[0].insertId))).limit(1);
  return newMessage[0];
}

export async function updateMessageStatus(id: number, status: "sent" | "delivered" | "read" | "failed"): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(messages).set({ status }).where(eq(messages.id, id));
}

// Webhooks
export async function getWebhooksByUserId(userId: number): Promise<Webhook[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(webhooks).where(eq(webhooks.userId, userId)).orderBy(desc(webhooks.createdAt));
}

export async function getActiveWebhooksByUserId(userId: number): Promise<Webhook[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(webhooks).where(and(eq(webhooks.userId, userId), eq(webhooks.isActive, 1)));
}

export async function createWebhook(webhook: InsertWebhook): Promise<Webhook> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(webhooks).values(webhook);
  const newWebhook = await db.select().from(webhooks).where(eq(webhooks.id, Number(result[0].insertId))).limit(1);
  return newWebhook[0];
}

export async function updateWebhook(id: number, data: Partial<InsertWebhook>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(webhooks).set(data).where(eq(webhooks.id, id));
}

export async function deleteWebhook(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(webhooks).where(eq(webhooks.id, id));
}

// Webhook Logs
export async function createWebhookLog(log: InsertWebhookLog): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(webhookLogs).values(log);
}

export async function getWebhookLogsByWebhookId(webhookId: number, limit = 50): Promise<WebhookLog[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(webhookLogs).where(eq(webhookLogs.webhookId, webhookId)).orderBy(desc(webhookLogs.createdAt)).limit(limit);
}
