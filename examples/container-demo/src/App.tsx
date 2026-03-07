import { useRef, useCallback } from "react"
import { TUI } from "../../../packages/web/src/TUI"
import { ContainerTerminal } from "./ContainerTerminal"
import type { BrowserRenderer } from "../../../packages/web/src/browser-renderer"

export function App() {
  const rendererRef = useRef<BrowserRenderer | null>(null)

  const handleReady = useCallback((renderer: BrowserRenderer) => {
    rendererRef.current = renderer
  }, [])

  return (
    <TUI style={{ width: "100vw", height: "100vh" }} backgroundColor="#1e1e2e" onReady={handleReady}>
      <ContainerTerminal rendererRef={rendererRef} />
    </TUI>
  )
}
