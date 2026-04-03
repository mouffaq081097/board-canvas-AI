# Roadmap Engine Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a "Generate Roadmap" button to `FloatingContextMenu` that converts a StandardNote's todo items into a visual branching roadmap of rough-styled sticky notes connected by labeled arrows.

**Architecture:** AI returns a semantic graph (`nodes` + `edges`) with logical `depth`/`branch` positions but no coordinates. A pure client-side layout function converts these to canvas x/y positions. A single batch Zustand call commits all objects and connections with no intermediate renders.

**Tech Stack:** Next.js 16 API route, Google Gemini (`gemini-2.5-flash`), Vitest (new — for layout algorithm), Zustand 5, Lucide React (`GitFork`), existing `addObjects`/`addConnection` store actions.

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `src/lib/roadmapLayout.ts` | **Create** | Pure layout algorithm — AI nodes → canvas positions. Zero side effects. |
| `src/app/api/ai/roadmap/route.ts` | **Create** | Gemini prompt, JSON validation, returns `{ nodes, edges }` |
| `src/hooks/useAI.ts` | **Modify** | Add `'roadmap'` to `AIAction`; special-case request body; add roadmap switch case |
| `src/components/ui/FloatingContextMenu.tsx` | **Modify** | Eligibility gate + `GitFork` button in AI cluster |
| `vitest.config.ts` | **Create** | Minimal Vitest config for unit-testing pure functions |
| `src/lib/__tests__/roadmapLayout.test.ts` | **Create** | Unit tests for layout algorithm |

---

## Task 1: Vitest Setup

No test framework exists in this project. Add minimal Vitest so the layout algorithm can be unit-tested.

**Files:**
- Create: `vitest.config.ts`
- Modify: `package.json` (add test script + devDependency)

- [ ] **Step 1: Install Vitest**

```bash
npm install --save-dev vitest
```

Expected: vitest appears in `devDependencies` in `package.json`.

- [ ] **Step 2: Create vitest config**

Create `vitest.config.ts`:

```ts
import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'node',
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

- [ ] **Step 3: Add test script to package.json**

In `package.json`, add to `"scripts"`:
```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 4: Verify setup works**

```bash
npm test
```

Expected output: `No test files found` (or similar — Vitest runs with no failures).

- [ ] **Step 5: Commit**

```bash
git add vitest.config.ts package.json package-lock.json
git commit -m "chore: add Vitest for unit testing pure functions"
```

---

## Task 2: Layout Algorithm (`roadmapLayout.ts`)

A pure function with no imports from the app — just math. Takes AI nodes and the source object's position; returns canvas-ready objects and the AI→canvas ID mapping data.

**Files:**
- Create: `src/lib/__tests__/roadmapLayout.test.ts`
- Create: `src/lib/roadmapLayout.ts`

### Types used in this task

```ts
// These come from @/types/canvas — already defined
interface CanvasObjectStyle {
  backgroundColor: string;
  textColor: string;
  fontFamily: string;
  fontSize: number;
  opacity: number;
  roughEdges: boolean;
}

// Internal to roadmapLayout.ts
export interface RoadmapNode {
  id: string;
  label: string;
  duration: string;
  depth: number;
  branch: number;
}

export interface RoadmapEdge {
  from: string;
  to: string;
}

export interface LayoutResult {
  // Canvas objects ready for addObjects() — index 0 is always the Start node
  canvasNodes: {
    type: 'sticky';
    x: number;
    y: number;
    width: number;
    height: number;
    content: string;
    style: CanvasObjectStyle;
  }[];
  // AI node IDs in same order as canvasNodes. Index 0 = '__START__'
  aiNodeIds: string[];
  // Maps AI node id → duration string (for connection labels)
  durationMap: Map<string, string>;
}
```

- [ ] **Step 1: Write failing tests**

Create `src/lib/__tests__/roadmapLayout.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { layoutRoadmap } from '../roadmapLayout';

const source = { x: 100, y: 200, height: 360 };

const nodes = [
  { id: 'n1', label: 'Design mockups', duration: '2 days', depth: 0, branch: 0 },
  { id: 'n2', label: 'Write API spec', duration: '1 day',  depth: 0, branch: 1 },
  { id: 'n3', label: 'Build frontend', duration: '3 days', depth: 1, branch: 0 },
];

describe('layoutRoadmap', () => {
  it('returns one extra node (Start) at index 0', () => {
    const { canvasNodes, aiNodeIds } = layoutRoadmap(source, nodes);
    expect(canvasNodes.length).toBe(nodes.length + 1);
    expect(aiNodeIds[0]).toBe('__START__');
  });

  it('positions depth-0 nodes directly right of Start column', () => {
    const { canvasNodes, aiNodeIds } = layoutRoadmap(source, nodes);
    const n1Index = aiNodeIds.indexOf('n1');
    const n1 = canvasNodes[n1Index];
    // depth 0: x = source.x + 0 * (200 + 80) = 100
    expect(n1.x).toBe(100);
  });

  it('positions depth-1 nodes one column further right', () => {
    const { canvasNodes, aiNodeIds } = layoutRoadmap(source, nodes);
    const n3Index = aiNodeIds.indexOf('n3');
    const n3 = canvasNodes[n3Index];
    // depth 1: x = source.x + 1 * (200 + 80) = 380
    expect(n3.x).toBe(380);
  });

  it('stacks branch-1 below branch-0 at same depth', () => {
    const { canvasNodes, aiNodeIds } = layoutRoadmap(source, nodes);
    const n1Index = aiNodeIds.indexOf('n1');
    const n2Index = aiNodeIds.indexOf('n2');
    expect(canvasNodes[n2Index].y).toBeGreaterThan(canvasNodes[n1Index].y);
  });

  it('Start node uses distinct background color', () => {
    const { canvasNodes } = layoutRoadmap(source, nodes);
    expect(canvasNodes[0].style.backgroundColor).toBe('#e0e7ff');
  });

  it('builds durationMap correctly', () => {
    const { durationMap } = layoutRoadmap(source, nodes);
    expect(durationMap.get('n1')).toBe('2 days');
    expect(durationMap.get('n3')).toBe('3 days');
  });

  it('sets roughEdges: true on all nodes', () => {
    const { canvasNodes } = layoutRoadmap(source, nodes);
    expect(canvasNodes.every(n => n.style.roughEdges)).toBe(true);
  });
});
```

- [ ] **Step 2: Run tests — confirm they fail**

```bash
npm test
```

Expected: `Cannot find module '../roadmapLayout'` (or similar import error).

- [ ] **Step 3: Implement `roadmapLayout.ts`**

Create `src/lib/roadmapLayout.ts`:

```ts
export interface RoadmapNode {
  id: string;
  label: string;
  duration: string;
  depth: number;
  branch: number;
}

export interface RoadmapEdge {
  from: string;
  to: string;
}

const NODE_W = 200;
const NODE_H = 120;
const COL_GAP = 80;
const ROW_GAP = 40;

const REGULAR_STYLE = {
  backgroundColor: '#fef9c3',
  textColor: '#1a1a1a',
  fontFamily: 'caveat',
  fontSize: 16,
  opacity: 1,
  roughEdges: true,
} as const;

const START_STYLE = {
  ...REGULAR_STYLE,
  backgroundColor: '#e0e7ff',
} as const;

export interface LayoutResult {
  canvasNodes: {
    type: 'sticky';
    x: number;
    y: number;
    width: number;
    height: number;
    content: string;
    style: typeof REGULAR_STYLE;
  }[];
  aiNodeIds: string[];
  durationMap: Map<string, string>;
}

export function layoutRoadmap(
  source: { x: number; y: number; height: number },
  nodes: RoadmapNode[],
): LayoutResult {
  const baseY = source.y + source.height + 60;

  // Compute x/y for each AI node
  const positioned = nodes.map((n) => ({
    ...n,
    x: source.x + n.depth * (NODE_W + COL_GAP),
    y: baseY + n.branch * (NODE_H + ROW_GAP),
  }));

  // Start node: one column left of depth-0, vertically centered across depth-0 branches
  const depth0Branches = nodes.filter((n) => n.depth === 0).map((n) => n.branch);
  const minBranch = Math.min(...depth0Branches);
  const maxBranch = Math.max(...depth0Branches);
  const startBranchCenter = (minBranch + maxBranch) / 2;

  const startNode = {
    type: 'sticky' as const,
    x: source.x - NODE_W - COL_GAP,
    y: baseY + startBranchCenter * (NODE_H + ROW_GAP),
    width: NODE_W,
    height: NODE_H,
    content: 'Start',
    style: START_STYLE,
  };

  const regularNodes = positioned.map((n) => ({
    type: 'sticky' as const,
    x: n.x,
    y: n.y,
    width: NODE_W,
    height: NODE_H,
    content: n.label,
    style: REGULAR_STYLE,
  }));

  const durationMap = new Map(nodes.map((n) => [n.id, n.duration]));

  return {
    canvasNodes: [startNode, ...regularNodes],
    aiNodeIds: ['__START__', ...nodes.map((n) => n.id)],
    durationMap,
  };
}
```

- [ ] **Step 4: Run tests — confirm they pass**

```bash
npm test
```

Expected: `7 passed` with no failures.

- [ ] **Step 5: Commit**

```bash
git add src/lib/roadmapLayout.ts src/lib/__tests__/roadmapLayout.test.ts
git commit -m "feat: add roadmapLayout pure layout algorithm with tests"
```

---

## Task 3: API Route (`/api/ai/roadmap`)

**Files:**
- Create: `src/app/api/ai/roadmap/route.ts`

- [ ] **Step 1: Create the route**

Create `src/app/api/ai/roadmap/route.ts`:

```ts
import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { TodoItem } from '@/types/canvas';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY || '');
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

interface RoadmapNode {
  id: string;
  label: string;
  duration: string;
  depth: number;
  branch: number;
}

interface RoadmapEdge {
  from: string;
  to: string;
}

interface RoadmapResponse {
  nodes: RoadmapNode[];
  edges: RoadmapEdge[];
}

export async function POST(req: NextRequest) {
  try {
    const { todos }: { todos: TodoItem[] } = await req.json();

    if (!todos?.length) {
      return NextResponse.json({ error: 'No todos provided' }, { status: 400 });
    }

    const todoList = todos.map((t, i) => `${i + 1}. ${t.text}`).join('\n');

    const prompt = `You are a project planning assistant. Given these tasks, create a dependency graph.

Tasks:
${todoList}

Rules:
- Tasks that depend on others must come after them (higher depth)
- Tasks that can run in parallel share the same depth but different branch values
- depth starts at 0 (first column of tasks)
- branch starts at 0 within each depth level and increments by 1 for each parallel task
- Each (depth, branch) pair must be unique
- Estimate a realistic duration for each task (e.g. "2 days", "1 week", "3 hours")
- Keep labels concise (under 6 words)

Return ONLY valid JSON with no prose:
{
  "nodes": [
    { "id": "n1", "label": "short label", "duration": "X days", "depth": 0, "branch": 0 }
  ],
  "edges": [
    { "from": "n1", "to": "n2" }
  ]
}`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ error: 'AI returned invalid JSON' }, { status: 400 });
    }

    const data: RoadmapResponse = JSON.parse(jsonMatch[0]);

    if (!Array.isArray(data.nodes) || !Array.isArray(data.edges)) {
      return NextResponse.json({ error: 'AI response missing nodes or edges' }, { status: 400 });
    }

    // Validate unique (depth, branch) pairs
    const positions = new Set(data.nodes.map((n) => `${n.depth},${n.branch}`));
    if (positions.size !== data.nodes.length) {
      return NextResponse.json({ error: 'AI returned duplicate depth/branch positions' }, { status: 400 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Roadmap AI Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'AI error' },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 2: Manually verify the route (dev server must be running)**

Start the dev server in a separate terminal:
```bash
npm run dev
```

Then test the route with curl (use a PowerShell or Git Bash terminal):
```bash
curl -X POST http://localhost:3000/api/ai/roadmap \
  -H "Content-Type: application/json" \
  -d '{"todos":[{"id":"1","text":"Design the UI","done":false},{"id":"2","text":"Build the API","done":false},{"id":"3","text":"Write tests","done":false}]}'
```

Expected: JSON response with `nodes` and `edges` arrays, each node having `id`, `label`, `duration`, `depth`, `branch`.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/ai/roadmap/route.ts
git commit -m "feat: add /api/ai/roadmap route (Gemini → semantic graph)"
```

---

## Task 4: Hook Integration (`useAI.ts`)

**Files:**
- Modify: `src/hooks/useAI.ts`

- [ ] **Step 1: Add `'roadmap'` to the `AIAction` type and update store destructuring**

Open `src/hooks/useAI.ts`. Make these three changes:

**Change 1** — extend the type (line 7):
```ts
export type AIAction = 'group' | 'summarize' | 'brainstorm' | 'sketch' | 'ocr' | 'roadmap';
```

**Change 2** — add `addObjects` and `addConnection` to the store destructure (line 10):
```ts
const { selectedIds, objects, addObject, addObjects, addConnection, batchUpdateObjects, updateObject } = useCanvasStore();
```

**Change 3** — special-case the request body in `runAI` (replace the existing `body: JSON.stringify(...)` line inside the try block):
```ts
const body = action === 'roadmap'
  ? JSON.stringify({ todos: selectedObjects[0]?.metadata?.todoItems ?? [] })
  : JSON.stringify({ objects: selectedObjects, imageBase64 });

const res = await fetch(`/api/ai/${action}`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body,
});
```

- [ ] **Step 2: Add the `roadmap` case to the switch statement**

In the `switch (action)` block, add after the `'ocr'` case:

```ts
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
```

- [ ] **Step 3: Run the linter to catch type errors**

```bash
npm run lint
```

Expected: no errors. If TypeScript complains about the dynamic import, add `// eslint-disable-next-line @typescript-eslint/no-var-requires` above it or switch to a top-level import.

- [ ] **Step 4: Commit**

```bash
git add src/hooks/useAI.ts
git commit -m "feat: add roadmap case to useAI hook with layout + batch commit"
```

---

## Task 5: FloatingContextMenu Button

**Files:**
- Modify: `src/components/ui/FloatingContextMenu.tsx`

- [ ] **Step 1: Add the `GitFork` import**

In `FloatingContextMenu.tsx`, add `GitFork` to the existing lucide-react import:

```ts
import {
  Trash2, Type, Link as LinkIcon, Wand2, Group, BookMarked,
  Pencil, ScanText, ArrowRight, Lock, LockOpen, GitFork,
} from 'lucide-react';
```

- [ ] **Step 2: Add the eligibility constant**

After line `const primaryObject = selectedObjects[0];`, add:

```ts
const isRoadmapEligible =
  selectedObjects.length === 1 &&
  primaryObject.type === 'note' &&
  (primaryObject.metadata?.todoItems?.length ?? 0) > 0;
```

- [ ] **Step 3: Add the Roadmap button inside the AI actions cluster**

Find the AI actions `<div>` (the one with `className="flex items-center gap-0.5 bg-indigo-50/50 rounded-lg p-0.5"`). Add the Roadmap button as the first button inside it, before the existing Brainstorm button:

```tsx
{isRoadmapEligible && (
  <button
    onClick={() => runAI('roadmap')}
    disabled={loading !== null}
    className={`w-7 h-7 rounded-lg flex items-center justify-center transition ${
      loading === 'roadmap'
        ? 'text-indigo-600'
        : 'text-indigo-500 hover:bg-white hover:shadow-sm'
    }`}
    title="Generate Roadmap"
  >
    {loading === 'roadmap' ? (
      <div className="w-3.5 h-3.5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    ) : (
      <GitFork size={14} />
    )}
  </button>
)}
```

- [ ] **Step 4: Manual end-to-end test**

With the dev server running (`npm run dev`):

1. Create a `StandardNote` on the canvas
2. Switch it to todo mode (click the checkbox icon)
3. Add 3–5 todo items (e.g. "Design UI", "Build API", "Write docs", "Deploy")
4. Click the note to select it
5. Confirm the `GitFork` button appears in the floating context menu
6. Click it — spinner should appear
7. After a few seconds: rough-styled sticky notes appear below/right of the source note, connected by labeled arrows with duration labels (e.g. "2 days")
8. Confirm the Start node has a light indigo background (`#e0e7ff`)

- [ ] **Step 5: Run linter**

```bash
npm run lint
```

Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add src/components/ui/FloatingContextMenu.tsx
git commit -m "feat: add Roadmap button to FloatingContextMenu (Intelligence Layer 1/5)"
```

---

## Self-Review Checklist

**Spec coverage:**
- [x] Trigger: FloatingContextMenu button with eligibility gate — Task 5
- [x] Input: single StandardNote's `todoItems` — Task 4, Step 1 (request body)
- [x] AI returns semantic graph, no coordinates — Task 3
- [x] Client layout algorithm — Task 2
- [x] Start node auto-generated client-side — Task 2, Step 3
- [x] `rough` styling (`roughEdges: true`) — Task 2, Step 3 (`REGULAR_STYLE`)
- [x] Duration labels on connections — Task 4, Step 2 (`label: durationMap.get(...)`)
- [x] Batch Zustand commit (single `addObjects` call) — Task 4, Step 2
- [x] Non-overlapping layout (unique `depth, branch` pairs validated) — Task 3, Step 1

**Type consistency:**
- `layoutRoadmap` defined in Task 2, called in Task 4 — signatures match
- `RoadmapNode` / `RoadmapEdge` defined locally in both `roadmapLayout.ts` and `route.ts` — intentionally separate (route types are server-only)
- `aiNodeIds`, `canvasNodes`, `durationMap` — defined and consumed consistently across Tasks 2 and 4
