import { useState, useCallback } from "react"

export type MultiSelectItem<V> = {
  key?: string
  label: string
  value: V
}

export interface MultiSelectProps<V> {
  items?: MultiSelectItem<V>[]
  selected?: MultiSelectItem<V>[]
  defaultSelected?: MultiSelectItem<V>[]
  focus?: boolean
  initialIndex?: number
  limit?: number
  onSelect?: (item: MultiSelectItem<V>) => void
  onUnselect?: (item: MultiSelectItem<V>) => void
  onSubmit?: (items: MultiSelectItem<V>[]) => void
  onHighlight?: (item: MultiSelectItem<V>) => void
  /** Keyboard handler — pass useKeyboard from @opentui/react */
  useKeyboard?: (handler: (event: any) => void) => void
}

export function MultiSelect<V>({
  items = [],
  selected: controlledSelected,
  defaultSelected = [],
  focus = true,
  initialIndex = 0,
  limit,
  onSelect,
  onUnselect,
  onSubmit,
  onHighlight,
  useKeyboard,
}: MultiSelectProps<V>) {
  const visibleCount = limit && limit < items.length ? limit : items.length
  const clampedInitial = Math.min(Math.max(0, initialIndex), Math.max(0, items.length - 1))

  const [highlightedIndex, setHighlightedIndex] = useState(clampedInitial)
  const [scrollOffset, setScrollOffset] = useState(
    limit ? Math.max(0, clampedInitial - Math.floor(limit / 2)) : 0,
  )
  const [internalSelected, setInternalSelected] = useState<MultiSelectItem<V>[]>(defaultSelected)

  const selected = controlledSelected ?? internalSelected

  const isSelected = useCallback(
    (value: V) => selected.some((item) => item.value === value),
    [selected],
  )

  const visibleItems = limit ? items.slice(scrollOffset, scrollOffset + visibleCount) : items

  // Use keyboard hook if provided
  useKeyboard?.((event: any) => {
    if (!focus) return

    if (event.name === "j" || event.name === "down") {
      const newIndex = highlightedIndex < items.length - 1 ? highlightedIndex + 1 : 0
      setHighlightedIndex(newIndex)

      if (limit && newIndex >= scrollOffset + visibleCount) {
        setScrollOffset(newIndex - visibleCount + 1)
      } else if (limit && newIndex === 0) {
        setScrollOffset(0)
      }

      onHighlight?.(items[newIndex]!)
    }

    if (event.name === "k" || event.name === "up") {
      const newIndex = highlightedIndex > 0 ? highlightedIndex - 1 : items.length - 1
      setHighlightedIndex(newIndex)

      if (limit && newIndex < scrollOffset) {
        setScrollOffset(newIndex)
      } else if (limit && newIndex >= items.length - 1 && scrollOffset + visibleCount < items.length) {
        setScrollOffset(Math.max(0, items.length - visibleCount))
      }

      onHighlight?.(items[newIndex]!)
    }

    if (event.name === "space") {
      const item = items[highlightedIndex]
      if (!item) return

      if (isSelected(item.value)) {
        onUnselect?.(item)
        if (!controlledSelected) {
          setInternalSelected((prev) => prev.filter((s) => s.value !== item.value))
        }
      } else {
        onSelect?.(item)
        if (!controlledSelected) {
          setInternalSelected((prev) => [...prev, item])
        }
      }
    }

    if (event.name === "return") {
      onSubmit?.(selected)
    }
  })

  return (
    <box>
      {visibleItems.map((item, index) => {
        const actualIndex = (limit ? scrollOffset : 0) + index
        const isHighlighted = actualIndex === highlightedIndex
        const itemIsSelected = isSelected(item.value)

        return (
          <text key={item.key ?? String(item.value)}>
            <span style={{ fg: isHighlighted ? "blue" : undefined }}>
              {isHighlighted ? "\u276f" : " "}{" "}
            </span>
            <span style={{ fg: "green" }}>
              {itemIsSelected ? "\u25c9" : "\u25cb"}{" "}
            </span>
            <span style={{ fg: isHighlighted ? "blue" : undefined }}>
              {item.label}
            </span>
          </text>
        )
      })}
    </box>
  )
}
