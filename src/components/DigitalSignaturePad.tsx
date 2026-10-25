import React, { useRef, useState, useEffect, useCallback } from "react";
import { RotateCcw, PenTool, CheckCircle2 } from "lucide-react";

interface DigitalSignaturePadProps {
  value?: string;
  onChange: (dataUrl: string | null) => void;
  language?: "ku" | "en";
  height?: number;
}

export default function DigitalSignaturePad({
  value,
  onChange,
  language = "ku",
  height = 140
}: DigitalSignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [lastPoint, setLastPoint] = useState<{ x: number; y: number } | null>(null);

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Handle high DPI displays
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    
    ctx.scale(dpr, dpr);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#1e293b"; // Dark slate ink
    ctx.lineWidth = 2.5;

    // If pre-existing value, draw it
    if (value) {
      const img = new Image();
      img.onload = () => {
        ctx.clearRect(0, 0, rect.width, rect.height);
        ctx.drawImage(img, 0, 0, rect.width, rect.height);
        setHasDrawn(true);
      };
      img.src = value;
    }
  }, []);

  const getCanvasCoordinates = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Capture pointer to track outside canvas if fast stroke
    try {
      canvas.setPointerCapture(e.pointerId);
    } catch {
      // ignore
    }

    const { x, y } = getCanvasCoordinates(e);
    setIsDrawing(true);
    setLastPoint({ x, y });

    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.beginPath();
      ctx.arc(x, y, 1.25, 0, Math.PI * 2);
      ctx.fillStyle = "#1e293b";
      ctx.fill();
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !lastPoint) return;
    e.preventDefault();

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { x, y } = getCanvasCoordinates(e);

    ctx.beginPath();
    ctx.moveTo(lastPoint.x, lastPoint.y);
    ctx.lineTo(x, y);
    ctx.stroke();

    setLastPoint({ x, y });
    if (!hasDrawn) setHasDrawn(true);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    setIsDrawing(false);
    setLastPoint(null);

    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      canvas.releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }

    // Export signature as base64
    const dataUrl = canvas.toDataURL("image/png");
    setHasDrawn(true);
    onChange(dataUrl);
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    ctx.clearRect(0, 0, rect.width, rect.height);
    setHasDrawn(false);
    onChange(null);
  };

  return (
    <div className="flex flex-col gap-1.5 w-full">
      <div className="flex items-center justify-between text-xs">
        <span className="font-bold text-slate-700 flex items-center gap-1.5">
          <PenTool className="w-3.5 h-3.5 text-indigo-600" />
          {language === "ku" ? "واژووی دیجیتالی (لەسەر شاشە بە پەنجە یان قەڵەم واژوو بکە):" : "Digital Signature (Sign on screen with finger or stylus):"}
        </span>
        <div className="flex items-center gap-2">
          {hasDrawn && (
            <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {language === "ku" ? "واژوو تۆمارکراوە" : "Signed"}
            </span>
          )}
          <button
            type="button"
            onClick={handleClear}
            className="text-[11px] font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 px-2 py-0.5 rounded-lg border border-rose-200 transition flex items-center gap-1 cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            {language === "ku" ? "سڕینەوەی واژوو" : "Clear"}
          </button>
        </div>
      </div>

      <div 
        className="relative w-full rounded-2xl border-2 border-dashed border-slate-300 bg-white overflow-hidden shadow-inner touch-none select-none transition focus-within:border-indigo-400 hover:border-slate-400"
        style={{ height: `${height}px` }}
      >
        <canvas
          ref={canvasRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          className="w-full h-full cursor-crosshair touch-none block"
          style={{ touchAction: "none" }}
        />

        {/* Baseline guideline */}
        <div className="absolute bottom-6 left-6 right-6 border-b border-dashed border-slate-200 pointer-events-none flex justify-between items-center text-[10px] text-slate-300 font-sans font-bold">
          <span>{language === "ku" ? "شوێنی واژوو" : "Signature Line"}</span>
          <span>✕</span>
        </div>

        {!hasDrawn && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5 opacity-70">
              <PenTool className="w-4 h-4 stroke-[1.5]" />
              {language === "ku" ? "لێرە واژوو بکە (پەنجە یان قەڵەم لەسەر شاشە ڕابکێشە)" : "Draw signature here using finger or stylus"}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
