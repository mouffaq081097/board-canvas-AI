---
name: canvas-object-dev
description: Use when adding new object types, tools, or major UI components to MindCanvas-AI (freeform-pro). Covers the required pattern for types, store, component, toolbar wiring, and canvas rendering.
trigger: when adding a new canvas object type, new tool, or modifying CanvasObject/Toolbar/ShapeOverlay
---

# MindCanvas Canvas Object Development Guide

This skill ensures new canvas objects are added correctly and consistently across all layers of the app.

## Required Pattern for New Object Types

Every new canvas object type touches exactly these 7 places — in this order:

### 1. `src/types/canvas.ts`
```ts
// Add to ObjectType union
export type ObjectType = 'sticky' | 'note' | 'book' | 'shape' | 'drawing' | 'table' | 'image' | 'YOUR_TYPE';

// Add to ToolType union
export type ToolType = ... | 'YOUR_TYPE';

// Add metadata fields to ObjectMetadata
export interface ObjectMetadata {
  // ...existing...
  yourTypeData?: {
    // type-specific fields
  };
}
```

### 2. `src/store/canvasStore.ts`
```ts
addYourType: (x: number, y: number) => {
  const obj: CanvasObject = {
    id: uuidv4(),
    type: 'YOUR_TYPE',
    x, y,
    width: DEFAULT_WIDTH,
    height: DEFAULT_HEIGHT,
    content: '',
    style: { backgroundColor: '#ffffff' },
    metadata: { yourTypeData: { /* defaults */ } },
  };
  set((s) => ({ objects: [...s.objects, obj] }));
},
```

### 3. Create `src/components/canvas/YourTypeObject.tsx`
- Accept `{ object: CanvasObject; isSelected: boolean }` props
- Handle `onUpdate(partial: Partial<CanvasObject>)` for edits
- Use `stopPropagation()` on pointer events to prevent canvas interactions
- Do NOT implement resize/drag here — `CanvasObject.tsx` handles that wrapper

### 4. `src/components/canvas/CanvasObject.tsx`
Add to the render switch:
```tsx
{object.type === 'YOUR_TYPE' && (
  <YourTypeObject object={object} isSelected={isSelected} onUpdate={handleUpdate} />
)}
```

### 5. `src/components/ui/Toolbar.tsx`
Add button in the appropriate section:
```tsx
<ToolButton
  tool="YOUR_TYPE"
  icon={<YourIcon size={16} />}
  label="YOUR LABEL"
  shortcut="Y"
/>
```

### 6. `src/app/canvas/[boardId]/page.tsx` or `Canvas.tsx`
Handle `activeTool === 'YOUR_TYPE'` in the canvas click handler to call `addYourType(x, y)`.

### 7. (If applicable) `src/components/canvas/ShapeOverlay.tsx`
Only needed for new shape sub-types (circle, triangle, etc.) — add SVG path rendering.

---

## Critical Performance Rules

**NEVER call Zustand setters during `pointermove`.**
- During drag: mutate `elementRef.current.style.left/top` directly
- On `pointerup`: commit the final position to Zustand once

**NEVER trigger re-renders during interaction.**
- Store interaction state in refs, not useState
- Use `useCallback` for event handlers

```ts
const dragRef = useRef({ startX: 0, startY: 0, startObjX: 0, startObjY: 0 });
```

---

## Object Sizing Defaults
| Type     | Width | Height |
|----------|-------|--------|
| sticky   | 200   | 200    |
| note     | 280   | 360    |
| book     | 160   | 220    |
| shape    | 120   | 120    |
| table    | 320   | 240    |
| image    | 200   | 200    |

Minimum size: **40px** (enforced in resize logic in `CanvasObject.tsx`).

---

## Design Rules
- Selection handles: 16px circles, `border-indigo-500`, `bg-white`, glow on hover
- Hover state: dashed `border-indigo-400` outline (even before selection)
- Active tool button: `bg-indigo-600 text-white`
- Toolbar buttons: `w-9 h-9 rounded-xl`
- All Tailwind theme tokens are in `globals.css` `@theme {}` — NOT in `tailwind.config.ts`

---

## Book Object Specifics
- **Hierarchy**: `BookSection[]` → `BookPage[]` (stored in `metadata.sections`)
- **Rich text**: Tiptap HTML stored in `BookPage.content`
- **Migration**: On modal open, if `metadata.pages` exists and `metadata.sections` doesn't, migrate automatically
- **OneNote layout**: Section tabs (top) + page list (right, always visible) + Tiptap editor (main area)

## Minimap Specifics
- Always snaps to nearest corner on drag release (YouTube PiP behavior)
- Corners: 16px inset from viewport edges
- Spring animation via Framer Motion `animate`

## Shape Sub-types
Current: `circle | rectangle | arrow | triangle | diamond | star | hexagon | pentagon`
All rendered as SVG in `ShapeOverlay.tsx`. Shape tool uses `activeShapeType` in Zustand store.
Toolbar shows single "Shapes" button → `ShapePicker.tsx` popover with 8 shape icons.
