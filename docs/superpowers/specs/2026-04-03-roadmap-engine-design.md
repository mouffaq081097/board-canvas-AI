# Roadmap Engine — Design Spec
**Date:** 2026-04-03  
**Status:** Approved, ready for implementation planning  
**Feature:** Intelligence Layer — Feature 1 of 5

---

## Overview

Transform a `StandardNote` with todo items into a visual branching roadmap on the canvas. The AI determines task relationships (sequential vs. parallel); the client runs a deterministic tree-layout algorithm to place nodes without overlaps. Everything commits to Zustand in a single batch.

---

## Trigger & Eligibility

A "Roadmap" button appears in `FloatingContextMenu` inside the existing AI actions cluster, gated by:

```ts
const isRoadmapEligible =
  selectedObjects.length === 1 &&
  primaryObject.type === 'note' &&
  (primaryObject.metadata?.todoItems?.length ?? 0) > 0;
```

- Icon: `GitFork` from `lucide-react`
- Loading state: indigo spinner (matches existing AI buttons)
- Disabled while any other AI action is in progress

---

## API Route: `POST /api/ai/roadmap`

**File:** `src/app/api/ai/roadmap/route.ts`

### Request
```ts
{ todos: { id: string; text: string; done: boolean }[] }
```

### Prompt Strategy
Send the todo list to Gemini (`gemini-2.5-flash`, matching existing routes). Instruct the model to:
- Identify which tasks depend on others (sequential) vs. can run in parallel (same depth)
- Assign each node a `depth` (column, 0 = first) and `branch` (row within that column, 0-indexed)
- Estimate a realistic `duration` string (e.g. `"2 days"`, `"1 week"`)
- Return only valid JSON — no prose

### Response Shape
```ts
{
  nodes: [
    { id: string; label: string; duration: string; depth: number; branch: number }
  ],
  edges: [
    { from: string; to: string }
  ]
}
```

### Validation
- If JSON parse fails or `nodes`/`edges` are missing: return `400` with descriptive error
- `(depth, branch)` pairs must be unique — the prompt enforces this; the route validates it
- No silent fallbacks

---

## Tree-Layout Algorithm (client-side)

Runs in the `useAI` hook's `roadmap` handler, before any Zustand calls.

### Constants
```ts
const NODE_W = 200;
const NODE_H = 120;
const COL_GAP = 80;
const ROW_GAP = 40;
```

### Placement Formula
Anchored below the source `StandardNote`:
```ts
x = sourceNote.x + (depth * (NODE_W + COL_GAP))
y = sourceNote.y + sourceNote.height + 60 + (branch * (NODE_H + ROW_GAP))
```

### Start Node
A synthetic "Start" node is prepended by the client (not the AI):
- Positioned directly above depth-0 nodes, centered vertically across all branches
- Background: `#e0e7ff` (light indigo) to distinguish it as entry point
- Connected to every depth-0 node via an edge

---

## Zustand Integration

All objects and connections are committed in two sequential calls after layout:

### Sticky Notes — `addObjects`
```ts
{
  type: 'sticky',
  x, y,
  width: NODE_W,
  height: NODE_H,
  content: node.label,
  style: {
    backgroundColor: '#fef9c3',   // Start node: '#e0e7ff'
    textColor: '#1a1a1a',
    fontFamily: 'caveat',
    fontSize: 16,
    opacity: 1,
    roughEdges: true,
  }
}
```

### Connections — `addConnection` (per edge)
```ts
{
  fromId: idMap[edge.from],   // resolved from local Map<aiNodeId, canvasObjectId>
  toId: idMap[edge.to],
  fromAnchor: 'right',
  toAnchor: 'left',
  color: '#6366f1',
  label: nodeDurationMap[edge.to],  // duration of the destination node
}
```

The local `Map<aiNodeId, canvasObjectId>` is built from the array returned by `addObjects`. Duration labels are rendered by the existing `ConnectionLayer` label system — no new UI needed.

---

## Hook Integration Details (`useAI.ts`)

Three changes required:

1. **Extend `AIAction` type:** add `'roadmap'` to the union
2. **Special-case request body:** roadmap sends `{ todos }` not `{ objects }`:
   ```ts
   body: action === 'roadmap'
     ? JSON.stringify({ todos: selectedObjects[0].metadata?.todoItems ?? [] })
     : JSON.stringify({ objects: selectedObjects, imageBase64 })
   ```
3. **Destructure additional store actions:** `addObjects`, `addConnection` (not currently in the hook)

### Start Node Position Formula
```ts
const depth0Nodes = nodes.filter(n => n.depth === 0);
const minBranch = 0;
const maxBranch = Math.max(...depth0Nodes.map(n => n.branch));
const startY = sourceNote.y + sourceNote.height + 60
  + ((minBranch + maxBranch) / 2) * (NODE_H + ROW_GAP)
  + NODE_H / 2 - NODE_H / 2;  // simplified: center of branch range
const startX = sourceNote.x - NODE_W - COL_GAP;
```
Start node sits one column to the left of depth-0 nodes, vertically centered across all depth-0 branches.

---

## Files Changed

| File | Change |
|------|--------|
| `src/app/api/ai/roadmap/route.ts` | New — AI route |
| `src/hooks/useAI.ts` | Add `'roadmap'` to `AIAction`; special-case request body; destructure `addObjects`, `addConnection`; add roadmap case to switch |
| `src/components/ui/FloatingContextMenu.tsx` | Add Roadmap button with eligibility gate |

---

## Out of Scope (v1)
- Multi-note input (single note only)
- User editing of AI-assigned durations before placement
- Roadmap re-generation / update flow
- Clarity Mode integration (Feature 4)
