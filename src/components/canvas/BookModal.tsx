'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Plus, 
  ChevronLeft, 
  ChevronRight, 
  Trash2, 
  CheckCircle2, 
  Cloud,
  Book as BookIcon
} from 'lucide-react';
import { useCanvasStore } from '@/store/canvasStore';
import { CanvasObject, BookPage } from '@/types/canvas';
import { v4 as uuidv4 } from 'uuid';

interface Props {
  object: CanvasObject;
  onClose: () => void;
}

export default function BookModal({ object, onClose }: Props) {
  const { updateObject, addBookPage, updateBookPage, deleteBookPage, setIsBookModalOpen, setFocusedObjectId } = useCanvasStore();
  const pages: BookPage[] = object.metadata?.pages || [{ id: uuidv4(), title: 'Page 1', content: '' }];
  const [currentPage, setCurrentPage] = useState(0);
  const [direction, setDirection] = useState(0);
  const [title, setTitle] = useState(object.content);
  const [isSaving, setIsSaving] = useState(false);

  // Set store state on mount and cleanup on unmount
  useEffect(() => {
    setIsBookModalOpen(true);
    setFocusedObjectId(object.id);
    return () => {
      setIsBookModalOpen(false);
      setFocusedObjectId(null);
    };
  }, [object.id, setIsBookModalOpen, setFocusedObjectId]);

  const handleClose = () => {
    onClose();
  };

  const handleAddPage = () => {
    addBookPage(object.id);
    setDirection(1);
    setCurrentPage(pages.length);
  };

  const handleDeletePage = () => {
    if (pages.length <= 1) return;
    const pageIdToDelete = pages[currentPage].id;
    const newIndex = Math.max(0, currentPage - 1);
    setDirection(-1);
    setCurrentPage(newIndex);
    deleteBookPage(object.id, pageIdToDelete);
  };

  const goNext = () => {
    if (currentPage < pages.length - 1) {
      setDirection(1);
      setCurrentPage((p) => p + 1);
    }
  };

  const goPrev = () => {
    if (currentPage > 0) {
      setDirection(-1);
      setCurrentPage((p) => p - 1);
    }
  };

  const handleContentChange = (content: string) => {
    setIsSaving(true);
    updateBookPage(object.id, pages[currentPage].id, content);
    setTimeout(() => setIsSaving(false), 500);
  };

  const handleTitleBlur = () => {
    updateObject(object.id, { content: title });
  };

  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 100 : -100,
      opacity: 0,
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 100 : -100,
      opacity: 0,
    }),
  };

  return (
    <div
      className="fixed inset-0 z-[500] flex items-center justify-center p-2 md:p-4"
      onPointerDown={(e) => e.stopPropagation()}
    >
      {/* Heavy Backdrop with Blur */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/80 backdrop-blur-md"
        onClick={handleClose}
      />

      {/* Large Modal Container */}
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="relative z-10 w-full max-w-[98vw] h-[96vh] flex flex-col bg-white rounded-[2rem] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.5)] overflow-hidden"
      >
        {/* Pro Header */}
        <div className="flex items-center justify-between px-8 py-5 border-b border-gray-100 bg-white/95 backdrop-blur-xl z-20">
          <div className="flex items-center gap-6 flex-1">
            <div 
              className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg transform rotate-3 hover:rotate-0 transition-transform"
              style={{ background: object.style.backgroundColor || '#4f46e5' }}
            >
              <BookIcon className="text-white w-7 h-7" />
            </div>
            <div className="flex flex-col flex-1 max-w-2xl">
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={handleTitleBlur}
                className="text-gray-900 font-black text-2xl bg-transparent border-none outline-none placeholder-gray-200 w-full truncate"
                placeholder="Untitled Masterpiece"
              />
              <div className="flex items-center gap-2 mt-0.5">
                {isSaving ? (
                  <span className="flex items-center gap-1.5 text-[10px] font-bold text-amber-500 uppercase tracking-[0.2em]">
                    <Cloud className="w-3 h-3 animate-bounce" />
                    Saving...
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-500 uppercase tracking-[0.2em]">
                    <CheckCircle2 className="w-3 h-3" />
                    Changes Synced
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <button
              onClick={handleAddPage}
              className="group flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl shadow-[0_8px_16px_rgba(79,70,229,0.3)] transition-all active:scale-95 font-bold"
            >
              <Plus size={20} className="group-hover:rotate-90 transition-transform duration-300" />
              <span>Add New Page</span>
            </button>
            <div className="w-px h-10 bg-gray-100" />
            <button
              onClick={handleClose}
              className="group w-14 h-14 rounded-2xl bg-gray-50 text-gray-400 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all active:scale-90"
              title="Close (Esc)"
            >
              <X size={28} className="group-hover:rotate-90 transition-transform duration-300" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 relative bg-[#fdfdfd] flex overflow-hidden">
          {/* Navigation Overlay */}
          <div className="absolute inset-y-0 left-0 w-32 z-30 pointer-events-none bg-gradient-to-r from-white via-transparent to-transparent opacity-0 hover:opacity-100 transition-opacity flex items-center pl-8">
            {currentPage > 0 && (
              <button
                onClick={goPrev}
                className="p-4 bg-white shadow-2xl rounded-full text-indigo-600 pointer-events-auto hover:scale-110 active:scale-90 transition-transform border border-gray-100"
              >
                <ChevronLeft size={32} />
              </button>
            )}
          </div>
          <div className="absolute inset-y-0 right-0 w-32 z-30 pointer-events-none bg-gradient-to-l from-white via-transparent to-transparent opacity-0 hover:opacity-100 transition-opacity flex items-center justify-end pr-8">
            {currentPage < pages.length - 1 && (
              <button
                onClick={goNext}
                className="p-4 bg-white shadow-2xl rounded-full text-indigo-600 pointer-events-auto hover:scale-110 active:scale-90 transition-transform border border-gray-100"
              >
                <ChevronRight size={32} />
              </button>
            )}
          </div>

          {/* Focused Canvas-style Page */}
          <div className="flex-1 flex items-center justify-center p-6 md:p-12 overflow-y-auto">
            <AnimatePresence mode="wait" initial={false} custom={direction}>
              <motion.div
                key={currentPage}
                custom={direction}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="w-full h-full max-w-6xl bg-white rounded-[2.5rem] shadow-[0_10px_50px_rgba(0,0,0,0.04)] border border-gray-100 flex flex-col p-12 md:p-24 relative overflow-hidden"
              >
                {/* Paper texture overlay */}
                <div className="absolute inset-0 opacity-[0.02] pointer-events-none mix-blend-multiply bg-[url('https://www.transparenttextures.com/patterns/natural-paper.png')]" />

                <div className="relative z-10 flex flex-col h-full">
                  <div className="flex items-center justify-between mb-12">
                    <div className="flex items-center gap-3">
                      <div className="h-2 w-12 bg-indigo-600 rounded-full" />
                      <span className="text-xs font-black text-indigo-600 uppercase tracking-widest">
                        SECTION {currentPage + 1}
                      </span>
                    </div>
                    <button
                      onClick={handleDeletePage}
                      disabled={pages.length <= 1}
                      className="p-3 text-gray-200 hover:text-red-500 disabled:opacity-0 transition-all rounded-2xl hover:bg-red-50"
                      title="Remove page"
                    >
                      <Trash2 size={24} />
                    </button>
                  </div>
                  
                  <textarea
                    value={pages[currentPage]?.content || ''}
                    onChange={(e) => handleContentChange(e.target.value)}
                    placeholder="Enter your thoughts here..."
                    className="flex-1 w-full bg-transparent resize-none border-none outline-none text-gray-900 text-3xl md:text-5xl leading-tight font-serif placeholder:text-gray-100 selection:bg-indigo-100"
                    autoFocus
                  />
                </div>

                {/* Aesthetic Page Counter */}
                <div className="absolute bottom-16 left-16 flex items-baseline gap-2 select-none pointer-events-none opacity-20">
                  <span className="text-gray-900 text-8xl font-serif italic">0{currentPage + 1}</span>
                  <div className="h-px w-24 bg-gray-900 mb-6" />
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Dynamic Pagination Bar */}
        <div className="h-24 bg-white border-t border-gray-50 flex items-center justify-center px-12 z-20">
          <div className="flex items-center gap-4 bg-gray-100/50 p-2.5 rounded-[2rem] max-w-full overflow-x-auto no-scrollbar">
            {pages.map((_, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setDirection(idx > currentPage ? 1 : -1);
                  setCurrentPage(idx);
                }}
                className={`transition-all duration-500 rounded-[1.25rem] min-w-[3rem] h-10 flex items-center justify-center text-sm font-bold ${
                  idx === currentPage 
                  ? 'px-8 bg-gray-900 text-white shadow-lg' 
                  : 'bg-white text-gray-400 hover:text-indigo-600 shadow-sm'
                }`}
              >
                {idx + 1}
              </button>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
