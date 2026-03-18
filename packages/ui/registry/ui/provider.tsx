import { createContext, useContext } from "react"
import type { ReactNode } from "react"
import type { Theme } from "./theme"
import { darkTheme } from "./theme"
import { ThemeProvider } from "./theme"
import { FocusProvider } from "../../../../core/src/react/focus/focus-provider"

type KeyboardHandler = (event: any) => void
type UseKeyboardHook = (handler: KeyboardHandler) => void

const KeyboardContext = createContext<UseKeyboardHook | null>(null)

export interface GridlandProviderProps {
  /** Theme object. Defaults to darkTheme. */
  theme?: Theme
  /** Keyboard hook from @opentui/react. Provided once here so components don't need it as a prop. */
  useKeyboard?: UseKeyboardHook
  /** Show a visual highlight on the cell under the mouse cursor */
  cursorHighlight?: boolean
  children: ReactNode
}

export function GridlandProvider({ theme, useKeyboard, children }: GridlandProviderProps) {
  const inner = (
    <FocusProvider>
      <KeyboardContext.Provider value={useKeyboard ?? null}>
        {children}
      </KeyboardContext.Provider>
    </FocusProvider>
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
