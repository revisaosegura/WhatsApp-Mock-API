import { createWebhookLog, getActiveWebhooksByUserId } from "./db";
import { Webhook } from "../drizzle/schema";

export type WebhookEvent = "message.sent" | "message.received" | "message.status";

export interface WebhookPayload {
  event: WebhookEvent;
  timestamp: string;
  data: {
    messageId?: number;
    phoneNumber?: string;
    content?: string;
    status?: string;
    direction?: string;
    [key: string]: any;
  };
}

/**
 * Trigger webhooks for a specific user and event
 */
export async function triggerWebhooks(userId: number, event: WebhookEvent, data: any): Promise<void> {
  const webhooks = await getActiveWebhooksByUserId(userId);
  
  for (const webhook of webhooks) {
    const events = JSON.parse(webhook.events) as string[];
    
    // Check if this webhook is subscribed to this event
    if (!events.includes(event)) {
      continue;
    }
    
    const payload: WebhookPayload = {
      event,
      timestamp: new Date().toISOString(),
      data,
    };
    
    // Send webhook in background (don't await)
    sendWebhook(webhook, payload).catch(err => {
      console.error(`Failed to send webhook ${webhook.id}:`, err);
    });
  }
}

/**
 * Send a webhook HTTP request
 */
async function sendWebhook(webhook: Webhook, payload: WebhookPayload): Promise<void> {
  const startTime = Date.now();
  let success = false;
  let responseStatus: number | undefined;
  let responseBody: string | undefined;
  
  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "User-Agent": "WhatsApp-Mock-API/1.0",
    };
    
    // Add signature if secret is configured
    if (webhook.secret) {
      const crypto = await import("crypto");
      const signature = crypto
        .createHmac("sha256", webhook.secret)
        .update(JSON.stringify(payload))
        .digest("hex");
      headers["X-Webhook-Signature"] = signature;
    }
    
    const response = await fetch(webhook.url, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(10000), // 10 second timeout
    });
    
    responseStatus = response.status;
    responseBody = await response.text();
    success = response.ok;
    
  } catch (error: any) {
    responseStatus = 0;
    responseBody = error.message || "Request failed";
    success = false;
  }
  
  // Log the webhook attempt
  await createWebhookLog({
    webhookId: webhook.id,
    event: payload.event,
    payload: JSON.stringify(payload),
    responseStatus: responseStatus || null,
    responseBody: responseBody?.substring(0, 1000) || null, // Limit response body size
    success: success ? 1 : 0,
  });
}

/**
 * Generate a random webhook secret
 */
export function generateWebhookSecret(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let secret = "";
  for (let i = 0; i < 32; i++) {
    secret += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return secret;
}
