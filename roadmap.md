# Bug Fixes & UX Polish (Implementation Plan)

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` or `superpowers:executing-plans` to implement this plan task-by-task.

**Goal:** Fix a specific list of bugs and improve canvas interactions, z-indexing, multi-selection, and context menus.

---

## Task 1: Context Menu Cleanup (Quick Wins) (DONE)
**Files:** `src/components/ui/FloatingContextMenu.tsx`, `src/hooks/useAI.ts`, `src/components/canvas/Canvas.tsx`

1. **Remove Sketch-to-Vector:**
   - In `FloatingContextMenu.tsx`, remove the `Pencil` button (sketch-to-vector).
   - In `useAI.ts`, remove the `'sketch'` action from the `AIAction` type and the `switch` statement.
2. **Remove Opacity Slider & Copy Link:**
   - In `FloatingContextMenu.tsx`, delete the `<input type="range">` (opacity) block and the `LinkIcon` (copy link) button.
3. **Hide AI Toolbox for Shape/Book:**
   - In `FloatingContextMenu.tsx`, hide the entire AI actions cluster (`div` with `bg-indigo-50/50`) if `selectedObjects.some(o => o.type === 'shape' || o.type === 'book')`.
4. **Fix Tooltip Distance:**
   - In `src/components/canvas/Canvas.tsx`, find where `selectionBox` renders the `FloatingContextMenu`. Adjust the `top` or `transform` Y-offset to push it further above the selected object (e.g., change `top: selectionBox.y - 60` to `selectionBox.y - 80` or similar).
5. **Fix Lock Button:**
   - Investigate why the lock toggle isn't working. Ensure `toggleObjectLock` in `canvasStore.ts` correctly updates the `locked` property, and `CanvasObject.tsx` respects `object.locked` properly without breaking pointer events for the unlock button.

---

## Task 2: Object Rendering & Styling (Z-Index & Books) (DONE)
**Files:** `src/components/canvas/CanvasObject.tsx`, `src/components/canvas/Book.tsx`

1. **Shapes Under Objects (Z-Index):**
   - In `CanvasObject.tsx`, adjust the `zIndex` logic.
   - Example: `zIndex: isSelected ? 100 : (object.type === 'shape' ? 0 : 10)` so shapes always sit behind notes and books unless selected.
2. **Book Resizing & Corners:**
   - In `CanvasObject.tsx`, hide the 8-point resize handles and the W/H inputs if `object.type === 'book'`. (It currently hides W/H inputs, but double check resize handles).
   - In `src/components/canvas/Book.tsx`, remove rounded corners (`rounded-xl`, `rounded-r-xl`, etc.) to make the book strictly rectangular.

---

## Task 3: Canvas Interactions (Multi-Move & Double Click) (DONE)
**Files:** `src/store/canvasStore.ts`, `src/components/canvas/CanvasObject.tsx`

1. **Multi-Object Dragging:**
   - Update `CanvasObject.tsx` `handlePointerMove` and `handlePointerUp`.
   - If the dragged object is part of `selectedIds`, calculate the `dx/dy` delta and move *all* objects in `selectedIds` together.
   - Add a `moveObjects: (deltas: {id: string, x: number, y: number}[]) => void` action to `canvasStore.ts` (or use `batchUpdateObjects`) to commit the multi-move on pointer up.
2. **Double Click Book to Open:**
   - In `CanvasObject.tsx`, add an `onDoubleClick` event handler.
   - If `object.type === 'book'`, call `setIsBookModalOpen(true)` and `setFocusedObjectId(object.id)` (available from `canvasStore`).
   - Ensure pointer events allow double-clicking even when selected.

---

## Task 4: iPad Zooming & Gestures (DONE)
**Files:** `src/components/canvas/Canvas.tsx`

1. **Improve Touch Zooming:**
   - In `Canvas.tsx`, review the `wheel` and `touch` event handlers.
   - Implement or refine pinch-to-zoom logic using `e.touches`. Calculate the distance between two fingers to adjust the `viewport.scale` smoothly around the pinch center, preventing erratic jumps.

---

## Task 5: Undo/Redo System (DONE)
**Files:** `src/store/canvasStore.ts`, `src/components/ui/Toolbar.tsx`

1. **Implement Undo History:**
   - Add a simple history stack to `canvasStore.ts` (e.g., `past: CanvasState[]`, `future: CanvasState[]`).
   - Create an `undo()` and `redo()` action.
   - Hook into critical destructive actions (like `deleteObjects`, `deleteConnection`, `batchUpdateObjects`) to push the current state to the `past` array before modifying.
   - *Alternative:* Install `zundo` middleware for Zustand if a robust solution is preferred.
2. **UI Triggers:**
   - Add standard Undo (Ctrl+Z) and Redo (Ctrl+Y / Cmd+Shift+Z) keyboard shortcuts in `Canvas.tsx` using `react-hotkeys-hook`.
   - Add Undo/Redo icon buttons to the `Toolbar.tsx`.