'use client';

import { useState } from 'react';
import { useCanvasStore } from '@/store/canvasStore';
import { CanvasObject } from '@/types/canvas';

export type AIAction = 'group' | 'summarize' | 'brainstorm' | 'sketch' | 'ocr';

export function useAI() {
  const { selectedIds, objects, addObject, batchUpdateObjects, updateObject } = useCanvasStore();
  const [loading, setLoading] = useState<AIAction | null>(null);
  const [error, setError] = useState('');

  const runAI = async (action: AIAction) => {
    const selectedObjects = objects.filter((o) => selectedIds.includes(o.id));
    if (selectedObjects.length === 0) return;

    setLoading(action);
    setError('');

    try {
      const res = await fetch(`/api/ai/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ objects: selectedObjects }),
      });

      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();

      switch (action) {
        case 'brainstorm':
          if (data.notes) {
            data.notes.forEach((note: Omit<CanvasObject, 'id'>) => addObject(note));
          }
          break;
        case 'group':
          if (data.moves) batchUpdateObjects(data.moves);
          break;
        case 'summarize':
          if (data.book) addObject(data.book);
          break;
        case 'sketch':
          if (data.object) {
            updateObject(selectedIds[0], data.object);
          }
          break;
        case 'ocr':
          if (data.text) {
            updateObject(selectedIds[0], {
              metadata: {
                ...selectedObjects[0]?.metadata,
                ocrText: data.text,
              },
            });
          }
          break;
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'AI request failed');
    } finally {
      setLoading(null);
    }
  };

  return { runAI, loading, error };
}
