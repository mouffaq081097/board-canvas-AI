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
    label: 'Smart Clustering',
    description: 'Cluster objects by theme',
    minSelected: 2,
  },
  {
    id: 'summarize',
    icon: <BookMarked size={15} />,
    label: 'Summarize-to-Book',
    description: 'Summarize into a structured book',
    minSelected: 1,
  },
  {
    id: 'sketch',
    icon: <Pencil size={15} />,
    label: 'Sketch-to-Vector',
    description: 'Convert drawing to clean vector shape',
    minSelected: 1,
  },
  {
    id: 'ocr',
    icon: <ScanText size={15} />,
    label: 'Read Handwriting',
    description: 'Extract text from drawing',
    minSelected: 1,
  },
];

export default function AIPanel() {
  const { selectedIds } = useCanvasStore();
  const { runAI, loading, error } = useAI();

  if (selectedIds.length === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        key="ai-panel"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
        className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 bg-white rounded-2xl shadow-xl border border-gray-100 px-3 py-2 flex items-center gap-2"
      >
        {/* AI badge */}
        <div className="flex items-center gap-1.5 pr-2 border-r border-gray-100">
          <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
            <Wand2 size={12} className="text-white" />
          </div>
          <span className="text-xs font-semibold text-gray-500">AI</span>
        </div>

        {AI_BUTTONS.map((btn) => {
          const disabled = selectedIds.length < btn.minSelected;
          const isLoading = loading === btn.id;

          return (
            <button
              key={btn.id}
              onClick={() => !disabled && runAI(btn.id)}
              disabled={disabled || loading !== null}
              title={btn.description}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                disabled
                  ? 'text-gray-300 cursor-not-allowed'
                  : loading !== null && !isLoading
                  ? 'text-gray-300 cursor-not-allowed'
                  : 'text-gray-600 hover:bg-indigo-50 hover:text-indigo-700 active:scale-95'
              }`}
            >
              {isLoading ? (
                <span className="w-3.5 h-3.5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              ) : (
                btn.icon
              )}
              {btn.label}
            </button>
          );
        })}

        {error && (
          <span className="text-xs text-red-500 max-w-40 truncate">{error}</span>
        )}

        {/* Selection count badge */}
        <div className="ml-1 px-2 py-0.5 bg-indigo-50 text-indigo-600 text-xs rounded-full font-medium">
          {selectedIds.length} selected
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
