import { useReducer, useMemo, useRef } from "react"
import { textStyle } from "./text-style"
import { useTheme } from "./theme"
import { useKeyboardContext } from "./provider"

export type SelectInputItem<V> = {
  key?: string
  label: string
  value: V
  group?: string
  disabled?: boolean
}

export interface SelectInputProps<V> {
  items?: SelectInputItem<V>[]
  defaultValue?: V
  value?: V
  onChange?: (value: V) => void
  disabled?: boolean
  invalid?: boolean
  required?: boolean
  placeholder?: string
  title?: string
  submittedStatus?: string
  limit?: number
  highlightColor?: string
  onSubmit?: (value: V) => void
  useKeyboard?: (handler: (event: any) => void) => void
}

type State = {
  cursor: number
  submitted: boolean
}

type Action =
  | { type: "MOVE"; direction: 1 | -1; max: number }
  | { type: "SUBMIT" }

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "MOVE": {
      let next = state.cursor + action.direction
      if (next < 0) next = action.max - 1
      if (next >= action.max) next = 0
      return { ...state, cursor: next }
    }
    case "SUBMIT":
      return { ...state, submitted: true }
    default:
      return state
  }
}

const VISIBLE = 12
const BAR = "│"
const RADIO = "○"
const CURSOR = "▸"
const SEPARATOR = "─"

type Row<V> =
  | { type: "group"; label: string }
  | { type: "separator" }
  | { type: "item"; item: SelectInputItem<V>; index: number }

export function SelectInput<V>({
  items = [],
  defaultValue,
  value: controlledValue,
  onChange,
  disabled = false,
  invalid = false,
  required = false,
  placeholder,
  title = "Select",
  submittedStatus = "submitted",
  limit,
  highlightColor,
  onSubmit,
  useKeyboard: useKeyboardProp,
}: SelectInputProps<V>) {
  const theme = useTheme()
  const useKeyboard = useKeyboardContext(useKeyboardProp)
  const resolvedHighlight = highlightColor ?? theme.primary

  const isControlled = controlledValue !== undefined
  const controlledRef = useRef(isControlled)
  if (controlledRef.current !== isControlled) {
    console.warn("SelectInput: switching between controlled and uncontrolled is not supported.")
  }

  const initialIndex = items.findIndex((i) => i.value === (isControlled ? controlledValue : defaultValue))

  const [state, dispatch] = useReducer(reducer, {
    cursor: Math.max(0, initialIndex),
    submitted: false,
  })

  const { flatRows, selectableItems } = useMemo(() => {
    const rows: Row<V>[] = []
    const selectable: Array<{ item: SelectInputItem<V>; index: number }> = []
    let index = 0
    const grouped = new Map<string, SelectInputItem<V>[]>()
    for (const item of items) {
      const group = item.group ?? ""
      const list = grouped.get(group) ?? []
      list.push(item)
      grouped.set(group, list)
    }
    let first = true
    for (const [group, groupItems] of grouped) {
      if (!first) rows.push({ type: "separator" })
      first = false
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
  const cursorRowIndex = flatRows.findIndex((r) => r.type === "item" && r.index === state.cursor)
  const scrollOffset = Math.max(0, Math.min(cursorRowIndex - Math.floor(visibleCount / 2), flatRows.length - visibleCount))
  const visibleRows = flatRows.slice(scrollOffset, scrollOffset + visibleCount)

  const diamondColor = invalid ? theme.error
    : disabled ? theme.muted
    : theme.accent

  useKeyboard?.((event: any) => {
    if (state.submitted || disabled) return

    if (event.name === "up" || event.name === "k") {
      const direction = -1
      let next = state.cursor + direction
      if (next < 0) next = selectableItems.length - 1
      dispatch({ type: "MOVE", direction, max: selectableItems.length })
      const nextItem = selectableItems[next]
      if (nextItem && !nextItem.item.disabled) {
        onChange?.(nextItem.item.value)
      }
      event.preventDefault?.()
    } else if (event.name === "down" || event.name === "j") {
      const direction = 1
      let next = state.cursor + direction
      if (next >= selectableItems.length) next = 0
      dispatch({ type: "MOVE", direction, max: selectableItems.length })
      const nextItem = selectableItems[next]
      if (nextItem && !nextItem.item.disabled) {
        onChange?.(nextItem.item.value)
      }
      event.preventDefault?.()
    } else if (event.name === "return") {
      const current = selectableItems[state.cursor]
      if (current && !current.item.disabled) {
        dispatch({ type: "SUBMIT" })
        onSubmit?.(isControlled ? controlledValue : current.item.value)
      }
      event.preventDefault?.()
    }
  })

  if (state.submitted) {
    const selectedItem = isControlled
      ? items.find((i) => i.value === controlledValue)
      : selectableItems[state.cursor]?.item
    return (
      <box flexDirection="column">
        <text>
          <span style={textStyle({ fg: theme.success })}>{"◆ "}</span>
          <span style={textStyle({ bold: true, fg: theme.foreground })}>{title}</span>
        </text>
        {selectedItem && (
          <text>
            <span style={textStyle({ fg: theme.success })}>{BAR} </span>
            <span>{"  "}</span>
            <span style={textStyle({ fg: theme.success })}>{"● "}</span>
            <span style={textStyle({ fg: theme.foreground })}>{selectedItem.label}</span>
          </text>
        )}
        <text> </text>
        <text>
          <span style={textStyle({ dim: true, fg: theme.muted })}>{submittedStatus}</span>
        </text>
      </box>
    )
  }

  const hasItems = selectableItems.length > 0

  return (
    <box flexDirection="column">
      <text>
        <span style={textStyle({ fg: diamondColor, dim: disabled })}>{"◆ "}</span>
        <span style={textStyle({ bold: true, dim: disabled, fg: theme.foreground })}>{title}</span>
        {required && <span style={textStyle({ fg: theme.error })}>{" *"}</span>}
      </text>
      {invalid && (
        <text>
          <span style={textStyle({ fg: theme.muted })}>{BAR} </span>
          <span style={textStyle({ fg: theme.error })}>{"  Please select an option"}</span>
        </text>
      )}
      {!hasItems && placeholder && (
        <text>
          <span style={textStyle({ fg: theme.muted })}>{BAR} </span>
          <span style={textStyle({ dim: true, fg: theme.muted })}>{"  "}{placeholder}</span>
        </text>
      )}
      {visibleRows.map((row, i) => {
        if (row.type === "separator") {
          return (
            <text key={`sep-${i}`}>
              <span style={textStyle({ fg: theme.muted })}>{BAR} </span>
              <span style={textStyle({ fg: theme.muted })}>{"  "}{SEPARATOR.repeat(20)}</span>
            </text>
          )
        }

        if (row.type === "group") {
          return (
            <text key={`group-${row.label}`}>
              <span style={textStyle({ fg: theme.muted })}>{BAR} </span>
              <span style={textStyle({ bold: true, fg: theme.muted })}>{` ${row.label}`}</span>
            </text>
          )
        }

        const { item, index: itemIndex } = row
        const isHighlighted = !disabled && itemIndex === state.cursor
        const isItemDisabled = disabled || !!item.disabled
        const itemColor = isItemDisabled ? theme.muted
          : isHighlighted ? resolvedHighlight
          : theme.foreground

        return (
          <text key={item.key ?? String(item.value)}>
            <span style={textStyle({ fg: theme.muted })}>{BAR} </span>
            <span style={textStyle({ fg: isHighlighted ? resolvedHighlight : undefined })}>
              {isHighlighted ? CURSOR : " "}{" "}
            </span>
            <span style={textStyle({ fg: theme.muted, dim: isItemDisabled })}>
              {RADIO}{" "}
            </span>
            <span style={textStyle({ fg: itemColor, dim: isItemDisabled })}>
              {item.label}
            </span>
          </text>
        )
      })}
    </box>
  )
}
