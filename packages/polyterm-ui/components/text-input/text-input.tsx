import { useState, useCallback } from "react"
import { useTheme } from "../theme/index"

export interface TextInputProps {
  value?: string
  onChange?: (value: string) => void
  onSubmit?: (value: string) => void
  placeholder?: string
  prompt?: string
  promptColor?: string
  focus?: boolean
  maxLength?: number
}

export function TextInput({
  value: controlledValue,
  onChange,
  onSubmit,
  placeholder = "",
  prompt = "> ",
  promptColor,
  focus = true,
  maxLength,
}: TextInputProps) {
  const theme = useTheme()
  const resolvedPromptColor = promptColor ?? theme.accent
  const [internalValue, setInternalValue] = useState("")
  const isControlled = controlledValue !== undefined
  const displayValue = isControlled ? controlledValue : internalValue

  const handleInput = useCallback(
    (newValue: string) => {
      if (!isControlled) setInternalValue(newValue)
      onChange?.(newValue)
    },
    [isControlled, onChange],
  )

  const handleSubmit = useCallback(
    (value: string) => {
      onSubmit?.(value)
      if (!isControlled) setInternalValue("")
    },
    [isControlled, onSubmit],
  )

  return (
    <box>
      {prompt && <text style={{ fg: resolvedPromptColor }}>{prompt}</text>}
      <input
        value={displayValue}
        placeholder={placeholder}
        maxLength={maxLength}
        focused={focus}
        // Cast: polyterm's custom <input> takes (value: string) => void, not DOM event handlers
        onInput={handleInput as any}
        onSubmit={handleSubmit as any}
      />
    </box>
  )
}
