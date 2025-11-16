import { Client, LocalAuth, Message as WAMessage, MessageMedia } from "whatsapp-web.js";
import QRCode from "qrcode";
import { createMessage } from "./db";
import { triggerWebhooks } from "./webhookUtils";
import { uploadMediaToS3 } from "./mediaUpload";
import path from "path";
import axios from "axios";

interface WhatsAppClient {
  client: Client;
  qrCode: string | null;
  isReady: boolean;
  userId: number;
}

const clients = new Map<number, WhatsAppClient>();

/**
 * Initialize WhatsApp client for a user
 */
export async function initializeWhatsAppClient(userId: number): Promise<void> {
  if (clients.has(userId)) {
    console.log(`[WhatsApp] Client already exists for user ${userId}`);
    return;
  }

  const sessionPath = path.join(process.cwd(), `.wwebjs_auth/session_${userId}`);

  const client = new Client({
    authStrategy: new LocalAuth({
      clientId: `user_${userId}`,
      dataPath: sessionPath,
    }),
    puppeteer: {
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-accelerated-2d-canvas",
        "--no-first-run",
        "--no-zygote",
        "--disable-gpu",
      ],
    },
  });

  const whatsappClient: WhatsAppClient = {
    client,
    qrCode: null,
    isReady: false,
    userId,
  };

  clients.set(userId, whatsappClient);

  // QR Code event
  client.on("qr", async (qr) => {
    console.log(`[WhatsApp] QR Code generated for user ${userId}`);
    try {
      const qrCodeDataUrl = await QRCode.toDataURL(qr);
      whatsappClient.qrCode = qrCodeDataUrl;
    } catch (error) {
      console.error("[WhatsApp] Error generating QR code:", error);
    }
  });

  // Ready event
  client.on("ready", () => {
    console.log(`[WhatsApp] Client ready for user ${userId}`);
    whatsappClient.isReady = true;
    whatsappClient.qrCode = null;
  });

  // Authenticated event
  client.on("authenticated", () => {
    console.log(`[WhatsApp] Client authenticated for user ${userId}`);
  });

  // Auth failure event
  client.on("auth_failure", (msg) => {
    console.error(`[WhatsApp] Auth failure for user ${userId}:`, msg);
    whatsappClient.qrCode = null;
  });

  // Disconnected event
  client.on("disconnected", (reason) => {
    console.log(`[WhatsApp] Client disconnected for user ${userId}:`, reason);
    whatsappClient.isReady = false;
  });

  // Message received event
  client.on("message", async (message: WAMessage) => {
    try {
      const contact = await message.getContact();
      let mediaUrl: string | null = null;
      let messageType: "text" | "image" | "video" | "audio" | "document" = "text";
      let content = message.body || "";

      // Handle media messages
      if (message.hasMedia) {
        try {
          const media = await message.downloadMedia();
          
          // Determine media type
          if (media.mimetype.startsWith("image/")) {
            messageType = "image";
          } else if (media.mimetype.startsWith("video/")) {
            messageType = "video";
          } else if (media.mimetype.startsWith("audio/")) {
            messageType = "audio";
          } else {
            messageType = "document";
          }

          // Upload media to S3
          const mediaBuffer = Buffer.from(media.data, "base64");
          const filename = media.filename || `media_${Date.now()}.${media.mimetype.split("/")[1]}`;
          const uploaded = await uploadMediaToS3(userId, mediaBuffer, filename, media.mimetype);
          mediaUrl = uploaded.url;
          
          // Use caption as content if available
          if (message.body) {
            content = message.body;
          } else {
            content = `[${messageType.toUpperCase()}]`;
          }
        } catch (mediaError) {
          console.error("[WhatsApp] Error downloading media:", mediaError);
          content = "[Erro ao baixar mídia]";
        }
      }

      // Save to database
      const savedMessage = await createMessage({
        userId,
        phoneNumber: contact.number,
        direction: "inbound",
        content,
        messageType,
        mediaUrl,
        status: "delivered",
      });

      // Trigger webhooks
      await triggerWebhooks(userId, "message.received", {
        messageId: savedMessage.id,
        phoneNumber: contact.number,
        content,
        messageType,
        mediaUrl,
      });

      console.log(`[WhatsApp] Message received from ${contact.number} (type: ${messageType})`);
    } catch (error) {
      console.error("[WhatsApp] Error processing received message:", error);
    }
  });

  // Initialize client
  try {
    await client.initialize();
    console.log(`[WhatsApp] Client initialized for user ${userId}`);
  } catch (error) {
    console.error(`[WhatsApp] Error initializing client for user ${userId}:`, error);
    clients.delete(userId);
    throw error;
  }
}

/**
 * Get WhatsApp client for a user
 */
export function getWhatsAppClient(userId: number): WhatsAppClient | undefined {
  return clients.get(userId);
}

/**
 * Get QR Code for a user
 */
export function getQRCode(userId: number): string | null {
  const client = clients.get(userId);
  return client?.qrCode || null;
}

/**
 * Check if client is ready
 */
export function isClientReady(userId: number): boolean {
  const client = clients.get(userId);
  return client?.isReady || false;
}

/**
 * Send a message via WhatsApp (text or media)
 */
export async function sendWhatsAppMessage(
  userId: number,
  phoneNumber: string,
  content: string,
  mediaUrl?: string,
  messageType?: "text" | "image" | "video" | "audio" | "document"
): Promise<{ success: boolean; messageId?: number; error?: string }> {
  const whatsappClient = clients.get(userId);

  if (!whatsappClient) {
    return { success: false, error: "Cliente WhatsApp não inicializado" };
  }

  if (!whatsappClient.isReady) {
    return { success: false, error: "Cliente WhatsApp não está conectado" };
  }

  try {
    // Format phone number (remove special characters and add country code if needed)
    let formattedNumber = phoneNumber.replace(/\D/g, "");
    if (!formattedNumber.endsWith("@c.us")) {
      formattedNumber = `${formattedNumber}@c.us`;
    }

    // Send message with or without media
    if (mediaUrl && messageType && messageType !== "text") {
      // Download media from URL
      const response = await axios.get(mediaUrl, { responseType: "arraybuffer" });
      const mediaBuffer = Buffer.from(response.data);
      const base64Media = mediaBuffer.toString("base64");
      
      // Determine mimetype from URL or default
      const mimeType = response.headers["content-type"] || "application/octet-stream";
      
      // Create MessageMedia object
      const media = new MessageMedia(mimeType, base64Media);
      
      // Send media message with caption
      await whatsappClient.client.sendMessage(formattedNumber, media, {
        caption: content || undefined,
      });
    } else {
      // Send text message
      await whatsappClient.client.sendMessage(formattedNumber, content);
    }

    // Save to database
    const savedMessage = await createMessage({
      userId,
      phoneNumber,
      direction: "outbound",
      content,
      messageType: messageType || "text",
      mediaUrl: mediaUrl || null,
      status: "sent",
    });

    // Trigger webhooks
    await triggerWebhooks(userId, "message.sent", {
      messageId: savedMessage.id,
      phoneNumber,
      content,
      messageType: "text",
    });

    // Update status to delivered after a delay
    setTimeout(async () => {
      const { updateMessageStatus } = await import("./db");
      await updateMessageStatus(savedMessage.id, "delivered");
      await triggerWebhooks(userId, "message.status", {
        messageId: savedMessage.id,
        status: "delivered",
      });
    }, 1000);

    return { success: true, messageId: savedMessage.id };
  } catch (error: any) {
    console.error("[WhatsApp] Error sending message:", error);
    return { success: false, error: error.message || "Erro ao enviar mensagem" };
  }
}

/**
 * Disconnect WhatsApp client
 */
export async function disconnectWhatsAppClient(userId: number): Promise<void> {
  const whatsappClient = clients.get(userId);
  if (whatsappClient) {
    try {
      await whatsappClient.client.destroy();
      clients.delete(userId);
      console.log(`[WhatsApp] Client disconnected for user ${userId}`);
    } catch (error) {
      console.error(`[WhatsApp] Error disconnecting client for user ${userId}:`, error);
    }
  }
}

/**
 * Get WhatsApp connection status
 */
export function getConnectionStatus(userId: number): {
  initialized: boolean;
  ready: boolean;
  hasQR: boolean;
} {
  const client = clients.get(userId);
  return {
    initialized: !!client,
    ready: client?.isReady || false,
    hasQR: !!client?.qrCode,
  };
}
