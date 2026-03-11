import { createContext, useContext, type ReactNode } from "react"
import type { Theme } from "./types"
import { darkTheme } from "./themes"

const ThemeContext = createContext<Theme>(darkTheme)

export interface ThemeProviderProps {
  theme: Theme
  children: ReactNode
}

export function ThemeProvider({ theme, children }: ThemeProviderProps) {
  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>
}

export function useTheme(): Theme {
  return useContext(ThemeContext)
}
