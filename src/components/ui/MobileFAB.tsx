'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, X,
  MousePointer2, StickyNote, FileText, BookOpen,
  Shapes, Table2, ImageIcon, Pen, Eraser, Link,
  Wand2, Group, BookMarked, ScanText, Pencil, GitFork,
} from 'lucide-react';
import { useCanvasStore } from '@/store/canvasStore';
import { useAI, AIAction } from '@/hooks/useAI';
import type { ToolType, ShapeType } from '@/types/canvas';

const TOOLS: { id: ToolType; icon: React.ReactNode; label: string }[] = [
  { id: 'pointer',   icon: <MousePointer2 size={22} />, label: 'Select' },
  { id: 'sticky',    icon: <StickyNote size={22} />,    label: 'Sticky' },
  { id: 'note',      icon: <FileText size={22} />,      label: 'Note' },
  { id: 'book',      icon: <BookOpen size={22} />,      label: 'Book' },
  { id: 'shape',     icon: <Shapes size={22} />,        label: 'Shape' },
  { id: 'table',     icon: <Table2 size={22} />,        label: 'Table' },
  { id: 'image',     icon: <ImageIcon size={22} />,      label: 'Image' },
  { id: 'pen',       icon: <Pen size={22} />,           label: 'Draw' },
  { id: 'eraser',    icon: <Eraser size={22} />,        label: 'Eraser' },
  { id: 'connector', icon: <Link size={22} />,          label: 'Connect' },
];

interface AIButtonDef {
  id: AIAction;
  icon: React.ReactNode;
  label: string;
  description: string;
  minSelected: number;
}

const AI_BUTTONS: AIButtonDef[] = [
  { id: 'brainstorm', icon: <Wand2 size={22} />,     label: 'Brainstorm', description: 'Generate 5 related ideas',                  minSelected: 1 },
  { id: 'group',      icon: <Group size={22} />,      label: 'Cluster',    description: 'Cluster objects by theme',                   minSelected: 2 },
  { id: 'summarize',  icon: <BookMarked size={22} />, label: 'Summarize',  description: 'Summarize into a structured book',           minSelected: 1 },
  { id: 'roadmap',    icon: <GitFork size={22} />,    label: 'Roadmap',    description: 'Turn todos into a branching roadmap',        minSelected: 1 },
  { id: 'sketch',     icon: <Pencil size={22} />,     label: 'To Vector',  description: 'Convert drawing to clean vector shape',      minSelected: 1 },
  { id: 'ocr',        icon: <ScanText size={22} />,   label: 'Read Text',  description: 'Extract text from drawing',                  minSelected: 1 },
];

type Tab = 'tools' | 'ai';

const SHAPES: { id: ShapeType; label: string }[] = [
  { id: 'circle',    label: 'Circle' },
  { id: 'rectangle', label: 'Square' },
  { id: 'arrow',     label: 'Arrow' },
  { id: 'triangle',  label: 'Triangle' },
  { id: 'diamond',   label: 'Diamond' },
  { id: 'star',      label: 'Star' },
  { id: 'hexagon',   label: 'Hexagon' },
  { id: 'pentagon',  label: 'Pentagon' },
];

export default function MobileFAB() {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('tools');
  const [isSelectingShape, setIsSelectingShape] = useState(false);
  const { activeTool, setActiveTool, activeShapeType, setActiveShapeType, selectedIds, objects } = useCanvasStore();
  const { runAI, loading } = useAI();

  const selectedObjects = objects.filter(o => selectedIds.includes(o.id));
  const hasBookOrShape = selectedObjects.some(
    o => o.type === 'book' || ['shape', 'circle', 'rectangle', 'arrow', 'triangle', 'diamond', 'star', 'hexagon', 'pentagon'].includes(o.type)
  );
  const hasSelection = selectedIds.length > 0 && !hasBookOrShape;

  function handleToolSelect(tool: ToolType) {
    if (tool === 'shape') {
      setIsSelectingShape(true);
    } else {
      setActiveTool(tool);
      setOpen(false);
    }
  }

  function handleShapeSelect(shapeId: ShapeType) {
    setActiveShapeType(shapeId);
    setActiveTool('shape');
    setIsSelectingShape(false);
    setOpen(false);
  }

  function handleAIAction(action: AIAction, minSelected: number) {
    if (selectedIds.length < minSelected) return;
    runAI(action);
    setOpen(false);
  }

  return (
    <>
      {/* Backdrop */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-black/30"
            onClick={() => setOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Bottom sheet */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="sheet"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-[210] bg-white rounded-t-3xl shadow-2xl"
            style={{ height: '55vh', paddingBottom: 'env(safe-area-inset-bottom)' }}
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-gray-300" />
            </div>

            {/* Tabs */}
            <div className="flex mx-4 mb-3 bg-gray-100 rounded-xl p-1">
              <button
                onClick={() => setActiveTab('tools')}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
                  activeTab === 'tools' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500'
                }`}
              >
                Tools
              </button>
              <button
                onClick={() => setActiveTab('ai')}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
                  activeTab === 'ai' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500'
                }`}
              >
                AI
                {hasSelection && (
                  <span className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full bg-indigo-600 text-white text-[9px] font-bold">
                    {selectedIds.length}
                  </span>
                )}
              </button>
            </div>

            {/* Tools grid */}
            {activeTab === 'tools' && !isSelectingShape && (
              <div className="grid grid-cols-4 gap-2 px-4 overflow-y-auto" style={{ maxHeight: 'calc(55vh - 100px)' }}>
                {TOOLS.map(tool => (
                  <button
                    key={tool.id}
                    onClick={() => handleToolSelect(tool.id)}
                    className={`flex flex-col items-center justify-center gap-1.5 rounded-2xl py-3 transition-all ${
                      activeTool === tool.id
                        ? 'bg-indigo-600 text-white shadow-md'
                        : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {tool.icon}
                    <span className="text-[11px] font-medium">{tool.label}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Shape selection grid */}
            {activeTab === 'tools' && isSelectingShape && (
              <div className="px-4">
                <button 
                  onClick={() => setIsSelectingShape(false)}
                  className="mb-4 text-xs font-bold text-indigo-600 uppercase tracking-widest flex items-center gap-1"
                >
                  ← Back to tools
                </button>
                <div className="grid grid-cols-4 gap-2 overflow-y-auto" style={{ maxHeight: 'calc(55vh - 140px)' }}>
                  {SHAPES.map(shape => (
                    <button
                      key={shape.id}
                      onClick={() => handleShapeSelect(shape.id)}
                      className={`flex flex-col items-center justify-center gap-1.5 rounded-2xl py-3 transition-all ${
                        activeShapeType === shape.id && activeTool === 'shape'
                          ? 'bg-indigo-600 text-white shadow-md'
                          : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      <Shapes size={22} />
                      <span className="text-[11px] font-medium">{shape.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* AI grid */}
            {activeTab === 'ai' && (
              <div className="px-4 overflow-y-auto" style={{ maxHeight: 'calc(55vh - 100px)' }}>
                {!hasSelection && (
                  <div className="text-center py-6 text-sm text-gray-400">
                    Select objects on the canvas to use AI tools
                  </div>
                )}
                {hasSelection && (
                  <div className="grid grid-cols-3 gap-2">
                    {AI_BUTTONS.map(btn => {
                      const disabled = selectedIds.length < btn.minSelected;
                      const isLoading = loading === btn.id;
                      return (
                        <button
                          key={btn.id}
                          onClick={() => !disabled && handleAIAction(btn.id, btn.minSelected)}
                          disabled={disabled || loading !== null}
                          className={`flex flex-col items-center justify-center gap-1.5 rounded-2xl py-3 transition-all ${
                            disabled
                              ? 'bg-gray-50 text-gray-300 cursor-not-allowed'
                              : isLoading
                              ? 'bg-indigo-50 text-indigo-400'
                              : 'bg-gray-50 text-gray-600 hover:bg-indigo-50 hover:text-indigo-600'
                          }`}
                        >
                          {isLoading ? (
                            <span className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                          ) : btn.icon}
                          <span className="text-[11px] font-medium">{btn.label}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* FAB button */}
      <motion.button
        onClick={() => setOpen(v => !v)}
        animate={{ rotate: open ? 45 : 0 }}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        className="fixed z-[220] flex items-center justify-center w-14 h-14 rounded-full bg-indigo-600 text-white shadow-lg shadow-indigo-600/40 active:scale-95 transition-transform"
        style={{
          bottom: 'calc(1.5rem + env(safe-area-inset-bottom))',
          right: '1.5rem',
        }}
      >
        {open ? <X size={24} /> : <Plus size={24} />}
      </motion.button>
    </>
  );
}
