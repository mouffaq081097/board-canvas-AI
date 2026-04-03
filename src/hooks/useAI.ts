'use client';

import { useState } from 'react';
import { useCanvasStore } from '@/store/canvasStore';
import { CanvasObject } from '@/types/canvas';

export type AIAction = 'group' | 'summarize' | 'brainstorm' | 'sketch' | 'ocr' | 'roadmap';

export function useAI() {
  const { selectedIds, objects, addObject, addObjects, addConnection, batchUpdateObjects, updateObject } = useCanvasStore();
  const [loading, setLoading] = useState<AIAction | null>(null);
  const [error, setError] = useState('');

  const runAI = async (action: AIAction) => {
    const selectedObjects = objects.filter((o) => selectedIds.includes(o.id));
    if (selectedObjects.length === 0) return;

    setLoading(action);
    setError('');

    try {
      let imageBase64;
      const firstObj = selectedObjects[0];
      
      if ((action === 'ocr' || action === 'sketch') && firstObj.type === 'image' && firstObj.metadata?.imageUrl?.startsWith('data:image')) {
        imageBase64 = firstObj.metadata.imageUrl;
      }

      const body = action === 'roadmap'
        ? JSON.stringify({ todos: selectedObjects[0]?.metadata?.todoItems ?? [] })
        : JSON.stringify({ objects: selectedObjects, imageBase64 });

      const res = await fetch(`/api/ai/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
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
        case 'roadmap': {
          if (!data.nodes || !data.edges) break;

          const sourceObj = selectedObjects[0];
          const { layoutRoadmap } = await import('@/lib/roadmapLayout');
          const { canvasNodes, aiNodeIds, durationMap } = layoutRoadmap(
            { x: sourceObj.x, y: sourceObj.y, height: sourceObj.height },
            data.nodes,
          );

          // Batch-add all sticky notes in one call (zero intermediate renders)
          const ids = addObjects(canvasNodes);

          // Map AI node IDs → canvas object IDs
          const idMap = new Map<string, string>(
            aiNodeIds.map((aiId: string, i: number) => [aiId, ids[i]])
          );

          // Connect Start node to all depth-0 nodes
          const depth0NodeIds = data.nodes
            .filter((n: { depth: number }) => n.depth === 0)
            .map((n: { id: string }) => n.id);

          depth0NodeIds.forEach((nodeId: string) => {
            addConnection({
              fromId: idMap.get('__START__')!,
              toId: idMap.get(nodeId)!,
              fromAnchor: 'right',
              toAnchor: 'left',
              color: '#6366f1',
              label: durationMap.get(nodeId) ?? '',
            });
          });

          // Connect all edges from AI graph
          data.edges.forEach((edge: { from: string; to: string }) => {
            const fromId = idMap.get(edge.from);
            const toId = idMap.get(edge.to);
            if (!fromId || !toId) return;
            addConnection({
              fromId,
              toId,
              fromAnchor: 'right',
              toAnchor: 'left',
              color: '#6366f1',
              label: durationMap.get(edge.to) ?? '',
            });
          });

          break;
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'AI request failed');
    } finally {
      setLoading(null);
    }
  };

  return { runAI, loading, error };
}
