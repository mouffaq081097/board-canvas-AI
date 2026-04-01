import { AnchorSide, CanvasObject, Viewport } from '@/types/canvas';

export function screenToCanvas(
  screenX: number,
  screenY: number,
  viewport: Viewport
): { x: number; y: number } {
  return {
    x: (screenX - viewport.x) / viewport.scale,
    y: (screenY - viewport.y) / viewport.scale,
  };
}

export function canvasToScreen(
  canvasX: number,
  canvasY: number,
  viewport: Viewport
): { x: number; y: number } {
  return {
    x: canvasX * viewport.scale + viewport.x,
    y: canvasY * viewport.scale + viewport.y,
  };
}

export function getAnchorPoint(
  obj: CanvasObject,
  anchor: AnchorSide
): { x: number; y: number } {
  const cx = obj.x + obj.width / 2;
  const cy = obj.y + obj.height / 2;

  switch (anchor) {
    case 'top':
      return { x: cx, y: obj.y };
    case 'right':
      return { x: obj.x + obj.width, y: cy };
    case 'bottom':
      return { x: cx, y: obj.y + obj.height };
    case 'left':
      return { x: obj.x, y: cy };
  }
}

export function getClosestAnchors(
  objA: CanvasObject,
  objB: CanvasObject
): { fromAnchor: AnchorSide; toAnchor: AnchorSide } {
  const sides: AnchorSide[] = ['top', 'right', 'bottom', 'left'];
  let minDiff = Infinity;
  let bestFrom: AnchorSide = 'right';
  let bestTo: AnchorSide = 'left';

  for (const s1 of sides) {
    for (const s2 of sides) {
      const p1 = getAnchorPoint(objA, s1);
      const p2 = getAnchorPoint(objB, s2);
      const dx = p1.x - p2.x;
      const dy = p1.y - p2.y;
      const dist = dx * dx + dy * dy;
      if (dist < minDiff) {
        minDiff = dist;
        bestFrom = s1;
        bestTo = s2;
      }
    }
  }
  return { fromAnchor: bestFrom, toAnchor: bestTo };
}

export function getBezierPath(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  fromAnchor: AnchorSide,
  toAnchor: AnchorSide
): string {
  const dx = Math.abs(x1 - x2);
  const dy = Math.abs(y1 - y2);
  
  // Dynamic offset based on distance, capped for very long/short connections
  const offset = Math.min(Math.max(dx, dy, 50), 150) * 0.6;
  
  let cx1 = x1;
  let cy1 = y1;
  let cx2 = x2;
  let cy2 = y2;

  if (fromAnchor === 'right') cx1 += offset;
  else if (fromAnchor === 'left') cx1 -= offset;
  else if (fromAnchor === 'bottom') cy1 += offset;
  else if (fromAnchor === 'top') cy1 -= offset;

  if (toAnchor === 'left') cx2 -= offset;
  else if (toAnchor === 'right') cx2 += offset;
  else if (toAnchor === 'top') cy2 -= offset;
  else if (toAnchor === 'bottom') cy2 -= offset;

  return `M ${x1} ${y1} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${x2} ${y2}`;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function getSelectionBoundingBox(objects: CanvasObject[]) {
  if (objects.length === 0) return null;

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

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  };
}
