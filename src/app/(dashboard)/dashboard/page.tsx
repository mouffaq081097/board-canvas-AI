'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Layers, Trash2, Clock, LogOut, Search } from 'lucide-react';
import { createClient } from '@/lib/supabase';
import { Board } from '@/types/canvas';

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

const BOARD_COLORS = [
  'from-indigo-400 to-purple-500',
  'from-pink-400 to-rose-500',
  'from-amber-400 to-orange-500',
  'from-emerald-400 to-teal-500',
  'from-sky-400 to-blue-500',
  'from-violet-400 to-fuchsia-500',
];

function getBoardColor(id: string) {
  const idx = parseInt(id.replace(/-/g, '').slice(0, 8), 16) % BOARD_COLORS.length;
  return BOARD_COLORS[idx] || BOARD_COLORS[0];
}

export default function DashboardPage() {
  const [boards, setBoards] = useState<Board[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');
  const [creating, setCreating] = useState(false);
  const [newBoardTitle, setNewBoardTitle] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [search, setSearch] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    fetchBoards();
  }, []);

  const fetchBoards = async () => {
    try {
      const res = await fetch('/api/boards');
      if (res.ok) {
        setBoards(await res.json());
        setFetchError('');
      } else {
        const body = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
        setFetchError(body.error || `Server error (${res.status})`);
      }
    } catch {
      setFetchError('Network error — is the server running?');
    } finally {
      setLoading(false);
    }
  };

  const createBoard = async () => {
    if (!newBoardTitle.trim()) return;
    setCreating(true);
    const res = await fetch('/api/boards', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: newBoardTitle.trim() }),
    });
    if (res.ok) {
      const board = await res.json();
      router.push(`/canvas/${board.id}`);
    }
    setCreating(false);
  };

  const deleteBoard = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeletingId(id);
    await fetch(`/api/boards/${id}`, { method: 'DELETE' });
    setBoards((prev) => prev.filter((b) => b.id !== id));
    setDeletingId(null);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  const filtered = boards.filter((b) =>
    b.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center">
              <Layers size={20} />
            </div>
            <span className="font-bold text-gray-900 text-lg">Freeform Pro</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search boards…"
                className="pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 w-52"
              />
            </div>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition px-3 py-2 rounded-xl hover:bg-gray-100"
            >
              <LogOut size={15} />
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Boards</h1>
            <p className="text-sm text-gray-500 mt-0.5">{boards.length} board{boards.length !== 1 ? 's' : ''}</p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition shadow-sm"
          >
            <Plus size={16} />
            New Board
          </button>
        </div>

        {/* Error banner */}
        {fetchError && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 text-sm">
            <p className="font-semibold text-red-700 mb-1">Failed to load boards</p>
            <p className="text-red-600 font-mono text-xs">{fetchError}</p>
            {fetchError.includes('relation') && (
              <p className="text-red-500 mt-2 text-xs">
                💡 The <code>boards</code> table is missing. Run <code>supabase-setup.sql</code> in your Supabase SQL Editor.
              </p>
            )}
          </div>
        )}

        {/* Create modal */}
        <AnimatePresence>
          {showCreate && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => setShowCreate(false)}
            >
              <motion.div
                initial={{ scale: 0.92, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.92, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm"
              >
                <h3 className="font-semibold text-gray-900 mb-4">Create new board</h3>
                <input
                  autoFocus
                  value={newBoardTitle}
                  onChange={(e) => setNewBoardTitle(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && createBoard()}
                  placeholder="Board title…"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50"
                />
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => setShowCreate(false)}
                    className="flex-1 py-2.5 rounded-xl text-sm text-gray-600 border border-gray-200 hover:bg-gray-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={createBoard}
                    disabled={!newBoardTitle.trim() || creating}
                    className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700 transition disabled:opacity-50"
                  >
                    {creating ? 'Creating…' : 'Create'}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Board grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="rounded-2xl bg-gray-200 animate-pulse h-44" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 rounded-2xl bg-indigo-100 flex items-center justify-center mx-auto mb-4">
              <Layers size={28} className="text-indigo-400" />
            </div>
            <p className="text-gray-500">
              {search ? 'No boards match your search.' : 'No boards yet. Create your first one!'}
            </p>
          </div>
        ) : (
          <motion.div
            layout
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
          >
            <AnimatePresence>
              {filtered.map((board) => (
                <motion.div
                  key={board.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  onClick={() => router.push(`/canvas/${board.id}`)}
                  className="group relative rounded-2xl overflow-hidden border border-gray-200 bg-white shadow-sm hover:shadow-md transition-all cursor-pointer"
                >
                  {/* Thumbnail gradient */}
                  <div className={`h-28 bg-gradient-to-br ${getBoardColor(board.id)} opacity-80`}>
                    <div className="absolute inset-0 flex items-center justify-center opacity-20">
                      <div className="grid grid-cols-4 gap-2 p-4">
                        {[...Array(8)].map((_, i) => (
                          <div key={i} className="w-8 h-6 bg-white rounded opacity-60" />
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 text-sm truncate">{board.title}</h3>
                    <div className="flex items-center gap-1 text-xs text-gray-400 mt-1">
                      <Clock size={11} />
                      {timeAgo(board.updated_at)}
                    </div>
                  </div>

                  {/* Delete button */}
                  <button
                    onClick={(e) => deleteBoard(board.id, e)}
                    disabled={deletingId === board.id}
                    className="absolute top-3 right-3 w-7 h-7 rounded-lg bg-white/80 backdrop-blur-sm border border-gray-200 text-gray-500 hover:text-red-600 hover:border-red-200 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <Trash2 size={13} />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </main>
    </div>
  );
}
