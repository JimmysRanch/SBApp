'use client';

import { useRef, useState, useEffect } from 'react';

/**
 * Simple signature pad using an HTML canvas.  Captures pointer and touch input
 * so users can sign waivers on mobile or desktop.  The drawn image is kept in
 * memory and can be retrieved via `toDataURL()` if needed for upload.
 */
export default function SignaturePad() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [drawing, setDrawing] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, []);

  const getPos = (e: PointerEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const start = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    const pos = getPos(e.nativeEvent);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    setDrawing(true);
  };

  const draw = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing) return;
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    const pos = getPos(e.nativeEvent);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  };

  const end = () => {
    setDrawing(false);
  };

  const clear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (canvas && ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  return (
    <div className="space-y-2">
      <canvas
        ref={canvasRef}
        width={500}
        height={160}
        className="w-full touch-none rounded border border-white/10 bg-brand-onyx/80 shadow-[0_18px_55px_-30px_rgba(5,12,32,0.85)]"
        onPointerDown={start}
        onPointerMove={draw}
        onPointerUp={end}
        onPointerLeave={end}
      />
      <button
        type="button"
        onClick={clear}
        className="rounded-full border border-white/10 bg-brand-onyx/70 px-3 py-1 text-sm font-semibold text-brand-cream shadow-[0_12px_35px_-20px_rgba(5,12,32,0.85)] transition hover:-translate-y-0.5"
      >
        Clear
      </button>
    </div>
  );
}

