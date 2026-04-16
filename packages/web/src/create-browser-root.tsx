// Side-effect import: registers browser overrides in core's component catalogue
// before any _createContainer call. Must stay as the very first import — see
// tasks/003-browser-compat-contract.md §4.3 for load-order requirement, and
// the "sideEffects" entry in packages/web/package.json for tree-shake safety.
import "./components/register"

import React, { type ReactNode } from "react"
import type { BrowserRenderer } from "./browser-renderer"
import { BrowserContext } from "./browser-context"

import { _createContainer, _updateContainer } from "../../core/src/react/reconciler/reconciler"
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
  let container: ReturnType<typeof _createContainer> | null = null

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
      if (!container) {
        container = _createContainer(renderer.root)
      }
      _updateContainer(element, container)
    },
    unmount() {
      if (container) {
        _updateContainer(null, container)
        container = null
      }
    },
  }
}
