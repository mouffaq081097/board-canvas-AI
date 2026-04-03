'use client';

import { useState } from 'react';
import { useCanvasStore } from '@/store/canvasStore';
import { CanvasObject } from '@/types/canvas';

export type AIAction = 'group' | 'summarize' | 'brainstorm' | 'ocr' | 'roadmap' | 'research';

export function useAI() {
  const { selectedIds, objects, addObject, addObjects, addConnection, batchUpdateObjects, updateObject } = useCanvasStore();
  const [loading, setLoading] = useState<AIAction | null>(null);
  const [error, setError] = useState('');

  const runAI = async (action: AIAction) => {
    const selectedObjects = objects.filter((o) => selectedIds.includes(o.id));
    if (selectedObjects.length === 0) return;

    setLoading(action);
    setError('');

    // Roadmap pre-flight check: ensure selected note has todo items
    if (action === 'roadmap') {
      const todoItems = selectedObjects[0]?.metadata?.todoItems;
      if (!todoItems?.length) {
        setError('Select a note with todo items to generate a roadmap');
        setLoading(null);
        return;
      }
    }

    // Research pre-flight check: ensure selected object is a book
    if (action === 'research') {
      if (selectedObjects[0]?.type !== 'book') {
        setError('Select a book to use Magic Research');
        setLoading(null);
        return;
      }
    }

    try {
      let imageBase64;
      const firstObj = selectedObjects[0];
      
      if (action === 'ocr' && firstObj.type === 'image' && firstObj.metadata?.imageUrl?.startsWith('data:image')) {
        imageBase64 = firstObj.metadata.imageUrl;
      }

      const body = action === 'roadmap'
        ? JSON.stringify({ todos: selectedObjects[0]?.metadata?.todoItems ?? [] })
        : action === 'research'
        ? JSON.stringify({ title: selectedObjects[0]?.content || 'Untitled' })
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

          const startId = idMap.get('__START__');
          depth0NodeIds.forEach((nodeId: string) => {
            const toId = idMap.get(nodeId);
            if (!startId || !toId) return;
            addConnection({
              fromId: startId,
              toId,
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
        case 'research': {
          if (!data.pages) break;
          const bookObj = selectedObjects[0];
          const { v4: uuidv4 } = await import('uuid');

          // 1. Splice new pages into the book's first section
          const newPages = data.pages.map((p: { title: string; contentHtml: string }) => ({
            id: uuidv4(),
            title: p.title,
            content: p.contentHtml,
          }));

          const sections = bookObj.metadata?.sections || [];
          if (sections.length > 0) {
            const updatedSections = [...sections];
            updatedSections[0] = {
              ...updatedSections[0],
              pages: [...updatedSections[0].pages, ...newPages],
            };
            updateObject(bookObj.id, {
              metadata: { ...bookObj.metadata, sections: updatedSections },
            });
          }

          // 2. Drop media items on canvas adjacent to the book
          if (data.media && data.media.length > 0) {
            const mediaObjects = data.media.map((m: { query: string; alt: string }, idx: number) => ({
              type: 'image' as const,
              x: bookObj.x + bookObj.width + 80,
              y: bookObj.y + (idx * 240),
              width: 320,
              height: 200,
              content: '',
              style: {},
              metadata: {
                imageUrl: `https://pollinations.ai/p/${encodeURIComponent(m.query)}?width=640&height=400&nologo=true&seed=${Math.floor(Math.random() * 1000000)}`,
                imageAlt: m.alt,
                isGif: false,
              },
            }));
            addObjects(mediaObjects);
          }
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
