'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useCanvasStore } from '@/store/canvasStore';
import { getAnchorPoint, getBezierPath } from '@/lib/canvasUtils';
import { X } from 'lucide-react';

export default function ConnectionLayer() {
  const { connections, objects, deleteConnection, updateConnection, connectingFrom, mousePos } =
    useCanvasStore();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [tempLabel, setTempLabel] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const objMap = useMemo(() => new Map(objects.map((o) => [o.id, o])), [objects]);

  // Delete selected connection with Delete / Backspace key
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!selectedId) return;
      if (e.key === 'Delete' || e.key === 'Backspace') {
        // Don't delete when user is typing in an input
        const tag = (e.target as HTMLElement).tagName;
        if (['INPUT', 'TEXTAREA'].includes(tag)) return;
        deleteConnection(selectedId);
        setSelectedId(null);
      }
      if (e.key === 'Escape') {
        setSelectedId(null);
      }
    },
    [selectedId, deleteConnection]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Deselect when clicking elsewhere on the SVG background
  const handleSvgClick = (e: React.MouseEvent) => {
    if ((e.target as SVGElement).tagName === 'svg') {
      setSelectedId(null);
    }
  };

  const handleLabelSubmit = (id: string) => {
    updateConnection(id, { label: tempLabel });
    setEditingId(null);
  };

  const previewLine = useMemo(() => {
    if (!connectingFrom || !mousePos) return null;
    const fromObj = objMap.get(connectingFrom.id);
    if (!fromObj) return null;

    const from = getAnchorPoint(fromObj, connectingFrom.anchor as 'top' | 'right' | 'bottom' | 'left');
    const fromX = from.x + 10000;
    const fromY = from.y + 10000;
    const toX = mousePos.x + 10000;
    const toY = mousePos.y + 10000;

    const dx = Math.abs(toX - fromX) * 0.5;
    const controlX1 =
      connectingFrom.anchor === 'right'
        ? fromX + dx
        : connectingFrom.anchor === 'left'
        ? fromX - dx
        : fromX;
    const controlY1 =
      connectingFrom.anchor === 'bottom'
        ? fromY + dx
        : connectingFrom.anchor === 'top'
        ? fromY - dx
        : fromY;

    return `M ${fromX} ${fromY} C ${controlX1} ${controlY1} ${toX} ${toY} ${toX} ${toY}`;
  }, [connectingFrom, mousePos, objMap]);

  return (
    <svg
      className="absolute"
      style={{
        left: -10000,
        top: -10000,
        width: 20000,
        height: 20000,
        pointerEvents: 'none',
        overflow: 'visible',
        zIndex: 1,
      }}
      onClick={handleSvgClick}
    >
      <defs>
        <marker id="arrowhead" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
          <polygon points="0 0, 8 3, 0 6" fill="#6366f1" />
        </marker>
        <marker id="arrowhead-selected" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
          <polygon points="0 0, 8 3, 0 6" fill="#4f46e5" />
        </marker>
      </defs>

      {/* Live preview line while dragging */}
      {previewLine && (
        <path
          d={previewLine}
          fill="none"
          stroke="#6366f1"
          strokeWidth={2.5}
          strokeDasharray="6 5"
          strokeLinecap="round"
          markerEnd="url(#arrowhead)"
          style={{ pointerEvents: 'none' }}
        />
      )}

      {connections.map((conn) => {
        const fromObj = objMap.get(conn.fromId);
        const toObj = objMap.get(conn.toId);
        if (!fromObj || !toObj) return null;

        const from = getAnchorPoint(fromObj, conn.fromAnchor);
        const to = getAnchorPoint(toObj, conn.toAnchor);
        const path = getBezierPath(
          from.x + 10000,
          from.y + 10000,
          to.x + 10000,
          to.y + 10000,
          conn.fromAnchor,
          conn.toAnchor
        );
        const midX = (from.x + to.x) / 2 + 10000;
        const midY = (from.y + to.y) / 2 + 10000;
        const isSelected = selectedId === conn.id;

        return (
          <g key={conn.id} style={{ pointerEvents: 'all' }}>
            {/* Wide invisible hit area */}
            <path
              d={path}
              fill="none"
              stroke="transparent"
              strokeWidth={20}
              style={{ cursor: 'pointer' }}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedId(isSelected ? null : conn.id);
              }}
              onDoubleClick={(e) => {
                e.stopPropagation();
                setEditingId(conn.id);
                setTempLabel(conn.label || '');
                setSelectedId(conn.id);
              }}
            />

            {/* Selection glow underneath */}
            {isSelected && (
              <path
                d={path}
                fill="none"
                stroke="#a5b4fc"
                strokeWidth={6}
                strokeLinecap="round"
                style={{ pointerEvents: 'none' }}
              />
            )}

            {/* Visible stroke */}
            <path
              d={path}
              fill="none"
              stroke={isSelected ? '#4f46e5' : (conn.color || '#6366f1')}
              strokeWidth={isSelected ? 2.5 : 2}
              strokeLinecap="round"
              markerEnd={isSelected ? 'url(#arrowhead-selected)' : 'url(#arrowhead)'}
              style={{ pointerEvents: 'none' }}
            />

            {/* Label */}
            {(conn.label || editingId === conn.id) && (
              <foreignObject
                x={midX - 50}
                y={midY - 15}
                width={100}
                height={30}
                style={{ pointerEvents: 'none' }}
              >
                {editingId === conn.id ? (
                  <input
                    autoFocus
                    style={{ pointerEvents: 'all' }}
                    className="w-full h-full px-1 text-[10px] text-center border border-indigo-400 rounded bg-white shadow-sm focus:outline-none"
                    value={tempLabel}
                    onChange={(e) => setTempLabel(e.target.value)}
                    onBlur={() => handleLabelSubmit(conn.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleLabelSubmit(conn.id);
                      if (e.key === 'Escape') setEditingId(null);
                    }}
                  />
                ) : (
                  <div
                    style={{ pointerEvents: 'all' }}
                    className="w-full h-full flex items-center justify-center text-[10px] font-medium text-indigo-600 bg-white/90 backdrop-blur-[2px] rounded px-1 truncate cursor-text border border-indigo-100 transition-colors"
                    onDoubleClick={() => {
                      setEditingId(conn.id);
                      setTempLabel(conn.label || '');
                    }}
                  >
                    {conn.label}
                  </div>
                )}
              </foreignObject>
            )}

            {/* Delete button — always visible when selected, visible on hover otherwise */}
            <foreignObject
              x={midX - 12}
              y={midY - 12}
              width={24}
              height={24}
              style={{ pointerEvents: 'all', cursor: 'pointer', opacity: isSelected ? 1 : undefined }}
              className={isSelected ? '' : 'opacity-0 hover:opacity-100 transition-opacity'}
              onClick={(e) => {
                e.stopPropagation();
                deleteConnection(conn.id);
                setSelectedId(null);
              }}
            >
              <div
                style={{
                  width: 24,
                  height: 24,
                  background: isSelected ? '#ef4444' : '#fff0f0',
                  borderRadius: '50%',
                  border: isSelected ? '2px solid #dc2626' : '1.5px solid #fca5a5',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: isSelected ? '0 2px 8px rgba(239,68,68,0.4)' : '0 1px 4px rgba(0,0,0,0.1)',
                  transition: 'background 0.15s, box-shadow 0.15s',
                }}
              >
                <X size={13} color={isSelected ? '#fff' : '#ef4444'} />
              </div>
            </foreignObject>

            {/* "Press Delete to remove" hint when selected */}
            {isSelected && (
              <foreignObject
                x={midX - 75}
                y={midY + 16}
                width={150}
                height={20}
                style={{ pointerEvents: 'none' }}
              >
                <div
                  style={{
                    width: '100%',
                    textAlign: 'center',
                    fontSize: 10,
                    fontFamily: "'Syne', 'Helvetica Neue', sans-serif",
                    color: '#6366f1',
                    background: 'rgba(238,242,255,0.9)',
                    borderRadius: 4,
                    padding: '1px 6px',
                    border: '1px solid rgba(199,210,254,0.8)',
                    backdropFilter: 'blur(4px)',
                    whiteSpace: 'nowrap',
                  }}
                >
                  Press Delete to remove
                </div>
              </foreignObject>
            )}
          </g>
        );
      })}
    </svg>
  );
}
