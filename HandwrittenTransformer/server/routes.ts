import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertHandwritingTemplateSchema, insertHandwrittenNoteSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Get handwriting template for user
  app.get("/api/templates/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const template = await storage.getHandwritingTemplate(userId);
      res.json(template);
    } catch (error) {
      res.status(500).json({ message: "Failed to get template" });
    }
  });

  // Create or update handwriting template
  app.post("/api/templates", async (req, res) => {
    try {
      const data = insertHandwritingTemplateSchema.parse(req.body);
      const existing = await storage.getHandwritingTemplate(data.userId);
      
      let template;
      if (existing) {
        template = await storage.updateHandwritingTemplate(data.userId, data);
      } else {
        template = await storage.createHandwritingTemplate(data);
      }
      
      res.json(template);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid template data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to save template" });
      }
    }
  });

  // Create handwritten note
  app.post("/api/notes", async (req, res) => {
    try {
      const data = insertHandwrittenNoteSchema.parse(req.body);
      const note = await storage.createHandwrittenNote(data);
      res.json(note);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid note data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create note" });
      }
    }
  });

  // Get handwritten note
  app.get("/api/notes/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const note = await storage.getHandwrittenNote(id);
      if (!note) {
        res.status(404).json({ message: "Note not found" });
        return;
      }
      res.json(note);
    } catch (error) {
      res.status(500).json({ message: "Failed to get note" });
    }
  });

  // Generate handwriting from text
  app.post("/api/generate-handwriting", async (req, res) => {
    try {
      const { text, templateId, settings } = req.body;
      
      if (!text || !templateId) {
        res.status(400).json({ message: "Text and templateId are required" });
        return;
      }

      // Simulate handwriting generation (in real app, this would use AI/ML)
      const handwritingData = {
        paths: text.split('').map((char: string, index: number) => ({
          character: char,
          path: `M${index * 20},30 Q${index * 20 + 10},10 ${index * 20 + 20},30`, // Sample SVG path
          x: index * 20,
          y: 30
        })),
        dimensions: { width: text.length * 20, height: 60 }
      };

      res.json({ handwritingData });
    } catch (error) {
      res.status(500).json({ message: "Failed to generate handwriting" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
