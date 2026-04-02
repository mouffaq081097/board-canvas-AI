# MindCanvas-AI — Project Memory

> This file tracks planned features, architectural decisions, and implementation context.
> Updated: 2026-04-02

---

## Planned Enhancement: Canvas UI Overhaul (2026-04-02)

Full implementation plan is at: `C:\Users\Mouffaq\.claude\plans\mighty-wiggling-hollerith.md`

### 1. Selection Tool Enhancements
- **Hover bounding box**: Dashed indigo-400 outline on hover before click
- **Resize handles**: Enlarged to 16px with glow on hover (was 12px)
- **Marquee selection**: Semi-transparent indigo fill + animated dashed border
- **Files**: `src/components/canvas/CanvasObject.tsx`, `src/components/canvas/Canvas.tsx`

### 2. Shape Picker — Combined Icon + New Shapes
- All shape tools merged into one toolbar button → floating popover grid
- **8 shapes**: Circle, Rectangle, Arrow + Triangle, Diamond, Star, Hexagon, Pentagon
- New `activeShapeType` field in Zustand store
- New component: `src/components/ui/ShapePicker.tsx`
- **Files**: `src/components/ui/Toolbar.tsx`, `src/components/canvas/ShapeOverlay.tsx`, `src/types/canvas.ts`

### 3. Book — Microsoft OneNote Layout
- **Hierarchy**: Sections (tabs at top) → Pages (right-side panel, always visible)
- **Section tabs**: Color-coded, renameable (double-click), add/delete
- **Page list**: Right panel (200px), editable titles, drag-to-reorder, add/delete
- **Rich text editor**: Tiptap with Bold, Italic, Underline, H1/H2, BulletList, OrderedList, TaskList
- Floating formatting toolbar on text selection
- **Type system update**:
  ```ts
  BookSection { id, title, color, pages: BookPage[] }
  BookPage { id, title, content }  // content = Tiptap HTML
  ```
- Old `metadata.pages[]` migrated to `metadata.sections[0].pages` on first open
- **Install**: `npm install @tiptap/react @tiptap/pm @tiptap/starter-kit @tiptap/extension-underline @tiptap/extension-task-list @tiptap/extension-task-item`
- **Files**: `src/components/canvas/BookModal.tsx`, `src/components/canvas/Book.tsx`, `src/types/canvas.ts`, `src/store/canvasStore.ts`

### 4. Table Object (New ObjectType: `'table'`)
- Full-featured: editable column headers, add/remove rows & cols, cell bold/color, resizable columns
- Cell styling toolbar appears on cell focus
- Default: 3×3 grid, 320×240px
- **Metadata shape**:
  ```ts
  tableData: { rows, cols, cells[][], colWidths?, headers?, cellStyles? }
  ```
- **Files**: New `src/components/canvas/TableObject.tsx`, `src/types/canvas.ts`, `src/store/canvasStore.ts`, `src/components/ui/Toolbar.tsx`, `src/components/canvas/CanvasObject.tsx`

### 5. Image & GIF Object (New ObjectType: `'image'`)
- Input methods: upload from device, paste from clipboard (Ctrl+V), URL input
- Placeholder state (dashed border + icon) until image is loaded
- GIF: detected via file extension or MIME type, stored as data URL or raw URL
- **Metadata shape**: `imageUrl?, imageAlt?, isGif?`
- **Files**: New `src/components/canvas/ImageObject.tsx`, `src/types/canvas.ts`, `src/store/canvasStore.ts`, `src/components/ui/Toolbar.tsx`, `src/components/canvas/CanvasObject.tsx`

### 6. Object Sizing — W/H Input Fields
- Compact floating pill above selected object with W: and H: number inputs
- Enter/blur commits the resize
- **Files**: `src/components/canvas/CanvasObject.tsx`

### 7. Minimap — Snap to Corners (YouTube PiP)
- On drag release: spring-animate to nearest corner (TL, TR, BL, BR)
- Corners inset 16px from viewport edges
- Always snaps — no free-floating in the middle of the screen
- **Files**: `src/components/ui/MiniMap.tsx`

---

## Implementation Order
1. Types & Store (`canvas.ts`, `canvasStore.ts`)
2. Shape system (`ShapeOverlay.tsx`, new `ShapePicker.tsx`)
3. Selection enhancements (`CanvasObject.tsx`, `Canvas.tsx`)
4. Table object (`TableObject.tsx` + wiring)
5. Image/GIF object (`ImageObject.tsx` + wiring)
6. Book/OneNote (install Tiptap → `BookModal.tsx`, `Book.tsx`)
7. Toolbar consolidation (`Toolbar.tsx`)
8. Minimap snap-to-corners (`MiniMap.tsx`)

---

## Architecture Decisions

### Object Type Pattern
Every new canvas object type follows this pattern:
1. Add type to `ObjectType` union in `canvas.ts`
2. Add tool to `ToolType` union in `canvas.ts`
3. Add metadata fields to `ObjectMetadata` in `canvas.ts`
4. Add `add<Type>()` action to `canvasStore.ts`
5. Create `<Type>Object.tsx` component
6. Register in `CanvasObject.tsx` render switch
7. Add toolbar button in `Toolbar.tsx`

### State Management
- Single Zustand store (`canvasStore.ts`) is the source of truth
- During drag: direct DOM mutation (`elementRef.style.left/top`) — no React renders
- On pointer-up: commit to Zustand
- Viewport state lives in a ref (`vpRef`), synced to Zustand on 100ms debounce

### Performance
- Never update Zustand during mouse/pointer move events
- Use `pointer capture` for drag operations
- `memo()` wraps all canvas object components

### Styling
- Tailwind v4: all theme config in `globals.css` `@theme {}` blocks
- Active tool: `bg-indigo-600 text-white`
- Selection: indigo-500 ring
- Handles: 16px circles, indigo-500 border, white fill
