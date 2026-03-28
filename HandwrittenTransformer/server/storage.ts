import { 
  type HandwritingTemplate, 
  type InsertHandwritingTemplate,
  type HandwrittenNote,
  type InsertHandwrittenNote
} from "@shared/schema";

export interface IStorage {
  // Handwriting Templates
  getHandwritingTemplate(userId: string): Promise<HandwritingTemplate | undefined>;
  createHandwritingTemplate(template: InsertHandwritingTemplate): Promise<HandwritingTemplate>;
  updateHandwritingTemplate(userId: string, template: Partial<InsertHandwritingTemplate>): Promise<HandwritingTemplate | undefined>;
  
  // Handwritten Notes
  getHandwrittenNote(id: number): Promise<HandwrittenNote | undefined>;
  getHandwrittenNotesByTemplate(templateId: number): Promise<HandwrittenNote[]>;
  createHandwrittenNote(note: InsertHandwrittenNote): Promise<HandwrittenNote>;
}

export class MemStorage implements IStorage {
  private templates: Map<string, HandwritingTemplate>;
  private notes: Map<number, HandwrittenNote>;
  private currentTemplateId: number;
  private currentNoteId: number;

  constructor() {
    this.templates = new Map();
    this.notes = new Map();
    this.currentTemplateId = 1;
    this.currentNoteId = 1;
  }

  async getHandwritingTemplate(userId: string): Promise<HandwritingTemplate | undefined> {
    return Array.from(this.templates.values()).find(template => template.userId === userId);
  }

  async createHandwritingTemplate(insertTemplate: InsertHandwritingTemplate): Promise<HandwritingTemplate> {
    const id = this.currentTemplateId++;
    const template: HandwritingTemplate = {
      ...insertTemplate,
      id,
      createdAt: new Date().toISOString(),
      isComplete: insertTemplate.isComplete ?? false,
    };
    this.templates.set(template.userId, template);
    return template;
  }

  async updateHandwritingTemplate(userId: string, updates: Partial<InsertHandwritingTemplate>): Promise<HandwritingTemplate | undefined> {
    const existing = await this.getHandwritingTemplate(userId);
    if (!existing) return undefined;

    const updated: HandwritingTemplate = {
      ...existing,
      ...updates,
    };
    this.templates.set(userId, updated);
    return updated;
  }

  async getHandwrittenNote(id: number): Promise<HandwrittenNote | undefined> {
    return this.notes.get(id);
  }

  async getHandwrittenNotesByTemplate(templateId: number): Promise<HandwrittenNote[]> {
    return Array.from(this.notes.values()).filter(note => note.templateId === templateId);
  }

  async createHandwrittenNote(insertNote: InsertHandwrittenNote): Promise<HandwrittenNote> {
    const id = this.currentNoteId++;
    const note: HandwrittenNote = {
      ...insertNote,
      id,
      createdAt: new Date().toISOString(),
      templateId: insertNote.templateId ?? null,
    };
    this.notes.set(id, note);
    return note;
  }
}

export const storage = new MemStorage();
