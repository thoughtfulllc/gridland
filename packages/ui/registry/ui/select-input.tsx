// @ts-nocheck — OpenTUI intrinsic elements conflict with React's HTML/SVG types
import { useReducer, useMemo, useRef } from "react"
import { textStyle } from "./text-style"
import { useTheme } from "./theme"
import { useKeyboardContext } from "./provider"

export type SelectInputItem<V> = {
  /** Unique key for React reconciliation. Falls back to stringified value. */
  key?: string
  /** Display label for this option. */
  label: string
  /** The value returned when this item is selected. Compared by `===`; use primitives. */
  value: V
  /** Optional group heading this item belongs to. */
  group?: string
  /** Whether this item is non-selectable. */
  disabled?: boolean
}

export interface SelectInputProps<V> {
  /** Available options. @default [] */
  items?: SelectInputItem<V>[]
  /** Initially selected value (uncontrolled). */
  defaultValue?: V
  /** Controlled selected value. */
  value?: V
  /** Called when the highlighted item changes (controlled mode). */
  onChange?: (value: V) => void
  /** Disable all interaction. */
  disabled?: boolean
  /** Show validation error state. */
  invalid?: boolean
  /** Custom error message when invalid. @default "Please select an option" */
  errorMessage?: string
  /** Show required indicator on the title. */
  required?: boolean
  /** Text shown when no items are available. */
  placeholder?: string
  /** Heading text above the list. @default "Select" */
  title?: string
  /** Status text shown after submission. @default "submitted" */
  submittedStatus?: string
  /** Maximum visible rows before scrolling. @default 12 */
  limit?: number
  /** Override the cursor/highlight color. Defaults to theme.primary. */
  highlightColor?: string
  /** Override the radio indicator color. Defaults to theme.muted. */
  radioColor?: string
  /** Called when the user confirms selection via Enter. */
  onSubmit?: (value: V) => void
  /** Keyboard handler — pass useKeyboard from @gridland/utils. */
  useKeyboard?: (handler: (event: any) => void) => void
}

type State = {
  cursor: number
  submitted: boolean
}

type Action =
  | { type: "SET_CURSOR"; cursor: number }
  | { type: "SUBMIT" }

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "SET_CURSOR":
      return { ...state, cursor: action.cursor }
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

/** Single-select list with grouping and keyboard navigation. */
export function SelectInput<V>({
  items = [],
  defaultValue,
  value: controlledValue,
  onChange,
  disabled = false,
  invalid = false,
  errorMessage = "Please select an option",
  required = false,
  placeholder,
  title = "Select",
  submittedStatus = "submitted",
  limit,
  highlightColor,
  radioColor,
  onSubmit,
  useKeyboard: useKeyboardProp,
}: SelectInputProps<V>) {
  const theme = useTheme()
  const useKeyboard = useKeyboardContext(useKeyboardProp)
  const resolvedHighlight = highlightColor ?? theme.primary
  const resolvedRadio = radioColor ?? theme.muted

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

  const cursor = selectableItems.length > 0
    ? Math.min(state.cursor, selectableItems.length - 1)
    : 0

  const cursorRef = useRef(cursor)
  cursorRef.current = cursor

  const submittedRef = useRef(state.submitted)
  submittedRef.current = state.submitted

  const selectableItemsRef = useRef(selectableItems)
  selectableItemsRef.current = selectableItems

  const visibleCount = limit ?? VISIBLE
  const cursorRowIndex = flatRows.findIndex((r) => r.type === "item" && r.index === cursor)
  const scrollOffset = Math.max(0, Math.min(cursorRowIndex - Math.floor(visibleCount / 2), Math.max(0, flatRows.length - visibleCount)))
  const visibleRows = flatRows.slice(scrollOffset, scrollOffset + visibleCount)

  const diamondColor = invalid ? theme.error
    : disabled ? theme.muted
    : theme.accent

  useKeyboard?.((event: any) => {
    if (submittedRef.current || disabled) return
    const items = selectableItemsRef.current
    const total = items.length

    const findNextEnabled = (from: number, direction: 1 | -1): number => {
      let next = from
      for (let i = 0; i < total; i++) {
        next += direction
        if (next < 0) next = total - 1
        if (next >= total) next = 0
        if (!items[next]?.item.disabled) return next
      }
      return from // all disabled — stay put
    }

    if (event.name === "up" || event.name === "k") {
      const next = findNextEnabled(cursorRef.current, -1)
      cursorRef.current = next
      dispatch({ type: "SET_CURSOR", cursor: next })
      const nextItem = items[next]
      if (nextItem) onChange?.(nextItem.item.value)
      event.preventDefault?.()
    } else if (event.name === "down" || event.name === "j") {
      const next = findNextEnabled(cursorRef.current, 1)
      cursorRef.current = next
      dispatch({ type: "SET_CURSOR", cursor: next })
      const nextItem = items[next]
      if (nextItem) onChange?.(nextItem.item.value)
      event.preventDefault?.()
    } else if (event.name === "return") {
      const current = items[cursorRef.current]
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
      : selectableItems[cursor]?.item
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
          <span style={textStyle({ fg: theme.error })}>{"  "}{errorMessage}</span>
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
            <text key={`sep-${scrollOffset + i}`}>
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
        const isHighlighted = !disabled && itemIndex === cursor
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
            <span style={textStyle({ fg: resolvedRadio, dim: isItemDisabled })}>
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
