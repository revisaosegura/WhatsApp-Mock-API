import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import path from "path";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { appRouter } from "./routers";

const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;
const app = express();

// Basic middleware
app.use(cors({
  origin: process.env.FRONTEND_ORIGIN || true,
  credentials: true,
}));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());

// Health check
app.get("/health", (_req, res) => res.json({ ok: true }));

// Public webhook endpoint (provider -> your app)
app.post("/webhook", async (req, res) => {
  // Simple pass-through: try to forward to webhook handler util if present.
  try {
    const { handleIncomingProviderWebhook } = await import("./webhookUtils");
    // handleIncomingProviderWebhook should validate signature and persist events
    await handleIncomingProviderWebhook(req, res);
    // the handler should end the response; return here just in case
  } catch (err) {
    // If there's no specialized handler, respond 200 to avoid retry storms during development
    console.warn("webhook handler not found or errored:", err instanceof Error ? err.message : err);
    res.sendStatus(200);
  }
});

// TRPC router mounted at /api/trpc
app.use(
  "/api/trpc",
  createExpressMiddleware({
    router: appRouter,
    createContext: async ({ req, res }) => {
      // routers.ts expects ctx with req, res and user resolution happens inside auth.ts
      return { req, res };
    },
  })
);

// Serve frontend if built (optional)
const staticPath = path.join(__dirname, "public");
app.use(express.static(staticPath));
app.get("*", (_req, res) => {
  // If your frontend is SPA and built into public/, this serves index.html
  res.sendFile(path.join(staticPath, "index.html"), (err) => {
    if (err) res.sendStatus(404);
  });
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT} (env=${process.env.NODE_ENV || "development"})`);
});