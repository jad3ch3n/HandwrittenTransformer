import { Eye, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { HandwritingEngine, type HandwritingGenerationResult } from "@/lib/handwriting-engine";
import { useToast } from "@/hooks/use-toast";
import type { HandwritingTemplate as HandwritingTemplateRecord } from "@shared/schema";

interface NoteCreationProps {
  templateLoading: boolean;
  templateError: boolean;
  template: HandwritingTemplateRecord | null;
  noteText: string;
  onNoteTextChange: (value: string) => void;
  fontSize: string;
  onFontSizeChange: (value: string) => void;
  includeLines: boolean;
  onIncludeLinesChange: (value: boolean) => void;
  handwritingData: HandwritingGenerationResult | null;
  onComplete: () => void;
}

export function NoteCreation({
  templateLoading,
  templateError,
  template,
  noteText,
  onNoteTextChange,
  fontSize,
  onFontSizeChange,
  includeLines,
  onIncludeLinesChange,
  handwritingData,
  onComplete,
}: NoteCreationProps) {
  const { toast } = useToast();

  const handleExport = () => {
    if (!handwritingData) {
      toast({
        title: "No content",
        description: "Please write some text first.",
        variant: "destructive",
      });
      return;
    }
    onComplete();
  };

  const handleFullPreview = () => {
    if (!handwritingData) {
      toast({
        title: "Nothing to preview",
        description: "Type some text to generate handwriting first.",
        variant: "destructive",
      });
      return;
    }
    const svg = new HandwritingEngine().exportToSVG(handwritingData, { includeLines });
    const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank", "noopener,noreferrer");
    window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
  };

  const renderHandwritingPreview = () => {
    if (!handwritingData) {
      return (
        <div className="space-y-3 font-mono text-slate-400 italic text-center py-8">
          <p>Your handwritten text will appear here...</p>
          <p className="text-sm">As you type, we'll convert it to your unique handwriting style</p>
        </div>
      );
    }

    const { width, height } = handwritingData.dimensions;

    return (
      <svg
        width="100%"
        style={{ minHeight: "12rem" }}
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="xMinYMin meet"
        className="border border-slate-200 rounded"
      >
        {includeLines &&
          Array.from(
            { length: Math.max(0, Math.ceil((height - 30) / 40)) },
            (_, i) => 30 + i * 40,
          ).map((y) => (
            <line
              key={y}
              x1="0"
              y1={y}
              x2={width}
              y2={y}
              stroke="#e2e8f0"
              strokeWidth="1"
            />
          ))}
        {handwritingData.paths.map((pathData, index) => (
          <path
            key={index}
            d={pathData.path}
            stroke="#334155"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ))}
      </svg>
    );
  };

  return (
    <Card className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
      <div className="bg-gradient-to-r from-emerald-500 to-teal-600 px-8 py-6">
        <h2 className="text-2xl font-bold text-white mb-2">Create Your Handwritten Note</h2>
        <p className="text-emerald-100">
          Type your message and watch it transform into your personal handwriting style.
        </p>
      </div>

      <CardContent className="p-8">
        <div className="grid md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <Label htmlFor="noteText" className="text-sm font-medium text-slate-700">
              Your Message
            </Label>
            <Textarea
              id="noteText"
              value={noteText}
              onChange={(e) => onNoteTextChange(e.target.value)}
              className="h-64 resize-none"
              placeholder="Start typing your message here..."
            />

            <div className="flex items-center justify-between text-sm text-slate-600">
              <span>Character count: {noteText.length}</span>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="includeLines"
                    checked={includeLines}
                    onCheckedChange={(checked) => onIncludeLinesChange(checked as boolean)}
                  />
                  <Label htmlFor="includeLines" className="text-sm">
                    Include ruled lines
                  </Label>
                </div>
                <Select value={fontSize} onValueChange={onFontSizeChange}>
                  <SelectTrigger className="w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="small">Small</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="large">Large</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <Label className="text-sm font-medium text-slate-700">Handwritten Preview</Label>
            <div className="w-full h-64 bg-white border-2 border-slate-300 rounded-xl p-4 overflow-auto">
              {templateLoading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : templateError ? (
                <div className="flex items-center justify-center h-full text-center text-sm text-red-600 px-4">
                  Could not load your handwriting template. Check your connection and try again, or return to step 1
                  to save your template.
                </div>
              ) : !template ? (
                <div className="flex items-center justify-center h-full text-center text-sm text-slate-500 px-4">
                  No handwriting template found for this account. Go back to step 1 and save your template.
                </div>
              ) : (
                renderHandwritingPreview()
              )}
            </div>

            <div className="flex space-x-2">
              <Button type="button" variant="outline" className="flex-1" onClick={handleFullPreview}>
                <Eye className="w-4 h-4 mr-2" />
                Full Preview
              </Button>
              <Button type="button" onClick={handleExport} className="flex-1">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
