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
  /** Bright focus color — component is selected (entered for interaction) */
  focusSelected: string
  /** Medium focus color — component has keyboard focus */
  focusFocused: string
  /** Dimmed focus color — idle hint that the component is selectable */
  focusIdle: string
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
  focusSelected: "#FF71CE",
  focusFocused: "#e065b8",
  focusIdle: "#33192a",
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
  focusSelected: "#FF6B2B",
  focusFocused: "#d45a24",
  focusIdle: "#f5e6d8",
}

import { createContext, useContext, type ReactNode } from "react"
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

import { getFocusBorderStyle, getFocusDividerStyle } from "@gridland/utils"
import type { FocusBorderState, FocusBorderResult, FocusDividerResult } from "@gridland/utils"

/** Returns focus border color and style from the current theme. */
export function useFocusBorderStyle(state: FocusBorderState): FocusBorderResult {
  const theme = useTheme()
  return getFocusBorderStyle(state, {
    selected: theme.focusSelected,
    focused: theme.focusFocused,
    idle: theme.focusIdle,
  })
}

/** Returns focus divider color and dashed state from the current theme. */
export function useFocusDividerStyle(state: FocusBorderState): FocusDividerResult {
  const theme = useTheme()
  return getFocusDividerStyle(state, {
    selected: theme.focusSelected,
    focused: theme.focusFocused,
    idle: theme.focusIdle,
  })
}