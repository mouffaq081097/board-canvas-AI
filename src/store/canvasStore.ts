import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import {
  CanvasObject,
  CanvasState,
  Connection,
  GridMode,
  ObjectType,
  AnchorSide,
  ToolType,
  Viewport,
} from '@/types/canvas';

interface CanvasStore {
  // State
  objects: CanvasObject[];
  connections: Connection[];
  selectedIds: string[];
  activeTool: ToolType;
  viewport: Viewport;
  isDrawing: boolean;
  connectingFrom: { id: string; anchor: AnchorSide } | null;
  pulsingId: string | null;
  focusedObjectId: string | null;
  isBookModalOpen: boolean;
  gridMode: GridMode;
  layerLockEnabled: boolean;

  // Object actions
  addObject: (obj: Omit<CanvasObject, 'id'>) => string;
  updateObject: (id: string, updates: Partial<CanvasObject>) => void;
  deleteObjects: (ids: string[]) => void;
  moveObject: (id: string, x: number, y: number) => void;
  batchUpdateObjects: (updates: ({ id: string } & Partial<CanvasObject>)[]) => void;
  addObjects: (objs: Omit<CanvasObject, 'id'>[]) => string[];

  // Connection actions
  addConnection: (conn: Omit<Connection, 'id'>) => void;
  updateConnection: (id: string, updates: Partial<Connection>) => void;
  deleteConnection: (id: string) => void;

  // Selection
  selectObject: (id: string, multi?: boolean) => void;
  selectObjectsInRect: (rect: { x: number; y: number; width: number; height: number }) => void;
  clearSelection: () => void;
  setSelectedIds: (ids: string[]) => void;

  // Tools & viewport
  setActiveTool: (tool: ToolType) => void;
  setViewport: (viewport: Partial<Viewport>) => void;
  setIsDrawing: (drawing: boolean) => void;
  setConnectingFrom: (data: { id: string; anchor: AnchorSide } | null) => void;
  setPulsingId: (id: string | null) => void;
  setFocusedObjectId: (id: string | null) => void;
  setIsBookModalOpen: (isOpen: boolean) => void;
  setGridMode: (mode: GridMode) => void;
  setLayerLockEnabled: (val: boolean) => void;
  toggleObjectLock: (id: string) => void;

  // Layout & Organization
  autoTidy: () => void;
  duplicateObjects: (ids: string[]) => void;
  bringToFront: (ids: string[]) => void;
  sendToBack: (ids: string[]) => void;

  // Bulk load (from database)
  loadCanvasState: (state: CanvasState) => void;
  getCanvasState: () => CanvasState;

  // Create helpers for each type
  createStickyNote: (x: number, y: number) => string;
  createStandardNote: (x: number, y: number) => string;
  createBook: (x: number, y: number) => string;
  createShape: (x: number, y: number, shapeType: 'circle' | 'rectangle' | 'arrow') => string;

  // Book Page helpers
  addBookPage: (bookId: string) => void;
  updateBookPage: (bookId: string, pageId: string, content: string) => void;
  deleteBookPage: (bookId: string, pageId: string) => void;
}

export const useCanvasStore = create<CanvasStore>((set, get) => ({
  objects: [],
  connections: [],
  selectedIds: [],
  activeTool: 'pointer',
  viewport: { x: 0, y: 0, scale: 1 },
  isDrawing: false,
  connectingFrom: null,
  pulsingId: null,
  focusedObjectId: null,
  isBookModalOpen: false,
  gridMode: 'dots',
  layerLockEnabled: false,

  addObject: (obj) => {
    const id = uuidv4();
    set((state) => ({ objects: [...state.objects, { ...obj, id }] }));
    return id;
  },

  addObjects: (objs) => {
    const ids = objs.map(() => uuidv4());
    const newObjects = objs.map((obj, i) => ({ ...obj, id: ids[i] }));
    set((state) => ({ objects: [...state.objects, ...newObjects] }));
    return ids;
  },

  updateObject: (id, updates) => {
    set((state) => ({
      objects: state.objects.map((o) => (o.id === id ? { ...o, ...updates } : o)),
    }));
  },

  deleteObjects: (ids) => {
    set((state) => ({
      objects: state.objects.filter((o) => !ids.includes(o.id)),
      connections: state.connections.filter(
        (c) => !ids.includes(c.fromId) && !ids.includes(c.toId)
      ),
      selectedIds: state.selectedIds.filter((id) => !ids.includes(id)),
    }));
  },

  moveObject: (id, x, y) => {
    set((state) => ({
      objects: state.objects.map((o) => (o.id === id ? { ...o, x, y } : o)),
    }));
  },

  batchUpdateObjects: (updates) => {
    set((state) => {
      const map = new Map(updates.map((u) => [u.id, u]));
      return {
        objects: state.objects.map((o) => {
          const upd = map.get(o.id);
          return upd ? { ...o, ...upd } : o;
        }),
      };
    });
  },

  addConnection: (conn) => {
    const id = uuidv4();
    set((state) => ({ connections: [...state.connections, { ...conn, id }] }));
  },

  updateConnection: (id, updates) => {
    set((state) => ({
      connections: state.connections.map((c) => (c.id === id ? { ...c, ...updates } : c)),
    }));
  },

  deleteConnection: (id) => {
    set((state) => ({ connections: state.connections.filter((c) => c.id !== id) }));
  },

  selectObject: (id, multi = false) => {
    const { objects, layerLockEnabled } = get();
    const obj = objects.find((o) => o.id === id);
    if (layerLockEnabled && obj?.locked) return;
    set((state) => ({
      selectedIds: multi
        ? state.selectedIds.includes(id)
          ? state.selectedIds.filter((s) => s !== id)
          : [...state.selectedIds, id]
        : [id],
    }));
  },

  selectObjectsInRect: (rect) => {
    const { objects, layerLockEnabled } = get();
    const ids = objects
      .filter((o) => {
        if (layerLockEnabled && o.locked) return false;
        return (
          o.x >= rect.x &&
          o.x + o.width <= rect.x + rect.width &&
          o.y >= rect.y &&
          o.y + o.height <= rect.y + rect.height
        );
      })
      .map((o) => o.id);
    set({ selectedIds: ids });
  },

  clearSelection: () => set({ selectedIds: [] }),

  setSelectedIds: (ids) => set({ selectedIds: ids }),

  setActiveTool: (tool) => set({ activeTool: tool }),

  setViewport: (viewport) =>
    set((state) => ({ viewport: { ...state.viewport, ...viewport } })),

  setIsDrawing: (drawing) => set({ isDrawing: drawing }),

  setConnectingFrom: (data) => set({ connectingFrom: data }),

  setPulsingId: (id) => set({ pulsingId: id }),

  setFocusedObjectId: (id) => set({ focusedObjectId: id }),

  setIsBookModalOpen: (isOpen) => set({ isBookModalOpen: isOpen }),

  setGridMode: (mode) => set({ gridMode: mode }),

  setLayerLockEnabled: (val) => set({ layerLockEnabled: val }),

  toggleObjectLock: (id) =>
    set((state) => ({
      objects: state.objects.map((o) => (o.id === id ? { ...o, locked: !o.locked } : o)),
    })),

  autoTidy: () => {
    const { objects, connections, batchUpdateObjects } = get();
    if (objects.length <= 1) return;

    // Simulation constants
    const ITERATIONS = 100;
    const REPULSION = 200000;
    const ATTRACTION = 0.05;
    const IDEAL_DIST = 400;
    const CENTER_GRAVITY = 0.02;
    const DAMPING = 0.8;

    // Use center points for physics
    const nodes = objects.map((obj) => ({
      id: obj.id,
      x: obj.x + obj.width / 2,
      y: obj.y + obj.height / 2,
      vx: 0,
      vy: 0,
      width: obj.width,
      height: obj.height,
    }));

    const startCenter = {
      x: nodes.reduce((sum, n) => sum + n.x, 0) / nodes.length,
      y: nodes.reduce((sum, n) => sum + n.y, 0) / nodes.length,
    };

    for (let i = 0; i < ITERATIONS; i++) {
      // 1. Repulsion
      for (let j = 0; j < nodes.length; j++) {
        for (let k = j + 1; k < nodes.length; k++) {
          const n1 = nodes[j];
          const n2 = nodes[k];
          const dx = n1.x - n2.x;
          const dy = n1.y - n2.y;
          const distSq = dx * dx + dy * dy || 1;
          const dist = Math.sqrt(distSq);
          const force = REPULSION / distSq;

          const fx = (dx / dist) * force;
          const fy = (dy / dist) * force;

          n1.vx += fx;
          n1.vy += fy;
          n2.vx -= fx;
          n2.vy -= fy;
        }
      }

      // 2. Attraction
      connections.forEach((conn) => {
        const n1 = nodes.find((n) => n.id === conn.fromId);
        const n2 = nodes.find((n) => n.id === conn.toId);
        if (n1 && n2) {
          const dx = n1.x - n2.x;
          const dy = n1.y - n2.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const force = (dist - IDEAL_DIST) * ATTRACTION;

          const fx = (dx / dist) * force;
          const fy = (dy / dist) * force;

          n1.vx -= fx;
          n1.vy -= fy;
          n2.vx += fx;
          n2.vy += fy;
        }
      });

      // 3. Update
      nodes.forEach((n) => {
        n.vx += (startCenter.x - n.x) * CENTER_GRAVITY;
        n.vy += (startCenter.y - n.y) * CENTER_GRAVITY;
        n.x += n.vx;
        n.y += n.vy;
        n.vx *= DAMPING;
        n.vy *= DAMPING;
      });
    }

    batchUpdateObjects(
      nodes.map((n) => ({
        id: n.id,
        x: Math.round(n.x - n.width / 2),
        y: Math.round(n.y - n.height / 2),
      }))
    );
  },

  duplicateObjects: (ids) => {
    const { objects, addObjects, setSelectedIds } = get();
    const toDuplicate = objects.filter((o) => ids.includes(o.id));
    if (toDuplicate.length === 0) return;

    const newObjs = toDuplicate.map((o) => {
      const { id: _id, ...rest } = JSON.parse(JSON.stringify(o));
      return {
        ...rest,
        x: o.x + 40,
        y: o.y + 40,
      };
    });

    const newIds = addObjects(newObjs);
    setSelectedIds(newIds);
  },

  bringToFront: (ids) => {
    set((state) => {
      const others = state.objects.filter((o) => !ids.includes(o.id));
      const targets = state.objects.filter((o) => ids.includes(o.id));
      return { objects: [...others, ...targets] };
    });
  },

  sendToBack: (ids) => {
    set((state) => {
      const others = state.objects.filter((o) => !ids.includes(o.id));
      const targets = state.objects.filter((o) => ids.includes(o.id));
      return { objects: [...targets, ...others] };
    });
  },

  loadCanvasState: (state) =>
    set({ objects: state.objects, connections: state.connections }),

  getCanvasState: () => ({
    objects: get().objects,
    connections: get().connections,
  }),

  createStickyNote: (x, y) => {
    return get().addObject({
      type: 'sticky' as ObjectType,
      x,
      y,
      width: 200,
      height: 200,
      content: '',
      style: {
        backgroundColor: '#fef9c3',
        textColor: '#1a1a1a',
        fontFamily: 'caveat',
        fontSize: 18,
        opacity: 1,
        roughEdges: false,
      },
    });
  },

  createStandardNote: (x, y) => {
    return get().addObject({
      type: 'note' as ObjectType,
      x,
      y,
      width: 280,
      height: 360,
      content: '',
      style: {
        backgroundColor: '#ffffff',
        textColor: '#1a1a1a',
        fontFamily: 'lora',
        fontSize: 14,
        opacity: 1,
      },
    });
  },

  createBook: (x, y) => {
    return get().addObject({
      type: 'book' as ObjectType,
      x,
      y,
      width: 160,
      height: 220,
      content: 'Untitled Book',
      style: {
        backgroundColor: '#4f46e5',
        spineColor: '#3730a3',
      },
      metadata: {
        pages: [{ id: uuidv4(), content: '' }],
      },
    });
  },

  createShape: (x, y, shapeType) => {
    return get().addObject({
      type: 'shape' as ObjectType,
      x,
      y,
      width: 120,
      height: 120,
      content: '',
      style: {
        strokeColor: '#6366f1',
        strokeWidth: 2,
        backgroundColor: 'transparent',
        opacity: 1,
      },
      metadata: { shapeType },
    });
  },

  addBookPage: (bookId) => {
    set((state) => ({
      objects: state.objects.map((o) => {
        if (o.id === bookId) {
          const pages = o.metadata?.pages || [];
          return {
            ...o,
            metadata: {
              ...o.metadata,
              pages: [...pages, { id: uuidv4(), content: '' }],
            },
          };
        }
        return o;
      }),
    }));
  },

  updateBookPage: (bookId, pageId, content) => {
    set((state) => ({
      objects: state.objects.map((o) => {
        if (o.id === bookId) {
          const pages = o.metadata?.pages?.map((p) =>
            p.id === pageId ? { ...p, content } : p
          );
          return {
            ...o,
            metadata: {
              ...o.metadata,
              pages,
            },
          };
        }
        return o;
      }),
    }));
  },

  deleteBookPage: (bookId, pageId) => {
    set((state) => ({
      objects: state.objects.map((o) => {
        if (o.id === bookId) {
          const pages = o.metadata?.pages?.filter((p) => p.id !== pageId);
          return {
            ...o,
            metadata: {
              ...o.metadata,
              pages,
            },
          };
        }
        return o;
      }),
    }));
  },
}));
