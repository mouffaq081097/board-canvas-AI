'use client';

import { useRef, useEffect, useCallback, RefObject } from 'react';
import { useCanvasStore } from '@/store/canvasStore';
import { screenToCanvas } from '@/lib/canvasUtils';

interface Props {
  viewportRef: RefObject<{ x: number; y: number; scale: number }>;
}

export default function DrawingCanvas({ viewportRef }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isPointerDown = useRef(false);
  const pathPoints = useRef<{ x: number; y: number }[]>([]);
  const { addObject, activeTool } = useCanvasStore();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }, []);

  const getCanvasPos = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      const vp = viewportRef.current ?? { x: 0, y: 0, scale: 1 };
      const rect = canvasRef.current!.getBoundingClientRect();
      return screenToCanvas(e.clientX - rect.left, e.clientY - rect.top, vp);
    },
    [viewportRef]
  );

  const drawCurrent = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || pathPoints.current.length < 2) return;
    const vp = viewportRef.current ?? { x: 0, y: 0, scale: 1 };
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(vp.x, vp.y);
    ctx.scale(vp.scale, vp.scale);
    ctx.beginPath();
    ctx.strokeStyle = '#6366f1';
    ctx.lineWidth = 2 / vp.scale;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    const pts = pathPoints.current;
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
    ctx.stroke();
    ctx.restore();
  }, [viewportRef]);

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (activeTool !== 'pen') return;
    isPointerDown.current = true;
    pathPoints.current = [getCanvasPos(e)];
    canvasRef.current?.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isPointerDown.current || activeTool !== 'pen') return;
    pathPoints.current.push(getCanvasPos(e));
    drawCurrent();
  };

  const handlePointerUp = () => {
    if (!isPointerDown.current) return;
    isPointerDown.current = false;

    const pts = pathPoints.current;
    if (pts.length < 2) {
      pathPoints.current = [];
      const canvas = canvasRef.current;
      if (canvas) canvas.getContext('2d')!.clearRect(0, 0, canvas.width, canvas.height);
      return;
    }

    const xs = pts.map(p => p.x);
    const ys = pts.map(p => p.y);
    const minX = Math.min(...xs);
    const minY = Math.min(...ys);
    const maxX = Math.max(...xs);
    const maxY = Math.max(...ys);
    const pathData = 'M ' + pts.map(p => `${p.x - minX} ${p.y - minY}`).join(' L ');

    addObject({
      type: 'drawing',
      x: minX, y: minY,
      width: Math.max(maxX - minX, 10),
      height: Math.max(maxY - minY, 10),
      content: '',
      style: { strokeColor: '#6366f1', strokeWidth: 2, opacity: 1 },
      metadata: { pathData },
    });

    pathPoints.current = [];
    const canvas = canvasRef.current;
    if (canvas) canvas.getContext('2d')!.clearRect(0, 0, canvas.width, canvas.height);
  };

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 z-20"
      style={{ cursor: activeTool === 'pen' ? 'crosshair' : 'not-allowed', touchAction: 'none' }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    />
  );
}
