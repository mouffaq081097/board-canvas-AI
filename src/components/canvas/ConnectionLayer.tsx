'use client';

import { useState } from 'react';
import { useCanvasStore } from '@/store/canvasStore';
import { getAnchorPoint, getBezierPath, getClosestAnchors } from '@/lib/canvasUtils';
import { X } from 'lucide-react';

export default function ConnectionLayer() {
  const { connections, objects, deleteConnection, updateConnection, connectingFrom } = useCanvasStore();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [tempLabel, setTempLabel] = useState('');
  
  const objMap = new Map(objects.map((o) => [o.id, o]));

  const handleLabelSubmit = (id: string) => {
    updateConnection(id, { label: tempLabel });
    setEditingId(null);
  };

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
    >
      <defs>
        <marker id="arrowhead" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
          <polygon points="0 0, 8 3, 0 6" fill="#6366f1" />
        </marker>
      </defs>

      {connections.map((conn) => {
        const fromObj = objMap.get(conn.fromId);
        const toObj = objMap.get(conn.toId);
        if (!fromObj || !toObj) return null;

        // Dynamically find best anchors
        const { fromAnchor, toAnchor } = getClosestAnchors(fromObj, toObj);

        const from = getAnchorPoint(fromObj, fromAnchor);
        const to = getAnchorPoint(toObj, toAnchor);
        const path = getBezierPath(from.x + 10000, from.y + 10000, to.x + 10000, to.y + 10000, fromAnchor, toAnchor);
        const midX = (from.x + to.x) / 2 + 10000;
        const midY = (from.y + to.y) / 2 + 10000;

        return (
          <g key={conn.id} style={{ pointerEvents: 'all' }}>
            {/* Invisible wider hit area */}
            <path
              d={path}
              fill="none"
              stroke="transparent"
              strokeWidth={16}
              style={{ cursor: 'pointer' }}
              onDoubleClick={(e) => {
                e.stopPropagation();
                setEditingId(conn.id);
                setTempLabel(conn.label || '');
              }}
            />
            <path
              d={path}
              fill="none"
              stroke={conn.color || '#6366f1'}
              strokeWidth={2}
              strokeLinecap="round"
              markerEnd="url(#arrowhead)"
            />
            
            {/* Logic Label */}
            {(conn.label || editingId === conn.id) && (
              <foreignObject
                x={midX - 50}
                y={midY - 15}
                width={100}
                height={30}
                style={{ pointerEvents: 'all' }}
              >
                {editingId === conn.id ? (
                  <input
                    autoFocus
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
                    className="w-full h-full flex items-center justify-center text-[10px] font-medium text-indigo-600 bg-white/80 backdrop-blur-[2px] rounded px-1 truncate cursor-text"
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

            {/* Delete button at midpoint */}
            <foreignObject
              x={midX + 40}
              y={midY - 10}
              width={20}
              height={20}
              style={{ pointerEvents: 'all', cursor: 'pointer', opacity: 0 }}
              className="hover:opacity-100 connection-delete"
              onClick={() => deleteConnection(conn.id)}
            >
              <div className="w-5 h-5 bg-white rounded-full border border-gray-200 flex items-center justify-center shadow-sm">
                <X size={10} className="text-gray-500" />
              </div>
            </foreignObject>
          </g>
        );
      })}

      {/* Live connecting line preview handled by parent */}
      {connectingFrom && (
        <circle
          cx={0}
          cy={0}
          r={4}
          fill="#6366f1"
          style={{ display: 'none' }}
        />
      )}
    </svg>
  );
}
