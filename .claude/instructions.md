# Create the directory if it doesn't exist
mkdir .claude
# Write the 'Skill' directly to a file Claude Code reads
@'
# Engineering Excellence & AI Logic Rules

## React 19 & Next.js 16 (Turbopack)
- Use the `use()` hook for handling AI stream promises in components.
- Optimize canvas rendering by memoizing the `rough` library instances.

## Zustand 5 State Strategy
- **Batching:** Use a single `set()` call for AI-generated roadmaps to prevent UI flicker.
- **Selective Subscriptions:** Only subscribe components to the specific properties they need (e.g., `node.x`, `node.y`).

## AI Roadmap Geometry
- When generating flowcharts, calculate coordinates to avoid overlapping existing `CanvasObject` bounds.
- Connect related nodes using `fromId` and `toId` with Bezier path logic.
'@ | Out-File -FilePath .claude/instructions.md -Encoding utf8