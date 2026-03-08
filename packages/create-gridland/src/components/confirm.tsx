import React from "react"
import { SelectInput } from "@gridland/ui"

interface ConfirmProps {
  onConfirm: (value: boolean) => void
  defaultValue?: boolean
  focus?: boolean
}

const items = [
  { label: "Yes", value: true },
  { label: "No", value: false },
]

export function Confirm({ onConfirm, defaultValue = true, focus = true }: ConfirmProps) {
  return (
    <SelectInput
      items={items}
      initialIndex={defaultValue ? 0 : 1}
      onSelect={(item) => onConfirm(item.value)}
      focus={focus}
    />
  )
}
