'use client';

import { useRef, memo, useState } from 'react';
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
      className={`absolute w-4 h-4 bg-white border-2 border-indigo-500 rounded-full z-50 pointer-events-auto hover:bg-indigo-50 transition-colors hover:shadow-[0_0_0_3px_rgba(99,102,241,0.3)] ${positionClasses}`}
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
  const moveObject = useCanvasStore(s => s.moveObject);
  const updateObject = useCanvasStore(s => s.updateObject);
  const setConnectingFrom = useCanvasStore(s => s.setConnectingFrom);
  const addConnection = useCanvasStore(s => s.addConnection);
  const isLocked = useCanvasStore(s => {
    const obj = s.objects.find(o => o.id === objectId);
    return s.layerLockEnabled && (obj?.locked ?? false);
  });

  const elementRef = useRef<HTMLDivElement>(null);
  const dragState = useRef({
    active: false,
    startClientX: 0,
    startClientY: 0,
    origX: 0,
    origY: 0,
  });

  const [isHovered, setIsHovered] = useState(false);

  if (!object) return null;

  const handlePointerDown = (e: React.PointerEvent) => {
    if (activeTool === 'pen' || activeTool === 'eraser') return;
    if (isLocked && activeTool !== 'arrow') { e.stopPropagation(); return; }
    e.stopPropagation();

    if (activeTool === 'arrow') {
      if (!connectingFrom) {
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
      selectObject(objectId, e.shiftKey);
      dragState.current = {
        active: true,
        startClientX: e.clientX,
        startClientY: e.clientY,
        origX: object.x,
        origY: object.y,
      };
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragState.current.active) return;
    const { scale } = useCanvasStore.getState().viewport;
    const dx = (e.clientX - dragState.current.startClientX) / scale;
    const dy = (e.clientY - dragState.current.startClientY) / scale;
    // Direct DOM mutation — zero React renders during drag
    if (elementRef.current) {
      elementRef.current.style.left = `${dragState.current.origX + dx}px`;
      elementRef.current.style.top = `${dragState.current.origY + dy}px`;
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!dragState.current.active) return;
    dragState.current.active = false;
    const { scale } = useCanvasStore.getState().viewport;
    const dx = (e.clientX - dragState.current.startClientX) / scale;
    const dy = (e.clientY - dragState.current.startClientY) / scale;
    // Single Zustand commit on release
    moveObject(objectId, dragState.current.origX + dx, dragState.current.origY + dy);
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

      if (handle.includes('e')) {
        newW = Math.max(40, startW + lDx);
      } else if (handle.includes('w')) {
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

  return (
    <motion.div
      ref={elementRef}
      initial={{ scale: 0.6, opacity: 0 }}
      animate={{
        scale: 1,
        opacity: 1,
        rotate: object.rotation || 0
      }}
      transition={{ type: 'spring', stiffness: 400, damping: 22 }}
      className={`absolute canvas-obj group ${isSelected ? 'selection-ring' : ''} ${isPulsing || (connectingFrom?.id === objectId) ? 'animate-pulse-border ring-2 ring-indigo-500 ring-offset-2' : ''} ${isLocked ? 'opacity-60' : ''}`}
      style={{
        left: object.x,
        top: object.y,
        width: object.width,
        height: object.height,
        opacity: isLocked ? 0.6 : (object.style.opacity ?? 1),
        zIndex: isSelected ? 100 : 10,
        cursor: isLocked ? 'not-allowed' : activeTool === 'pointer' ? 'grab' : 'default',
        willChange: 'transform',
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerEnter={() => setIsHovered(true)}
      onPointerLeave={() => setIsHovered(false)}
    >
      {isLocked && (
        <div className="absolute top-1 right-1 z-50 pointer-events-none">
          <Lock size={10} className="text-gray-500 opacity-70" />
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

      {isSelected && (
        <>
          <AnchorPoint objectId={objectId} side="top" />
          <AnchorPoint objectId={objectId} side="right" />
          <AnchorPoint objectId={objectId} side="bottom" />
          <AnchorPoint objectId={objectId} side="left" />
        </>
      )}

      {isSelected && object.type !== 'book' && (
        <>
          {/* W/H size input pill */}
          <div
            className="absolute -top-10 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-white border-2 border-indigo-400 rounded-full px-3 py-1 shadow-md z-50 pointer-events-auto"
            onPointerDown={(e) => e.stopPropagation()}
          >
            <span className="text-[10px] font-mono text-gray-400">W</span>
            <input
              type="number"
              value={Math.round(object.width)}
              className="w-14 text-[11px] font-mono text-gray-700 text-center bg-transparent outline-none border-none"
              onChange={(e) => {/* handled on blur/enter */}}
              onBlur={(e) => {
                const val = parseInt(e.target.value);
                if (!isNaN(val) && val >= 40) {
                  updateObject(object.id, { width: val });
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const val = parseInt((e.target as HTMLInputElement).value);
                  if (!isNaN(val) && val >= 40) {
                    updateObject(object.id, { width: val });
                  }
                  (e.target as HTMLInputElement).blur();
                }
              }}
            />
            <span className="text-[10px] font-mono text-gray-300">×</span>
            <input
              type="number"
              value={Math.round(object.height)}
              className="w-14 text-[11px] font-mono text-gray-700 text-center bg-transparent outline-none border-none"
              onBlur={(e) => {
                const val = parseInt(e.target.value);
                if (!isNaN(val) && val >= 40) {
                  updateObject(object.id, { height: val });
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const val = parseInt((e.target as HTMLInputElement).value);
                  if (!isNaN(val) && val >= 40) {
                    updateObject(object.id, { height: val });
                  }
                  (e.target as HTMLInputElement).blur();
                }
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
