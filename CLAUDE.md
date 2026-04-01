@AGENTS.md

## Stack
Next.js 16.2 (Turbopack), React 19, Tailwind v4 (CSS-only config), Framer Motion 12,
Zustand 5, Supabase Auth + PostgreSQL, Anthropic SDK + Google Generative AI, `rough` (sketch rendering)

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
  components/       # Canvas components (Canvas.tsx, DrawingCanvas.tsx, etc.)
  store/
    canvasStore.ts  # Zustand store — single source of truth for canvas state
  lib/
    supabase.ts         # Browser Supabase client
    supabaseServer.ts   # Server Supabase client
  proxy.ts              # Route protection (NOT middleware.ts — Next.js 16 breaking change)
```

## Key Gotchas
- Tailwind v4: config lives in `globals.css` `@theme {}` blocks, NOT `tailwind.config.ts`
- Route protection uses `proxy.ts`, not `middleware.ts` (Next.js 16 breaking change)
- All pages using Supabase require `export const dynamic = 'force-dynamic'`
- `rough` library used for hand-drawn sketch rendering on canvas

## Environment (.env.local)
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
ANTHROPIC_API_KEY=
# GOOGLE_GENERATIVE_AI_API_KEY= (if using Gemini features)
```

## Database Setup
Run `supabase-setup.sql` in Supabase SQL Editor to create boards table with RLS
