@AGENTS.md

## Stack
Next.js 16.2 (Turbopack), React 19, Tailwind v4 (CSS-only config), Framer Motion 12,
Zustand 5, Supabase Auth + PostgreSQL, Anthropic SDK + Google Generative AI, `rough` (sketch rendering),
Tiptap (rich text editor — used in BookModal)

## Commands
```bash
npm run dev    # Start dev server (Turbopack)
npm run build  # Production build
npm run lint   # ESLint
```

## Architecture
```
src/
  app/
    (auth)/         # Auth route group
    (dashboard)/    # Dashboard route group
    api/
      ai/           # AI endpoints: brainstorm, group, ocr, sketch, summarize
      boards/       # Board CRUD
      canvas/       # Canvas save/load
  components/
    canvas/
      Canvas.tsx          # Main viewport, pan/zoom, marquee selection
      CanvasObject.tsx    # Object wrapper: selection handles, hover box, W/H inputs, resize, rotation
      DrawingCanvas.tsx   # HTML5 canvas pen/eraser tool
      StickyNote.tsx      # Sticky note object
      StandardNote.tsx    # Standard note with todo mode
      Book.tsx            # Book object (canvas card)
      BookModal.tsx       # OneNote-style modal: sections tabs + page list + Tiptap editor
      ShapeOverlay.tsx    # SVG shapes: circle, rectangle, arrow, triangle, diamond, star, hexagon, pentagon
      TableObject.tsx     # Table with editable cells, add/remove rows & cols, cell styling
      ImageObject.tsx     # Image/GIF object: upload, paste, URL input
      ConnectionLayer.tsx # Bezier connection curves between objects
      AnchorPoint.tsx     # Connection anchor dots on objects
    ui/
      Toolbar.tsx         # Left toolbar: shapes merged into ShapePicker popover, table, image tools
      ShapePicker.tsx     # Floating popover grid of all 8 shape types
      MiniMap.tsx         # Minimap with YouTube PiP snap-to-corners behavior
      FloatingContextMenu.tsx  # AI + object actions menu
      AIPanel.tsx         # AI side panel
  store/
    canvasStore.ts  # Zustand store — single source of truth for canvas state
  lib/
    supabase.ts         # Browser Supabase client
    supabaseServer.ts   # Server Supabase client
    canvasUtils.ts      # screenToCanvas, canvasToScreen, getAnchorPoint
  types/
    canvas.ts           # All TypeScript interfaces: CanvasObject, ObjectType, ToolType, metadata shapes
  proxy.ts              # Route protection (NOT middleware.ts — Next.js 16 breaking change)
```

## Object Types
Current `ObjectType` values: `'sticky' | 'note' | 'book' | 'shape' | 'drawing' | 'table' | 'image'`

### Adding a New Object Type (Pattern)
1. Add to `ObjectType` union in `src/types/canvas.ts`
2. Add to `ToolType` union in `src/types/canvas.ts`
3. Add metadata fields to `ObjectMetadata` in `src/types/canvas.ts`
4. Add `add<Type>()` action in `src/store/canvasStore.ts`
5. Create `src/components/canvas/<Type>Object.tsx`
6. Register in `CanvasObject.tsx` render switch
7. Add toolbar button in `src/components/ui/Toolbar.tsx`

## Key Gotchas
- Tailwind v4: config lives in `globals.css` `@theme {}` blocks, NOT `tailwind.config.ts`
- Route protection uses `proxy.ts`, not `middleware.ts` (Next.js 16 breaking change)
- All pages using Supabase require `export const dynamic = 'force-dynamic'`
- `rough` library used for hand-drawn sketch rendering on canvas
- **Never update Zustand during pointermove** — use direct DOM mutation, commit to store on pointerup
- Shape metadata uses `metadata.shapeType` — now supports: `circle | rectangle | arrow | triangle | diamond | star | hexagon | pentagon`
- Book structure uses `metadata.sections[]` (Sections → Pages). Old `metadata.pages[]` is migrated on first open.
- Tiptap stores content as HTML string in `BookPage.content`
- MiniMap snaps to corners on drag release (YouTube PiP behavior) — do not allow free placement

## Performance Rules
- Drag operations: mutate `elementRef.style` directly, commit to Zustand on pointerup only
- Viewport: stored in `vpRef`, synced to Zustand on 100ms debounce
- All canvas object components are wrapped in `React.memo()`
- Use `setPointerCapture()` for all drag interactions

## Design System
- Primary: indigo-600 (active tools, selections)
- Selection handles: 16px circles, indigo-500 border, white fill, glow on hover
- Hover state: dashed indigo-400 bounding box
- Marquee: semi-transparent indigo fill + dashed indigo-500 border
- Toolbar buttons: 36×36px rounded-xl, active = `bg-indigo-600 text-white`
- All theme tokens in `src/app/globals.css` `@theme {}` block

## Environment (.env.local)
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
ANTHROPIC_API_KEY=
# GOOGLE_GENERATIVE_AI_API_KEY= (if using Gemini features)
```

## Database Setup
Run `supabase-setup.sql` in Supabase SQL Editor to create boards table with RLS

## See Also
- `Memory.md` — full enhancement plan and architectural decisions
