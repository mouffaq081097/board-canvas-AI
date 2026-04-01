'use client';

import {
  MousePointer2,
  Hand,
  StickyNote,
  FileText,
  BookOpen,
  Circle,
  Square,
  ArrowRight,
  Pen,
  Eraser,
  Sparkles,
  Plus,
  Minus,
  Lock,
  Grid3x3,
  LayoutGrid,
  Diamond,
  EyeOff,
} from 'lucide-react';
import { useCanvasStore } from '@/store/canvasStore';
import { GridMode, ToolType } from '@/types/canvas';

const GRID_CYCLE: GridMode[] = ['dots', 'graph', 'isometric', 'none'];
const GRID_META: Record<GridMode, { icon: React.ReactNode; label: string }> = {
  dots:      { icon: <Grid3x3 size={16} />,   label: 'Dot Grid' },
  graph:     { icon: <LayoutGrid size={16} />, label: 'Graph Paper' },
  isometric: { icon: <Diamond size={16} />,   label: 'Isometric' },
  none:      { icon: <EyeOff size={16} />,    label: 'No Grid' },
};

const TOOLS: { id: ToolType; icon: React.ReactNode; label: string }[] = [
  { id: 'pointer',   icon: <MousePointer2 size={18} />, label: 'Select (V)' },
  { id: 'hand',      icon: <Hand size={18} />,          label: 'Pan (H)' },
  { id: 'sticky',    icon: <StickyNote size={18} />,    label: 'Sticky Note (S)' },
  { id: 'note',      icon: <FileText size={18} />,      label: 'Standard Note (N)' },
  { id: 'book',      icon: <BookOpen size={18} />,      label: 'Book (B)' },
  { id: 'circle',    icon: <Circle size={18} />,        label: 'Circle (C)' },
  { id: 'rectangle', icon: <Square size={18} />,        label: 'Rectangle (R)' },
  { id: 'arrow',     icon: <ArrowRight size={18} />,    label: 'Arrow (A)' },
  { id: 'pen',       icon: <Pen size={18} />,           label: 'Draw (D)' },
  { id: 'eraser',    icon: <Eraser size={18} />,        label: 'Eraser (E)' },
];

function Divider() {
  return <div className="w-full h-px bg-gray-100 my-0.5" />;
}

function ToolBtn({ icon, label, active, onClick }: { icon: React.ReactNode; label: string; active?: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`relative w-9 h-9 rounded-xl flex items-center justify-center transition-all group ${
        active
          ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
          : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
      }`}
    >
      {icon}
      <div className="absolute left-full ml-3 px-2 py-1 bg-gray-900 text-white text-[10px] font-bold rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none uppercase tracking-widest z-50">
        {label}
      </div>
    </button>
  );
}

export default function Toolbar() {
  const {
    activeTool, setActiveTool,
    autoTidy,
    viewport, setViewport,
    gridMode, setGridMode,
    layerLockEnabled, setLayerLockEnabled,
  } = useCanvasStore();

  const cycleGrid = () => {
    const idx = GRID_CYCLE.indexOf(gridMode);
    setGridMode(GRID_CYCLE[(idx + 1) % GRID_CYCLE.length]);
  };

  const nextGridLabel = GRID_META[GRID_CYCLE[(GRID_CYCLE.indexOf(gridMode) + 1) % GRID_CYCLE.length]].label;

  const handleZoom = (delta: number) => {
    const newScale = Math.min(Math.max(viewport.scale + delta, 0.1), 4);
    const zoomFactor = newScale / viewport.scale;
    setViewport({
      scale: newScale,
      x: window.innerWidth / 2 - (window.innerWidth / 2 - viewport.x) * zoomFactor,
      y: window.innerHeight / 2 - (window.innerHeight / 2 - viewport.y) * zoomFactor,
    });
  };

  return (
    /* Anchor: left-4, below 52px navbar, above 8px bottom clearance, centered vertically */
    <div className="absolute left-4 z-[100] flex flex-col justify-center" style={{ top: 60, bottom: 8 }}>
      <div className="flex flex-col gap-0.5 bg-white/90 backdrop-blur-md rounded-2xl shadow-xl border border-gray-200 p-1.5 overflow-y-auto"
        style={{ maxHeight: '100%', scrollbarWidth: 'none' }}
      >
        {/* Selection + pan */}
        <ToolBtn icon={<MousePointer2 size={18} />} label="Select (V)" active={activeTool === 'pointer'} onClick={() => setActiveTool('pointer')} />
        <ToolBtn icon={<Hand size={18} />}          label="Pan (H)"    active={activeTool === 'hand'}    onClick={() => setActiveTool('hand')} />

        <Divider />

        {/* Object creators */}
        {TOOLS.slice(2, 8).map(t => (
          <ToolBtn key={t.id} icon={t.icon} label={t.label} active={activeTool === t.id} onClick={() => setActiveTool(t.id)} />
        ))}

        <Divider />

        {/* Drawing */}
        <ToolBtn icon={<Pen size={18} />}    label="Draw (D)"   active={activeTool === 'pen'}    onClick={() => setActiveTool('pen')} />
        <ToolBtn icon={<Eraser size={18} />} label="Eraser (E)" active={activeTool === 'eraser'} onClick={() => setActiveTool('eraser')} />

        <Divider />

        {/* Auto-tidy */}
        <ToolBtn icon={<Sparkles size={18} />} label="Auto-Tidy" onClick={autoTidy} />

        <Divider />

        {/* Grid cycle */}
        <button
          onClick={cycleGrid}
          className="relative w-9 h-9 rounded-xl flex items-center justify-center text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-all group"
        >
          {GRID_META[gridMode].icon}
          <div className="absolute left-full ml-3 px-2 py-1 bg-gray-900 text-white text-[10px] font-bold rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none uppercase tracking-widest z-50">
            Grid → {nextGridLabel}
          </div>
        </button>

        {/* Layer lock */}
        <button
          onClick={() => setLayerLockEnabled(!layerLockEnabled)}
          className={`relative w-9 h-9 rounded-xl flex items-center justify-center transition-all group ${
            layerLockEnabled
              ? 'bg-amber-500 text-white shadow-md shadow-amber-200'
              : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
          }`}
        >
          <Lock size={16} />
          <div className="absolute left-full ml-3 px-2 py-1 bg-gray-900 text-white text-[10px] font-bold rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none uppercase tracking-widest z-50">
            Layer Lock {layerLockEnabled ? 'ON' : 'OFF'}
          </div>
        </button>

        <Divider />

        {/* Zoom */}
        <button
          onClick={() => handleZoom(0.1)}
          className="relative w-9 h-9 rounded-xl flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors group"
        >
          <Plus size={18} />
          <div className="absolute left-full ml-3 px-2 py-1 bg-gray-900 text-white text-[10px] font-bold rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">ZOOM IN</div>
        </button>

        <button
          onClick={() => setViewport({ scale: 1, x: 0, y: 0 })}
          className="relative w-9 h-9 rounded-xl flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors group"
        >
          <span className="text-[10px] font-black">{Math.round(viewport.scale * 100)}%</span>
          <div className="absolute left-full ml-3 px-2 py-1 bg-gray-900 text-white text-[10px] font-bold rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">RESET ZOOM</div>
        </button>

        <button
          onClick={() => handleZoom(-0.1)}
          className="relative w-9 h-9 rounded-xl flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors group"
        >
          <Minus size={18} />
          <div className="absolute left-full ml-3 px-2 py-1 bg-gray-900 text-white text-[10px] font-bold rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">ZOOM OUT</div>
        </button>
      </div>
    </div>
  );
}
