'use client';

import { useRef, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';

interface SignatureCanvasProps {
  onChange: (dataUrl: string | null) => void;
  value?: string | null;
}

export function SignatureCanvas({ onChange, value }: SignatureCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawing = useRef(false);
  const lastDataUrl = useRef<string | null>(value ?? null);
  const [isEmpty, setIsEmpty] = useState(!value);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;

    // Match the drawing buffer to the canvas' on-screen size (times device pixel ratio),
    // so pointer coordinates map 1:1 to drawing coordinates and the line stays under the pen.
    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.round(canvas.clientWidth * dpr);
      canvas.height = Math.round(canvas.clientHeight * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.strokeStyle = '#1a1a2e';
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      // Resizing clears the canvas; redraw the existing signature scaled to the new size
      if (lastDataUrl.current) {
        const img = new Image();
        img.onload = () => ctx.drawImage(img, 0, 0, canvas.clientWidth, canvas.clientHeight);
        img.src = lastDataUrl.current;
      }
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);

    // offsetX/offsetY are relative to the drawing area (excluding the border)
    const startDraw = (e: PointerEvent) => {
      e.preventDefault();
      canvas.setPointerCapture(e.pointerId);
      isDrawing.current = true;
      ctx.beginPath();
      ctx.moveTo(e.offsetX, e.offsetY);
    };

    const draw = (e: PointerEvent) => {
      if (!isDrawing.current) return;
      e.preventDefault();
      ctx.lineTo(e.offsetX, e.offsetY);
      ctx.stroke();
      setIsEmpty(false);
    };

    const stopDraw = () => {
      if (isDrawing.current) {
        isDrawing.current = false;
        lastDataUrl.current = canvas.toDataURL('image/png');
        onChange(lastDataUrl.current);
      }
    };

    canvas.addEventListener('pointerdown', startDraw);
    canvas.addEventListener('pointermove', draw);
    canvas.addEventListener('pointerup', stopDraw);
    canvas.addEventListener('pointercancel', stopDraw);

    return () => {
      observer.disconnect();
      canvas.removeEventListener('pointerdown', startDraw);
      canvas.removeEventListener('pointermove', draw);
      canvas.removeEventListener('pointerup', stopDraw);
      canvas.removeEventListener('pointercancel', stopDraw);
    };
  }, [onChange]);

  const clear = () => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.restore();
    lastDataUrl.current = null;
    setIsEmpty(true);
    onChange(null);
  };

  return (
    <div className="flex flex-col gap-2">
      <canvas
        ref={canvasRef}
        className="border-2 border-dashed border-gray-300 rounded-lg w-full h-40 touch-none bg-white cursor-crosshair"
      />
      {!isEmpty && (
        <Button variant="ghost" size="sm" onClick={clear} type="button">
          נקה חתימה
        </Button>
      )}
    </div>
  );
}
