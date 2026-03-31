import { useReducer, useMemo, useRef } from "react"
import { textStyle } from "../text-style"
import { useTheme } from "../theme/index"
import { useKeyboardContext } from "../provider/provider"

export type MultiSelectItem<V> = {
  key?: string
  label: string
  value: V
  group?: string
  disabled?: boolean
}

export interface MultiSelectProps<V> {
  items?: MultiSelectItem<V>[]
  defaultSelected?: V[]
  selected?: V[]
  onChange?: (values: V[]) => void
  disabled?: boolean
  invalid?: boolean
  required?: boolean
  placeholder?: string
  maxCount?: number
  title?: string
  submittedStatus?: string
  limit?: number
  enableSelectAll?: boolean
  enableClear?: boolean
  highlightColor?: string
  checkboxColor?: string
  allowEmpty?: boolean
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
  | { type: "SET_SELECTED"; values: V[] }
  | { type: "SUBMIT" }

function reducer<V>(state: State<V>, action: Action<V>): State<V> {
  switch (action.type) {
    case "MOVE": {
      let next = state.cursor + action.direction
      if (next < 0) next = action.max - 1
      if (next >= action.max) next = 0
      return { ...state, cursor: next }
    }
    case "SET_SELECTED":
      return { ...state, selected: new Set(action.values) }
    case "SUBMIT":
      return { ...state, submitted: true }
    default:
      return state
  }
}

const VISIBLE = 12
const BAR = "│"
const CHECKED = "●"
const UNCHECKED = "○"
const CURSOR = "▸"
const SEPARATOR = "─"

type Row<V> =
  | { type: "group"; label: string }
  | { type: "separator" }
  | { type: "item"; item: MultiSelectItem<V>; index: number }

export function MultiSelect<V>({
  items = [],
  defaultSelected = [],
  selected: controlledSelected,
  onChange,
  disabled = false,
  invalid = false,
  required = false,
  placeholder,
  maxCount,
  title = "Select",
  submittedStatus = "submitted",
  limit,
  enableSelectAll = true,
  enableClear = true,
  highlightColor,
  checkboxColor,
  allowEmpty = false,
  onSubmit,
  useKeyboard: useKeyboardProp,
}: MultiSelectProps<V>) {
  const theme = useTheme()
  const useKeyboard = useKeyboardContext(useKeyboardProp)
  const resolvedHighlight = highlightColor ?? theme.primary
  const resolvedCheckbox = checkboxColor ?? theme.accent

  const isControlled = controlledSelected !== undefined
  const controlledRef = useRef(isControlled)
  if (controlledRef.current !== isControlled) {
    console.warn("MultiSelect: switching between controlled and uncontrolled is not supported.")
  }

  const [state, dispatch] = useReducer(reducer<V>, {
    cursor: 0,
    selected: new Set(isControlled ? controlledSelected : defaultSelected),
    submitted: false,
  })

  const cursorRef = useRef(0)
  const currentSelected = isControlled ? new Set(controlledSelected) : state.selected

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

  const hasSubmitRow = allowEmpty || currentSelected.size > 0
  const totalPositions = selectableItems.length + (hasSubmitRow ? 1 : 0)
  const isOnSubmit = hasSubmitRow && state.cursor === selectableItems.length

  const visibleCount = limit ?? VISIBLE
  const cursorRowIndex = flatRows.findIndex((r) => r.type === "item" && r.index === state.cursor)
  const scrollOffset = Math.max(0, Math.min(cursorRowIndex - Math.floor(visibleCount / 2), flatRows.length - visibleCount))
  const visibleRows = flatRows.slice(scrollOffset, scrollOffset + visibleCount)

  const setSelected = (values: V[]) => {
    if (isControlled) {
      onChange?.(values)
    } else {
      dispatch({ type: "SET_SELECTED", values })
    }
  }

  const diamondColor = invalid ? theme.error
    : disabled ? theme.muted
    : theme.accent

  useKeyboard?.((event: any) => {
    if (state.submitted || disabled) return

    const move = (direction: 1 | -1) => {
      let next = cursorRef.current + direction
      if (next < 0) next = totalPositions - 1
      if (next >= totalPositions) next = 0
      cursorRef.current = next
      dispatch({ type: "MOVE", direction, max: totalPositions })
    }

    if (event.name === "up" || event.name === "k") {
      move(-1)
      event.preventDefault?.()
    } else if (event.name === "down" || event.name === "j") {
      move(1)
      event.preventDefault?.()
    } else if (event.name === "return") {
      const onSubmitRow = hasSubmitRow && cursorRef.current === selectableItems.length
      if (onSubmitRow) {
        dispatch({ type: "SUBMIT" })
        onSubmit?.(Array.from(currentSelected))
      } else {
        const current = selectableItems[cursorRef.current]
        if (current && !current.item.disabled) {
          const isDeselecting = currentSelected.has(current.item.value)
          if (!isDeselecting && maxCount !== undefined && currentSelected.size >= maxCount) return
          const next = new Set(currentSelected)
          if (isDeselecting) next.delete(current.item.value)
          else next.add(current.item.value)
          setSelected(Array.from(next))
        }
      }
      event.preventDefault?.()
    } else if (event.name === "a" && enableSelectAll) {
      const enabledValues = items.filter((i) => !i.disabled).map((i) => i.value)
      setSelected(maxCount !== undefined ? enabledValues.slice(0, maxCount) : enabledValues)
      event.preventDefault?.()
    } else if (event.name === "x" && enableClear) {
      setSelected([])
      event.preventDefault?.()
    }
  })

  if (state.submitted) {
    const selectedItems = items.filter((i) => currentSelected.has(i.value))
    return (
      <box flexDirection="column">
        <text>
          <span style={textStyle({ fg: theme.success })}>{"◆ "}</span>
          <span style={textStyle({ bold: true, fg: theme.foreground })}>{title}</span>
        </text>
        {selectedItems.map((item) => (
          <text key={item.key ?? String(item.value)}>
            <span style={textStyle({ fg: theme.success })}>{BAR} </span>
            <span>{"  "}</span>
            <span style={textStyle({ fg: theme.success })}>{CHECKED} </span>
            <span style={textStyle({ fg: theme.foreground })}>{item.label}</span>
          </text>
        ))}
        <text> </text>
        <text>
          <span style={textStyle({ dim: true, fg: theme.muted })}>{selectedItems.length} selected — {submittedStatus}</span>
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
        {maxCount !== undefined && (
          <span style={textStyle({ dim: true, fg: theme.muted })}>{` (${currentSelected.size}/${maxCount})`}</span>
        )}
      </text>
      {invalid && (
        <text>
          <span style={textStyle({ fg: theme.muted })}>{BAR} </span>
          <span style={textStyle({ fg: theme.error })}>{"  Please select at least one option"}</span>
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
        const isSelected = currentSelected.has(item.value)
        const isItemDisabled = disabled || !!item.disabled
        const itemColor = isItemDisabled ? theme.muted
          : isHighlighted ? resolvedHighlight
          : isSelected ? resolvedCheckbox
          : theme.foreground

        return (
          <text key={item.key ?? String(item.value)}>
            <span style={textStyle({ fg: theme.muted })}>{BAR} </span>
            <span style={textStyle({ fg: isHighlighted ? resolvedHighlight : undefined })}>
              {isHighlighted ? CURSOR : " "}{" "}
            </span>
            <span style={textStyle({ fg: isSelected && !isItemDisabled ? resolvedCheckbox : theme.muted, dim: isItemDisabled })}>
              {isSelected ? CHECKED : UNCHECKED}{" "}
            </span>
            <span style={textStyle({ fg: itemColor, dim: isItemDisabled })}>
              {item.label}
            </span>
          </text>
        )
      })}
      {hasSubmitRow && (
        <text>
          <span style={textStyle({ fg: theme.muted })}>{BAR} </span>
          <span style={textStyle({ fg: isOnSubmit ? resolvedHighlight : undefined })}>
            {isOnSubmit ? CURSOR : " "}{" "}
          </span>
          <span style={textStyle({ fg: isOnSubmit ? resolvedHighlight : theme.muted })}>
            {"↳ "}
          </span>
          <span style={textStyle({ fg: isOnSubmit ? resolvedHighlight : theme.foreground })}>
            {"Submit"}
          </span>
        </text>
      )}
    </box>
  )
}
