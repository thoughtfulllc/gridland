import { Fragment } from "react"
import { textStyle } from "../text-style"

type Scalar = string | number | boolean | null | undefined
type ScalarDict = { [key: string]: Scalar }

export interface TableProps<T extends ScalarDict> {
  data: T[]
  columns?: (keyof T)[]
  padding?: number
  headerColor?: string
  borderColor?: string
}

interface ColumnInfo<T> {
  field: keyof T
  width: number
}

export function getColumns<T extends ScalarDict>(
  data: T[],
  columnsProp?: (keyof T)[],
): (keyof T)[] {
  if (columnsProp) return columnsProp
  const keys = new Set<keyof T>()
  for (const row of data) {
    for (const key in row) keys.add(key)
  }
  return Array.from(keys)
}

export function calculateColumnWidths<T extends ScalarDict>(
  columns: (keyof T)[],
  data: T[],
  padding: number,
): ColumnInfo<T>[] {
  return columns.map((field) => {
    const headerWidth = String(field).length
    const maxDataWidth = data.reduce((max, row) => {
      const val = row[field]
      return Math.max(max, val == null ? 0 : String(val).length)
    }, 0)
    return { field, width: Math.max(headerWidth, maxDataWidth) + padding * 2 }
  })
}

export function padCell(value: string, width: number, padding: number): string {
  const rightPad = width - value.length - padding
  return " ".repeat(padding) + value + " ".repeat(Math.max(0, rightPad))
}

export function Table<T extends ScalarDict>({
  data,
  columns: columnsProp,
  padding = 1,
  headerColor = "blue",
  borderColor,
}: TableProps<T>) {
  const columns = getColumns(data, columnsProp)
  const colInfo = calculateColumnWidths(columns, data, padding)

  const borderLine = (left: string, mid: string, right: string) => {
    const inner = colInfo.map((c) => "\u2500".repeat(c.width)).join(mid)
    return (
      <text>
        <span style={textStyle({ fg: borderColor, bold: true })}>
          {left}
          {inner}
          {right}
        </span>
      </text>
    )
  }

  const contentRow = (rowData: Partial<T>, isHeader: boolean) => {
    const parts: any[] = []
    parts.push(
      <span key="left-border" style={textStyle({ fg: borderColor, bold: true })}>
        {"\u2502"}
      </span>,
    )

    colInfo.forEach((col, i) => {
      const val = rowData[col.field]
      const str = val == null ? "" : String(val)
      const padded = padCell(str, col.width, padding)

      if (isHeader) {
        parts.push(
          <span key={`cell-${i}`} style={textStyle({ fg: headerColor, bold: true })}>
            {padded}
          </span>,
        )
      } else {
        parts.push(<span key={`cell-${i}`}>{padded}</span>)
      }

      if (i < colInfo.length - 1) {
        parts.push(
          <span key={`sep-${i}`} style={textStyle({ fg: borderColor, bold: true })}>
            {"\u2502"}
          </span>,
        )
      }
    })

    parts.push(
      <span key="right-border" style={textStyle({ fg: borderColor, bold: true })}>
        {"\u2502"}
      </span>,
    )
    return <text>{parts}</text>
  }

  const headerData = columns.reduce(
    (acc, col) => ({ ...acc, [col]: col }),
    {} as Partial<T>,
  )

  return (
    <box>
      {borderLine("\u250c", "\u252c", "\u2510")}
      {contentRow(headerData, true)}
      {data.map((row, index) => (
        <Fragment key={index}>
          {borderLine("\u251c", "\u253c", "\u2524")}
          {contentRow(row, false)}
        </Fragment>
      ))}
      {borderLine("\u2514", "\u2534", "\u2518")}
    </box>
  )
}
