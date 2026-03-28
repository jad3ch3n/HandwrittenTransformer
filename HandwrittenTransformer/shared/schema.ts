import { pgTable, text, serial, integer, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const handwritingTemplates = pgTable("handwriting_templates", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  characterData: jsonb("character_data").notNull(), // Store character strokes as JSON
  isComplete: boolean("is_complete").default(false),
  createdAt: text("created_at").notNull(),
});

export const handwrittenNotes = pgTable("handwritten_notes", {
  id: serial("id").primaryKey(),
  templateId: integer("template_id").references(() => handwritingTemplates.id),
  originalText: text("original_text").notNull(),
  handwritingData: jsonb("handwriting_data").notNull(), // Synthesized handwriting paths
  settings: jsonb("settings").notNull(), // Font size, lines, etc.
  createdAt: text("created_at").notNull(),
});

export const insertHandwritingTemplateSchema = createInsertSchema(handwritingTemplates).omit({
  id: true,
  createdAt: true,
});

export const insertHandwrittenNoteSchema = createInsertSchema(handwrittenNotes).omit({
  id: true,
  createdAt: true,
});

export type InsertHandwritingTemplate = z.infer<typeof insertHandwritingTemplateSchema>;
export type HandwritingTemplate = typeof handwritingTemplates.$inferSelect;
export type InsertHandwrittenNote = z.infer<typeof insertHandwrittenNoteSchema>;
export type HandwrittenNote = typeof handwrittenNotes.$inferSelect;

// Character stroke data structure
export const characterStrokeSchema = z.object({
  character: z.string(),
  strokes: z.array(z.array(z.object({
    x: z.number(),
    y: z.number(),
    timestamp: z.number()
  })))
});

export type CharacterStroke = z.infer<typeof characterStrokeSchema>;
