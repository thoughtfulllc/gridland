import type { BrowserBuffer } from "./browser-buffer"
import type { BrowserRenderContext } from "./browser-render-context"

/**
 * Shared render pipeline used by both BrowserRenderer and HeadlessRenderer.
 * Runs lifecycle passes, calculates layout, collects and executes render commands.
 */
export function executeRenderPipeline(
  buffer: BrowserBuffer,
  renderContext: BrowserRenderContext,
  root: any,
  deltaTime: number,
): void {
  // Clear buffer
  buffer.clear()

  // Run lifecycle passes
  const lifecyclePasses = renderContext.getLifecyclePasses()
  for (const renderable of lifecyclePasses) {
    if (renderable.onLifecyclePass) {
      renderable.onLifecyclePass()
    }
  }

  // Calculate layout
  root.calculateLayout()

  // Collect render commands
  const renderList: any[] = []
  root.updateLayout(deltaTime, renderList)

  // Execute render commands
  for (const cmd of renderList) {
    switch (cmd.action) {
      case "pushScissorRect":
        buffer.pushScissorRect(cmd.x, cmd.y, cmd.width, cmd.height)
        break
      case "popScissorRect":
        buffer.popScissorRect()
        break
      case "pushOpacity":
        buffer.pushOpacity(cmd.opacity)
        break
      case "popOpacity":
        buffer.popOpacity()
        break
      case "render":
        cmd.renderable.render(buffer, deltaTime)
        break
    }
  }

  // Clear scissor/opacity stacks
  buffer.clearScissorRects()
  buffer.clearOpacity()
}
