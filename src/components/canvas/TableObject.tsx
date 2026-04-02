'use client';
import { CanvasObject } from '@/types/canvas';
export default function TableObject({ object, isSelected, onUpdate }: { object: CanvasObject; isSelected: boolean; onUpdate: (p: Partial<CanvasObject>) => void }) {
  return <div className="w-full h-full bg-white border border-gray-200 rounded" />;
}
