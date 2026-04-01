'use client';

import { useRef } from 'react';
import { CheckSquare, FileText, Plus, X } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { useCanvasStore } from '@/store/canvasStore';
import { CanvasObject, TodoItem } from '@/types/canvas';

interface Props {
  object: CanvasObject;
}

export default function StandardNote({ object }: Props) {
  const { updateObject } = useCanvasStore();
  const newItemRef = useRef<HTMLInputElement>(null);

  const isTodo = object.metadata?.todoMode ?? false;
  const items: TodoItem[] = object.metadata?.todoItems ?? [];

  const title = object.content.split('\n')[0] ?? '';
  const bodyText = object.content.split('\n').slice(1).join('\n');

  const setTitle = (val: string) => {
    const rest = object.content.split('\n').slice(1).join('\n');
    updateObject(object.id, { content: val + '\n' + rest });
  };

  const setBodyText = (val: string) => {
    const t = object.content.split('\n')[0] ?? '';
    updateObject(object.id, { content: t + '\n' + val });
  };

  const toggleMode = () => {
    updateObject(object.id, {
      metadata: {
        ...object.metadata,
        todoMode: !isTodo,
        // Seed one blank item when switching to todo mode for the first time
        todoItems: !isTodo && items.length === 0
          ? [{ id: uuidv4(), text: '', done: false }]
          : items,
      },
    });
  };

  const addItem = () => {
    const newItems = [...items, { id: uuidv4(), text: '', done: false }];
    updateObject(object.id, { metadata: { ...object.metadata, todoItems: newItems } });
    // Focus the new input on next tick
    setTimeout(() => {
      const inputs = document.querySelectorAll<HTMLInputElement>(`[data-note-id="${object.id}"] .todo-input`);
      inputs[inputs.length - 1]?.focus();
    }, 30);
  };

  const toggleItem = (id: string) => {
    const newItems = items.map(it => it.id === id ? { ...it, done: !it.done } : it);
    updateObject(object.id, { metadata: { ...object.metadata, todoItems: newItems } });
  };

  const updateItemText = (id: string, text: string) => {
    const newItems = items.map(it => it.id === id ? { ...it, text } : it);
    updateObject(object.id, { metadata: { ...object.metadata, todoItems: newItems } });
  };

  const removeItem = (id: string) => {
    const newItems = items.filter(it => it.id !== id);
    updateObject(object.id, { metadata: { ...object.metadata, todoItems: newItems } });
  };

  const handleItemKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, id: string, idx: number) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addItem();
    } else if (e.key === 'Backspace' && items[idx].text === '' && items.length > 1) {
      e.preventDefault();
      removeItem(id);
      // Focus the previous item
      setTimeout(() => {
        const inputs = document.querySelectorAll<HTMLInputElement>(`[data-note-id="${object.id}"] .todo-input`);
        inputs[Math.max(0, idx - 1)]?.focus();
      }, 30);
    }
  };

  const done = items.filter(it => it.done).length;

  return (
    <div
      data-note-id={object.id}
      className="relative w-full h-full overflow-hidden flex flex-col rounded-sm"
      style={{
        backgroundColor: object.style.backgroundColor || '#ffffff',
        boxShadow: '2px 4px 12px rgba(0,0,0,0.1), 0 1px 3px rgba(0,0,0,0.06)',
        borderLeft: '4px solid #6366f1',
      }}
    >
      {/* Header */}
      <div className="h-8 flex items-center px-3 gap-2 border-b border-indigo-200 bg-indigo-50/50 flex-shrink-0">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title"
          onPointerDown={(e) => e.stopPropagation()}
          className="flex-1 bg-transparent border-none outline-none text-sm font-semibold text-indigo-700 placeholder-indigo-300 min-w-0"
        />

        {/* Mode toggle */}
        <button
          onPointerDown={(e) => e.stopPropagation()}
          onClick={toggleMode}
          title={isTodo ? 'Switch to text mode' : 'Switch to checklist mode'}
          className={`flex-shrink-0 w-5 h-5 rounded flex items-center justify-center transition-colors ${
            isTodo ? 'text-indigo-600' : 'text-gray-300 hover:text-indigo-400'
          }`}
        >
          {isTodo ? <CheckSquare size={14} /> : <FileText size={14} />}
        </button>
      </div>

      {isTodo ? (
        /* ── Todo mode ── */
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Progress bar */}
          {items.length > 0 && (
            <div className="flex-shrink-0 px-3 pt-1.5 pb-0.5">
              <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-500 rounded-full transition-all duration-300"
                  style={{ width: `${items.length ? (done / items.length) * 100 : 0}%` }}
                />
              </div>
              <p className="text-[9px] text-gray-400 mt-0.5 text-right">
                {done}/{items.length}
              </p>
            </div>
          )}

          {/* Items list */}
          <div className="flex-1 overflow-y-auto px-2 py-1">
            {items.map((item, idx) => (
              <div
                key={item.id}
                className="flex items-center gap-1.5 group/item py-0.5"
              >
                {/* Checkbox */}
                <button
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={() => toggleItem(item.id)}
                  className={`flex-shrink-0 w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
                    item.done
                      ? 'bg-indigo-500 border-indigo-500'
                      : 'border-gray-300 hover:border-indigo-400'
                  }`}
                >
                  {item.done && (
                    <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
                      <path d="M1 3.5L3.5 6L8 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </button>

                {/* Text input */}
                <input
                  type="text"
                  value={item.text}
                  onChange={(e) => updateItemText(item.id, e.target.value)}
                  onKeyDown={(e) => handleItemKeyDown(e, item.id, idx)}
                  onPointerDown={(e) => e.stopPropagation()}
                  placeholder="To-do item…"
                  className={`todo-input flex-1 bg-transparent border-none outline-none text-xs min-w-0 transition-colors ${
                    item.done
                      ? 'line-through text-gray-400 placeholder-gray-300'
                      : 'text-gray-700 placeholder-gray-300'
                  }`}
                  style={{ fontFamily: object.style.fontFamily || 'inherit' }}
                />

                {/* Remove button */}
                <button
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={() => removeItem(item.id)}
                  className="flex-shrink-0 opacity-0 group-hover/item:opacity-100 transition-opacity text-gray-300 hover:text-red-400"
                >
                  <X size={10} />
                </button>
              </div>
            ))}
          </div>

          {/* Add item button */}
          <button
            onPointerDown={(e) => e.stopPropagation()}
            onClick={addItem}
            className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 text-[11px] text-gray-400 hover:text-indigo-500 hover:bg-indigo-50 transition-colors border-t border-gray-100"
          >
            <Plus size={11} />
            Add item
          </button>
        </div>
      ) : (
        /* ── Text mode ── */
        <>
          {/* Lined paper background */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage: 'repeating-linear-gradient(transparent, transparent 27px, #dde3ea 27px, #dde3ea 28px)',
              backgroundPositionY: '32px',
              backgroundAttachment: 'local',
            }}
          />
          <textarea
            value={bodyText}
            onChange={(e) => setBodyText(e.target.value)}
            placeholder="Start writing…"
            onPointerDown={(e) => e.stopPropagation()}
            className="flex-1 w-full px-3 bg-transparent resize-none border-none outline-none text-gray-700 placeholder-gray-300 font-serif text-sm relative z-10"
            style={{
              lineHeight: '28px',
              paddingTop: '6px',
              fontSize: object.style.fontSize || 14,
              color: object.style.textColor || '#374151',
            }}
          />
        </>
      )}
    </div>
  );
}
