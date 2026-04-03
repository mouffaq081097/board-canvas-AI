'use client';

import { useRef } from 'react';
import { useCanvasStore } from '@/store/canvasStore';
import { CanvasObject } from '@/types/canvas';

interface Props {
  object: CanvasObject;
}

function getLighterShade(hex: string): string {
  const map: Record<string, string> = {
    '#fef9c3': '#fef08a',
    '#fce7f3': '#fbcfe8',
    '#dbeafe': '#bfdbfe',
    '#dcfce7': '#bbf7d0',
    '#f3e8ff': '#e9d5ff',
    '#ffedd5': '#fed7aa',
    '#ccfbf1': '#99f6e4',
    '#fee2e2': '#fecaca',
  };
  return map[hex] || hex;
}

export default function StickyNote({ object }: Props) {
  const { updateObject } = useCanvasStore();
  const textRef = useRef<HTMLTextAreaElement>(null);
  const bg = object.style.backgroundColor || '#fef9c3';
  const border = getLighterShade(bg);

  const fontClass = object.style.fontFamily === 'lora'
    ? 'font-serif'
    : 'font-[Caveat,cursive]';

  return (
    <div
      className={`relative w-full h-full paper-texture rounded-sm overflow-hidden flex flex-col ${object.style.roughEdges ? 'rounded-none' : 'rounded-sm'}`}
      style={{
        backgroundColor: bg,
        borderBottom: `3px solid ${border}`,
        boxShadow: '2px 4px 12px rgba(0,0,0,0.12), 0 1px 3px rgba(0,0,0,0.08)',
      }}
    >
      {/* Top fold decoration */}
      <div
        className="absolute top-0 right-0 w-0 h-0"
        style={{
          borderStyle: 'solid',
          borderWidth: '0 12px 12px 0',
          borderColor: `transparent ${border} transparent transparent`,
        }}
      />

      {/* Text area */}
      <textarea
        ref={textRef}
        value={object.content}
        onChange={(e) => updateObject(object.id, { content: e.target.value })}
        placeholder="Write something…"
        onPointerDown={(e) => e.stopPropagation()}
        className={`flex-1 w-full h-full p-3 bg-transparent resize-none border-none outline-none text-gray-800 placeholder-gray-400 leading-snug ${fontClass}`}
        style={{
          fontSize: object.style.fontSize || 18,
          color: object.style.textColor || '#1a1a1a',
        }}
      />
    </div>
  );
}
