import React, { type ReactNode } from "react"
import type { BrowserRenderer } from "./browser-renderer"
import { BrowserContext } from "./browser-context"

import { _render } from "../../core/src/react/reconciler/reconciler"
import { AppContext } from "../../core/src/react/components/app"
import { ErrorBoundary as _ErrorBoundary } from "../../core/src/react/components/error-boundary"
import { RuntimeProvider } from "../../core/src/react/runtime/runtime-context"

// Cast needed: ErrorBoundary uses opentui's JSX intrinsics internally,
// which causes a type conflict with React's JSX types during DTS builds.
const ErrorBoundary = _ErrorBoundary as unknown as React.ComponentType<{ children: React.ReactNode }>

export interface BrowserRoot {
  render(node: ReactNode): void
  unmount(): void
}

export function createBrowserRoot(renderer: BrowserRenderer): BrowserRoot {
  let unmountFn: (() => void) | null = null

  return {
    render(node: ReactNode) {
      const element = (
        <RuntimeProvider value="web">
          <BrowserContext.Provider value={{ renderContext: renderer.renderContext }}>
            <AppContext.Provider value={{ keyHandler: renderer.renderContext.keyInput as any, renderer: renderer.renderContext as any }}>
              <ErrorBoundary>{node}</ErrorBoundary>
            </AppContext.Provider>
          </BrowserContext.Provider>
        </RuntimeProvider>
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
