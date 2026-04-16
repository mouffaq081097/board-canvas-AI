'use client';

import { useRef, memo } from 'react';
import { useCanvasStore } from '@/store/canvasStore';
import { getSelectionBoundingBox } from '@/lib/canvasUtils';

// Explicit handle definitions: position style + cursor
const HANDLES: Record<string, { style: React.CSSProperties; cursor: string }> = {
  tl: { style: { top: -8, left: -8 },                                   cursor: 'nwse-resize' },
  t:  { style: { top: -8, left: '50%', transform: 'translateX(-50%)' }, cursor: 'ns-resize'   },
  tr: { style: { top: -8, right: -8 },                                  cursor: 'nesw-resize' },
  w:  { style: { top: '50%', left: -8, transform: 'translateY(-50%)' }, cursor: 'ew-resize'   },
  r:  { style: { top: '50%', right: -8, transform: 'translateY(-50%)'},  cursor: 'ew-resize'   },
  sw: { style: { bottom: -8, left: -8 },                                cursor: 'nesw-resize' },
  s:  { style: { bottom: -8, left: '50%', transform: 'translateX(-50%)' }, cursor: 'ns-resize' },
  se: { style: { bottom: -8, right: -8 },                               cursor: 'nwse-resize' },
};

// Which handles affect each edge
const AFFECTS_RIGHT  = new Set(['r',  'tr', 'se']);
const AFFECTS_LEFT   = new Set(['w',  'tl', 'sw']);
const AFFECTS_BOTTOM = new Set(['s',  'sw', 'se']);
const AFFECTS_TOP    = new Set(['t',  'tl', 'tr']);

interface ResizeDragState {
  active: boolean;
  handle: string;
  startClientX: number;
  startClientY: number;
  origBBox: { x: number; y: number; width: number; height: number };
  origObjs: { id: string; x: number; y: number; width: number; height: number }[];
}

function computeNewBBox(
  dx: number,
  dy: number,
  handle: string,
  orig: { x: number; y: number; width: number; height: number }
) {
  let dW = 0, dH = 0, dX = 0, dY = 0;

  if (AFFECTS_RIGHT.has(handle))  dW = dx;
  if (AFFECTS_LEFT.has(handle))  { dW = -dx; dX = dx; }
  if (AFFECTS_BOTTOM.has(handle)) dH = dy;
  if (AFFECTS_TOP.has(handle))   { dH = -dy; dY = dy; }

  const rawW = orig.width  + dW;
  const rawH = orig.height + dH;
  const newW = Math.max(40, rawW);
  const newH = Math.max(40, rawH);

  // If clamped, don't let the origin drift
  const newX = orig.x + (rawW < 40 ? (orig.width - 40) : dX);
  const newY = orig.y + (rawH < 40 ? (orig.height - 40) : dY);

  return { x: newX, y: newY, width: newW, height: newH };
}

function MultiSelectBox() {
  const selectedIds = useCanvasStore(s => s.selectedIds);
  const objects = useCanvasStore(s => s.objects);
  const batchUpdateObjects = useCanvasStore(s => s.batchUpdateObjects);

  const boxRef = useRef<HTMLDivElement>(null);
  const dragState = useRef<ResizeDragState>({
    active: false,
    handle: '',
    startClientX: 0,
    startClientY: 0,
    origBBox: { x: 0, y: 0, width: 0, height: 0 },
    origObjs: [],
  });

  if (selectedIds.length < 2) return null;

  const selectedObjects = objects.filter(o => selectedIds.includes(o.id));
  const bbox = getSelectionBoundingBox(selectedObjects);
  if (!bbox) return null;

  function handleResizeDown(e: React.PointerEvent, handle: string) {
    e.stopPropagation();
    e.preventDefault();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);

    const { objects: allObjs, selectedIds: ids } = useCanvasStore.getState();
    const sel = allObjs.filter(o => ids.includes(o.id));
    const origBBox = getSelectionBoundingBox(sel)!;

    dragState.current = {
      active: true,
      handle,
      startClientX: e.clientX,
      startClientY: e.clientY,
      origBBox,
      origObjs: sel.map(o => ({ id: o.id, x: o.x, y: o.y, width: o.width, height: o.height })),
    };

    function applyResize(clientX: number, clientY: number) {
      const { scale } = useCanvasStore.getState().viewport;
      const dx = (clientX - dragState.current.startClientX) / scale;
      const dy = (clientY - dragState.current.startClientY) / scale;

      const { origBBox: ob, origObjs, handle: h } = dragState.current;
      const newBBox = computeNewBBox(dx, dy, h, ob);
      const scaleX = newBBox.width / ob.width;
      const scaleY = newBBox.height / ob.height;

      origObjs.forEach(obj => {
        const newObjX = newBBox.x + (obj.x - ob.x) * scaleX;
        const newObjY = newBBox.y + (obj.y - ob.y) * scaleY;
        const newObjW = obj.width * scaleX;
        const newObjH = obj.height * scaleY;

        const el = document.querySelector<HTMLElement>(`[data-object-id="${obj.id}"]`);
        if (el) {
          el.style.left   = `${newObjX}px`;
          el.style.top    = `${newObjY}px`;
          el.style.width  = `${newObjW}px`;
          el.style.height = `${newObjH}px`;
        }
      });

      if (boxRef.current) {
        boxRef.current.style.left   = `${newBBox.x}px`;
        boxRef.current.style.top    = `${newBBox.y}px`;
        boxRef.current.style.width  = `${newBBox.width}px`;
        boxRef.current.style.height = `${newBBox.height}px`;
      }

      return { newBBox, scaleX, scaleY };
    }

    function onMove(ev: PointerEvent) {
      if (!dragState.current.active) return;
      applyResize(ev.clientX, ev.clientY);
    }

    function onUp(ev: PointerEvent) {
      if (!dragState.current.active) return;
      dragState.current.active = false;
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);

      const { scale } = useCanvasStore.getState().viewport;
      const dx = (ev.clientX - dragState.current.startClientX) / scale;
      const dy = (ev.clientY - dragState.current.startClientY) / scale;

      const { origBBox: ob, origObjs, handle: h } = dragState.current;
      const newBBox = computeNewBBox(dx, dy, h, ob);
      const scaleX = newBBox.width / ob.width;
      const scaleY = newBBox.height / ob.height;

      batchUpdateObjects(
        origObjs.map(obj => ({
          id: obj.id,
          x: newBBox.x + (obj.x - ob.x) * scaleX,
          y: newBBox.y + (obj.y - ob.y) * scaleY,
          width:  obj.width  * scaleX,
          height: obj.height * scaleY,
        }))
      );
    }

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  }

  return (
    <div
      ref={boxRef}
      style={{
        position: 'absolute',
        left: bbox.x,
        top: bbox.y,
        width: bbox.width,
        height: bbox.height,
        border: '2px solid rgba(99,102,241,0.85)',
        borderRadius: '3px',
        pointerEvents: 'none',
        zIndex: 200,
        boxSizing: 'border-box',
      }}
    >
      {Object.entries(HANDLES).map(([handle, { style, cursor }]) => (
        <div
          key={handle}
          style={{
            position: 'absolute',
            width: 16,
            height: 16,
            background: 'white',
            border: '2px solid rgb(99,102,241)',
            borderRadius: '50%',
            cursor,
            pointerEvents: 'auto',
            zIndex: 201,
            boxSizing: 'border-box',
            ...style,
          }}
          onPointerDown={(e) => handleResizeDown(e, handle)}
          onPointerEnter={(e) => {
            (e.currentTarget as HTMLElement).style.background = 'rgb(238,242,255)';
            (e.currentTarget as HTMLElement).style.boxShadow = '0 0 0 3px rgba(99,102,241,0.3)';
          }}
          onPointerLeave={(e) => {
            (e.currentTarget as HTMLElement).style.background = 'white';
            (e.currentTarget as HTMLElement).style.boxShadow = '';
          }}
        />
      ))}
    </div>
  );
}

export default memo(MultiSelectBox);
