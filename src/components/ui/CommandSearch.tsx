'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, animate } from 'framer-motion';
import { Search, StickyNote, FileText, BookOpen, Circle, Square } from 'lucide-react';
// Search is still used inside the modal input
import { useCanvasStore } from '@/store/canvasStore';
import { CanvasObject } from '@/types/canvas';

const TYPE_ICONS: Record<string, React.ReactNode> = {
  sticky: <StickyNote size={14} />,
  note: <FileText size={14} />,
  book: <BookOpen size={14} />,
  shape: <Circle size={14} />,
  drawing: <Square size={14} />,
};

export default function CommandSearch() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [highlighted, setHighlighted] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const { objects, setViewport, setPulsingId } = useCanvasStore();

  // Keyboard shortcut Cmd+K / Ctrl+K
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen((o) => !o);
        setQuery('');
        setHighlighted(0);
      }
      if (e.key === 'Escape') setIsOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const results = query.trim()
    ? objects.filter((o) => {
        const text = [
          o.content,
          o.metadata?.ocrText,
          o.metadata?.pages?.map((p) => p.content).join(' '),
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        return text.includes(query.toLowerCase());
      })
    : objects.slice(0, 8);

  const navigateTo = (obj: CanvasObject) => {
    const windowW = window.innerWidth;
    const windowH = window.innerHeight;

    const targetX = windowW / 2 - (obj.x + obj.width / 2);
    const targetY = windowH / 2 - (obj.y + obj.height / 2);
    const targetScale = 1;

    // Get current viewport state from store snapshot
    const currentVp = useCanvasStore.getState().viewport;

    // Smoothly animate viewport to center the object
    animate(currentVp.x, targetX, {
      type: 'spring',
      stiffness: 120,
      damping: 20,
      mass: 1,
      onUpdate: (x) => setViewport({ x }),
    });

    animate(currentVp.y, targetY, {
      type: 'spring',
      stiffness: 120,
      damping: 20,
      mass: 1,
      onUpdate: (y) => setViewport({ y }),
    });

    if (currentVp.scale !== targetScale) {
      animate(currentVp.scale, targetScale, {
        type: 'spring',
        stiffness: 100,
        damping: 20,
        onUpdate: (scale) => setViewport({ scale }),
      });
    }

    setPulsingId(obj.id);
    setTimeout(() => setPulsingId(null), 2000);
    setIsOpen(false);
    setQuery('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlighted((h) => Math.min(h + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlighted((h) => Math.max(h - 1, 0));
    } else if (e.key === 'Enter' && results[highlighted]) {
      navigateTo(results[highlighted]);
    }
  };

  function getSnippet(obj: CanvasObject): string {
    const texts = [
      obj.content,
      obj.metadata?.ocrText,
      ...(obj.metadata?.pages?.map((p) => p.content) || []),
    ].filter(Boolean);
    const full = texts.join(' ');
    if (full.length <= 60) return full;
    const idx = full.toLowerCase().indexOf(query.toLowerCase());
    if (idx === -1) return full.slice(0, 60) + '…';
    const start = Math.max(0, idx - 20);
    return (start > 0 ? '…' : '') + full.slice(start, start + 60) + '…';
  }

  return (
    <>
      {/* Modal only — trigger is in the header bar */}
      <AnimatePresence>
        {isOpen && (
          <div
            className="fixed inset-0 z-[300] flex items-start justify-center pt-20"
            onClick={() => setIsOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/20 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.96 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              className="relative z-10 w-full max-w-lg mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
                {/* Input */}
                <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
                  <Search size={18} className="text-gray-400 shrink-0" />
                  <input
                    ref={inputRef}
                    value={query}
                    onChange={(e) => { setQuery(e.target.value); setHighlighted(0); }}
                    onKeyDown={handleKeyDown}
                    placeholder="Search notes, books, drawings…"
                    className="flex-1 bg-transparent border-none outline-none text-gray-900 text-base placeholder-gray-400"
                  />
                  {query && (
                    <button
                      onClick={() => setQuery('')}
                      className="text-gray-400 hover:text-gray-600 text-xs"
                    >
                      Clear
                    </button>
                  )}
                </div>

                {/* Results */}
                <div className="max-h-72 overflow-y-auto">
                  {results.length === 0 ? (
                    <div className="px-4 py-8 text-center text-sm text-gray-400">
                      No results found
                    </div>
                  ) : (
                    results.map((obj, i) => (
                      <button
                        key={obj.id}
                        onClick={() => navigateTo(obj)}
                        className={`w-full flex items-start gap-3 px-4 py-3 text-left transition ${
                          i === highlighted ? 'bg-indigo-50' : 'hover:bg-gray-50'
                        }`}
                      >
                        <span className={`mt-0.5 shrink-0 ${i === highlighted ? 'text-indigo-500' : 'text-gray-400'}`}>
                          {TYPE_ICONS[obj.type]}
                        </span>
                        <div className="min-w-0">
                          <div className={`text-sm font-medium truncate ${i === highlighted ? 'text-indigo-700' : 'text-gray-700'}`}>
                            {obj.type === 'book' ? obj.content || 'Untitled Book' : obj.type}
                          </div>
                          <div className="text-xs text-gray-400 truncate mt-0.5">
                            {getSnippet(obj) || '(empty)'}
                          </div>
                        </div>
                        <span className="ml-auto shrink-0 text-xs text-gray-300">
                          ({Math.round(obj.x)}, {Math.round(obj.y)})
                        </span>
                      </button>
                    ))
                  )}
                </div>

                {/* Footer hint */}
                <div className="px-4 py-2 border-t border-gray-50 flex items-center gap-3 text-xs text-gray-400">
                  <span><kbd className="px-1 py-0.5 bg-gray-100 rounded font-mono text-xs">↑↓</kbd> navigate</span>
                  <span><kbd className="px-1 py-0.5 bg-gray-100 rounded font-mono text-xs">↵</kbd> jump to</span>
                  <span><kbd className="px-1 py-0.5 bg-gray-100 rounded font-mono text-xs">Esc</kbd> close</span>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
