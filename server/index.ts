import "dotenv/config";
import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";
import { handleUploadRequirements } from "./routes/upload";
import { handleUploadSettlements } from "./routes/settlements";

export function createServer() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Example API routes
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  app.get("/api/demo", handleDemo);
  app.post("/api/upload-requirements", handleUploadRequirements);
  app.post("/api/upload-settlements", handleUploadSettlements);

  return app;
}
