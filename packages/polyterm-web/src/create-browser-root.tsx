import React, { type ReactNode } from "react"
import type { BrowserRenderer } from "./browser-renderer"
import { BrowserContext } from "./browser-context"

// Import from opentui react through Vite aliases
import { _render } from "../../../opentui/packages/react/src/reconciler/reconciler"
import { AppContext } from "../../../opentui/packages/react/src/components/app"
import { ErrorBoundary } from "../../../opentui/packages/react/src/components/error-boundary"

export interface BrowserRoot {
  render(node: ReactNode): void
  unmount(): void
}

export function createBrowserRoot(renderer: BrowserRenderer): BrowserRoot {
  let unmountFn: (() => void) | null = null

  return {
    render(node: ReactNode) {
      const element = (
        <BrowserContext.Provider value={{ renderContext: renderer.renderContext }}>
          <AppContext.Provider value={{ keyHandler: renderer.renderContext.keyInput as any, renderer: null }}>
            <ErrorBoundary>{node}</ErrorBoundary>
          </AppContext.Provider>
        </BrowserContext.Provider>
      )
      unmountFn = _render(element, renderer.root)
    },
    unmount() {
      if (unmountFn) {
        // Reconciler cleanup would happen here
      }
    },
  }
}
