---
name: audit-render
description: Audit the browser rendering pipeline for scissor/clipping bypass bugs. Use when touching browser-buffer.ts, canvas-painter.ts, or adding visual features like borderRadius.
---

Audit the rendering pipeline to ensure every canvas-level drawing path respects the scissor (overflow:hidden) system.

1. Spawn the `render-pipeline-audit` agent as a background agent.

2. Wait for it to complete.

3. Present findings:
   - **Must Fix**: Any buffer→painter channel missing scissor capture or painter clipping
   - **Should Fix**: Channels with bounds-checking but no scissor clipping (low risk)
   - **OK**: Channels that are safe (cell-grid bounded or fully scissor-aware)

4. If issues are found, suggest the fix pattern:
   - Add `clipRect?` field to the data type
   - Capture `scissorStack[top]` at write time, skip if fully outside
   - Apply `ctx.save()` / `ctx.rect(clipRect)` / `ctx.clip()` / `ctx.restore()` in the painter
   - Add tests for: capture, skip, paint-clip, no-clip-when-absent
