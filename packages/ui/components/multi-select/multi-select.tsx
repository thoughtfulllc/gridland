import { useReducer, useMemo } from "react"
import { textStyle } from "../text-style"
import { useTheme } from "../theme/index"

export type MultiSelectItem<V> = {
  key?: string
  label: string
  value: V
  group?: string
}

export interface MultiSelectProps<V> {
  items?: MultiSelectItem<V>[]
  defaultSelected?: V[]
  title?: string
  limit?: number
  enableSelectAll?: boolean
  enableClear?: boolean
  highlightColor?: string
  checkboxColor?: string
  onSubmit?: (values: V[]) => void
  useKeyboard?: (handler: (event: any) => void) => void
}

type State<V> = {
  cursor: number
  selected: Set<V>
  submitted: boolean
}

type Action<V> =
  | { type: "MOVE"; direction: 1 | -1; max: number }
  | { type: "TOGGLE_ITEM"; value: V }
  | { type: "SELECT_ALL"; values: V[] }
  | { type: "CLEAR" }
  | { type: "SUBMIT" }
  | { type: "RESET" }

function reducer<V>(state: State<V>, action: Action<V>): State<V> {
  switch (action.type) {
    case "MOVE": {
      let next = state.cursor + action.direction
      if (next < 0) next = action.max - 1
      if (next >= action.max) next = 0
      return { ...state, cursor: next }
    }
    case "TOGGLE_ITEM": {
      const next = new Set(state.selected)
      if (next.has(action.value)) {
        next.delete(action.value)
      } else {
        next.add(action.value)
      }
      return { ...state, selected: next }
    }
    case "SELECT_ALL":
      return { ...state, selected: new Set(action.values) }
    case "CLEAR":
      return { ...state, selected: new Set() }
    case "SUBMIT":
      return { ...state, submitted: true }
    case "RESET":
      return { ...state, selected: new Set(), submitted: false, cursor: 0 }
    default:
      return state
  }
}

const VISIBLE = 12
const BAR = "│"
const CHECKED = "◉"
const UNCHECKED = "○"
const CURSOR = "▸"

type Row<V> =
  | { type: "group"; label: string }
  | { type: "item"; item: MultiSelectItem<V>; index: number }

export function MultiSelect<V>({
  items = [],
  defaultSelected = [],
  title = "Select",
  limit,
  enableSelectAll = true,
  enableClear = true,
  highlightColor,
  checkboxColor,
  onSubmit,
  useKeyboard,
}: MultiSelectProps<V>) {
  const theme = useTheme()
  const resolvedHighlight = highlightColor ?? theme.primary
  const resolvedCheckbox = checkboxColor ?? theme.accent

  const [state, dispatch] = useReducer(reducer<V>, {
    cursor: 0,
    selected: new Set(defaultSelected),
    submitted: false,
  })

  const { flatRows, selectableItems } = useMemo(() => {
    const rows: Row<V>[] = []
    const selectable: Array<{ item: MultiSelectItem<V>; index: number }> = []
    let index = 0
    const grouped = new Map<string, MultiSelectItem<V>[]>()
    for (const item of items) {
      const group = item.group ?? ""
      const list = grouped.get(group) ?? []
      list.push(item)
      grouped.set(group, list)
    }
    for (const [group, groupItems] of grouped) {
      if (group) {
        rows.push({ type: "group", label: group })
      }
      for (const item of groupItems) {
        rows.push({ type: "item", item, index })
        selectable.push({ item, index })
        index++
      }
    }
    return { flatRows: rows, selectableItems: selectable }
  }, [items])

  const visibleCount = limit ?? VISIBLE
  const scrollOffset = Math.max(0, Math.min(state.cursor - Math.floor(visibleCount / 2), selectableItems.length - visibleCount))
  const visibleRows = flatRows.slice(Math.max(0, scrollOffset), Math.max(0, scrollOffset) + visibleCount)

  useKeyboard?.((event: any) => {
    if (state.submitted) {
      if (event.name === "r") {
        dispatch({ type: "RESET" })
      }
      return
    }

    if (event.name === "up" || event.name === "k") {
      dispatch({ type: "MOVE", direction: -1, max: selectableItems.length })
    } else if (event.name === "down" || event.name === "j") {
      dispatch({ type: "MOVE", direction: 1, max: selectableItems.length })
    } else if (event.name === "space") {
      const current = selectableItems[state.cursor]
      if (current) {
        dispatch({ type: "TOGGLE_ITEM", value: current.item.value })
      }
    } else if (event.name === "a" && enableSelectAll) {
      dispatch({ type: "SELECT_ALL", values: items.map((i) => i.value) })
    } else if (event.name === "x" && enableClear) {
      dispatch({ type: "CLEAR" })
    } else if (event.name === "return") {
      dispatch({ type: "SUBMIT" })
      onSubmit?.(Array.from(state.selected))
    }
  })

  if (state.submitted) {
    const selectedItems = items.filter((i) => state.selected.has(i.value))
    return (
      <box flexDirection="column">
        <text>
          <span style={textStyle({ fg: theme.success })}>{"◆ "}</span>
          <span style={textStyle({ bold: true })}>{title}</span>
        </text>
        {selectedItems.map((item) => (
          <text key={item.key ?? String(item.value)}>
            <span style={textStyle({ fg: theme.success })}>{BAR} </span>
            <span>{"  "}</span>
            <span style={textStyle({ fg: theme.success })}>{CHECKED} </span>
            <span>{item.label}</span>
          </text>
        ))}
        <text>{""}</text>
        <text>
          <span style={textStyle({ dim: true })}>{selectedItems.length} selected — submitted</span>
        </text>
      </box>
    )
  }

  return (
    <box flexDirection="column">
      <text>
        <span style={textStyle({ fg: theme.accent })}>{"◆ "}</span>
        <span style={textStyle({ bold: true })}>{title}</span>
      </text>
      {visibleRows.map((row, i) => {
        if (row.type === "group") {
          return (
            <text key={`group-${row.label}`}>
              <span style={textStyle({ fg: theme.muted })}>{BAR} </span>
              <span style={textStyle({ bold: true, fg: theme.muted })}>{` ${row.label}`}</span>
            </text>
          )
        }

        const { item, index: itemIndex } = row
        const isHighlighted = itemIndex === state.cursor
        const isSelected = state.selected.has(item.value)

        return (
          <text key={item.key ?? String(item.value)}>
            <span style={textStyle({ fg: theme.muted })}>{BAR} </span>
            <span style={{ fg: isHighlighted ? resolvedHighlight : undefined }}>
              {isHighlighted ? CURSOR : " "}{" "}
            </span>
            <span style={{ fg: isSelected ? resolvedCheckbox : theme.muted }}>
              {isSelected ? CHECKED : UNCHECKED}{" "}
            </span>
            <span style={{ fg: isHighlighted ? resolvedHighlight : isSelected ? resolvedCheckbox : undefined }}>
              {item.label}
            </span>
          </text>
        )
      })}
    </box>
  )
}
