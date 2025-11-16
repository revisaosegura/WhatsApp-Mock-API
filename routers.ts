import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      ctx.res.clearCookie("auth_token", { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
    register: publicProcedure
      .input(z.object({
        email: z.string().email(),
        password: z.string().min(6),
        name: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const { registerUser } = await import("./auth");
        const result = await registerUser(input.email, input.password, input.name);
        
        if (result.success && result.token) {
          const cookieOptions = getSessionCookieOptions(ctx.req);
          ctx.res.cookie("auth_token", result.token, {
            ...cookieOptions,
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
          });
        }
        
        return result;
      }),
    login: publicProcedure
      .input(z.object({
        email: z.string().email(),
        password: z.string(),
      }))
      .mutation(async ({ input, ctx }) => {
        const { loginUser } = await import("./auth");
        const result = await loginUser(input.email, input.password);
        
        if (result.success && result.token) {
          const cookieOptions = getSessionCookieOptions(ctx.req);
          ctx.res.cookie("auth_token", result.token, {
            ...cookieOptions,
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
          });
        }
        
        return result;
      }),
  }),

  // Media Upload Router
  media: router({
    upload: protectedProcedure
      .input(z.object({
        file: z.string(), // base64 encoded file
        filename: z.string(),
        mimeType: z.string(),
      }))
      .mutation(async ({ input, ctx }) => {
        const { uploadMediaToS3, validateMediaType, validateFileSize } = await import("./mediaUpload");
        
        // Decode base64
        const fileBuffer = Buffer.from(input.file, "base64");
        
        // Validate file size
        const sizeValidation = validateFileSize(fileBuffer.length);
        if (!sizeValidation.valid) {
          throw new Error(sizeValidation.error);
        }
        
        // Validate media type
        const typeValidation = validateMediaType(input.mimeType);
        if (!typeValidation.valid) {
          throw new Error(typeValidation.error || "Tipo de arquivo não suportado");
        }
        
        // Upload to S3
        const uploaded = await uploadMediaToS3(
          ctx.user.id,
          fileBuffer,
          input.filename,
          input.mimeType
        );
        
        return {
          ...uploaded,
          mediaType: typeValidation.type,
        };
      }),
  }),
  
  // WhatsApp Integration Routers
  whatsapp: router({ init: protectedProcedure.mutation(async ({ ctx }) => {
      const { initializeWhatsAppClient } = await import("./whatsapp");
      await initializeWhatsAppClient(ctx.user.id);
      return { success: true };
    }),
    
    status: protectedProcedure.query(async ({ ctx }) => {
      const { getConnectionStatus } = await import("./whatsapp");
      return getConnectionStatus(ctx.user.id);
    }),
    
    qrCode: protectedProcedure.query(async ({ ctx }) => {
      const { getQRCode } = await import("./whatsapp");
      const qrCode = getQRCode(ctx.user.id);
      return { qrCode };
    }),
    
    disconnect: protectedProcedure.mutation(async ({ ctx }) => {
      const { disconnectWhatsAppClient } = await import("./whatsapp");
      await disconnectWhatsAppClient(ctx.user.id);
      return { success: true };
    }),
  }),
  
  contacts: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const { getContactsByUserId } = await import("./db");
      return getContactsByUserId(ctx.user.id);
    }),
    
    create: protectedProcedure
      .input(z.object({
        phoneNumber: z.string().min(1).max(20),
        name: z.string().min(1).max(255),
        profilePicture: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { createContact } = await import("./db");
        return createContact({
          userId: ctx.user.id,
          ...input,
        });
      }),
    
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().min(1).max(255).optional(),
        profilePicture: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { updateContact } = await import("./db");
        const { id, ...data } = input;
        await updateContact(id, data);
        return { success: true };
      }),
    
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const { deleteContact } = await import("./db");
        await deleteContact(input.id);
        return { success: true };
      }),
  }),
  
  messages: router({
    list: protectedProcedure
      .input(z.object({
        phoneNumber: z.string().optional(),
        limit: z.number().min(1).max(500).optional(),
      }))
      .query(async ({ ctx, input }) => {
        const { getMessagesByUserId, getMessagesByPhoneNumber } = await import("./db");
        if (input.phoneNumber) {
          return getMessagesByPhoneNumber(ctx.user.id, input.phoneNumber);
        }
        return getMessagesByUserId(ctx.user.id, input.limit || 100);
      }),
    
    send: protectedProcedure
      .input(z.object({
        phoneNumber: z.string(),
        content: z.string(),
        messageType: z.enum(["text", "image", "video", "audio", "document"]).optional(),
        mediaUrl: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const { sendWhatsAppMessage } = await import("./whatsapp");
        const result = await sendWhatsAppMessage(
          ctx.user.id,
          input.phoneNumber,
          input.content,
          input.mediaUrl,
          input.messageType
        );
        
        if (!result.success) {
          throw new Error(result.error || "Erro ao enviar mensagem");
        }
        
        return { success: true, messageId: result.messageId };
      }),
    
    simulateReceive: protectedProcedure
      .input(z.object({
        phoneNumber: z.string().min(1).max(20),
        content: z.string().min(1),
        messageType: z.enum(["text", "image", "video", "audio", "document"]).optional(),
        mediaUrl: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { createMessage } = await import("./db");
        const { triggerWebhooks } = await import("./webhookUtils");
        
        const message = await createMessage({
          userId: ctx.user.id,
          phoneNumber: input.phoneNumber,
          direction: "inbound",
          content: input.content,
          messageType: input.messageType || "text",
          mediaUrl: input.mediaUrl || null,
          status: "delivered",
        });
        
        // Trigger webhooks
        await triggerWebhooks(ctx.user.id, "message.received", {
          messageId: message.id,
          phoneNumber: message.phoneNumber,
          content: message.content,
          messageType: message.messageType,
        });
        
        return message;
      }),
  }),
  
  webhooks: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const { getWebhooksByUserId } = await import("./db");
      return getWebhooksByUserId(ctx.user.id);
    }),
    
    create: protectedProcedure
      .input(z.object({
        url: z.string().url(),
        events: z.array(z.enum(["message.sent", "message.received", "message.status"])),
        secret: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { createWebhook } = await import("./db");
        const { generateWebhookSecret } = await import("./webhookUtils");
        
        return createWebhook({
          userId: ctx.user.id,
          url: input.url,
          events: JSON.stringify(input.events),
          secret: input.secret || generateWebhookSecret(),
          isActive: 1,
        });
      }),
    
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        url: z.string().url().optional(),
        events: z.array(z.enum(["message.sent", "message.received", "message.status"])).optional(),
        isActive: z.boolean().optional(),
      }))
      .mutation(async ({ input }) => {
        const { updateWebhook } = await import("./db");
        const { id, events, isActive, ...rest } = input;
        const data: any = { ...rest };
        if (events) data.events = JSON.stringify(events);
        if (isActive !== undefined) data.isActive = isActive ? 1 : 0;
        await updateWebhook(id, data);
        return { success: true };
      }),
    
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const { deleteWebhook } = await import("./db");
        await deleteWebhook(input.id);
        return { success: true };
      }),
    
    logs: protectedProcedure
      .input(z.object({
        webhookId: z.number(),
        limit: z.number().min(1).max(200).optional(),
      }))
      .query(async ({ input }) => {
        const { getWebhookLogsByWebhookId } = await import("./db");
        return getWebhookLogsByWebhookId(input.webhookId, input.limit || 50);
      }),
  }),
});

export type AppRouter = typeof appRouter;
