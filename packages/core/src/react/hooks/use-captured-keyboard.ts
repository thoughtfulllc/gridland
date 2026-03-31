import { useRef, useCallback } from "react"
import { useKeyboard } from "./use-keyboard"

/**
 * Captures keyboard events for a selected focusable element and exposes
 * a callback to forward them to child components (e.g. PromptInput).
 *
 * Returns a `capture` function — pass it as the `useKeyboard` prop to the
 * child component so the child's key handler is registered via ref.
 */
export function useCapturedKeyboard(focusId: string) {
  const handlerRef = useRef<((event: any) => void) | null>(null)

  const capture = useCallback((handler: (event: any) => void) => {
    handlerRef.current = handler
  }, [])

  useKeyboard((event: any) => {
    handlerRef.current?.(event)
  }, { focusId, selectedOnly: true })

  return capture
}
