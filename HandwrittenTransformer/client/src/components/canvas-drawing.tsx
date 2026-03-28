import { useRef, useEffect, useState } from "react";
import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Point {
  x: number;
  y: number;
  timestamp: number;
}

interface CanvasDrawingProps {
  character: string;
  onStrokeComplete: (character: string, strokes: Point[][]) => void;
}

export function CanvasDrawing({ character, onStrokeComplete }: CanvasDrawingProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [strokes, setStrokes] = useState<Point[][]>([]);
  const [currentStroke, setCurrentStroke] = useState<Point[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    // Configure drawing style
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#334155";
  }, []);

  const getEventPos = (e: React.MouseEvent | React.TouchEvent): { x: number; y: number } => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;

    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDrawing(true);
    const pos = getEventPos(e);
    const point: Point = { ...pos, timestamp: Date.now() };
    setCurrentStroke([point]);

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (ctx) {
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y);
    }
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDrawing) return;

    const pos = getEventPos(e);
    const point: Point = { ...pos, timestamp: Date.now() };
    setCurrentStroke(prev => [...prev, point]);

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (ctx) {
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
    }
  };

  const stopDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDrawing) return;

    setIsDrawing(false);
    if (currentStroke.length > 0) {
      const newStrokes = [...strokes, currentStroke];
      setStrokes(newStrokes);
      setCurrentStroke([]);
      onStrokeComplete(character, newStrokes);
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (ctx && canvas) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      setStrokes([]);
      setCurrentStroke([]);
      onStrokeComplete(character, []);
    }
  };

  return (
    <div className="character-card bg-slate-50 rounded-xl p-4 border-2 border-dashed border-slate-300 hover:border-primary transition-colors">
      <div className="text-center mb-3">
        <span className="text-2xl font-bold text-slate-700">{character}</span>
      </div>
      <canvas
        ref={canvasRef}
        className="w-full h-24 bg-white rounded-lg border border-slate-200 cursor-crosshair touch-none"
        style={{ touchAction: 'none' }}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        onTouchStart={startDrawing}
        onTouchMove={draw}
        onTouchEnd={stopDrawing}
        onTouchCancel={stopDrawing}
      />
      <div className="text-center mt-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={clearCanvas}
          className="text-xs text-slate-500 hover:text-slate-700"
        >
          <RotateCcw className="w-3 h-3 mr-1" />
          Clear
        </Button>
      </div>
    </div>
  );
}
