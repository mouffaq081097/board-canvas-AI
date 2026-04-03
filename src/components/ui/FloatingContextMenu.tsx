'use client';

import { motion } from 'framer-motion';
import {
  Trash2,
  Type,
  Link as LinkIcon,
  Wand2,
  Group,
  BookMarked,
  Pencil,
  ScanText,
  ArrowRight,
  Lock,
  LockOpen,
  GitFork,
} from 'lucide-react';
import { useCanvasStore } from '@/store/canvasStore';
import { CanvasObject } from '@/types/canvas';
import { useAI } from '@/hooks/useAI';
import { getClosestAnchors } from '@/lib/canvasUtils';

const PASTEL_COLORS = [
  { bg: '#fef9c3', label: 'Yellow' },
  { bg: '#fce7f3', label: 'Pink' },
  { bg: '#dbeafe', label: 'Blue' },
  { bg: '#dcfce7', label: 'Green' },
  { bg: '#f3e8ff', label: 'Purple' },
  { bg: '#ffedd5', label: 'Orange' },
  { bg: '#ccfbf1', label: 'Teal' },
  { bg: '#fee2e2', label: 'Red' },
];

const BOOK_COLORS = [
  '#4f46e5', '#be185d', '#065f46', '#92400e', '#1d4ed8', '#7c3aed',
];

const FONTS = [
  { value: 'caveat', label: 'Handwriting' },
  { value: 'serif', label: 'Serif' },
  { value: 'sans-serif', label: 'Sans' },
];

interface Props {
  selectedObjects: CanvasObject[];
}

export default function FloatingContextMenu({ selectedObjects }: Props) {
  const { updateObject, deleteObjects, selectedIds, addConnection, toggleObjectLock } = useCanvasStore();
  const { runAI, loading } = useAI();

  if (selectedObjects.length === 0) return null;

  const primaryObject = selectedObjects[0];

  const isRoadmapEligible =
    selectedObjects.length === 1 &&
    primaryObject.type === 'note' &&
    (primaryObject.metadata?.todoItems?.length ?? 0) > 0;

  const copyLink = () => {
    const url = new URL(window.location.href);
    url.searchParams.set('x', Math.round(primaryObject.x + primaryObject.width / 2).toString());
    url.searchParams.set('y', Math.round(primaryObject.y + primaryObject.height / 2).toString());
    url.searchParams.set('z', '1');
    
    navigator.clipboard.writeText(url.toString());
  };

  const handleConnect = () => {
    if (selectedObjects.length !== 2) return;
    const [objA, objB] = selectedObjects;
    const { fromAnchor, toAnchor } = getClosestAnchors(objA, objB);
    
    addConnection({
      fromId: objA.id,
      toId: objB.id,
      fromAnchor,
      toAnchor,
      color: '#6366f1',
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 6, scale: 0.92 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 6, scale: 0.92 }}
      transition={{ type: 'spring', stiffness: 400, damping: 28 }}
      className="absolute z-[200] bg-white rounded-xl shadow-xl border border-gray-100 px-3 py-2.5 flex items-center gap-2 whitespace-nowrap pointer-events-auto"
      onPointerDown={(e) => e.stopPropagation()}
    >
      {/* Arrow indicator */}
      <div
        className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-white border-r border-b border-gray-100 rotate-45"
        style={{ zIndex: -1 }}
      />

      {/* Group Actions: Connect */}
      {selectedObjects.length === 2 && (
        <>
          <button
            onClick={handleConnect}
            className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 transition"
          >
            <ArrowRight size={14} />
            <span>Connect Items</span>
          </button>
          <div className="w-px h-5 bg-gray-200 mx-1" />
        </>
      )}

      {/* Color swatches for sticky/note (if only one selected or all are notes) */}
      {selectedObjects.length === 1 && (primaryObject.type === 'sticky' || primaryObject.type === 'note') && (
        <div className="flex items-center gap-1.5">
          {PASTEL_COLORS.map((c) => (
            <button
              key={c.bg}
              title={c.label}
              onClick={() => updateObject(primaryObject.id, { style: { ...primaryObject.style, backgroundColor: c.bg } })}
              className={`w-5 h-5 rounded-full border-2 transition-transform hover:scale-110 ${
                primaryObject.style.backgroundColor === c.bg ? 'border-gray-500 scale-110' : 'border-transparent'
              }`}
              style={{ backgroundColor: c.bg }}
            />
          ))}
          <div className="w-px h-5 bg-gray-200 mx-0.5" />
        </div>
      )}

      {/* Book spine colors */}
      {selectedObjects.length === 1 && primaryObject.type === 'book' && (
        <div className="flex items-center gap-1.5">
          {BOOK_COLORS.map((c) => (
            <button
              key={c}
              onClick={() => updateObject(primaryObject.id, { style: { ...primaryObject.style, backgroundColor: c } })}
              className={`w-5 h-5 rounded-full border-2 transition-transform hover:scale-110 ${
                primaryObject.style.backgroundColor === c ? 'border-gray-500 scale-110' : 'border-transparent'
              }`}
              style={{ backgroundColor: c }}
            />
          ))}
          <div className="w-px h-5 bg-gray-200 mx-0.5" />
        </div>
      )}

      {/* Font toggle for notes */}
      {selectedObjects.length === 1 && (primaryObject.type === 'sticky' || primaryObject.type === 'note') && (
        <>
          <div className="flex items-center gap-1">
            {FONTS.map((f) => (
              <button
                key={f.value}
                title={f.label}
                onClick={() => updateObject(primaryObject.id, { style: { ...primaryObject.style, fontFamily: f.value } })}
                className={`px-2 py-0.5 text-xs rounded-md transition ${
                  primaryObject.style.fontFamily === f.value
                    ? 'bg-indigo-100 text-indigo-700 font-medium'
                    : 'text-gray-500 hover:bg-gray-100'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
          <div className="w-px h-5 bg-gray-200 mx-0.5" />
        </>
      )}

      {/* Opacity slider */}
      {selectedObjects.length === 1 && (
        <div className="flex items-center gap-1.5">
          <Type size={12} className="text-gray-400" />
          <input
            type="range"
            min={0.2}
            max={1}
            step={0.05}
            value={primaryObject.style.opacity ?? 1}
            onChange={(e) =>
              updateObject(primaryObject.id, { style: { ...primaryObject.style, opacity: parseFloat(e.target.value) } })
            }
            className="w-16 accent-indigo-500"
            title="Opacity"
          />
          <div className="w-px h-5 bg-gray-200 mx-0.5" />
        </div>
      )}

      {/* Copy Link */}
      {selectedObjects.length === 1 && (
        <button
          onClick={copyLink}
          className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-indigo-500 hover:bg-indigo-50 transition"
          title="Copy Link to Here"
        >
          <LinkIcon size={14} />
        </button>
      )}

      {/* Lock / Unlock (single object only) */}
      {selectedObjects.length === 1 && (
        <button
          onClick={() => toggleObjectLock(primaryObject.id)}
          className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-amber-500 hover:bg-amber-50 transition"
          title={primaryObject.locked ? 'Unlock Object' : 'Lock Object'}
        >
          {primaryObject.locked ? <LockOpen size={14} /> : <Lock size={14} />}
        </button>
      )}

      {/* Delete */}
      <button
        onClick={() => deleteObjects(selectedIds)}
        className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition"
        title="Delete"
      >
        <Trash2 size={14} />
      </button>

      <div className="w-px h-5 bg-gray-200 mx-0.5" />

      {/* AI Actions */}
      <div className="flex items-center gap-0.5 bg-indigo-50/50 rounded-lg p-0.5">
        {isRoadmapEligible && (
          <button
            onClick={() => runAI('roadmap')}
            disabled={loading !== null}
            className={`w-7 h-7 rounded-lg flex items-center justify-center transition ${
              loading === 'roadmap'
                ? 'text-indigo-600'
                : 'text-indigo-500 hover:bg-white hover:shadow-sm'
            }`}
            title="Generate Roadmap"
          >
            {loading === 'roadmap' ? (
              <div className="w-3.5 h-3.5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            ) : (
              <GitFork size={14} />
            )}
          </button>
        )}

        <button
          onClick={() => runAI('brainstorm')}
          disabled={loading !== null}
          className={`w-7 h-7 rounded-lg flex items-center justify-center transition ${
            loading === 'brainstorm' ? 'text-indigo-600' : 'text-indigo-500 hover:bg-white hover:shadow-sm'
          }`}
          title="Brainstorm"
        >
          {loading === 'brainstorm' ? (
            <div className="w-3.5 h-3.5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          ) : (
            <Wand2 size={14} />
          )}
        </button>

        {selectedIds.length >= 2 && (
          <button
            onClick={() => runAI('group')}
            disabled={loading !== null}
            className={`w-7 h-7 rounded-lg flex items-center justify-center transition ${
              loading === 'group' ? 'text-indigo-600' : 'text-indigo-500 hover:bg-white hover:shadow-sm'
            }`}
            title="Smart Clustering"
          >
            {loading === 'group' ? (
              <div className="w-3.5 h-3.5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            ) : (
              <Group size={14} />
            )}
          </button>
        )}

        <button
          onClick={() => runAI('summarize')}
          disabled={loading !== null}
          className={`w-7 h-7 rounded-lg flex items-center justify-center transition ${
            loading === 'summarize' ? 'text-indigo-600' : 'text-indigo-500 hover:bg-white hover:shadow-sm'
          }`}
          title="Summarize-to-Book"
        >
          {loading === 'summarize' ? (
            <div className="w-3.5 h-3.5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          ) : (
            <BookMarked size={14} />
          )}
        </button>

        {selectedObjects.length === 1 && primaryObject.type === 'drawing' && (
          <button
            onClick={() => runAI('sketch')}
            disabled={loading !== null}
            className={`w-7 h-7 rounded-lg flex items-center justify-center transition ${
              loading === 'sketch' ? 'text-indigo-600' : 'text-indigo-500 hover:bg-white hover:shadow-sm'
            }`}
            title="Sketch-to-Vector"
          >
            {loading === 'sketch' ? (
              <div className="w-3.5 h-3.5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            ) : (
              <Pencil size={14} />
            )}
          </button>
        )}
        
        {selectedObjects.length === 1 && primaryObject.type === 'drawing' && (
          <button
            onClick={() => runAI('ocr')}
            disabled={loading !== null}
            className={`w-7 h-7 rounded-lg flex items-center justify-center transition ${
              loading === 'ocr' ? 'text-indigo-600' : 'text-indigo-500 hover:bg-white hover:shadow-sm'
            }`}
            title="Read Handwriting (OCR)"
          >
            {loading === 'ocr' ? (
              <div className="w-3.5 h-3.5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            ) : (
              <ScanText size={14} />
            )}
          </button>
        )}
      </div>
    </motion.div>
  );
}
