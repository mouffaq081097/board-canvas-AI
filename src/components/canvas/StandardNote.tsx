'use client';

import { useRef, useEffect, useState } from 'react';
import { Plus, X } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { useCanvasStore } from '@/store/canvasStore';
import { CanvasObject, TodoItem } from '@/types/canvas';

interface Props {
  object: CanvasObject;
}

// Fixed line height so text perfectly aligns with the ruled background lines
const LINE_H = 28;

export default function StandardNote({ object }: Props) {
  const { updateObject, setEditingObjectId } = useCanvasStore();
  const isEditing = useCanvasStore((s) => s.editingObjectId === object.id);
  const textRef = useRef<HTMLTextAreaElement>(null);
  
  // Local state for editing the header title
  const [editingTitle, setEditingTitle] = useState(false);

  const isTodo = object.metadata?.todoMode ?? false;
  const items: TodoItem[] = object.metadata?.todoItems ?? [];
  const noteTitle = object.metadata?.noteTitle ?? '';
  const content = object.content;

  const bodyFont =
    object.style.fontFamily === 'serif'
      ? "'Lora', 'Georgia', serif"
      : object.style.fontFamily === 'mono'
      ? "'Menlo', 'Monaco', 'Courier New', monospace"
      : object.style.fontFamily === 'handwriting'
      ? "'Caveat', 'Comic Sans MS', cursive"
      : "ui-sans-serif, system-ui, sans-serif";
  const fontSize = object.style.fontSize || 16;
  const textColor = object.style.textColor || '#1f2937';

  const setContent = (val: string) => updateObject(object.id, { content: val });
  const setTitle = (val: string) => updateObject(object.id, { metadata: { ...object.metadata, noteTitle: val } });

  const addItem = () => {
    const newItems = [...items, { id: uuidv4(), text: '', done: false }];
    updateObject(object.id, { metadata: { ...object.metadata, todoItems: newItems } });
    setTimeout(() => {
      const inputs = document.querySelectorAll<HTMLInputElement>(
        `[data-note-id="${object.id}"] .todo-input`
      );
      inputs[inputs.length - 1]?.focus();
    }, 30);
  };

  const toggleItem = (id: string) => {
    const newItems = items.map((it) => (it.id === id ? { ...it, done: !it.done } : it));
    updateObject(object.id, { metadata: { ...object.metadata, todoItems: newItems } });
  };

  const updateItemText = (id: string, text: string) => {
    const newItems = items.map((it) => (it.id === id ? { ...it, text } : it));
    updateObject(object.id, { metadata: { ...object.metadata, todoItems: newItems } });
  };

  const removeItem = (id: string) => {
    const newItems = items.filter((it) => it.id !== id);
    updateObject(object.id, { metadata: { ...object.metadata, todoItems: newItems } });
  };

  const handleItemKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, id: string, idx: number) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addItem();
    } else if (e.key === 'Backspace' && items[idx].text === '' && items.length > 1) {
      e.preventDefault();
      removeItem(id);
      setTimeout(() => {
        const inputs = document.querySelectorAll<HTMLInputElement>(
          `[data-note-id="${object.id}"] .todo-input`
        );
        inputs[Math.max(0, idx - 1)]?.focus();
      }, 30);
    }
  };

  useEffect(() => {
    if (isEditing && !isTodo && textRef.current) {
      textRef.current.focus();
      textRef.current.setSelectionRange(
        textRef.current.value.length,
        textRef.current.value.length
      );
    }
  }, [isEditing, isTodo]);

  // Shared paper styles
  const paperBg = {
    backgroundColor: object.style.backgroundColor === 'transparent' ? '#ffffff' : (object.style.backgroundColor || '#ffffff'),
    backgroundImage: `repeating-linear-gradient(transparent, transparent ${LINE_H - 1}px, #e5e7eb ${LINE_H - 1}px, #e5e7eb ${LINE_H}px)`,
    // Offset the background so the first line starts exactly below the header
    backgroundPositionY: '0px', 
  };

  // Shared text layout to ensure exact alignment whether editing or viewing
  const textLayout: React.CSSProperties = {
    fontFamily: bodyFont,
    fontSize,
    color: textColor,
    lineHeight: `${LINE_H}px`,
    paddingLeft: 44, // Room for the red margin line
    paddingRight: 16,
    paddingTop: 0,
    paddingBottom: LINE_H,
    margin: 0,
  };

  return (
    <div
      data-note-id={object.id}
      className="relative w-full h-full flex flex-col overflow-hidden group"
      style={{
        borderRadius: '12px',
        boxShadow: `
          0 4px 24px rgba(0,0,0,0.06),
          0 1px 4px rgba(0,0,0,0.03),
          inset 0 0 0 1px rgba(0,0,0,0.05)
        `,
      }}
    >
      {/* ── Header Area ── */}
      <div
        className="flex-shrink-0 flex items-center px-4 pt-3 pb-2 relative z-20 border-b border-gray-100 bg-white/90 backdrop-blur-sm"
        onDoubleClick={(e) => {
          e.stopPropagation();
          setEditingTitle(true);
        }}
      >
        {editingTitle ? (
          <input
            autoFocus
            type="text"
            value={noteTitle}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={() => setEditingTitle(false)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === 'Escape') setEditingTitle(false);
            }}
            placeholder="Title"
            onPointerDown={(e) => e.stopPropagation()}
            className="w-full bg-transparent border-none outline-none text-gray-900 font-semibold placeholder-gray-400"
            style={{ fontSize: Math.max(16, fontSize + 2), fontFamily: bodyFont }}
          />
        ) : (
          <div
            className="w-full font-semibold truncate select-none"
            style={{
              fontSize: Math.max(16, fontSize + 2),
              fontFamily: bodyFont,
              color: noteTitle ? '#111827' : '#9ca3af',
              cursor: 'text',
            }}
          >
            {noteTitle || 'Title'}
          </div>
        )}
      </div>

      {/* ── Ruled Paper Body ── */}
      <div className="flex-1 relative overflow-hidden" style={paperBg}>
        
        {/* Left red margin line */}
        <div className="absolute top-0 bottom-0 left-[32px] w-px bg-red-200/60 z-0 pointer-events-none" />

        {isTodo ? (
          /* ── Todo / list mode ── */
          <div className="absolute inset-0 overflow-y-auto z-10" style={{ paddingTop: 0 }}>
            {items.map((item, idx) => (
              <div
                key={item.id}
                className="flex items-center group/item"
                style={{ height: LINE_H, paddingLeft: 44, paddingRight: 16 }}
              >
                <button
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={() => toggleItem(item.id)}
                  className="flex-shrink-0 flex items-center justify-center transition-all mr-3"
                  style={{
                    width: 16,
                    height: 16,
                    borderRadius: '50%',
                    border: item.done ? '2px solid #3b82f6' : '2px solid #d1d5db',
                    backgroundColor: item.done ? '#3b82f6' : 'transparent',
                  }}
                >
                  {item.done && (
                    <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                      <path d="M1 4L4 7L9 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </button>

                <input
                  type="text"
                  value={item.text}
                  onChange={(e) => updateItemText(item.id, e.target.value)}
                  onKeyDown={(e) => handleItemKeyDown(e, item.id, idx)}
                  onPointerDown={(e) => e.stopPropagation()}
                  placeholder="List item"
                  className={`todo-input flex-1 bg-transparent border-none outline-none min-w-0 ${
                    item.done ? 'line-through text-gray-400' : 'text-gray-800'
                  }`}
                  style={{
                    fontFamily: bodyFont,
                    fontSize,
                    lineHeight: `${LINE_H}px`,
                    height: LINE_H,
                  }}
                />

                <button
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={() => removeItem(item.id)}
                  className="flex-shrink-0 opacity-0 group-hover/item:opacity-100 transition-opacity text-gray-300 hover:text-red-400 ml-2"
                >
                  <X size={14} />
                </button>
              </div>
            ))}

            <button
              onPointerDown={(e) => e.stopPropagation()}
              onClick={addItem}
              className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity text-blue-500 hover:text-blue-600"
              style={{ height: LINE_H, paddingLeft: 44, fontSize: 14 }}
            >
              <Plus size={14} />
              Add item
            </button>
          </div>
        ) : (
          /* ── Text mode ── */
          <>
            {isEditing ? (
              <textarea
                ref={textRef}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                onBlur={() => setEditingObjectId(null)}
                placeholder="Start writing..."
                onPointerDown={(e) => e.stopPropagation()}
                className="absolute inset-0 w-full h-full bg-transparent resize-none border-none outline-none z-10 placeholder-gray-300"
                style={textLayout}
              />
            ) : (
              <div
                className="absolute inset-0 w-full h-full z-10 select-none overflow-y-auto"
                style={{
                  ...textLayout,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  color: object.content ? textColor : '#9ca3af',
                }}
              >
                {object.content || 'Start writing...'}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
