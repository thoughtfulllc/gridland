import { useInteractive } from "@/registry/gridland/hooks/use-interactive"
import { textStyle } from "@/registry/gridland/lib/text-style"
import { useTheme } from "@/registry/gridland/lib/theme"

export interface TextInputProps {
  /** Field label shown above the input */
  label?: string
  /** Helper text shown inline next to the label */
  description?: string
  /** Error message — overrides description when set */
  error?: string
  /** Whether the field is required (shows indicator on label) */
  required?: boolean
  /** Whether the input is disabled */
  disabled?: boolean
  /** Current value of the input */
  value: string
  /** Called on every keystroke */
  onChange?: (value: string) => void
  /** Called when Enter is pressed */
  onSubmit?: (value: string) => void
  /** Hint text shown when empty */
  placeholder?: string
  /** Prompt string shown before the input (e.g. "> ") */
  prompt?: string
  /** Maximum characters allowed */
  maxLength?: number
  /** Stable focus id. Auto-generated via useId when omitted. */
  focusId?: string
  /** Focus this input on mount. */
  autoFocus?: boolean
}

/** Form text input with label, validation, and focus-system integration. */
export function TextInput({
  label,
  description,
  error,
  required = false,
  disabled = false,
  value,
  onChange,
  onSubmit,
  placeholder,
  prompt,
  maxLength,
  focusId,
  autoFocus,
}: TextInputProps) {
  const theme = useTheme()
  const interactive = useInteractive({
    id: focusId,
    autoFocus,
    disabled,
    shortcuts: ({ isSelected }) =>
      isSelected
        ? [
            { key: "⏎", label: "submit" },
            { key: "esc", label: "back" },
          ]
        : [{ key: "enter", label: "edit" }],
  })
  const { isFocused, isSelected, focusRef } = interactive
  // "Selected" drives whether <input> is rendered. "Focused" alone drives
  // the label indicator affordance. When disabled, neither fires.
  const showInput = isSelected && !disabled
  const showIndicator = (isFocused || isSelected) && !disabled

  const empty = !value
  const showLabel = label != null
  const message = error ?? description

  return (
    <box ref={focusRef} flexDirection="column">
      {showLabel && (
        <text>
          <span
            style={textStyle({
              fg: error
                ? theme.error
                : showIndicator
                  ? theme.primary
                  : disabled
                    ? theme.muted
                    : theme.foreground,
              bold: !disabled,
              dim: disabled,
            })}
          >
            {showIndicator ? "\u25B8 " : "  "}
            {label}
          </span>
          {required && <span style={textStyle({ fg: theme.error })}>{" *"}</span>}
          {value && maxLength != null && (
            <span style={textStyle({ dim: true, fg: theme.muted })}>
              {" "}
              {value.length}/{maxLength}
            </span>
          )}
          {message != null && (
            <span style={textStyle({ fg: error ? theme.error : theme.muted, dim: !error })}>
              {" | "}
              {message}
            </span>
          )}
        </text>
      )}
      <box flexDirection="row" marginLeft={showLabel ? 2 : 0}>
        {prompt != null && (
          <text
            style={{
              fg: error ? theme.error : showIndicator ? theme.primary : theme.muted,
            }}
          >
            {prompt}
          </text>
        )}
        {showInput ? (
          <input
            value={value}
            placeholder={placeholder}
            maxLength={maxLength}
            focused
            onInput={onChange}
            onSubmit={onSubmit}
            cursorColor={error ? theme.error : theme.muted}
            cursorStyle={{ style: "line", blinking: empty }}
            placeholderColor={theme.placeholder}
            textColor={theme.foreground}
          />
        ) : (
          <text
            style={{
              fg: empty ? theme.placeholder : disabled ? theme.muted : theme.foreground,
              dim: disabled,
            }}
          >
            {empty ? placeholder : value}
          </text>
        )}
      </box>
    </box>
  )
}
