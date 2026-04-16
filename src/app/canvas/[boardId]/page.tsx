'use client';

import { useEffect, useState, useRef, use } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, CheckCheck, Search, MoreHorizontal } from 'lucide-react';
import { useCanvasStore } from '@/store/canvasStore';
import { debounce } from '@/lib/debounce';
import Canvas from '@/components/canvas/Canvas';
import Toolbar from '@/components/ui/Toolbar';
import CommandSearch from '@/components/ui/CommandSearch';
import AIPanel from '@/components/ui/AIPanel';
import BookModal from '@/components/canvas/BookModal';
import MiniMap from '@/components/ui/MiniMap';
import MobileFAB from '@/components/ui/MobileFAB';
import { useIsMobile } from '@/hooks/useIsMobile';

type SaveStatus = 'idle' | 'saving' | 'saved';

export default function CanvasPage({ params }: { params: Promise<{ boardId: string }> }) {
  const { boardId } = use(params);
  const searchParams = useSearchParams();
  const [boardTitle, setBoardTitle] = useState('Loading…');
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [loaded, setLoaded] = useState(false);
  const { 
    loadCanvasState, 
    getCanvasState, 
    objects, 
    connections, 
    setActiveTool, 
    setViewport,
    isBookModalOpen,
    focusedObjectId,
    setIsBookModalOpen,
    setFocusedObjectId
  } = useCanvasStore();
  const router = useRouter();
  const isMounted = useRef(true);

  // Load board
  useEffect(() => {
    isMounted.current = true;
    fetch(`/api/boards/${boardId}`)
      .then((r) => r.json())
      .then((board) => {
        if (!isMounted.current) return;
        setBoardTitle(board.title || 'Untitled');
        if (board.canvas_state?.objects) {
          loadCanvasState(board.canvas_state);
        }
        
        // Handle Deep Links
        const startX = searchParams.get('x');
        const startY = searchParams.get('y');
        const startZ = searchParams.get('z');
        if (startX && startY) {
          setViewport({
            x: window.innerWidth / 2 - Number(startX),
            y: window.innerHeight / 2 - Number(startY),
            scale: startZ ? Number(startZ) : 1
          });
        }
        
        setLoaded(true);
      })
      .catch(() => router.push('/dashboard'));

    return () => { isMounted.current = false; };
  }, [boardId, searchParams, loadCanvasState, setViewport, router]);

  // Auto-save with debounce
  const saveCanvas = useRef(
    debounce(async (id: string, state: ReturnType<typeof getCanvasState>) => {
      setSaveStatus('saving');
      try {
        await fetch(`/api/boards/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ canvas_state: state }),
        });
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
      } catch {
        setSaveStatus('idle');
      }
    }, 2000)
  );

  useEffect(() => {
    if (!loaded) return;
    const state = getCanvasState();
    saveCanvas.current(boardId, state);
  }, [objects, connections, loaded, boardId, getCanvasState]);

  // Keyboard shortcuts for tools
  useEffect(() => {
    const shortcuts: Record<string, string> = {
      v: 'pointer', s: 'sticky', n: 'note', b: 'book',
      c: 'circle', r: 'rectangle', a: 'arrow', d: 'pen', e: 'eraser',
    };
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      const tool = shortcuts[e.key.toLowerCase()];
      if (tool) setActiveTool(tool as Parameters<typeof setActiveTool>[0]);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [setActiveTool]);

  const isMobile = useIsMobile();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const focusedObject = objects.find(o => o.id === focusedObjectId);

  return (
    <div className="fixed inset-0 overflow-hidden bg-gray-50 canvas-safe-wrapper">
      {/* Header bar */}
      <div className="absolute top-0 left-0 right-0 z-40 flex items-center justify-between px-4 py-2 bg-white/90 backdrop-blur-md border-b border-gray-100 h-[52px]">

        {/* Left: back + title */}
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <button
            onClick={() => router.push('/dashboard')}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition px-2 py-1.5 rounded-lg hover:bg-gray-100 shrink-0"
          >
            <ArrowLeft size={15} />
            <span className="hidden sm:inline">Back</span>
          </button>
          <div className="w-px h-4 bg-gray-200 shrink-0" />
          <input
            value={boardTitle}
            onChange={(e) => setBoardTitle(e.target.value)}
            onBlur={async () => {
              await fetch(`/api/boards/${boardId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title: boardTitle }),
              });
            }}
            className="text-sm font-semibold text-gray-800 bg-transparent border-none outline-none hover:bg-gray-100 focus:bg-gray-100 rounded-lg px-2 py-1 transition min-w-0 max-w-[180px]"
          />
        </div>

        {/* Center: search trigger (desktop only) */}
        <div className="hidden sm:flex flex-1 justify-center px-4">
          <button
            onClick={() => {
              window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true, bubbles: true }));
            }}
            className="flex items-center gap-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 hover:border-gray-300 rounded-xl px-3 py-1.5 text-sm text-gray-400 hover:text-gray-600 transition-all w-56"
          >
            <Search size={13} />
            <span className="flex-1 text-left">Search canvas…</span>
            <kbd className="px-1.5 py-0.5 text-xs bg-white border border-gray-200 rounded-md font-mono text-gray-400">⌘K</kbd>
          </button>
        </div>

        {/* Right: save status + object count (desktop) */}
        <div className="hidden sm:flex items-center gap-2 flex-1 justify-end">
          {saveStatus === 'saving' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-1.5 text-xs text-gray-400"
            >
              <span className="w-3 h-3 border-2 border-gray-300 border-t-indigo-400 rounded-full animate-spin" />
              <span>Saving…</span>
            </motion.div>
          )}
          {saveStatus === 'saved' && (
            <motion.div
              initial={{ opacity: 0, x: 4 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-1.5 text-xs text-green-600"
            >
              <CheckCheck size={13} />
              <span>Saved</span>
            </motion.div>
          )}
          <div className="text-xs text-gray-400 bg-gray-50 border border-gray-100 px-2 py-1 rounded-lg">
            {objects.length} obj
          </div>
        </div>

        {/* Right: mobile overflow menu */}
        <div className="sm:hidden flex items-center gap-2 relative">
          {saveStatus === 'saving' && (
            <span className="w-3 h-3 border-2 border-gray-300 border-t-indigo-400 rounded-full animate-spin" />
          )}
          {saveStatus === 'saved' && <CheckCheck size={14} className="text-green-600" />}
          <button
            onClick={() => setMobileMenuOpen(v => !v)}
            className="p-2 rounded-xl hover:bg-gray-100 transition text-gray-500"
          >
            <MoreHorizontal size={18} />
          </button>
          {mobileMenuOpen && (
            <>
              <div className="fixed inset-0 z-[90]" onClick={() => setMobileMenuOpen(false)} />
              <div className="absolute top-10 right-0 z-[100] bg-white rounded-xl shadow-lg border border-gray-100 py-1 min-w-[160px]">
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true, bubbles: true }));
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <Search size={14} />
                  Search canvas
                </button>
                <div className="text-xs text-gray-400 px-3 py-2 border-t border-gray-100">
                  {objects.length} objects
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Main canvas area */}
      <div className="absolute inset-0 pt-[52px]">
        {loaded ? (
          <Canvas />
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="w-8 h-8 border-3 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
          </div>
        )}
      </div>

      {/* Toolbar */}
      {loaded && <Toolbar />}

      {/* MiniMap */}
      {loaded && <MiniMap />}

      {/* Command search */}
      {loaded && <CommandSearch />}

      {/* AI Panel */}
      {loaded && <AIPanel />}

      {/* Mobile FAB */}
      {loaded && isMobile && <MobileFAB />}

      {/* Book Modal */}
      <AnimatePresence>
        {isBookModalOpen && focusedObject && (
          <BookModal 
            object={focusedObject} 
            onClose={() => {
              setIsBookModalOpen(false);
              setFocusedObjectId(null);
            }} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}
