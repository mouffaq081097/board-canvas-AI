'use client';

import { useCanvasStore } from '@/store/canvasStore';
import { AnchorSide } from '@/types/canvas';

interface Props {
  objectId: string;
  side: AnchorSide;
}

const POSITIONS: Record<AnchorSide, React.CSSProperties> = {
  top:    { top: -8,    left: '50%',  transform: 'translateX(-50%)' },
  right:  { right: -8,  top: '50%',   transform: 'translateY(-50%)' },
  bottom: { bottom: -8, left: '50%',  transform: 'translateX(-50%)' },
  left:   { left: -8,   top: '50%',   transform: 'translateY(-50%)' },
};

export default function AnchorPoint({ objectId, side }: Props) {
  const { connectingFrom, setConnectingFrom, addConnection, activeTool } = useCanvasStore();

  const isConnectorMode = activeTool === 'connector';
  const isSourceAnchor = connectingFrom?.id === objectId && connectingFrom?.anchor === side;
  const isDragging = !!connectingFrom;
  // This anchor is a valid drop target (different object, connection in progress)
  const isValidTarget = isDragging && connectingFrom?.id !== objectId;

  const handlePointerDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setConnectingFrom({ id: objectId, anchor: side });
    // Intentionally NOT capturing the pointer here so that Canvas can
    // receive pointermove events for the live preview line.
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    e.stopPropagation();
    if (!connectingFrom) return;

    if (connectingFrom.id !== objectId) {
      addConnection({
        fromId: connectingFrom.id,
        toId: objectId,
        fromAnchor: connectingFrom.anchor as AnchorSide,
        toAnchor: side,
        color: '#6366f1',
      });
    }
    setConnectingFrom(null);
  };

  // Size + color state
  let dotSize: number;
  let bg: string;
  let border: string;
  let cursor: string;

  if (isSourceAnchor) {
    // Currently being dragged from
    dotSize = 14;
    bg = '#4f46e5';
    border = '#3730a3';
    cursor = 'crosshair';
  } else if (isValidTarget) {
    // Hoverable drop target while dragging
    dotSize = 14;
    bg = '#10b981';
    border = '#059669';
    cursor = 'crosshair';
  } else if (isConnectorMode) {
    // Idle in connector mode — clearly visible
    dotSize = 12;
    bg = '#6366f1';
    border = '#ffffff';
    cursor = 'crosshair';
  } else {
    // Normal (selected object, not in connector mode)
    dotSize = 10;
    bg = '#ffffff';
    border = '#6366f1';
    cursor = 'crosshair';
  }

  return (
    <div
      data-anchor-point="true"
      style={{
        position: 'absolute',
        zIndex: 60,
        ...POSITIONS[side],
      }}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
    >
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>

        {/* Outer pulse ring — shown in connector mode when idle */}
        {isConnectorMode && !isDragging && (
          <div
            style={{
              position: 'absolute',
              width: 24,
              height: 24,
              borderRadius: '50%',
              background: 'rgba(99,102,241,0.25)',
              animation: 'anchor-pulse 1.8s ease-out infinite',
              pointerEvents: 'none',
            }}
          />
        )}

        {/* Green ring around valid targets while dragging */}
        {isValidTarget && (
          <div
            style={{
              position: 'absolute',
              width: 26,
              height: 26,
              borderRadius: '50%',
              background: 'rgba(16,185,129,0.2)',
              border: '1.5px solid rgba(16,185,129,0.5)',
              animation: 'anchor-pulse 1s ease-out infinite',
              pointerEvents: 'none',
            }}
          />
        )}

        {/* Core dot */}
        <div
          style={{
            width: dotSize,
            height: dotSize,
            borderRadius: '50%',
            background: bg,
            border: `2px solid ${border}`,
            boxShadow: isConnectorMode
              ? '0 0 0 1px rgba(99,102,241,0.3), 0 2px 6px rgba(0,0,0,0.2)'
              : '0 1px 4px rgba(0,0,0,0.15)',
            cursor,
            transition: 'width 0.12s, height 0.12s, background 0.12s',
            flexShrink: 0,
          }}
          onMouseEnter={(e) => {
            if (!isSourceAnchor) {
              (e.currentTarget as HTMLDivElement).style.transform = 'scale(1.4)';
            }
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLDivElement).style.transform = 'scale(1)';
          }}
        />
      </div>

      <style>{`
        @keyframes anchor-pulse {
          0%   { transform: scale(0.8); opacity: 0.8; }
          70%  { transform: scale(1.6); opacity: 0; }
          100% { transform: scale(0.8); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
