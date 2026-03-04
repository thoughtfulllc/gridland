import { BrowserRenderer, setRootRenderableClass } from "./browser-renderer"
import { RootRenderable } from "@opentui/core"
import { createBrowserRoot } from "./create-browser-root"
import { App } from "./App"

// Set the RootRenderable class before creating the renderer
setRootRenderableClass(RootRenderable)

function init() {
  const canvas = document.getElementById("terminal-canvas") as HTMLCanvasElement
  if (!canvas) {
    console.error("Canvas element not found")
    return
  }

  // Calculate grid dimensions from window size
  // We'll measure cell size first, then determine cols/rows
  const tempCtx = canvas.getContext("2d")!
  tempCtx.font = "14px 'JetBrains Mono', 'Fira Code', 'Cascadia Code', 'Consolas', monospace"
  const metrics = tempCtx.measureText("M")
  const cellWidth = Math.ceil(metrics.width)
  const cellHeight = Math.ceil(14 * 1.4)

  const cols = Math.floor(window.innerWidth / cellWidth)
  const rows = Math.floor(window.innerHeight / cellHeight)

  const renderer = new BrowserRenderer(canvas, cols, rows)
  const root = createBrowserRoot(renderer)

  root.render(<App />)
  renderer.start()

  // Handle window resize
  window.addEventListener("resize", () => {
    const newCols = Math.floor(window.innerWidth / cellWidth)
    const newRows = Math.floor(window.innerHeight / cellHeight)
    if (newCols !== cols || newRows !== rows) {
      renderer.resize(newCols, newRows)
    }
  })

  // Forward keyboard events
  window.addEventListener("keydown", (e) => {
    renderer.handleKeyDown(e)
  })
}

// Wait for DOM
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init)
} else {
  init()
}
