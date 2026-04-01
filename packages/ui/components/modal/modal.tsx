import type { ReactNode } from "react"
import { FocusScope } from "@gridland/utils"
import { textStyle } from "../text-style"
import { useTheme } from "../theme/index"
import { useKeyboardContext } from "../provider/provider"

export interface ModalProps {
  /** The content rendered inside the modal border. */
  children: ReactNode
  /** Optional title displayed at the top inside the border. Rendered bold in the borderColor. */
  title?: string
  /** Color of the border and the title text. */
  borderColor?: string
  /**
   * The character set used for drawing the border.
   * Maps to opentui border styles: "single" | "double" | "rounded" | "heavy".
   */
  borderStyle?: "single" | "double" | "rounded" | "heavy"
  /** Callback invoked when the Escape key is pressed. */
  onClose?: () => void
  /** Keyboard handler — pass useKeyboard from @opentui/react */
  useKeyboard?: (handler: (event: any) => void) => void
}

/** Bordered modal overlay with optional title and Escape-to-close. Traps focus automatically. */
export function Modal({
  children,
  title,
  borderColor,
  borderStyle = "rounded",
  onClose,
  useKeyboard: useKeyboardProp,
}: ModalProps) {
  const theme = useTheme()
  const useKeyboard = useKeyboardContext(useKeyboardProp)
  const resolvedBorderColor = borderColor ?? theme.muted

  // Handle Escape key
  useKeyboard?.((event: any) => {
    if (event.name === "escape" && onClose) {
      onClose()
    }
  })

  return (
    <FocusScope trap autoFocus restoreOnUnmount>
      <box flexDirection="column" flexGrow={1}>
        <box
          flexDirection="column"
          flexGrow={1}
          border
          borderStyle={borderStyle}
          borderColor={resolvedBorderColor}
        >
          {title ? (
            <>
              <box paddingX={1} marginBottom={1}>
                <text style={textStyle({ bold: true, fg: theme.primary })}>{title}</text>
              </box>
              {children}
            </>
          ) : (
            children
          )}
        </box>
      </box>
    </FocusScope>
  )
}
