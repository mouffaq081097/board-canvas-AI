'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  X,
  Plus,
  CheckCircle2,
  Cloud,
  Book as BookIcon,
} from 'lucide-react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import { useCanvasStore } from '@/store/canvasStore';
import { CanvasObject, BookSection } from '@/types/canvas';
import { v4 as uuidv4 } from 'uuid';

interface Props {
  object: CanvasObject;
  onClose: () => void;
}

const SECTION_COLORS = ['#6366f1', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#06b6d4'];

function getNextSectionColor(sections: BookSection[]): string {
  return SECTION_COLORS[sections.length % SECTION_COLORS.length];
}

export default function BookModal({ object, onClose }: Props) {
  const {
    updateObject,
    addBookPage,
    updateBookPage,
    deleteBookPage,
    updateBookPageTitle,
    addBookSection,
    deleteBookSection,
    renameBookSection,
    setIsBookModalOpen,
    setFocusedObjectId,
  } = useCanvasStore();

  const [title, setTitle] = useState(object.content);
  const [isSaving, setIsSaving] = useState(false);
  const [activeSectionId, setActiveSectionId] = useState<string>('');
  const [activePageId, setActivePageId] = useState<string>('');
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [editingSectionTitle, setEditingSectionTitle] = useState('');
  const [editingPageId, setEditingPageId] = useState<string | null>(null);
  const [editingPageTitle, setEditingPageTitle] = useState('');
  const [pageTitle, setPageTitle] = useState('');
  const [initialized, setInitialized] = useState(false);

  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Get live sections from store
  const liveObject = useCanvasStore(
    (s) => s.objects.find((o) => o.id === object.id) ?? object
  );

  // --- Migration & Initialization ---
  useEffect(() => {
    setIsBookModalOpen(true);
    setFocusedObjectId(object.id);

    const meta = object.metadata;
    if (!meta?.sections || meta.sections.length === 0) {
      // Migrate from legacy pages[] or create default
      const legacyPages = (meta?.pages || []).map((p) => ({
        ...p,
        title: p.title || 'Untitled',
      }));

      const migratedSection: BookSection = {
        id: uuidv4(),
        title: 'Notes',
        color: '#6366f1',
        pages:
          legacyPages.length > 0
            ? legacyPages
            : [{ id: uuidv4(), title: 'Untitled Page', content: '' }],
      };

      updateObject(object.id, {
        metadata: {
          ...meta,
          sections: [migratedSection],
        },
      });
    }

    return () => {
      setIsBookModalOpen(false);
      setFocusedObjectId(null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Set initial active section/page after sections are available
  useEffect(() => {
    if (initialized) return;
    const sections = liveObject.metadata?.sections;
    if (sections && sections.length > 0) {
      const firstSection = sections[0];
      setActiveSectionId(firstSection.id);
      if (firstSection.pages.length > 0) {
        const firstPage = firstSection.pages[0];
        setActivePageId(firstPage.id);
        setPageTitle(firstPage.title);
      }
      setInitialized(true);
    }
  }, [liveObject.metadata?.sections, initialized]);

  // Derive active section and page from live state
  const sections = liveObject.metadata?.sections ?? [];
  const activeSection = sections.find((s) => s.id === activeSectionId) ?? sections[0];
  const activePage = activeSection?.pages.find((p) => p.id === activePageId) ?? activeSection?.pages[0];

  // --- Tiptap Editor ---
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Underline,
      TaskList,
      TaskItem.configure({ nested: true }),
    ],
    content: activePage?.content || '',
    onUpdate: ({ editor }) => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      setIsSaving(true);
      saveTimerRef.current = setTimeout(() => {
        if (activePage) {
          updateBookPage(object.id, activePage.id, editor.getHTML());
        }
        setTimeout(() => setIsSaving(false), 300);
      }, 500);
    },
  });

  // Sync editor content when active page changes
  const prevPageIdRef = useRef<string>('');
  useEffect(() => {
    if (!editor) return;
    if (!activePage) return;
    if (activePage.id === prevPageIdRef.current) return;
    prevPageIdRef.current = activePage.id;
    editor.commands.setContent(activePage.content || '');
    setPageTitle(activePage.title);
  }, [activePage, editor]);

  const handleClose = () => onClose();

  const handleTitleBlur = () => {
    updateObject(object.id, { content: title });
  };

  // --- Section actions ---
  const handleAddSection = () => {
    const newTitle = 'New Section';
    const color = getNextSectionColor(sections);
    addBookSection(object.id, newTitle, color);
    // Switch to the new section after store update (it will appear at end)
    // We'll detect it in next render via useEffect
  };

  // After adding a section, switch to it
  const prevSectionCountRef = useRef(sections.length);
  useEffect(() => {
    if (sections.length > prevSectionCountRef.current) {
      const newest = sections[sections.length - 1];
      setActiveSectionId(newest.id);
      if (newest.pages.length > 0) {
        setActivePageId(newest.pages[0].id);
        setPageTitle(newest.pages[0].title);
      }
    }
    prevSectionCountRef.current = sections.length;
  }, [sections]);

  const handleDeleteSection = (sectionId: string) => {
    if (sections.length <= 1) return;
    deleteBookSection(object.id, sectionId);
    if (activeSectionId === sectionId) {
      const remaining = sections.filter((s) => s.id !== sectionId);
      if (remaining.length > 0) {
        const next = remaining[0];
        setActiveSectionId(next.id);
        if (next.pages.length > 0) {
          setActivePageId(next.pages[0].id);
          setPageTitle(next.pages[0].title);
        }
      }
    }
  };

  const handleStartRenameSection = (sectionId: string, currentTitle: string) => {
    setEditingSectionId(sectionId);
    setEditingSectionTitle(currentTitle);
  };

  const handleCommitRenameSection = () => {
    if (editingSectionId && editingSectionTitle.trim()) {
      renameBookSection(object.id, editingSectionId, editingSectionTitle.trim());
    }
    setEditingSectionId(null);
  };

  const handleSwitchSection = (sectionId: string) => {
    if (sectionId === activeSectionId) return;
    setActiveSectionId(sectionId);
    const sec = sections.find((s) => s.id === sectionId);
    if (sec && sec.pages.length > 0) {
      setActivePageId(sec.pages[0].id);
      setPageTitle(sec.pages[0].title);
    }
  };

  // --- Page actions ---
  const handleAddPage = () => {
    if (!activeSection) return;
    addBookPage(object.id, activeSection.id);
  };

  // After adding a page to active section, switch to it
  const prevPageCountRef = useRef(activeSection?.pages.length ?? 0);
  useEffect(() => {
    const currentCount = activeSection?.pages.length ?? 0;
    if (currentCount > prevPageCountRef.current && activeSection) {
      const newest = activeSection.pages[activeSection.pages.length - 1];
      setActivePageId(newest.id);
      setPageTitle(newest.title);
    }
    prevPageCountRef.current = currentCount;
  }, [activeSection?.pages.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleDeletePage = (pageId: string) => {
    if (!activeSection || activeSection.pages.length <= 1) return;
    deleteBookPage(object.id, pageId);
    if (activePageId === pageId) {
      const remaining = activeSection.pages.filter((p) => p.id !== pageId);
      if (remaining.length > 0) {
        setActivePageId(remaining[0].id);
        setPageTitle(remaining[0].title);
      }
    }
  };

  const handleSwitchPage = (pageId: string) => {
    const page = activeSection?.pages.find((p) => p.id === pageId);
    if (!page) return;
    setActivePageId(pageId);
    setPageTitle(page.title);
  };

  const handlePageTitleCommit = useCallback(() => {
    if (!activePage || !activeSection) return;
    const trimmed = pageTitle.trim() || 'Untitled';
    updateBookPageTitle(object.id, activeSection.id, activePage.id, trimmed);
  }, [activePage, activeSection, pageTitle, object.id, updateBookPageTitle]);

  // --- Inline page title editing in page list ---
  const handleStartEditPageTitle = (pageId: string, currentTitle: string) => {
    setEditingPageId(pageId);
    setEditingPageTitle(currentTitle);
  };

  const handleCommitEditPageTitle = (pageId: string) => {
    if (editingPageTitle.trim() && activeSection) {
      updateBookPageTitle(object.id, activeSection.id, pageId, editingPageTitle.trim());
      if (pageId === activePageId) {
        setPageTitle(editingPageTitle.trim());
      }
    }
    setEditingPageId(null);
  };

  return (
    <div
      className="fixed inset-0 z-[500] flex items-center justify-center p-2 md:p-4"
      onPointerDown={(e) => e.stopPropagation()}
    >
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/80 backdrop-blur-md"
        onClick={handleClose}
      />

      {/* Modal Container */}
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="relative z-10 w-full max-w-[98vw] h-[96vh] flex flex-col bg-white rounded-[2rem] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.5)] overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-white/95 backdrop-blur-xl z-20 flex-shrink-0">
          <div className="flex items-center gap-4 flex-1">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shadow-md transform rotate-3 hover:rotate-0 transition-transform flex-shrink-0"
              style={{ background: object.style.backgroundColor || '#4f46e5' }}
            >
              <BookIcon className="text-white w-5 h-5" />
            </div>
            <div className="flex flex-col flex-1 max-w-2xl">
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={handleTitleBlur}
                className="text-gray-900 font-black text-xl bg-transparent border-none outline-none placeholder-gray-300 w-full truncate"
                placeholder="Untitled Book"
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
          <button
            onClick={handleClose}
            className="group w-10 h-10 rounded-xl bg-gray-50 text-gray-400 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all active:scale-90 flex-shrink-0"
            title="Close (Esc)"
          >
            <X size={20} className="group-hover:rotate-90 transition-transform duration-300" />
          </button>
        </div>

        {/* Section Tabs */}
        <div className="flex items-center border-b border-gray-100 bg-gray-50/80 px-4 flex-shrink-0 overflow-x-auto no-scrollbar">
          {sections.map((section) => {
            const isActive = section.id === activeSectionId;
            return (
              <div
                key={section.id}
                className={`group flex items-center gap-1.5 px-4 py-2.5 cursor-pointer select-none relative flex-shrink-0 border-b-2 transition-all ${
                  isActive
                    ? 'bg-white border-indigo-500 text-gray-900'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-white/50'
                }`}
                onClick={() => handleSwitchSection(section.id)}
                onDoubleClick={() => handleStartRenameSection(section.id, section.title)}
              >
                <span
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: section.color }}
                />
                {editingSectionId === section.id ? (
                  <input
                    autoFocus
                    value={editingSectionTitle}
                    onChange={(e) => setEditingSectionTitle(e.target.value)}
                    onBlur={handleCommitRenameSection}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleCommitRenameSection();
                      if (e.key === 'Escape') setEditingSectionId(null);
                    }}
                    className="text-sm font-medium bg-transparent border-none outline-none w-24 min-w-0"
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  <span className="text-sm font-medium whitespace-nowrap">{section.title}</span>
                )}
                {sections.length > 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteSection(section.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 ml-1 w-4 h-4 rounded-full hover:bg-red-100 hover:text-red-500 flex items-center justify-center text-gray-400 transition-all text-xs leading-none"
                    title="Delete section"
                  >
                    ×
                  </button>
                )}
              </div>
            );
          })}
          <button
            onClick={handleAddSection}
            className="flex items-center gap-1 px-3 py-2.5 text-gray-400 hover:text-indigo-600 text-sm transition-colors flex-shrink-0"
            title="Add section"
          >
            <Plus size={14} />
            <span>Add Section</span>
          </button>
        </div>

        {/* Body: Editor + Page List */}
        <div className="flex flex-1 overflow-hidden">
          {/* Main Editor Area */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Formatting Toolbar */}
            <div className="flex items-center gap-1 px-6 py-2 border-b border-gray-100 bg-white flex-shrink-0 flex-wrap">
              {editor && (
                <>
                  <ToolbarButton
                    label="B"
                    title="Bold"
                    isActive={editor.isActive('bold')}
                    onClick={() => editor.chain().focus().toggleBold().run()}
                    className="font-bold"
                  />
                  <ToolbarButton
                    label="I"
                    title="Italic"
                    isActive={editor.isActive('italic')}
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                    className="italic"
                  />
                  <ToolbarButton
                    label="U"
                    title="Underline"
                    isActive={editor.isActive('underline')}
                    onClick={() => editor.chain().focus().toggleUnderline().run()}
                    className="underline"
                  />
                  <div className="w-px h-5 bg-gray-200 mx-1" />
                  <ToolbarButton
                    label="H1"
                    title="Heading 1"
                    isActive={editor.isActive('heading', { level: 1 })}
                    onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                    className="font-bold text-xs"
                  />
                  <ToolbarButton
                    label="H2"
                    title="Heading 2"
                    isActive={editor.isActive('heading', { level: 2 })}
                    onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                    className="font-semibold text-xs"
                  />
                  <div className="w-px h-5 bg-gray-200 mx-1" />
                  <ToolbarButton
                    label="• List"
                    title="Bullet List"
                    isActive={editor.isActive('bulletList')}
                    onClick={() => editor.chain().focus().toggleBulletList().run()}
                    className="text-xs"
                  />
                  <ToolbarButton
                    label="1. List"
                    title="Ordered List"
                    isActive={editor.isActive('orderedList')}
                    onClick={() => editor.chain().focus().toggleOrderedList().run()}
                    className="text-xs"
                  />
                  <ToolbarButton
                    label="☑ Task"
                    title="Task List"
                    isActive={editor.isActive('taskList')}
                    onClick={() => editor.chain().focus().toggleTaskList().run()}
                    className="text-xs"
                  />
                </>
              )}
            </div>

            {/* Page Title + Editor */}
            <div className="flex-1 overflow-y-auto px-10 py-6">
              <input
                value={pageTitle}
                onChange={(e) => setPageTitle(e.target.value)}
                onBlur={handlePageTitleCommit}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handlePageTitleCommit();
                    editor?.commands.focus();
                  }
                }}
                placeholder="Page title"
                className="w-full text-3xl font-bold text-gray-900 bg-transparent border-none outline-none placeholder-gray-200 mb-3"
              />
              <div className="w-16 h-0.5 bg-indigo-200 mb-4 rounded-full" />
              {editor && (
                <EditorContent
                  editor={editor}
                  className="prose-editor min-h-[300px]"
                />
              )}
            </div>
          </div>

          {/* Page List Panel */}
          <div className="w-[200px] flex-shrink-0 border-l border-gray-100 flex flex-col bg-gray-50/50 overflow-hidden">
            <div className="flex-1 overflow-y-auto py-2">
              {activeSection?.pages.map((page) => {
                const isActive = page.id === activePageId;
                return (
                  <div
                    key={page.id}
                    className={`group flex items-center gap-1 px-3 py-2 cursor-pointer relative transition-all ${
                      isActive
                        ? 'bg-indigo-50 text-indigo-700 border-l-2 border-indigo-500'
                        : 'text-gray-600 hover:bg-gray-100 border-l-2 border-transparent'
                    }`}
                    onClick={() => handleSwitchPage(page.id)}
                  >
                    {editingPageId === page.id ? (
                      <input
                        autoFocus
                        value={editingPageTitle}
                        onChange={(e) => setEditingPageTitle(e.target.value)}
                        onBlur={() => handleCommitEditPageTitle(page.id)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleCommitEditPageTitle(page.id);
                          if (e.key === 'Escape') setEditingPageId(null);
                        }}
                        className="flex-1 text-sm bg-transparent border-none outline-none min-w-0"
                        onClick={(e) => e.stopPropagation()}
                      />
                    ) : (
                      <span
                        className="flex-1 text-sm truncate"
                        onDoubleClick={(e) => {
                          e.stopPropagation();
                          handleStartEditPageTitle(page.id, page.title);
                        }}
                      >
                        {page.title || 'Untitled'}
                      </span>
                    )}
                    {activeSection.pages.length > 1 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeletePage(page.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 w-4 h-4 flex items-center justify-center text-gray-400 hover:text-red-500 rounded transition-all text-xs leading-none flex-shrink-0"
                        title="Delete page"
                      >
                        ×
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="p-2 border-t border-gray-100 flex-shrink-0">
              <button
                onClick={handleAddPage}
                className="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-sm text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
              >
                <Plus size={14} />
                <span>Add Page</span>
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// Toolbar button helper
function ToolbarButton({
  label,
  title,
  isActive,
  onClick,
  className = '',
}: {
  label: string;
  title: string;
  isActive: boolean;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      title={title}
      onClick={onClick}
      className={`px-2 py-1 rounded text-sm transition-all ${
        isActive
          ? 'bg-indigo-100 text-indigo-700'
          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
      } ${className}`}
    >
      {label}
    </button>
  );
}
