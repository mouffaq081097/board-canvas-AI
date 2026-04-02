'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useCanvasStore } from '@/store/canvasStore';
import { motion, AnimatePresence } from 'framer-motion';
import { GripHorizontal, Maximize2, Minimize2 } from 'lucide-react';
import { CanvasObject } from '@/types/canvas';

const TYPE_COLORS: Record<string, string> = {
  sticky: '#f59e0b',   // amber
  note: '#64748b',     // slate
  book: '#8b5cf6',     // purple
  shape: '#0ea5e9',    // sky blue
  drawing: '#f43f5e',  // rose
  table: '#10b981',    // emerald
  image: '#f97316',    // orange
};

function getMinimapColor(obj: CanvasObject): string {
  return TYPE_COLORS[obj.type] ?? '#6366f1';
}

const MINIMAP_SIZE = 180; // px
const PADDING = 20;
const NAVBAR_HEIGHT = 56;
const MAP_MARGIN = 16;

function getCorners(mapW: number, mapH: number) {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  return [
    { x: MAP_MARGIN, y: MAP_MARGIN + NAVBAR_HEIGHT },                         // top-left
    { x: vw - mapW - MAP_MARGIN, y: MAP_MARGIN + NAVBAR_HEIGHT },             // top-right
    { x: MAP_MARGIN, y: vh - mapH - MAP_MARGIN },                             // bottom-left
    { x: vw - mapW - MAP_MARGIN, y: vh - mapH - MAP_MARGIN },                 // bottom-right
  ];
}

function getNearestCorner(pos: { x: number; y: number }, mapW: number, mapH: number) {
  const corners = getCorners(mapW, mapH);
  return corners.reduce((best, c) =>
    Math.hypot(pos.x - c.x, pos.y - c.y) < Math.hypot(pos.x - best.x, pos.y - best.y) ? c : best
  );
}

export default function MiniMap() {
  const { objects, viewport, setViewport } = useCanvasStore();
  const containerRef = useRef<HTMLDivElement>(null);
  const [isNavigating, setIsNavigating] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  // Position state: screen coordinates for Framer Motion
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);

  // Initialize to bottom-right corner after mount
  useEffect(() => {
    const mapW = MINIMAP_SIZE;
    const mapH = MINIMAP_SIZE + 24;
    setPos({
      x: window.innerWidth - mapW - MAP_MARGIN,
      y: window.innerHeight - mapH - MAP_MARGIN,
    });
  }, []);

  // Drag state
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef({ mouseX: 0, mouseY: 0, posX: 0, posY: 0 });

  const handlePointerDown = (e: React.PointerEvent) => {
    if (!pos) return;
    setDragging(true);
    dragStart.current = { mouseX: e.clientX, mouseY: e.clientY, posX: pos.x, posY: pos.y };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragging) return;
    const dx = e.clientX - dragStart.current.mouseX;
    const dy = e.clientY - dragStart.current.mouseY;
    setPos({ x: dragStart.current.posX + dx, y: dragStart.current.posY + dy });
  };

  const handlePointerUp = () => {
    if (!dragging || !pos) return;
    setDragging(false);
    const mapW = isMinimized ? 40 : MINIMAP_SIZE;
    const mapH = isMinimized ? 40 : MINIMAP_SIZE + 24;
    setPos(getNearestCorner(pos, mapW, mapH));
  };

  // Re-snap on window resize
  useEffect(() => {
    const handleResize = () => {
      const mapW = isMinimized ? 40 : MINIMAP_SIZE;
      const mapH = isMinimized ? 40 : MINIMAP_SIZE + 24;
      setPos(prev => {
        if (!prev) return prev;
        return getNearestCorner(prev, mapW, mapH);
      });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isMinimized]);

  // 1. Calculate the bounding box of all objects + viewport
  const bounds = useMemo(() => {
    if (objects.length === 0) {
      return { minX: -1000, minY: -1000, maxX: 1000, maxY: 1000, width: 2000, height: 2000 };
    }

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    objects.forEach((obj) => {
      minX = Math.min(minX, obj.x);
      minY = Math.min(minY, obj.y);
      maxX = Math.max(maxX, obj.x + obj.width);
      maxY = Math.max(maxY, obj.y + obj.height);
    });

    const vpX1 = -viewport.x / viewport.scale;
    const vpY1 = -viewport.y / viewport.scale;
    const vpX2 = (window.innerWidth - viewport.x) / viewport.scale;
    const vpY2 = (window.innerHeight - viewport.y) / viewport.scale;

    minX = Math.min(minX, vpX1);
    minY = Math.min(minY, vpY1);
    maxX = Math.max(maxX, vpX2);
    maxY = Math.max(maxY, vpY2);

    minX -= 500;
    minY -= 500;
    maxX += 500;
    maxY += 500;

    return { minX, minY, maxX, maxY, width: maxX - minX, height: maxY - minY };
  }, [objects, viewport]);

  // 2. Map coordinates to MiniMap pixels
  const mmScale = useMemo(() => {
    const sX = (MINIMAP_SIZE - PADDING * 2) / bounds.width;
    const sY = (MINIMAP_SIZE - PADDING * 2) / bounds.height;
    return Math.min(sX, sY);
  }, [bounds]);

  const toMapX = (x: number) => (x - bounds.minX) * mmScale + PADDING;
  const toMapY = (y: number) => (y - bounds.minY) * mmScale + PADDING;

  // vpRect drag state (separate from minimap-background nav)
  const isDraggingVp = useRef(false);
  const vpDragStart = useRef({ px: 0, py: 0, vpX: 0, vpY: 0 });

  const handlePointerAction = (e: React.PointerEvent) => {
    if (!containerRef.current || isMinimized) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const canvasX = (x - PADDING) / mmScale + bounds.minX;
    const canvasY = (y - PADDING) / mmScale + bounds.minY;

    setViewport({
      x: window.innerWidth / 2 - canvasX * viewport.scale,
      y: window.innerHeight / 2 - canvasY * viewport.scale,
    });
  };

  const handleVpRectDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    isDraggingVp.current = true;
    vpDragStart.current = { px: e.clientX, py: e.clientY, vpX: viewport.x, vpY: viewport.y };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handleVpRectMove = (e: React.PointerEvent) => {
    if (!isDraggingVp.current) return;
    e.stopPropagation();
    const dx = (e.clientX - vpDragStart.current.px) / mmScale;
    const dy = (e.clientY - vpDragStart.current.py) / mmScale;
    setViewport({
      x: vpDragStart.current.vpX - dx * viewport.scale,
      y: vpDragStart.current.vpY - dy * viewport.scale,
    });
  };

  const handleVpRectUp = () => {
    isDraggingVp.current = false;
  };

  const handleNavStart = (e: React.PointerEvent) => {
    setIsNavigating(true);
    handlePointerAction(e);
    containerRef.current?.setPointerCapture(e.pointerId);
  };

  const handleNavMove = (e: React.PointerEvent) => {
    if (isNavigating) handlePointerAction(e);
  };

  const handleNavEnd = () => {
    setIsNavigating(false);
  };

  const vpRect = {
    left: toMapX(-viewport.x / viewport.scale),
    top:  toMapY(-viewport.y / viewport.scale),
    w: (window.innerWidth / viewport.scale) * mmScale,
    h: (window.innerHeight / viewport.scale) * mmScale,
  };

  // Don't render until position is initialized
  if (!pos) return null;

  return (
    <motion.div
      animate={{ x: pos.x, y: pos.y, width: isMinimized ? 40 : MINIMAP_SIZE, height: isMinimized ? 40 : MINIMAP_SIZE + 24 }}
      transition={dragging ? { type: 'tween', duration: 0 } : { type: 'spring', stiffness: 300, damping: 30 }}
      style={{ position: 'fixed', top: 0, left: 0 }}
      className="z-[100] bg-white/80 backdrop-blur-md border border-gray-200 ring-1 ring-indigo-400/50 rounded-2xl shadow-2xl overflow-hidden select-none flex flex-col"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      {/* Mini Header / Drag Bar */}
      <div
        className="h-6 w-full flex items-center justify-between px-2 bg-gray-50/50 border-b border-gray-100 cursor-move group/header"
      >
        <div className="flex items-center gap-1">
          <GripHorizontal size={12} className="text-gray-400" />
          {!isMinimized && <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Radar</span>}
        </div>
        <button
          onPointerDown={(e) => e.stopPropagation()}
          onClick={() => setIsMinimized(!isMinimized)}
          className="p-0.5 hover:bg-gray-200 rounded-md transition-colors text-gray-400"
        >
          {isMinimized ? <Maximize2 size={10} /> : <Minimize2 size={10} />}
        </button>
      </div>

      <AnimatePresence>
        {!isMinimized && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            ref={containerRef}
            onPointerDown={(e) => { e.stopPropagation(); handleNavStart(e); }}
            onPointerMove={(e) => { e.stopPropagation(); handleNavMove(e); }}
            onPointerUp={(e) => { e.stopPropagation(); handleNavEnd(); }}
            className="relative flex-1 cursor-crosshair bg-white/30"
          >
            {/* Objects — color-coded by type */}
            {objects.map((obj) => (
              <div
                key={obj.id}
                className="absolute rounded-sm"
                style={{
                  left: toMapX(obj.x),
                  top: toMapY(obj.y),
                  width: Math.max(2, obj.width * mmScale),
                  height: Math.max(2, obj.height * mmScale),
                  backgroundColor: getMinimapColor(obj),
                  opacity: 0.85,
                  border: '1px solid rgba(0,0,0,0.15)',
                }}
              />
            ))}

            {/* Viewport Finder — draggable to pan */}
            <div
              onPointerDown={handleVpRectDown}
              onPointerMove={handleVpRectMove}
              onPointerUp={handleVpRectUp}
              style={{
                position: 'absolute',
                left: vpRect.left,
                top: vpRect.top,
                width: vpRect.w,
                height: vpRect.h,
                border: '2px solid #6366f1',
                backgroundColor: 'rgba(99,102,241,0.08)',
                borderRadius: 2,
                cursor: 'grab',
                pointerEvents: 'auto',
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {isMinimized && (
        <div
          onPointerDown={(e) => e.stopPropagation()}
          onClick={() => setIsMinimized(false)}
          className="flex-1 flex items-center justify-center cursor-pointer hover:bg-gray-50"
        >
          <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse" />
        </div>
      )}
    </motion.div>
  );
}
