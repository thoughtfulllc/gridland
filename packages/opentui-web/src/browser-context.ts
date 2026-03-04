import { createContext, useContext } from "react"
import type { BrowserRenderContext } from "./browser-render-context"

export interface BrowserContextValue {
  renderContext: BrowserRenderContext
}

export const BrowserContext = createContext<BrowserContextValue | null>(null)

export function useBrowserContext(): BrowserContextValue {
  const ctx = useContext(BrowserContext)
  if (!ctx) {
    throw new Error("useBrowserContext must be used within a BrowserContext.Provider")
  }
  return ctx
}
