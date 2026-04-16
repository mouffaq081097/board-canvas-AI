'use client';

import { useRef, useEffect } from 'react';
import { useCanvasStore } from '@/store/canvasStore';
import { CanvasObject } from '@/types/canvas';

interface Props {
  object: CanvasObject;
}

// Apple Freeform inspired pastel colors
const STICKY_COLORS: Record<string, string> = {
  '#fef9c3': '#FFF2AD', // Yellow
  '#fce7f3': '#F6CFE1', // Pink
  '#dbeafe': '#B1E5F2', // Blue
  '#dcfce7': '#D2F5B0', // Green
  '#f3e8ff': '#E4D0F2', // Purple
  '#ffedd5': '#FFD6A5', // Orange
  '#ccfbf1': '#B1F2E7', // Teal
  '#fee2e2': '#FFB1B1', // Red
};

const DEFAULT_COLOR = '#FFF2AD';

export default function StickyNote({ object }: Props) {
  const { updateObject, setEditingObjectId } = useCanvasStore();
  const isEditing = useCanvasStore((s) => s.editingObjectId === object.id);
  const textRef = useRef<HTMLTextAreaElement>(null);

  const bg = object.style.backgroundColor || '#fef9c3';
  const color = STICKY_COLORS[bg] ?? bg;

  const fontClass = object.style.fontFamily === 'serif'
    ? 'font-serif'
    : object.style.fontFamily === 'mono'
    ? 'font-mono'
    : object.style.fontFamily === 'handwriting'
    ? 'font-[Caveat,cursive]'
    : 'font-sans';

  useEffect(() => {
    if (isEditing && textRef.current) {
      textRef.current.focus();
      textRef.current.setSelectionRange(textRef.current.value.length, textRef.current.value.length);
    }
  }, [isEditing]);

  return (
    <div
      className="relative w-full h-full flex items-center justify-center overflow-hidden"
      style={{
        backgroundColor: color,
        borderRadius: '0px',
        boxShadow: `
          0 4px 12px rgba(0,0,0,0.08),
          0 1px 4px rgba(0,0,0,0.04)
        `,
      }}
    >
      {isEditing ? (
        <textarea
          ref={textRef}
          value={object.content}
          onChange={(e) => updateObject(object.id, { content: e.target.value })}
          onBlur={() => setEditingObjectId(null)}
          placeholder="Write something…"
          onPointerDown={(e) => e.stopPropagation()}
          className={`w-full h-full bg-transparent resize-none border-none outline-none text-gray-800 placeholder-gray-500/50 leading-tight z-10 text-center ${fontClass}`}
          style={{
            padding: '20px',
            fontSize: object.style.fontSize || 18,
            color: object.style.textColor || '#1c1008',
          }}
        />
      ) : (
        <div
          className={`w-full px-5 max-h-full overflow-hidden text-gray-800 leading-tight z-10 text-center select-none ${fontClass}`}
          style={{
            fontSize: object.style.fontSize || 18,
            color: object.style.textColor || '#1c1008',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            opacity: object.content ? 1 : 0.5,
          }}
        >
          {object.content || 'Write something…'}
        </div>
      )}
    </div>
  );
}
