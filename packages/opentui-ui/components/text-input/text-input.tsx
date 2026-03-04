import { useState, useCallback } from "react"

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
  promptColor = "cyan",
  focus = true,
  maxLength,
}: TextInputProps) {
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
      {prompt && <text style={{ fg: promptColor }}>{prompt}</text>}
      <input
        value={displayValue}
        placeholder={placeholder}
        maxLength={maxLength}
        focused={focus}
        onInput={handleInput}
        onSubmit={handleSubmit}
      />
    </box>
  )
}
