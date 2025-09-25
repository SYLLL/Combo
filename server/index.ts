import "dotenv/config";
import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";
import { handleUploadRequirements } from "./routes/upload.js";
import { handleUploadSettlements } from "./routes/settlements.js";
import { testGeminiConnection } from "./routes/upload.js";
import { analyzeFigmaFile } from "./routes/figma";

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
  app.post("/api/figma/analyze", analyzeFigmaFile);

  // Test endpoint for Gemini API
  app.get('/api/test-gemini', async (req, res) => {
    try {
      const isWorking = await testGeminiConnection();
      if (isWorking) {
        res.json({ success: true, message: 'Gemini API is working correctly' });
      } else {
        res.json({ success: false, message: 'Gemini API test failed' });
      }
    } catch (error) {
      console.error('Test endpoint error:', error);
      res.status(500).json({ success: false, message: 'Test failed', error: error.message });
    }
  });

  return app;
}
