import React, { useRef, useState, useEffect } from "react";
import { X, Crop, Move, ZoomIn, ZoomOut } from "lucide-react";

interface ImageCropperProps {
  imageSrc: string;
  onCrop: (croppedImage: string) => void;
  onCancel: () => void;
  language: "ku" | "en";
}

export default function ImageCropper({ imageSrc, onCrop, onCancel, language }: ImageCropperProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [zoom, setZoom] = useState<number>(1.0);
  const [offset, setOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  
  // Dragging states
  const isDragging = useRef<boolean>(false);
  const prevX = useRef<number>(0);
  const prevY = useRef<number>(0);

  // Load image
  useEffect(() => {
    const img = new Image();
    if (imageSrc && (imageSrc.startsWith("http://") || imageSrc.startsWith("https://"))) {
      img.crossOrigin = "anonymous";
    }
    img.src = imageSrc;
    img.onload = () => {
      setImage(img);
      // Reset position
      setOffset({ x: 0, y: 0 });
      setZoom(1.0);
    };
    img.onerror = () => {
      console.error("Could not load image source for editing.");
    };
  }, [imageSrc]);

  // Redraw logic
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !image) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear previous drawing
    ctx.clearRect(0, 0, 400, 400);

    // 1. Draw Image with zoom and offset centered
    ctx.save();
    
    // Translate context to canvas center
    ctx.translate(200 + offset.x, 200 + offset.y);
    // Apply zoom scale
    ctx.scale(zoom, zoom);

    // Calculate dimensions to maintain aspect ratio
    let drawWidth = 0;
    let drawHeight = 0;
    const canvasRefWidth = 320; // safe frame inside 400
    
    if (image.width > image.height) {
      drawHeight = canvasRefWidth;
      drawWidth = (image.width / image.height) * canvasRefWidth;
    } else {
      drawWidth = canvasRefWidth;
      drawHeight = (image.height / image.width) * canvasRefWidth;
    }

    // Draw the image centered around the translated origin (0, 0)
    ctx.drawImage(image, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);
    
    ctx.restore();

    // 2. Draw outer slate-900 mask with carved circular gap
    ctx.save();
    ctx.fillStyle = "rgba(15, 23, 42, 0.75)"; // Semi-transparent dark overlay
    ctx.beginPath();
    ctx.rect(0, 0, 400, 400);
    // Draw counter-clockwise circle to cut a hole in the rectangle
    ctx.arc(200, 200, 110, 0, Math.PI * 2, true);
    ctx.fill();
    ctx.restore();

    // 3. Draw a gorgeous amber/golden border around the crop circle
    ctx.save();
    ctx.strokeStyle = "#f59e0b"; // amber-500
    ctx.lineWidth = 3;
    ctx.shadowColor = "rgba(245, 158, 11, 0.4)";
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(200, 200, 110, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

  }, [image, zoom, offset]);

  // Touch handlers for panning
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      isDragging.current = true;
      prevX.current = e.touches[0].clientX;
      prevY.current = e.touches[0].clientY;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging.current || e.touches.length !== 1) return;
    const dx = e.touches[0].clientX - prevX.current;
    const dy = e.touches[0].clientY - prevY.current;
    setOffset((prev) => ({ x: prev.x + dx, y: prev.y + dy }));
    prevX.current = e.touches[0].clientX;
    prevY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = () => {
    isDragging.current = false;
  };

  // Mouse handlers for panning
  const handleMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true;
    prevX.current = e.clientX;
    prevY.current = e.clientY;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current) return;
    const dx = e.clientX - prevX.current;
    const dy = e.clientY - prevY.current;
    setOffset((prev) => ({ x: prev.x + dx, y: prev.y + dy }));
    prevX.current = e.clientX;
    prevY.current = e.clientY;
  };

  const handleMouseUpOrLeave = () => {
    isDragging.current = false;
  };

  // Export cropped circle
  const handleApplyCrop = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Create high-res target crop canvas
    const finalCanvas = document.createElement("canvas");
    finalCanvas.width = 300;
    finalCanvas.height = 300;
    const fCtx = finalCanvas.getContext("2d");

    if (fCtx) {
      // The circle area of radius 110 is centered at (200, 200) inside the 400x400 canvas.
      // Left coordinate: 200 - 110 = 90
      // Top coordinate: 200 - 110 = 90
      // Size: 220x220
      fCtx.drawImage(canvas, 90, 90, 220, 220, 0, 0, 300, 300);
      const croppedBase64 = finalCanvas.toDataURL("image/jpeg", 0.9);
      onCrop(croppedBase64);
    }
  };

  const t = {
    title: language === "ku" ? "بڕین و هاسەنگکردنی وێنە" : "Crop and Adjust Photo",
    instructions: language === "ku" ? "وێنەکە ڕابکێشە بۆ دەستکاری و پێوانە بکە تا تێدەچێتە ناو بازنە ئاڵتوونییەکە" : "Drag to pan, slide the zoom bar to perfectly frame the face in the golden ring.",
    zoom: language === "ku" ? "گەورەکردن / زووم" : "Zoom Scaling",
    apply: language === "ku" ? "ببڕە و پاشەکەوت بکە" : "Crop & Save Image",
    cancel: language === "ku" ? "پاشگەزبوونەوە" : "Cancel"
  };

  return (
    <div className="fixed inset-0 z-55 overflow-y-auto bg-slate-950/70 backdrop-blur-lg flex items-center justify-center p-4">
      <div className="bg-white rounded-[32px] max-w-md w-full border border-slate-100 shadow-2xl overflow-hidden flex flex-col p-6 animate-fade-in">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-amber-500/10 text-amber-600 rounded-xl">
              <Crop className="w-5 h-5" />
            </div>
            <h4 className="font-display font-black text-slate-800 text-base sm:text-lg">
              {t.title}
            </h4>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Dynamic Instruction */}
        <p className="text-xs text-slate-500 leading-relaxed text-center mb-5 font-medium px-2">
          {t.instructions}
        </p>

        {/* Interactive Interactive Crop Canvas */}
        <div className="flex justify-center items-center mb-5">
          <div className="relative rounded-3xl bg-slate-100 border border-slate-200 overflow-hidden shadow-inner p-1 max-w-[290px] w-full">
            <canvas
              ref={canvasRef}
              width={400}
              height={400}
              className="w-full h-auto aspect-square rounded-2xl cursor-move touch-none bg-slate-900"
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUpOrLeave}
              onMouseLeave={handleMouseUpOrLeave}
            />
            {/* Visual HUD overlay clue */}
            <div className="absolute bottom-3 left-3 bg-slate-900/80 backdrop-blur text-[10px] text-white px-2 py-1 rounded-lg pointer-events-none flex items-center gap-1">
              <Move className="w-3 h-3 text-amber-500" />
              <span>{language === "ku" ? "بە جێگۆڕکێ" : "Drag to move"}</span>
            </div>
          </div>
        </div>

        {/* Zoom Controls Slider */}
        <div className="bg-slate-50 border border-slate-100 p-3.5 rounded-2xl mb-6">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-600 mb-1.5 px-1">
            <span>{t.zoom}</span>
            <span className="font-mono text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-md text-[10px]">{Math.round(zoom * 100)}%</span>
          </div>
          <div className="flex items-center gap-3">
            <ZoomOut className="w-4 h-4 text-slate-400 shrink-0" />
            <input
              type="range"
              min="1.0"
              max="4.0"
              step="0.05"
              value={zoom}
              onChange={(e) => setZoom(parseFloat(e.target.value))}
              className="flex-1 accent-amber-500 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
            />
            <ZoomIn className="w-4 h-4 text-slate-400 shrink-0" />
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-3 justify-end pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 px-4 py-2.5 text-xs text-slate-600 hover:text-slate-800 bg-slate-50 hover:bg-slate-100 font-bold rounded-xl border border-slate-200 transition active:scale-95 text-center"
          >
            {t.cancel}
          </button>
          
          <button
            type="button"
            onClick={handleApplyCrop}
            className="flex-1 px-4 py-2.5 text-xs text-slate-950 bg-amber-500 hover:bg-amber-600 font-black rounded-xl shadow-md transition active:scale-95 text-center flex items-center justify-center gap-1.5"
          >
            <Crop className="w-4 h-4" />
            {t.apply}
          </button>
        </div>

      </div>
    </div>
  );
}
