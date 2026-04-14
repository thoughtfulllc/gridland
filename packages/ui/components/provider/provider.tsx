import type { ReactNode } from "react"
import { FocusProvider } from "@gridland/utils"
import type { Theme } from "@/registry/gridland/lib/theme/types"
import { ThemeProvider } from "@/registry/gridland/lib/theme/theme-context"

export interface GridlandProviderProps {
  /** Theme object. Defaults to darkTheme (via ThemeContext's default). */
  theme?: Theme
  /**
   * Escape hatch: skip the implicit FocusProvider wrap. Use this when
   * you need to mount GridlandProvider inside another FocusProvider or
   * when testing components that don't need focus routing.
   */
  disableFocusProvider?: boolean
  children: ReactNode
}

/**
 * Root provider that supplies theme and the focus system to all
 * Gridland components. Wraps children in a `<FocusProvider selectable>`
 * by default — pass `disableFocusProvider` to opt out.
 */
export function GridlandProvider({
  theme,
  disableFocusProvider = false,
  children,
}: GridlandProviderProps) {
  const wrapped = disableFocusProvider
    ? children
    : <FocusProvider selectable>{children}</FocusProvider>

  if (theme) {
    return <ThemeProvider theme={theme}>{wrapped}</ThemeProvider>
  }

  return wrapped
}
