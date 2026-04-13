import { createContext, useContext, type ReactNode } from "react"
import type { Theme } from "./types"
import { darkTheme } from "./themes"

const ThemeContext = createContext<Theme>(darkTheme)

export interface ThemeProviderProps {
  theme: Theme
  children: ReactNode
}

/** Provides a theme to all descendant components via React context. */
export function ThemeProvider({ theme, children }: ThemeProviderProps) {
  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>
}

/** Returns the current theme from the nearest ThemeProvider. Falls back to darkTheme. */
export function useTheme(): Theme {
  return useContext(ThemeContext)
}
