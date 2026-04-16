'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useCanvasStore } from '@/store/canvasStore';
import { motion, AnimatePresence } from 'framer-motion';
import { GripHorizontal, Maximize2, Minimize2, Map as MapIcon } from 'lucide-react';
import { CanvasObject } from '@/types/canvas';

// Colors matched to our new Freeform palette
const TYPE_COLORS: Record<string, string> = {
  sticky: '#FFF2AD',   // matching pastel yellow
  note: '#ffffff',     // white ruled paper
  book: '#4f46e5',     // premium indigo
  shape: '#6366f1',    // indigo
  drawing: '#f43f5e',  // rose
  table: '#10b981',    // emerald
  image: '#f97316',    // orange
};

function getMinimapColor(obj: CanvasObject): string {
  return TYPE_COLORS[obj.type] ?? '#6366f1';
}

const MAP_WIDTH = 200; // px
const MAP_HEIGHT = 120; // px
const PADDING = 12;
const NAVBAR_HEIGHT = 60;
const MAP_MARGIN = 20;

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
    const mapW = MAP_WIDTH;
    const mapH = MAP_HEIGHT + 24;
    setTimeout(() => {
      setPos({
        x: window.innerWidth - mapW - MAP_MARGIN,
        y: window.innerHeight - mapH - MAP_MARGIN,
      });
    }, 0);
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
    const mapW = isMinimized ? 44 : MAP_WIDTH;
    const mapH = isMinimized ? 44 : MAP_HEIGHT + 24;
    setPos(getNearestCorner(pos, mapW, mapH));
  };

  // Re-snap on window resize
  useEffect(() => {
    const handleResize = () => {
      const mapW = isMinimized ? 44 : MAP_WIDTH;
      const mapH = isMinimized ? 44 : MAP_HEIGHT + 24;
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
      return { minX: -2000, minY: -2000, maxX: 2000, maxY: 2000, width: 4000, height: 4000 };
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

    // Padding for the minimap view
    minX -= 800;
    minY -= 800;
    maxX += 800;
    maxY += 800;

    return { minX, minY, maxX, maxY, width: maxX - minX, height: maxY - minY };
  }, [objects, viewport]);

  // 2. Map coordinates to MiniMap pixels
  const mmScale = useMemo(() => {
    const sX = (MAP_WIDTH - PADDING * 2) / bounds.width;
    const sY = (MAP_HEIGHT - PADDING * 2) / bounds.height;
    return Math.min(sX, sY);
  }, [bounds]);

  const toMapX = (x: number) => (x - bounds.minX) * mmScale + PADDING;
  const toMapY = (y: number) => (y - bounds.minY) * mmScale + PADDING;

  // vpRect drag state
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

  if (!pos) return null;

  return (
    <div className="hidden sm:block">
    <motion.div
      animate={{ 
        x: pos.x, 
        y: pos.y, 
        width: isMinimized ? 44 : MAP_WIDTH, 
        height: isMinimized ? 44 : MAP_HEIGHT + 32,
        borderRadius: isMinimized ? '22px' : '20px'
      }}
      transition={dragging ? { type: 'tween', duration: 0 } : { type: 'spring', stiffness: 400, damping: 35 }}
      style={{ position: 'fixed', top: 0, left: 0 }}
      className="z-[100] bg-white/70 backdrop-blur-xl border border-white/40 shadow-[0_20px_50px_rgba(0,0,0,0.1)] select-none flex flex-col overflow-hidden"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      {/* Premium Header */}
      <div
        className="h-8 w-full flex items-center justify-between px-3 bg-white/30 cursor-move border-b border-black/5"
      >
        <div className="flex items-center gap-2">
          <MapIcon size={12} className="text-indigo-600/70" />
          {!isMinimized && (
            <span className="text-[9px] font-bold text-gray-500 uppercase tracking-[0.15em]">Overview</span>
          )}
        </div>
        {!isMinimized && (
          <button
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => setIsMinimized(true)}
            className="p-1 hover:bg-black/5 rounded-full transition-colors text-gray-400"
          >
            <Minimize2 size={12} />
          </button>
        )}
      </div>

      <AnimatePresence>
        {!isMinimized && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            ref={containerRef}
            onPointerDown={(e) => { e.stopPropagation(); handleNavStart(e); }}
            onPointerMove={(e) => { e.stopPropagation(); handleNavMove(e); }}
            onPointerUp={(e) => { e.stopPropagation(); handleNavEnd(); }}
            className="relative flex-1 cursor-crosshair overflow-hidden"
          >
            {/* Subtle Mini-Grid Background */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{
              backgroundImage: 'radial-gradient(circle, #000 1px, transparent 1px)',
              backgroundSize: '12px 12px'
            }} />

            {/* Objects — Detailed Miniatures */}
            {objects.map((obj) => (
              <div
                key={obj.id}
                className="absolute"
                style={{
                  left: toMapX(obj.x),
                  top: toMapY(obj.y),
                  width: Math.max(3, obj.width * mmScale),
                  height: Math.max(3, obj.height * mmScale),
                  backgroundColor: getMinimapColor(obj),
                  borderRadius: obj.type === 'sticky' ? 1 : 2,
                  boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                  border: '0.5px solid rgba(0,0,0,0.05)',
                  zIndex: obj.type === 'shape' ? 1 : 2,
                }}
              />
            ))}

            {/* Viewport Lens — The Draggable Focus Area */}
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
                border: '1.5px solid #6366f1',
                backgroundColor: 'rgba(99,102,241,0.05)',
                borderRadius: 4,
                cursor: 'grab',
                pointerEvents: 'auto',
                boxShadow: '0 0 0 1000px rgba(0,0,0,0.03)', // Soft dimming of outside area
              }}
            >
              {/* Corner Accents for the lens */}
              <div className="absolute -top-1 -left-1 w-1.5 h-1.5 border-t-2 border-l-2 border-indigo-500 rounded-tl-sm" />
              <div className="absolute -bottom-1 -right-1 w-1.5 h-1.5 border-b-2 border-r-2 border-indigo-500 rounded-br-sm" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Minimized Pulse State */}
      {isMinimized && (
        <div
          onPointerDown={(e) => e.stopPropagation()}
          onClick={() => setIsMinimized(false)}
          className="flex-1 flex items-center justify-center cursor-pointer hover:bg-black/5 transition-colors"
        >
          <div className="relative">
            <div className="w-2.5 h-2.5 bg-indigo-500 rounded-full" />
            <div className="absolute inset-0 w-2.5 h-2.5 bg-indigo-500 rounded-full animate-ping opacity-40" />
          </div>
        </div>
      )}
    </motion.div>
    </div>
  );
}
