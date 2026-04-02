'use client';

import { useRef, useCallback, useEffect, memo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCanvasStore } from '@/store/canvasStore';
import { clamp, screenToCanvas, getSelectionBoundingBox } from '@/lib/canvasUtils';
import CanvasObject from './CanvasObject';
import ConnectionLayer from './ConnectionLayer';
import DrawingCanvas from './DrawingCanvas';
import FloatingContextMenu from '../ui/FloatingContextMenu';

// Separate component so it doesn't re-render when viewport/objects change
const ObjectLayer = memo(function ObjectLayer() {
  const objects = useCanvasStore(s => s.objects);
  return (
    <>
      {objects.map((obj) => (
        <CanvasObject key={obj.id} objectId={obj.id} />
      ))}
    </>
  );
});

// Build SVG data URI for isometric grid (3-line families at 0°, 60°, 120°)
function buildIsoSVG(spacing: number): string {
  const h = Math.round(spacing * Math.sin(Math.PI / 3) * 2);
  const s = Math.round(spacing);
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${s}' height='${h}'>` +
    `<line x1='0' y1='0' x2='${s}' y2='${h}' stroke='%23d1d5db' stroke-width='0.8'/>` +
    `<line x1='0' y1='${h}' x2='${s}' y2='0' stroke='%23d1d5db' stroke-width='0.8'/>` +
    `<line x1='0' y1='${h / 2}' x2='${s}' y2='${h / 2}' stroke='%23d1d5db' stroke-width='0.8'/>` +
    `</svg>`;
  return `url("data:image/svg+xml,${svg}")`;
}

export default function Canvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasWorldRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const zoomIndicatorRef = useRef<HTMLSpanElement>(null);

  // Viewport lives in a ref during interaction — only synced to Zustand when needed
  const vpRef = useRef({ x: 0, y: 0, scale: 1 });
  const isPanning = useRef(false);
  const isSelecting = useRef(false);
  const selectionStart = useRef({ x: 0, y: 0 });
  const [selectionRect, setSelectionRect] = useState<{ x: number, y: number, w: number, h: number } | null>(null);
  const lastPointer = useRef({ x: 0, y: 0 });

  const gridMode = useCanvasStore(s => s.gridMode);

  const {
    setViewport,
    activeTool,
    clearSelection,
    createStickyNote,
    createStandardNote,
    createBook,
    createShape,
    selectObjectsInRect,
    objects,
    selectedIds
  } = useCanvasStore();

  const selectedObjects = objects.filter(o => selectedIds.includes(o.id));
  const selectionBox = getSelectionBoundingBox(selectedObjects);

  // Apply viewport directly to DOM — zero React renders
  const applyViewport = useCallback((vp: { x: number; y: number; scale: number }) => {
    vpRef.current = vp;
    if (canvasWorldRef.current) {
      canvasWorldRef.current.style.transform =
        `translate3d(${vp.x}px, ${vp.y}px, 0) scale(${vp.scale})`;
    }
    if (gridRef.current) {
      const el = gridRef.current;
      if (gridMode === 'none') {
        el.style.backgroundImage = 'none';
      } else if (gridMode === 'dots') {
        const size = 24 * vp.scale;
        el.style.backgroundImage = 'radial-gradient(circle, #c4c9d4 1px, transparent 1px)';
        el.style.backgroundSize = `${size}px ${size}px`;
        el.style.backgroundPosition = `${vp.x % size}px ${vp.y % size}px`;
      } else if (gridMode === 'graph') {
        const minor = 24 * vp.scale;
        const major = 120 * vp.scale;
        el.style.backgroundImage = [
          'linear-gradient(to right, #e5e7eb 1px, transparent 1px)',
          'linear-gradient(to bottom, #e5e7eb 1px, transparent 1px)',
          'linear-gradient(to right, #9ca3af 1px, transparent 1px)',
          'linear-gradient(to bottom, #9ca3af 1px, transparent 1px)',
        ].join(', ');
        el.style.backgroundSize = [
          `${minor}px ${minor}px`,
          `${minor}px ${minor}px`,
          `${major}px ${major}px`,
          `${major}px ${major}px`,
        ].join(', ');
        // Use shared raw offsets so major/minor lines stay aligned when panning
        const ox = `${vp.x}px`;
        const oy = `${vp.y}px`;
        el.style.backgroundPosition = `${ox} ${oy}, ${ox} ${oy}, ${ox} ${oy}, ${ox} ${oy}`;
      } else if (gridMode === 'isometric') {
        const spacing = 28 * vp.scale;
        const h = Math.round(spacing * Math.sin(Math.PI / 3) * 2);
        el.style.backgroundImage = buildIsoSVG(spacing);
        el.style.backgroundSize = `${Math.round(spacing)}px ${h}px`;
        el.style.backgroundPosition = `${vp.x % Math.round(spacing)}px ${vp.y % h}px`;
      }
    }
    if (zoomIndicatorRef.current) {
      zoomIndicatorRef.current.textContent = `${Math.round(vp.scale * 100)}%`;
    }
  }, [gridMode]);

  // Sync to Zustand (for search navigation, etc.) — debounced
  const syncTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const syncViewport = useCallback(() => {
    clearTimeout(syncTimer.current);
    syncTimer.current = setTimeout(() => setViewport(vpRef.current), 100);
  }, [setViewport]);

  // Re-apply grid when mode changes (without requiring a pan/zoom event)
  useEffect(() => {
    applyViewport(vpRef.current);
  }, [gridMode, applyViewport]);

  // Listen for external viewport changes (e.g. search navigation)
  useEffect(() => {
    return useCanvasStore.subscribe((state) => {
      const sv = state.viewport;
      const cv = vpRef.current;
      if (sv.x !== cv.x || sv.y !== cv.y || sv.scale !== cv.scale) {
        applyViewport(sv);
      }
    });
  }, [applyViewport]);

  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const vp = vpRef.current;

    let newVp: typeof vp;
    if (e.ctrlKey || e.metaKey) {
      const delta = e.deltaY * -0.005;
      const newScale = clamp(vp.scale * (1 + delta), 0.1, 4);
      const ratio = newScale / vp.scale;
      newVp = {
        scale: newScale,
        x: mouseX - (mouseX - vp.x) * ratio,
        y: mouseY - (mouseY - vp.y) * ratio,
      };
    } else {
      newVp = { ...vp, x: vp.x - e.deltaX, y: vp.y - e.deltaY };
    }
    applyViewport(newVp);
    syncViewport();
  }, [applyViewport, syncViewport]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, [handleWheel]);

  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    // Standard middle click always pans
    if (e.button === 1) {
      isPanning.current = true;
      lastPointer.current = { x: e.clientX, y: e.clientY };
      containerRef.current?.setPointerCapture(e.pointerId);
      return;
    }

    // Only handle clicks directly on the canvas background
    if (e.target !== containerRef.current && e.target !== gridRef.current && e.target !== canvasWorldRef.current) return;
    
    const tool = useCanvasStore.getState().activeTool;

    if (tool === 'hand') {
      isPanning.current = true;
      lastPointer.current = { x: e.clientX, y: e.clientY };
      containerRef.current?.setPointerCapture(e.pointerId);
      return;
    }

    if (tool === 'pointer') {
      clearSelection();
      isSelecting.current = true;
      const container = containerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const pos = screenToCanvas(e.clientX - rect.left, e.clientY - rect.top, vpRef.current);
      selectionStart.current = pos;
      setSelectionRect({ x: pos.x, y: pos.y, w: 0, h: 0 });
      containerRef.current?.setPointerCapture(e.pointerId);
      return;
    }

    if (tool === 'pen' || tool === 'eraser') return;

    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const pos = screenToCanvas(e.clientX - rect.left, e.clientY - rect.top, vpRef.current);

    switch (tool) {
      case 'sticky': createStickyNote(pos.x - 100, pos.y - 100); break;
      case 'note': createStandardNote(pos.x - 140, pos.y - 180); break;
      case 'book': createBook(pos.x - 80, pos.y - 110); break;
      case 'circle': createShape(pos.x - 60, pos.y - 60, 'circle'); break;
      case 'rectangle': createShape(pos.x - 60, pos.y - 60, 'rectangle'); break;
      case 'arrow': createShape(pos.x - 60, pos.y - 30, 'arrow'); break;
    }
  }, [clearSelection, createStickyNote, createStandardNote, createBook, createShape]);

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (isSelecting.current) {
      const container = containerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const pos = screenToCanvas(e.clientX - rect.left, e.clientY - rect.top, vpRef.current);
      
      const x = Math.min(pos.x, selectionStart.current.x);
      const y = Math.min(pos.y, selectionStart.current.y);
      const w = Math.abs(pos.x - selectionStart.current.x);
      const h = Math.abs(pos.y - selectionStart.current.y);
      
      setSelectionRect({ x, y, w, h });
      selectObjectsInRect({ x, y, width: w, height: h });
      return;
    }

    if (!isPanning.current) return;
    const dx = e.clientX - lastPointer.current.x;
    const dy = e.clientY - lastPointer.current.y;
    lastPointer.current = { x: e.clientX, y: e.clientY };
    const vp = vpRef.current;
    applyViewport({ ...vp, x: vp.x + dx, y: vp.y + dy });
  }, [applyViewport, selectObjectsInRect]);

  const handlePointerUp = useCallback(() => {
    isPanning.current = false;
    isSelecting.current = false;
    setSelectionRect(null);
    syncViewport();
  }, [syncViewport]);

  const activeTool_ = activeTool; // snapshot for render
  const cursorClass = activeTool_ === 'pointer' ? 'cursor-default'
    : activeTool_ === 'hand' ? 'cursor-grab active:cursor-grabbing'
    : activeTool_ === 'pen' || activeTool_ === 'eraser' ? 'cursor-crosshair'
    : 'cursor-crosshair';

  const isFocusMode = useCanvasStore(s => s.focusedObjectId !== null || s.isBookModalOpen);

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full overflow-hidden select-none ${cursorClass}`}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      style={{ touchAction: 'none' }}
    >
      {/* Grid — all rendering driven by applyViewport via ref */}
      <div
        ref={gridRef}
        className="absolute inset-0 pointer-events-none"
      />

      {/* Focus Mode Overlay */}
      <AnimatePresence>
        {isFocusMode && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/40 backdrop-blur-[2px] z-[50] pointer-events-none"
          />
        )}
      </AnimatePresence>

      {/* Canvas world — transform applied via ref, not React state */}
      <div
        ref={canvasWorldRef}
        className={`absolute transition-opacity duration-500 ${isFocusMode ? 'opacity-30' : 'opacity-100'}`}
        style={{ transformOrigin: '0 0', width: 0, height: 0 }}
      >
        <ConnectionLayer />
        <ObjectLayer />

        {/* Selection Rect (Canvas Coordinates) */}
        {selectionRect && (
          <div
            style={{
              position: 'absolute',
              left: selectionRect.x,
              top: selectionRect.y,
              width: selectionRect.w,
              height: selectionRect.h,
              background: 'rgba(99,102,241,0.08)',
              border: '1.5px solid rgba(99,102,241,0.7)',
              borderRadius: '3px',
              pointerEvents: 'none',
              zIndex: 9999,
            }}
          />
        )}

        {/* Single Context Menu for Selection */}
        {selectionBox && !isSelecting.current && (
          <div
            className="absolute pointer-events-none z-[1000]"
            style={{
              left: selectionBox.x + selectionBox.width / 2,
              top: selectionBox.y - 12,
              width: 0,
              height: 0,
            }}
          >
            <FloatingContextMenu selectedObjects={selectedObjects} />
          </div>
        )}
      </div>

      {/* Drawing layer */}
      {(activeTool_ === 'pen' || activeTool_ === 'eraser') && (
        <DrawingCanvas viewportRef={vpRef} />
      )}

      {/* Zoom indicator — updated via ref */}
      <div className="absolute bottom-5 right-5 bg-white/80 backdrop-blur-sm border border-gray-200 text-xs text-gray-500 px-2.5 py-1 rounded-full shadow-sm z-50">
        <span ref={zoomIndicatorRef}>100%</span>
      </div>
    </div>
  );
}
