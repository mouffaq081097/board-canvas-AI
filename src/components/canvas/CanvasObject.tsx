'use client';

import { useRef, memo, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { RotateCcw, Lock } from 'lucide-react';
import { useCanvasStore } from '@/store/canvasStore';
import StickyNote from './StickyNote';
import StandardNote from './StandardNote';
import Book from './Book';
import ShapeOverlay from './ShapeOverlay';
import AnchorPoint from './AnchorPoint';
import TableObject from '../canvas/TableObject';
import ImageObject from '../canvas/ImageObject';

interface Props {
  objectId: string;
}

const HANDLE_POSITIONS: Record<string, string> = {
  tl: '-top-2 -left-2 cursor-nwse-resize',
  t:  '-top-2 left-1/2 -translate-x-1/2 cursor-ns-resize',
  tr: '-top-2 -right-2 cursor-nesw-resize',
  w:  'top-1/2 -left-2 -translate-y-1/2 cursor-ew-resize',
  r:  'top-1/2 -right-2 -translate-y-1/2 cursor-ew-resize',
  sw: '-bottom-2 -left-2 cursor-nesw-resize',
  s:  '-bottom-2 left-1/2 -translate-x-1/2 cursor-ns-resize',
  se: '-bottom-2 -right-2 cursor-nwse-resize',
};

const ResizeHandle = ({ pos, onPointerDown }: { pos: string; onPointerDown: (e: React.PointerEvent, handle: string) => void }) => {
  const positionClasses = HANDLE_POSITIONS[pos] ?? '';

  return (
    <div
      data-resize-handle="true"
      className={`absolute resize-handle w-4 h-4 bg-white border-2 border-indigo-500 rounded-full z-50 pointer-events-auto hover:bg-indigo-50 transition-colors hover:shadow-[0_0_0_3px_rgba(99,102,241,0.3)] ${positionClasses}`}
      onPointerDown={(e) => onPointerDown(e, pos)}
    />
  );
};

function CanvasObject({ objectId }: Props) {
  // Granular selectors — this component only re-renders when its own data changes
  const object = useCanvasStore(s => s.objects.find(o => o.id === objectId));
  const isSelected = useCanvasStore(s => s.selectedIds.includes(objectId));
  const isPulsing = useCanvasStore(s => s.pulsingId === objectId);
  const activeTool = useCanvasStore(s => s.activeTool);
  const connectingFrom = useCanvasStore(s => s.connectingFrom);
  const selectObject = useCanvasStore(s => s.selectObject);
  const batchUpdateObjects = useCanvasStore(s => s.batchUpdateObjects);
  const updateObject = useCanvasStore(s => s.updateObject);
  const setConnectingFrom = useCanvasStore(s => s.setConnectingFrom);
  const addConnection = useCanvasStore(s => s.addConnection);
  const setFocusedObjectId = useCanvasStore(s => s.setFocusedObjectId);
  const setIsBookModalOpen = useCanvasStore(s => s.setIsBookModalOpen);
  const isLocked = useCanvasStore(s => {
    const obj = s.objects.find(o => o.id === objectId);
    return obj?.locked ?? false;
  });
  const isMultiSelect = useCanvasStore(s => s.selectedIds.length > 1);

  const elementRef = useRef<HTMLDivElement>(null);
  const dragState = useRef<{
    active: boolean;
    startClientX: number;
    startClientY: number;
    origX: number;
    origY: number;
    // For multi-object drag: all selected objects' starting positions
    multiOrigins: { id: string; x: number; y: number }[];
  }>({
    active: false,
    startClientX: 0,
    startClientY: 0,
    origX: 0,
    origY: 0,
    multiOrigins: [],
  });

  const [isHovered, setIsHovered] = useState(false);
  const [wInput, setWInput] = useState(Math.round(object?.width ?? 0));
  const [hInput, setHInput] = useState(Math.round(object?.height ?? 0));

  if (!object) return null;

  // Sync local W/H state when object dimensions change externally (e.g. resize handles)
  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    setWInput(Math.round(object.width));
    setHInput(Math.round(object.height));
  }, [object.width, object.height]);

  // Capture-phase handler: fires before any child stopPropagation, enabling drag from anywhere on the object
  const handlePointerDownCapture = (e: React.PointerEvent) => {
    if (activeTool === 'pen' || activeTool === 'eraser') return;

    if (isLocked) {
      if (activeTool !== 'connector') {
        // Allow selection of locked objects so the user can unlock them via the context menu
        e.stopPropagation();
        selectObject(objectId, e.shiftKey);
      }
      return; // CRITICAL: Stop here. Locked objects cannot be interacted with further.
    }

    if (activeTool === 'connector') {
      // Let anchor points handle their own events — don't intercept them here
      const target = e.target as HTMLElement;
      if (target.closest('[data-anchor-point]')) return;

      e.stopPropagation();
      if (!connectingFrom) {
        // Clicking the object body starts from the nearest logical anchor (right fallback)
        setConnectingFrom({ id: objectId, anchor: 'right' });
      } else if (connectingFrom.id !== objectId) {
        addConnection({
          fromId: connectingFrom.id,
          toId: objectId,
          fromAnchor: connectingFrom.anchor,
          toAnchor: 'left',
          color: '#6366f1',
        });
        setConnectingFrom(null);
      }
      return;
    }

    if (activeTool === 'pointer') {
      const target = e.target as HTMLElement;
      const isEditable =
        ['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON', 'A'].includes(target.tagName) ||
        target.isContentEditable;

      const isControl = target.closest('[data-resize-handle]') ||
                        target.closest('[data-rotate-handle]') ||
                        target.closest('[data-anchor-point]');

      // Explicit drag handle always triggers drag regardless of editable children
      const isDragHandle = !!target.closest('[data-drag-handle]');

      if (isDragHandle || (!isEditable && !isControl)) {
        // Drag from anywhere on the object — stop propagation so canvas doesn't also handle it
        e.stopPropagation();
        selectObject(objectId, e.shiftKey);

        // Capture starting positions of ALL currently selected objects for multi-move.
        // We read from the store snapshot after selectObject runs.
        const { objects: allObjects, selectedIds: currentSelectedIds } = useCanvasStore.getState();
        // After selectObject, the dragged object is always in selectedIds.
        // Build origins for every selected object.
        const multiOrigins = allObjects
          .filter(o => currentSelectedIds.includes(o.id))
          .map(o => ({ id: o.id, x: o.x, y: o.y }));

        dragState.current = {
          active: true,
          startClientX: e.clientX,
          startClientY: e.clientY,
          origX: object.x,
          origY: object.y,
          multiOrigins,
        };
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      }
      // If editable element: let event through so textarea/input gets focus
    }
  };


  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragState.current.active) return;
    const { scale } = useCanvasStore.getState().viewport;
    const dx = (e.clientX - dragState.current.startClientX) / scale;
    const dy = (e.clientY - dragState.current.startClientY) / scale;

    const { multiOrigins } = dragState.current;
    if (multiOrigins.length > 1) {
      // Multi-object drag: move all selected objects' DOM elements directly
      multiOrigins.forEach(({ id, x, y }) => {
        const el = document.querySelector<HTMLElement>(`[data-object-id="${id}"]`);
        if (el) {
          el.style.left = `${x + dx}px`;
          el.style.top = `${y + dy}px`;
        }
      });
    } else {
      // Single-object drag — direct DOM mutation on this element only
      if (elementRef.current) {
        elementRef.current.style.left = `${dragState.current.origX + dx}px`;
        elementRef.current.style.top = `${dragState.current.origY + dy}px`;
      }
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!dragState.current.active) return;
    dragState.current.active = false;
    const { scale } = useCanvasStore.getState().viewport;
    const dx = (e.clientX - dragState.current.startClientX) / scale;
    const dy = (e.clientY - dragState.current.startClientY) / scale;

    const { multiOrigins } = dragState.current;
    // Always use batchUpdateObjects for uniform commit path (multiOrigins always has >= 1 entry)
    batchUpdateObjects(
      multiOrigins.map(({ id, x, y }) => ({ id, x: x + dx, y: y + dy }))
    );
  };

  const handleResize = (e: React.PointerEvent, handle: string) => {
    if (isLocked) return;
    e.stopPropagation();
    const startX = e.clientX;
    const startY = e.clientY;
    const startW = object.width;
    const startH = object.height;
    const startXPos = object.x;
    const startYPos = object.y;
    const rotationRad = ((object.rotation || 0) * Math.PI) / 180;

    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);

    const onMove = (ev: PointerEvent) => {
      const { scale } = useCanvasStore.getState().viewport;
      const dx = (ev.clientX - startX) / scale;
      const dy = (ev.clientY - startY) / scale;

      // Project mouse movement into local axes
      const lDx = dx * Math.cos(-rotationRad) - dy * Math.sin(-rotationRad);
      const lDy = dx * Math.sin(-rotationRad) + dy * Math.cos(-rotationRad);

      let newW = startW;
      let newH = startH;
      let dX_local = 0;
      let dY_local = 0;

      if (handle.includes('e') || handle.includes('r')) {
        newW = Math.max(40, startW + lDx);
      } else if (handle.includes('w') || handle.includes('l')) {
        const delta = Math.min(startW - 40, lDx);
        newW = startW - delta;
        dX_local = delta;
      }

      if (handle.includes('s')) {
        newH = Math.max(40, startH + lDy);
      } else if (handle.includes('t')) {
        const delta = Math.min(startH - 40, lDy);
        newH = startH - delta;
        dY_local = delta;
      }

      // Convert local translation back to world coordinates
      const worldDx = dX_local * Math.cos(rotationRad) - dY_local * Math.sin(rotationRad);
      const worldDy = dX_local * Math.sin(rotationRad) + dY_local * Math.cos(rotationRad);

      updateObject(objectId, {
        width: newW,
        height: newH,
        x: startXPos + worldDx,
        y: startYPos + worldDy,
      });
    };
    const onUp = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };

  const handleRotate = (e: React.PointerEvent) => {
    if (isLocked) return;
    e.stopPropagation();
    const { x: vX, y: vY, scale } = useCanvasStore.getState().viewport;
    const centerX = (object.x + object.width / 2) * scale + vX;
    const centerY = (object.y + object.height / 2) * scale + vY;

    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);

    const onMove = (ev: PointerEvent) => {
      const dx = ev.clientX - centerX;
      const dy = ev.clientY - centerY;
      // Standardize 0 deg as 'up'
      let angle = (Math.atan2(dy, dx) * 180) / Math.PI + 90;
      // Snap to 15 degrees
      angle = Math.round(angle / 15) * 15;
      updateObject(objectId, { rotation: angle });
    };
    const onUp = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (object.type === 'book') {
      setFocusedObjectId(object.id);
      setIsBookModalOpen(true);
    } else if (object.type === 'sticky' || object.type === 'note' || object.type === 'shape') {
      // If locked, we don't allow editing the inline text
      if (isLocked) return;
      useCanvasStore.getState().setEditingObjectId(object.id);
    }
  };

  return (
    <motion.div
      ref={elementRef}
      data-object-id={objectId}
      initial={{ scale: 0.6, opacity: 0 }}
      animate={{
        scale: 1,
        opacity: 1,
        rotate: object.rotation || 0
      }}
      transition={{ type: 'spring', stiffness: 400, damping: 22 }}
      className={`absolute canvas-obj group ${isSelected ? 'selection-ring' : ''} ${isPulsing || (connectingFrom?.id === objectId) ? 'animate-pulse-border ring-2 ring-indigo-500 ring-offset-2' : ''} ${isLocked ? '' : ''}`}
      style={{
        left: object.x,
        top: object.y,
        width: object.width,
        height: object.height,
        opacity: object.style.opacity ?? 1, 
        zIndex: isSelected ? 100 : (object.type === 'shape' ? 0 : 10),
        cursor: isLocked ? 'pointer' : activeTool === 'pointer' ? 'grab' : 'default', // Changed to pointer for locked objects so users know they can click/double-click
        willChange: 'transform',
      }}
      onPointerDownCapture={handlePointerDownCapture}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onDoubleClick={handleDoubleClick}
      onPointerEnter={() => setIsHovered(true)}
      onPointerLeave={() => setIsHovered(false)}
    >
      {/* Removed the dimmer/backdrop-blur overlay for locked state so content is perfectly clear */}

      {isLocked && (
        <div className="absolute top-2 right-2 z-[100] pointer-events-none flex items-center justify-center">
          <div className="absolute w-6 h-6 bg-amber-400 rounded-full animate-ping opacity-20" />
          <div className="w-6 h-6 bg-amber-100 border border-amber-300 rounded-full flex items-center justify-center shadow-sm">
            <Lock size={12} className="text-amber-600" />
          </div>
        </div>
      )}

      {/* Hover bounding box */}
      {isHovered && !isSelected && (
        <div
          className="absolute inset-0 pointer-events-none rounded-sm"
          style={{
            border: '2px dashed rgba(99,102,241,0.6)',
            borderRadius: 'inherit',
          }}
        />
      )}

      {object.type === 'sticky' && <StickyNote object={object} />}
      {object.type === 'note' && <StandardNote object={object} />}
      {object.type === 'book' && <Book object={object} />}
      {(object.type === 'shape' || object.type === 'drawing') && <ShapeOverlay object={object} />}
      {object.type === 'table' && (
        <TableObject object={object} isSelected={isSelected} onUpdate={(p) => updateObject(object.id, p)} />
      )}
      {object.type === 'image' && (
        <ImageObject object={object} isSelected={isSelected} onUpdate={(p) => updateObject(object.id, p)} />
      )}

      {(isSelected || activeTool === 'connector') && (
        <>
          <AnchorPoint objectId={objectId} side="top" />
          <AnchorPoint objectId={objectId} side="right" />
          <AnchorPoint objectId={objectId} side="bottom" />
          <AnchorPoint objectId={objectId} side="left" />
        </>
      )}

      {isSelected && !isMultiSelect && object.type !== 'book' && (
        <>
          {/* W/H size input pill */}
          <div
            className="absolute -top-10 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-white border-2 border-indigo-400 rounded-full px-3 py-1 shadow-md z-50 pointer-events-auto"
            onPointerDown={(e) => e.stopPropagation()}
          >
            <span className="text-[10px] font-mono text-gray-400">W</span>
            <input
              type="number"
              value={wInput}
              className="w-14 text-[11px] font-mono text-gray-700 text-center bg-transparent outline-none border-none"
              onChange={(e) => setWInput(parseInt(e.target.value) || 0)}
              onBlur={() => {
                if (!isNaN(wInput) && wInput >= 40) updateObject(object.id, { width: wInput });
                else setWInput(Math.round(object.width));
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
                if (e.key === 'Escape') { setWInput(Math.round(object.width)); (e.target as HTMLInputElement).blur(); }
              }}
            />
            <span className="text-[10px] font-mono text-gray-300">×</span>
            <input
              type="number"
              value={hInput}
              className="w-14 text-[11px] font-mono text-gray-700 text-center bg-transparent outline-none border-none"
              onChange={(e) => setHInput(parseInt(e.target.value) || 0)}
              onBlur={() => {
                if (!isNaN(hInput) && hInput >= 40) updateObject(object.id, { height: hInput });
                else setHInput(Math.round(object.height));
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
                if (e.key === 'Escape') { setHInput(Math.round(object.height)); (e.target as HTMLInputElement).blur(); }
              }}
            />
            <span className="text-[10px] font-mono text-gray-400">H</span>
          </div>

          {/* 8-point Resize Handles */}
          <div className="absolute inset-0 pointer-events-none">
            <ResizeHandle pos="tl" onPointerDown={handleResize} />
            <ResizeHandle pos="t" onPointerDown={handleResize} />
            <ResizeHandle pos="tr" onPointerDown={handleResize} />
            <ResizeHandle pos="w" onPointerDown={handleResize} />
            <ResizeHandle pos="r" onPointerDown={handleResize} />
            <ResizeHandle pos="sw" onPointerDown={handleResize} />
            <ResizeHandle pos="s" onPointerDown={handleResize} />
            <ResizeHandle pos="se" onPointerDown={handleResize} />
          </div>

          {/* Rotation Handle */}
          <div
            data-rotate-handle="true"
            className="absolute -top-12 left-1/2 -translate-x-1/2 w-8 h-8 flex flex-col items-center cursor-grab active:cursor-grabbing group/rotate pointer-events-auto"
            onPointerDown={handleRotate}
          >
            <div className="w-0.5 h-6 bg-indigo-400 group-hover/rotate:bg-indigo-600 transition-colors" />
            <div className="w-6 h-6 bg-white border-2 border-indigo-500 rounded-full flex items-center justify-center shadow-sm group-hover/rotate:scale-110 transition-transform">
              <RotateCcw className="w-3 h-3 text-indigo-500" />
            </div>
          </div>
        </>
      )}
    </motion.div>
  );
}

export default memo(CanvasObject);
