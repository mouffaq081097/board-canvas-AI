'use client';

import { useCanvasStore } from '@/store/canvasStore';
import { AnchorSide } from '@/types/canvas';

interface Props {
  objectId: string;
  side: AnchorSide;
}

const POSITIONS: Record<AnchorSide, React.CSSProperties> = {
  top: { top: -6, left: '50%', transform: 'translateX(-50%)' },
  right: { right: -6, top: '50%', transform: 'translateY(-50%)' },
  bottom: { bottom: -6, left: '50%', transform: 'translateX(-50%)' },
  left: { left: -6, top: '50%', transform: 'translateY(-50%)' },
};

export default function AnchorPoint({ objectId, side }: Props) {
  const { connectingFrom, setConnectingFrom, addConnection } = useCanvasStore();

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();

    if (!connectingFrom) {
      setConnectingFrom({ id: objectId, anchor: side });
    } else {
      if (connectingFrom.id === objectId) {
        setConnectingFrom(null);
        return;
      }
      addConnection({
        fromId: connectingFrom.id,
        toId: objectId,
        fromAnchor: connectingFrom.anchor as AnchorSide,
        toAnchor: side,
        color: '#6366f1',
      });
      setConnectingFrom(null);
    }
  };

  const isActive = connectingFrom?.id === objectId && connectingFrom?.anchor === side;

  return (
    <div
      data-anchor-point="true"
      className="anchor-points absolute z-10"
      style={POSITIONS[side]}
      onClick={handleClick}
    >
      <div
        className={`w-3 h-3 rounded-full border-2 transition-all cursor-crosshair ${
          isActive
            ? 'bg-indigo-600 border-indigo-700 scale-125'
            : connectingFrom
            ? 'bg-green-400 border-green-500 scale-110'
            : 'bg-white border-indigo-400 hover:bg-indigo-400 hover:scale-125'
        }`}
      />
    </div>
  );
}
