import type { ReactNode } from "react"
import { FocusScope, useKeyboard } from "@gridland/utils"
import { textStyle } from "@/registry/gridland/lib/text-style"
import { useTheme } from "@/registry/gridland/lib/theme"

export interface ModalProps {
  /** The content rendered inside the modal border. */
  children: ReactNode
  /** Optional title displayed at the top inside the border. */
  title?: string
  /** Color of the border. */
  borderColor?: string
  /**
   * The character set used for drawing the border.
   * Maps to opentui border styles: "single" | "double" | "rounded" | "heavy".
   */
  borderStyle?: "single" | "double" | "rounded" | "heavy"
  /** Callback invoked when the Escape key is pressed. */
  onClose?: () => void
}

/** Bordered modal overlay with optional title and Escape-to-close. Traps focus automatically. */
export function Modal({
  children,
  title,
  borderColor,
  borderStyle = "rounded",
  onClose,
}: ModalProps) {
  const theme = useTheme()
  const resolvedBorderColor = borderColor ?? theme.border

  useKeyboard((event: any) => {
    if (event.name === "escape" && onClose) {
      onClose()
    }
  })

  return (
    <FocusScope trap autoFocus restoreOnUnmount>
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
    </FocusScope>
  )
}
