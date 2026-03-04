import { useCallback } from "react"

export type SelectInputItem<V> = {
  key?: string
  label: string
  value: V
}

export interface SelectInputProps<V> {
  items?: SelectInputItem<V>[]
  focus?: boolean
  initialIndex?: number
  limit?: number
  onSelect?: (item: SelectInputItem<V>) => void
  onHighlight?: (item: SelectInputItem<V>) => void
  textColor?: string
  selectedTextColor?: string
  focusedTextColor?: string
  backgroundColor?: string
  selectedBackgroundColor?: string
  focusedBackgroundColor?: string
}

export function SelectInput<V>({
  items = [],
  focus = true,
  initialIndex = 0,
  limit,
  onSelect,
  onHighlight,
  textColor,
  selectedTextColor,
  focusedTextColor,
  backgroundColor,
  selectedBackgroundColor,
  focusedBackgroundColor,
}: SelectInputProps<V>) {
  const options = items.map((item) => ({
    name: item.label,
    value: item.value,
  }))

  const handleSelect = useCallback(
    (index: number) => {
      const item = items[index]
      if (item) onSelect?.(item)
    },
    [items, onSelect],
  )

  const handleChange = useCallback(
    (index: number) => {
      const item = items[index]
      if (item) onHighlight?.(item)
    },
    [items, onHighlight],
  )

  return (
    <select
      options={options}
      selectedIndex={initialIndex}
      focused={focus}
      wrapSelection
      onChange={handleChange}
      onSelect={handleSelect}
      height={limit ?? items.length}
      showDescription={false}
      textColor={textColor}
      selectedTextColor={selectedTextColor}
      focusedTextColor={focusedTextColor}
      backgroundColor={backgroundColor}
      selectedBackgroundColor={selectedBackgroundColor}
      focusedBackgroundColor={focusedBackgroundColor}
    />
  )
}
