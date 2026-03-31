// @ts-nocheck — OpenTUI intrinsic elements conflict with React's HTML/SVG types
import { useCallback, useRef, useState } from 'react'
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
  /** Controlled value */
  value?: string
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

export function TextInput({ label, description, error, required = false, disabled = false, value: controlledValue, onChange, onSubmit, placeholder, prompt, focus = false, maxLength }: TextInputProps) {
  const theme = useTheme()
  const [internalValue, setInternalValue] = useState('')
  const isControlled = controlledValue !== undefined
  const controlledRef = useRef(isControlled)
  if (controlledRef.current !== isControlled) {
    console.warn('TextInput: switching between controlled and uncontrolled is not supported.')
    controlledRef.current = isControlled
  }
  const current = isControlled ? controlledValue : internalValue
  const isFocused = focus && !disabled

  const handleInput = useCallback(
    (v: string) => {
      if (!isControlled) setInternalValue(v)
      onChange?.(v)
    },
    [isControlled, onChange],
  )

  const handleSubmit = useCallback(
    (v: string) => {
      onSubmit?.(v)
      if (!isControlled) setInternalValue('')
    },
    [isControlled, onSubmit],
  )

  const empty = !current
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
          {current && maxLength != null && (
            <span style={textStyle({ dim: true, fg: theme.muted })}>
              {' '}
              {current.length}/{maxLength}
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
        {prompt != null && <text style={{ fg: isFocused ? theme.primary : theme.muted }}>{prompt}</text>}
        {isFocused ? (
          <input
            value={current}
            placeholder={placeholder}
            maxLength={maxLength}
            focused
            onInput={handleInput}
            onSubmit={handleSubmit}
            cursorColor={theme.muted}
            cursorStyle={{ style: "line", blinking: empty }}
            placeholderColor={theme.placeholder}
            textColor={theme.foreground}
          />
        ) : (
          <text style={{ fg: empty ? theme.placeholder : disabled ? theme.muted : theme.foreground, dim: disabled }}>{empty ? placeholder : current}</text>
        )}
      </box>
    </box>
  )
}
