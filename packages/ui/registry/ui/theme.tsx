export interface Theme {
  /** Main brand color — headings, highlights, active elements */
  primary: string
  /** Secondary brand color — interactive highlights, focused states */
  accent: string
  /** Tertiary color — user messages, checkboxes, prompts */
  secondary: string
  /** Subdued color — disabled states, secondary text, cursor */
  muted: string
  /** Placeholder text color */
  placeholder: string
  /** Border and divider color */
  border: string
  /** Default foreground text color */
  foreground: string
  /** App background color */
  background: string
  /** Success state color */
  success: string
  /** Error state color */
  error: string
  /** Warning state color */
  warning: string
}

export const darkTheme: Theme = {
  primary: "#FF71CE",
  accent: "#01CDFE",
  secondary: "#B967FF",
  muted: "#A69CBD",
  placeholder: "#CEC7DE",
  border: "#B967FF",
  foreground: "#F0E6FF",
  background: "#0D0B10",
  success: "#05FFA1",
  error: "#FF6B6B",
  warning: "#FFC164",
}

export const lightTheme: Theme = {
  primary: "#FF6B2B",
  accent: "#3B82F6",
  secondary: "#0369A1",
  muted: "#64748B",
  placeholder: "#475569",
  border: "#E2E8F0",
  foreground: "#1E293B",
  background: "#FFFFFF",
  success: "#0B8438",
  error: "#E11D48",
  warning: "#B45309",
}

import { createContext, useContext, type ReactNode } from "react"
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