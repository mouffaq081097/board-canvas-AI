'use client';
import { CanvasObject } from '@/types/canvas';
export default function ImageObject({ object, isSelected, onUpdate }: { object: CanvasObject; isSelected: boolean; onUpdate: (p: Partial<CanvasObject>) => void }) {
  return <div className="w-full h-full bg-gray-50 border-2 border-dashed border-gray-300 rounded flex items-center justify-center text-gray-400 text-sm">Image</div>;
}
