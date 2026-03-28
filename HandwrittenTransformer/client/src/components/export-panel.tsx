import { useState } from "react";
import { Download, Share, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { HandwritingEngine, type HandwritingGenerationResult } from "@/lib/handwriting-engine";

function slugFromNote(noteText: string): string {
  const line = noteText.split("\n")[0]?.trim().slice(0, 48) ?? "";
  const slug = line
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .toLowerCase();
  return slug || "note";
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function pixelRatioFromQuality(quality: string): number {
  if (quality === "high") return 2;
  if (quality === "low") return 1;
  return 1.5;
}

async function rasterizeSvg(
  svgMarkup: string,
  width: number,
  height: number,
  mime: "image/png" | "image/jpeg",
  jpegQuality: number,
  pixelRatio: number,
): Promise<Blob | null> {
  return new Promise((resolve) => {
    const blob = new Blob([svgMarkup], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const w = Math.max(1, Math.ceil(width * pixelRatio));
      const h = Math.max(1, Math.ceil(height * pixelRatio));
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        URL.revokeObjectURL(url);
        resolve(null);
        return;
      }
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, w, h);
      ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      ctx.drawImage(img, 0, 0, width, height);
      URL.revokeObjectURL(url);
      canvas.toBlob((b) => resolve(b), mime, mime === "image/jpeg" ? jpegQuality : undefined);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(null);
    };
    img.src = url;
  });
}

interface ExportPanelProps {
  handwritingData: HandwritingGenerationResult | null;
  includeLines: boolean;
  noteText: string;
  templateLoading: boolean;
  templateError: boolean;
  hasTemplate: boolean;
}

export function ExportPanel({
  handwritingData,
  includeLines,
  noteText,
  templateLoading,
  templateError,
  hasTemplate,
}: ExportPanelProps) {
  const { toast } = useToast();
  const [format, setFormat] = useState("svg");
  const [paperSize, setPaperSize] = useState("a4");
  const [quality, setQuality] = useState("high");
  const [includeMargins, setIncludeMargins] = useState(true);
  const [addWatermark, setAddWatermark] = useState(false);
  const [busy, setBusy] = useState(false);

  const baseName = () => `handscript-${slugFromNote(noteText)}`;

  const buildSvgMarkup = () => {
    if (!handwritingData) return null;
    let svg = new HandwritingEngine().exportToSVG(handwritingData, { includeLines });
    if (addWatermark) {
      svg = svg.replace(
        "</svg>",
        `<text x="8" y="${
          handwritingData.dimensions.height - 8
        }" font-size="10" fill="#94a3b8" font-family="system-ui,sans-serif">HandScript</text></svg>`,
      );
    }
    return svg;
  };

  const handleDownload = async () => {
    if (!handwritingData || !noteText.trim()) {
      toast({
        title: "Nothing to export",
        description: "Go back and add text in step 2 first.",
        variant: "destructive",
      });
      return;
    }
    const svg = buildSvgMarkup();
    if (!svg) return;

    setBusy(true);
    try {
      if (format === "svg") {
        triggerDownload(new Blob([svg], { type: "image/svg+xml;charset=utf-8" }), `${baseName()}.svg`);
        toast({ title: "Download started", description: "Saved as SVG." });
        return;
      }

      if (format === "pdf") {
        toast({
          title: "PDF export",
          description: "Use Print → Save as PDF, or download SVG and convert locally.",
        });
        return;
      }

      const pr = pixelRatioFromQuality(quality);
      const mime = format === "jpeg" ? "image/jpeg" : "image/png";
      const ext = format === "jpeg" ? "jpg" : "png";
      const raster = await rasterizeSvg(
        svg,
        handwritingData.dimensions.width,
        handwritingData.dimensions.height,
        mime,
        0.92,
        pr,
      );
      if (!raster) {
        toast({
          title: "Export failed",
          description: "Could not rasterize the preview. Try SVG instead.",
          variant: "destructive",
        });
        return;
      }
      triggerDownload(raster, `${baseName()}.${ext}`);
      toast({ title: "Download started", description: `Saved as ${ext.toUpperCase()}.` });
    } finally {
      setBusy(false);
    }
  };

  const handleShare = async () => {
    if (!handwritingData || !noteText.trim()) {
      toast({
        title: "Nothing to share",
        description: "Add text in step 2 before sharing.",
        variant: "destructive",
      });
      return;
    }
    const svg = buildSvgMarkup();
    if (!svg) return;

    if (!navigator.share) {
      toast({
        title: "Sharing unavailable",
        description: "Your browser does not support the Web Share API. Use Download instead.",
      });
      return;
    }

    const file = new File([svg], `${baseName()}.svg`, { type: "image/svg+xml" });
    const payload = { files: [file], title: "Handwritten note", text: noteText.slice(0, 200) };
    try {
      if (!navigator.canShare?.(payload)) {
        toast({
          title: "Cannot share files",
          description: "Try Download and attach the file manually.",
        });
        return;
      }
      await navigator.share(payload);
    } catch (e) {
      if ((e as Error).name === "AbortError") return;
      toast({
        title: "Share failed",
        description: "Try Download instead.",
        variant: "destructive",
      });
    }
  };

  const handlePrint = () => {
    if (!handwritingData) {
      toast({
        title: "Nothing to print",
        description: "Complete step 2 with some text first.",
        variant: "destructive",
      });
      return;
    }
    const svg = buildSvgMarkup();
    if (!svg) return;
    const w = window.open("", "_blank");
    if (!w) {
      toast({
        title: "Pop-up blocked",
        description: "Allow pop-ups to print, or use Download.",
        variant: "destructive",
      });
      return;
    }
    w.document.write(
      `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>Print</title></head><body style="margin:0">${svg}</body></html>`,
    );
    w.document.close();
    w.focus();
    w.print();
  };

  const renderPreview = () => {
    if (templateLoading) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      );
    }
    if (templateError || !hasTemplate) {
      return (
        <div className="text-center text-slate-500 text-sm px-4">
          Template unavailable. Return to step 1 to save your handwriting, then run through step 2 again.
        </div>
      );
    }
    if (!handwritingData || !noteText.trim()) {
      return (
        <div className="text-center text-slate-500 text-sm px-4">
          No handwritten content yet. Go back to step 2 and type your note.
        </div>
      );
    }

    const { width, height } = handwritingData.dimensions;
    return (
      <svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="xMidYMid meet"
        className="max-h-full w-auto mx-auto"
      >
        {includeLines &&
          Array.from(
            { length: Math.max(0, Math.ceil((height - 30) / 40)) },
            (_, i) => 30 + i * 40,
          ).map((y) => (
            <line key={y} x1="0" y1={y} x2={width} y2={y} stroke="#e2e8f0" strokeWidth="1" />
          ))}
        {handwritingData.paths.map((p, i) => (
          <path
            key={i}
            d={p.path}
            stroke="#334155"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ))}
        {addWatermark && (
          <text
            x={8}
            y={height - 8}
            fontSize={10}
            fill="#94a3b8"
            fontFamily="system-ui, sans-serif"
          >
            HandScript
          </text>
        )}
      </svg>
    );
  };

  return (
    <Card className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
      <div className="bg-gradient-to-r from-purple-500 to-pink-600 px-8 py-6">
        <h2 className="text-2xl font-bold text-white mb-2">Export Your Handwritten Note</h2>
        <p className="text-purple-100">Save your handwritten note in various formats for printing or sharing.</p>
      </div>

      <CardContent className="p-8">
        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-1 space-y-4">
            <h3 className="font-semibold text-slate-900 mb-4">Export Settings</h3>

            <div className="space-y-3">
              <div>
                <Label htmlFor="format" className="text-sm font-medium text-slate-700 mb-2">
                  Format
                </Label>
                <Select value={format} onValueChange={setFormat}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="svg">SVG (vector)</SelectItem>
                    <SelectItem value="png">PNG Image</SelectItem>
                    <SelectItem value="jpeg">JPEG Image</SelectItem>
                    <SelectItem value="pdf">PDF (see note)</SelectItem>
                  </SelectContent>
                </Select>
                {format === "pdf" && (
                  <p className="text-xs text-slate-500 mt-1">
                    PDF is not generated in-app yet—use Print → Save as PDF, or download SVG.
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="paperSize" className="text-sm font-medium text-slate-700 mb-2">
                  Paper Size
                </Label>
                <Select value={paperSize} onValueChange={setPaperSize}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="a4">A4</SelectItem>
                    <SelectItem value="letter">Letter</SelectItem>
                    <SelectItem value="a5">A5</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-slate-500 mt-1">Layout presets; canvas export matches note dimensions.</p>
              </div>

              <div>
                <Label htmlFor="quality" className="text-sm font-medium text-slate-700 mb-2">
                  Raster quality
                </Label>
                <Select value={quality} onValueChange={setQuality} disabled={format === "svg" || format === "pdf"}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">High (scale 2×)</SelectItem>
                    <SelectItem value="medium">Medium (scale 1.5×)</SelectItem>
                    <SelectItem value="low">Low (scale 1×)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="includeMargins"
                    checked={includeMargins}
                    onCheckedChange={(checked) => setIncludeMargins(checked as boolean)}
                  />
                  <Label htmlFor="includeMargins" className="text-sm">
                    Include margins (layout preset)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="addWatermark"
                    checked={addWatermark}
                    onCheckedChange={(checked) => setAddWatermark(checked as boolean)}
                  />
                  <Label htmlFor="addWatermark" className="text-sm">
                    Add watermark
                  </Label>
                </div>
              </div>
            </div>
          </div>

          <div className="md:col-span-2 space-y-4">
            <Label className="text-sm font-medium text-slate-700">Export preview</Label>
            <div className="bg-slate-50 rounded-xl p-6 border-2 border-dashed border-slate-300 h-64 flex items-center justify-center overflow-hidden">
              {renderPreview()}
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button type="button" onClick={() => void handleDownload()} className="flex-1" disabled={busy}>
                <Download className="w-4 h-4 mr-2" />
                {busy ? "Working…" : "Download"}
              </Button>
              <Button type="button" onClick={() => void handleShare()} className="flex-1 bg-accent hover:bg-emerald-600">
                <Share className="w-4 h-4 mr-2" />
                Share
              </Button>
              <Button type="button" onClick={handlePrint} variant="outline" className="flex-1">
                <Printer className="w-4 h-4 mr-2" />
                Print
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
