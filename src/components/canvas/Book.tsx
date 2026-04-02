'use client';

import { BookOpen } from 'lucide-react';
import { motion } from 'framer-motion';
import { useCanvasStore } from '@/store/canvasStore';
import { CanvasObject } from '@/types/canvas';

interface Props {
  object: CanvasObject;
}

export default function Book({ object }: Props) {
  const { setIsBookModalOpen, setFocusedObjectId } = useCanvasStore();

  const spineColor = object.style.spineColor || '#3730a3';
  const coverColor = object.style.backgroundColor || '#4f46e5';
  const coverImage = object.style.coverImage;

  return (
    <motion.div
      layoutId={`book-${object.id}`}
      className="w-full h-full flex items-center justify-center"
      onDoubleClick={(e) => {
        e.stopPropagation();
        setIsBookModalOpen(true);
        setFocusedObjectId(object.id);
      }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <div
        className="relative book-spine cursor-pointer select-none"
        style={{
          width: '100%',
          height: '100%',
          perspective: '1000px',
        }}
      >
        {/* Book body */}
        <div
          className="relative w-full h-full rounded-r-sm overflow-hidden flex flex-col"
          style={{
            background: coverImage
              ? `url(${coverImage}) center/cover`
              : coverColor,
            boxShadow: `0 20px 40px rgba(0,0,0,0.25), 0 4px 8px rgba(0,0,0,0.15)`,
            borderRadius: '2px 4px 4px 2px',
          }}
        >
          {/* Spine */}
          <div
            className="absolute left-0 top-0 bottom-0"
            style={{
              width: '8px',
              background: spineColor,
              boxShadow: 'inset -2px 0 4px rgba(0,0,0,0.2)',
              backgroundImage: `${spineColor}, repeating-linear-gradient(to bottom, transparent, transparent 8px, rgba(0,0,0,0.05) 8px, rgba(0,0,0,0.05) 9px)`,
            }}
          />

          {/* Cover gradient sheen overlay */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, transparent 60%)',
              borderRadius: 'inherit',
            }}
          />

          {/* Cover content */}
          <div className="flex-1 flex flex-col items-center justify-center px-6 ml-2">
            <BookOpen size={28} className="text-white/80 mb-2" />
            <p className="text-white text-center text-sm font-semibold leading-snug line-clamp-3 drop-shadow">
              {object.content || 'Untitled'}
            </p>
          </div>

          {/* Bottom accent */}
          <div
            className="h-8 w-full ml-2 flex items-center justify-end pr-3"
            style={{ background: 'rgba(0,0,0,0.15)' }}
          >
            <span className="text-white/60 text-xs">Double-click to open</span>
          </div>

          {/* Page edge effect */}
          <div
            className="absolute right-0 top-1 bottom-1 w-2"
            style={{
              background: 'repeating-linear-gradient(to bottom, #f5f5f5 0px, #e5e5e5 1px, #f5f5f5 2px)',
              borderRadius: '0 2px 2px 0',
            }}
          />
        </div>
      </div>
    </motion.div>
  );
}
