import { textStyle } from '../text-style'
import { useTheme } from '../theme/index'

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
  /** Whether the input is focused and accepting keystrokes */
  focus?: boolean
  /** Maximum characters allowed */
  maxLength?: number
}

/** Form text input with label, validation, and controlled mode. */
export function TextInput({ label, description, error, required = false, disabled = false, value, onChange, onSubmit, placeholder, prompt, focus = false, maxLength }: TextInputProps) {
  const theme = useTheme()
  const isFocused = focus && !disabled

  const empty = !value
  const showLabel = label != null
  const message = error ?? description

  return (
    <box flexDirection="column">
      {showLabel && (
        <text>
          <span style={textStyle({ fg: error ? theme.error : isFocused ? theme.primary : disabled ? theme.muted : theme.foreground, bold: !disabled, dim: disabled })}>
            {isFocused ? '\u25B8 ' : '  '}
            {label}
          </span>
          {required && <span style={textStyle({ fg: theme.error })}>{' *'}</span>}
          {value && maxLength != null && (
            <span style={textStyle({ dim: true, fg: theme.muted })}>
              {' '}
              {value.length}/{maxLength}
            </span>
          )}
          {message != null && (
            <span style={textStyle({ fg: error ? theme.error : theme.muted, dim: !error })}>
              {' | '}
              {message}
            </span>
          )}
        </text>
      )}
      <box flexDirection="row" marginLeft={showLabel ? 2 : 0}>
        {prompt != null && <text style={{ fg: error ? theme.error : isFocused ? theme.primary : theme.muted }}>{prompt}</text>}
        {isFocused ? (
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
          <text style={{ fg: empty ? theme.placeholder : disabled ? theme.muted : theme.foreground, dim: disabled }}>{empty ? placeholder : value}</text>
        )}
      </box>
    </box>
  )
}
