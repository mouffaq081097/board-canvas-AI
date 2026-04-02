'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Wand2, BookMarked, Group, ScanText, Pencil } from 'lucide-react';
import { useCanvasStore } from '@/store/canvasStore';
import { useAI, AIAction } from '@/hooks/useAI';

interface AIButton {
  id: AIAction;
  icon: React.ReactNode;
  label: string;
  description: string;
  minSelected: number;
}

const AI_BUTTONS: AIButton[] = [
  {
    id: 'brainstorm',
    icon: <Wand2 size={15} />,
    label: 'Brainstorm',
    description: 'Generate 5 related ideas',
    minSelected: 1,
  },
  {
    id: 'group',
    icon: <Group size={15} />,
    label: 'Clustering',
    description: 'Cluster objects by theme',
    minSelected: 2,
  },
  {
    id: 'summarize',
    icon: <BookMarked size={15} />,
    label: 'Summarize',
    description: 'Summarize into a structured book',
    minSelected: 1,
  },
  {
    id: 'sketch',
    icon: <Pencil size={15} />,
    label: 'To Vector',
    description: 'Convert drawing to clean vector shape',
    minSelected: 1,
  },
  {
    id: 'ocr',
    icon: <ScanText size={15} />,
    label: 'Read Text',
    description: 'Extract text from drawing',
    minSelected: 1,
  },
];

export default function AIPanel() {
  const { selectedIds } = useCanvasStore();
  const { runAI, loading, error } = useAI();

  return (
    <AnimatePresence>
      {selectedIds.length > 0 && (
        <motion.div
          key="ai-panel"
          initial={{ opacity: 0, y: 40, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 40, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 z-50 bg-white/80 backdrop-blur-2xl rounded-3xl shadow-[0_8px_32px_-4px_rgba(99,102,241,0.2)] border border-white/60 p-2 flex items-center gap-1.5 ring-1 ring-black/5"
        >
          {/* AI badge */}
          <div className="flex items-center gap-2 pl-2 pr-4 border-r border-gray-200/60">
            <div className="relative flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-fuchsia-500 shadow-inner">
              <div className="absolute inset-0 rounded-full bg-indigo-500/30 blur-md animate-pulse" />
              <Wand2 size={14} className="text-white relative z-10" />
            </div>
            <span className="text-[11px] uppercase tracking-wider font-black bg-gradient-to-r from-indigo-600 to-fuchsia-600 bg-clip-text text-transparent">
              AI Tools
            </span>
          </div>

          <div className="flex items-center gap-1">
            {AI_BUTTONS.map((btn) => {
              const disabled = selectedIds.length < btn.minSelected;
              const isLoading = loading === btn.id;

              return (
                <button
                  key={btn.id}
                  onClick={() => !disabled && runAI(btn.id)}
                  disabled={disabled || loading !== null}
                  className={`relative group flex items-center gap-2 px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition-all duration-300 ${
                    disabled
                      ? 'text-gray-400 opacity-50 cursor-not-allowed'
                      : loading !== null && !isLoading
                      ? 'text-gray-400 opacity-50 cursor-not-allowed'
                      : 'text-gray-600 hover:text-indigo-700 hover:bg-white hover:shadow-sm'
                  }`}
                >
                  {isLoading && (
                    <span className="absolute inset-0 rounded-2xl bg-indigo-50/80 backdrop-blur-sm z-0" />
                  )}
                  {isLoading ? (
                    <span className="relative z-10 w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <span className={`relative z-10 transition-colors ${!disabled && 'group-hover:text-indigo-600'}`}>
                      {btn.icon}
                    </span>
                  )}
                  <span className="relative z-10">{btn.label}</span>

                  {/* Tooltip */}
                  {!disabled && (
                    <div className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 px-2.5 py-1.5 bg-gray-900 text-white text-[10px] font-medium rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none scale-95 group-hover:scale-100 origin-bottom shadow-xl">
                      {btn.description}
                      <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {error && (
            <div className="ml-1 px-3 py-1 bg-red-50 text-red-600 text-xs rounded-xl font-medium max-w-40 truncate border border-red-100">
              {error}
            </div>
          )}

          {/* Selection count badge */}
          <div className="ml-1 pl-3 pr-1 py-1 border-l border-gray-200/60 flex items-center">
            <div className="flex items-center gap-1.5 bg-indigo-50/80 px-3 py-1.5 rounded-xl text-[10px] font-bold text-indigo-600 uppercase tracking-wide">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
              {selectedIds.length} Selected
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
