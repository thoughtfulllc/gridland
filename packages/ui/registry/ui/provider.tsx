import { createContext, useContext } from "react"
import type { ReactNode } from "react"
import type { Theme } from "./theme"
import { darkTheme } from "./theme"
import { ThemeProvider } from "./theme"

type KeyboardHandler = (event: any) => void
type UseKeyboardHook = (handler: KeyboardHandler) => void

const KeyboardContext = createContext<UseKeyboardHook | null>(null)

export interface GridlandProviderProps {
  /** Theme object. Defaults to darkTheme. */
  theme?: Theme
  /** Keyboard hook from @gridland/utils. Provided once here so components don't need it as a prop. */
  useKeyboard?: UseKeyboardHook
  children: ReactNode
}

/** Root provider that supplies theme and keyboard context to all Gridland components. */
export function GridlandProvider({ theme, useKeyboard, children }: GridlandProviderProps) {
  const inner = (
    <KeyboardContext.Provider value={useKeyboard ?? null}>
      {children}
    </KeyboardContext.Provider>
  )

  // Only wrap with ThemeProvider if a theme is explicitly provided
  if (theme) {
    return <ThemeProvider theme={theme}>{inner}</ThemeProvider>
  }

  return inner
}

/**
 * Returns the useKeyboard hook from context, or the prop override if provided.
 * Components should call this instead of using the prop directly.
 */
export function useKeyboardContext(propOverride?: UseKeyboardHook): UseKeyboardHook | undefined {
  const fromContext = useContext(KeyboardContext)
  return propOverride ?? fromContext ?? undefined
}
