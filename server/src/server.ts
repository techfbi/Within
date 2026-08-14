import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import morgan from "morgan";
import { env } from "./config/env.js";
import { errorHandler } from "./middleware/errorHandler.js";
import workspaceRoutes from "./routes/workspaces.js";
import { getRedis } from "./config/redis.js";
import documentRoutes from "./routes/documents.js";

const app = express();

// Security headers
app.use(helmet());

// CORS, only allow the configured client origin
app.use(
  cors({
    origin: env.CLIENT_URL,
    credentials: true,
    methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Body parsing
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

// Compression
app.use(compression()); //reduces response size. Good for things like workspace/document lists and API responses.

// HTTP logging (skip in test)
if (env.NODE_ENV !== "test") {
  app.use(morgan("combined"));
}

// Health check no auth required
app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// API routes
app.use("/api/workspaces", workspaceRoutes);
app.use("/api/workspaces/:workspaceId/documents", documentRoutes);

// 404 handler, must come after all routes
app.use((_req, res) => {
  res.status(404).json({ error: { code: "NOT_FOUND", message: "Route not found" } });
});

// Global error handler, must be last, must have 4 params
app.use(errorHandler);

// Connect Redis on startup then start listening
const start = async () => {
  getRedis(); // establish connection early so first request isn't slow

  app.listen(env.PORT, () => {
    console.log(`Within API running on port ${env.PORT} [${env.NODE_ENV}]`);
  });
};

start();