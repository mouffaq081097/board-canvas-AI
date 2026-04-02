'use client';

import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ShapePickerProps {
  activeShapeType: string;
  onSelect: (shape: string) => void;
  onClose: () => void;
}

const SHAPES: { type: string; label: string; path?: string; isCircle?: boolean; isRect?: boolean; isArrow?: boolean }[] = [
  { type: 'circle', label: 'Circle', isCircle: true },
  { type: 'rectangle', label: 'Rectangle', isRect: true },
  { type: 'arrow', label: 'Arrow', isArrow: true },
  { type: 'triangle', label: 'Triangle', path: 'M 50 5 L 95 90 L 5 90 Z' },
  { type: 'diamond', label: 'Diamond', path: 'M 50 5 L 95 50 L 50 95 L 5 50 Z' },
  { type: 'star', label: 'Star', path: 'M 50 5 L 61 35 L 95 35 L 68 57 L 79 91 L 50 70 L 21 91 L 32 57 L 5 35 L 39 35 Z' },
  { type: 'hexagon', label: 'Hexagon', path: 'M 25 5 L 75 5 L 95 45 L 75 90 L 25 90 L 5 45 Z' },
  { type: 'pentagon', label: 'Pentagon', path: 'M 50 5 L 95 36 L 79 91 L 21 91 L 5 36 Z' },
];

function ShapeIcon({ shape, active }: { shape: typeof SHAPES[number]; active: boolean }) {
  const strokeColor = active ? 'white' : '#6366f1';
  const fillColor = active ? 'rgba(255,255,255,0.3)' : 'none';

  if (shape.isCircle) {
    return (
      <svg viewBox="0 0 100 100" width="24" height="24">
        <ellipse cx="50" cy="50" rx="42" ry="42" fill={fillColor} stroke={strokeColor} strokeWidth="8" />
      </svg>
    );
  }

  if (shape.isRect) {
    return (
      <svg viewBox="0 0 100 100" width="24" height="24">
        <rect x="8" y="8" width="84" height="84" rx="6" fill={fillColor} stroke={strokeColor} strokeWidth="8" />
      </svg>
    );
  }

  if (shape.isArrow) {
    return (
      <svg viewBox="0 0 100 100" width="24" height="24">
        <defs>
          <marker id={`picker-arrow-${active ? 'active' : 'inactive'}`} markerWidth="10" markerHeight="10" refX="10" refY="5" orient="auto">
            <polygon points="0 0, 10 5, 0 10" fill={strokeColor} />
          </marker>
        </defs>
        <line
          x1="5" y1="50" x2="80" y2="50"
          stroke={strokeColor}
          strokeWidth="8"
          markerEnd={`url(#picker-arrow-${active ? 'active' : 'inactive'})`}
        />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 100 100" width="24" height="24">
      <path d={shape.path} fill={fillColor} stroke={strokeColor} strokeWidth="8" strokeLinejoin="round" />
    </svg>
  );
}

export default function ShapePicker({ activeShapeType, onSelect, onClose }: ShapePickerProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handlePointerDown(e: PointerEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [onClose]);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, scale: 0.9, x: -10 }}
      animate={{ opacity: 1, scale: 1, x: 0 }}
      exit={{ opacity: 0, scale: 0.9, x: -10 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className="z-50 bg-white rounded-2xl shadow-xl border border-gray-100 p-3"
      style={{ transformOrigin: 'left center' }}
    >
      <div className="grid grid-cols-4 gap-2">
          {SHAPES.map((shape) => {
            const isActive = shape.type === activeShapeType;
            return (
              <button
                key={shape.type}
                onPointerDown={(e) => {
                  e.stopPropagation();
                  onSelect(shape.type);
                  onClose();
                }}
                className={[
                  'flex flex-col items-center justify-center gap-1 rounded-xl',
                  'w-12 h-14 transition-colors',
                  isActive
                    ? 'bg-indigo-600'
                    : 'bg-gray-100 hover:bg-gray-200',
                ].join(' ')}
                title={shape.label}
              >
                <ShapeIcon shape={shape} active={isActive} />
                <span
                  className={[
                    'text-[9px] font-medium leading-none',
                    isActive ? 'text-white' : 'text-gray-600',
                  ].join(' ')}
                >
                  {shape.label}
                </span>
              </button>
            );
          })}
        </div>
      </motion.div>
  );
}
