'use client';

import { useCanvasStore } from '@/store/canvasStore';
import { CanvasObject } from '@/types/canvas';

interface Props {
  object: CanvasObject;
}

export default function ShapeOverlay({ object }: Props) {
  const { updateObject } = useCanvasStore();
  const w = object.width;
  const h = object.height;
  const stroke = object.style.strokeColor || '#6366f1';
  const strokeWidth = object.style.strokeWidth || 2;
  const fill = object.style.backgroundColor === 'transparent' ? 'none' : (object.style.backgroundColor || 'none');
  const shapeType = object.metadata?.shapeType;
  const pathData = object.metadata?.pathData;

  if (object.type === 'drawing' && pathData) {
    return (
      <svg
        width={w}
        height={h}
        className="absolute inset-0"
        style={{ overflow: 'visible', pointerEvents: 'none' }}
      >
        <path
          d={pathData}
          fill="none"
          stroke={stroke}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  return (
    <svg
      width={w}
      height={h}
      className="absolute inset-0"
      style={{ overflow: 'visible' }}
    >
      {shapeType === 'circle' && (
        <ellipse
          cx={w / 2}
          cy={h / 2}
          rx={w / 2 - strokeWidth}
          ry={h / 2 - strokeWidth}
          fill={fill}
          stroke={stroke}
          strokeWidth={strokeWidth}
        />
      )}
      {shapeType === 'rectangle' && (
        <rect
          x={strokeWidth / 2}
          y={strokeWidth / 2}
          width={w - strokeWidth}
          height={h - strokeWidth}
          rx={4}
          fill={fill}
          stroke={stroke}
          strokeWidth={strokeWidth}
        />
      )}
      {shapeType === 'arrow' && (
        <>
          <defs>
            <marker id={`arrow-${object.id}`} markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
              <polygon points="0 0, 8 3, 0 6" fill={stroke} />
            </marker>
          </defs>
          <line
            x1={strokeWidth}
            y1={h / 2}
            x2={w - 12}
            y2={h / 2}
            stroke={stroke}
            strokeWidth={strokeWidth}
            markerEnd={`url(#arrow-${object.id})`}
          />
        </>
      )}

      {/* Editable label inside shape */}
      {shapeType !== 'arrow' && (
        <foreignObject x={8} y={8} width={w - 16} height={h - 16}>
          <textarea
            value={object.content}
            onChange={(e) => updateObject(object.id, { content: e.target.value })}
            onPointerDown={(e) => e.stopPropagation()}
            placeholder="Label"
            className="w-full h-full bg-transparent resize-none border-none outline-none text-center text-sm text-gray-600 placeholder-gray-300 leading-snug"
            style={{ fontSize: 13 }}
          />
        </foreignObject>
      )}
    </svg>
  );
}
