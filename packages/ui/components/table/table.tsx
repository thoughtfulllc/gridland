import { createContext, useContext, Children, isValidElement, Fragment } from "react"
import type { ReactNode } from "react"
import { textStyle } from "@/registry/gridland/lib/text-style"
import { useTheme } from "@/registry/gridland/lib/theme"

// ── Types ────────────────────────────────────────────────────────────────

type Scalar = string | number | boolean | null | undefined
export type ScalarDict = { [key: string]: Scalar }

// ── Context ──────────────────────────────────────────────────────────────

interface TableContextValue {
  columnWidths: number[]
  padding: number
  headerColor: string
  borderColor: string
  foregroundColor: string
}

const TableContext = createContext<TableContextValue | null>(null)

function useTableContext() {
  const ctx = useContext(TableContext)
  if (!ctx) throw new Error("Table compound components must be used within <TableRoot>")
  return ctx
}

// ── Utility functions ────────────────────────────────────────────────────

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

export interface ColumnInfo<T> {
  field: keyof T
  width: number
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

export function padCell(value: string, width: number, padding: number, align: "left" | "right" | "center" = "left"): string {
  if (align === "right") {
    const leftPad = width - value.length - padding
    return " ".repeat(Math.max(0, leftPad)) + value + " ".repeat(padding)
  }
  if (align === "center") {
    const totalGap = width - value.length
    const leftGap = Math.floor(totalGap / 2)
    const rightGap = totalGap - leftGap
    return " ".repeat(Math.max(0, leftGap)) + value + " ".repeat(Math.max(0, rightGap))
  }
  const rightPad = width - value.length - padding
  return " ".repeat(padding) + value + " ".repeat(Math.max(0, rightPad))
}

// ── Helpers: extract cell text from React tree ───────────────────────────

function extractCellText(node: ReactNode): string {
  if (node == null) return ""
  if (typeof node === "string") return node
  if (typeof node === "number" || typeof node === "boolean") return String(node)
  if (Array.isArray(node)) return node.map(extractCellText).join("")
  if (isValidElement<{ children?: ReactNode }>(node)) return extractCellText(node.props.children)
  return ""
}

function collectColumnWidths(children: ReactNode, padding: number): number[] {
  const columnMaxWidths: number[] = []

  Children.forEach(children, (section) => {
    if (!isValidElement<{ children?: ReactNode }>(section)) return
    if (section.type === TableCaption) return

    Children.forEach(section.props.children, (row: ReactNode) => {
      if (!isValidElement<{ children?: ReactNode }>(row)) return

      let colIdx = 0
      Children.forEach(row.props.children, (cell: ReactNode) => {
        if (!isValidElement<{ children?: ReactNode; colSpan?: number }>(cell)) return
        const span = cell.props.colSpan ?? 1
        if (span === 1) {
          const text = extractCellText(cell.props.children)
          const width = text.length + padding * 2
          if (colIdx >= columnMaxWidths.length) {
            columnMaxWidths.push(width)
          } else {
            columnMaxWidths[colIdx] = Math.max(columnMaxWidths[colIdx], width)
          }
        }
        colIdx += span
      })
    })
  })

  return columnMaxWidths
}

function getTotalWidth(columnWidths: number[]): number {
  if (columnWidths.length === 0) return 0
  return columnWidths.reduce((sum, w) => sum + w, 0) + (columnWidths.length - 1)
}

// ── TableRoot (compound root) ────────────────────────────────────────────

export interface TableRootProps {
  /** Table sub-components (TableHeader, TableBody, TableFooter, TableCaption). */
  children: ReactNode
  /** Cell padding in characters. @default 1 */
  padding?: number
  /** Override header text color. Defaults to theme.foreground. */
  headerColor?: string
  /** Override border/separator color. Defaults to theme.muted. */
  borderColor?: string
}

/** Compound table root — auto-calculates column widths from all header and body cells. */
export function TableRoot({ children, padding = 1, headerColor, borderColor }: TableRootProps) {
  const theme = useTheme()
  const resolvedHeaderColor = headerColor ?? theme.foreground
  const resolvedBorderColor = borderColor ?? theme.muted

  const columnWidths = collectColumnWidths(children, padding)

  return (
    <TableContext.Provider
      value={{
        columnWidths,
        padding,
        headerColor: resolvedHeaderColor,
        borderColor: resolvedBorderColor,
        foregroundColor: theme.foreground,
      }}
    >
      <box>{children}</box>
    </TableContext.Provider>
  )
}

// ── TableHeader ──────────────────────────────────────────────────────────

export interface TableHeaderProps {
  children: ReactNode
}

/** Table header section. Renders a horizontal rule below its rows. */
export function TableHeader({ children }: TableHeaderProps) {
  const ctx = useTableContext()
  const totalWidth = getTotalWidth(ctx.columnWidths)

  return (
    <box>
      {children}
      <text>
        <span style={textStyle({ fg: ctx.borderColor })}>{"\u2500".repeat(totalWidth)}</span>
      </text>
    </box>
  )
}

// ── TableBody ────────────────────────────────────────────────────────────

export interface TableBodyProps {
  children: ReactNode
}

/** Table body section. Renders dim separators between rows. */
export function TableBody({ children }: TableBodyProps) {
  const ctx = useTableContext()
  const totalWidth = getTotalWidth(ctx.columnWidths)
  const rows = Children.toArray(children)

  return (
    <box>
      {rows.map((row, index) => (
        <Fragment key={index}>
          {row}
          {index < rows.length - 1 && (
            <text>
              <span style={textStyle({ fg: ctx.borderColor, dim: true })}>
                {"\u2500".repeat(totalWidth)}
              </span>
            </text>
          )}
        </Fragment>
      ))}
    </box>
  )
}

// ── TableFooter ──────────────────────────────────────────────────────────

export interface TableFooterProps {
  children: ReactNode
}

/** Table footer section. Renders a horizontal rule above its rows. */
export function TableFooter({ children }: TableFooterProps) {
  const ctx = useTableContext()
  const totalWidth = getTotalWidth(ctx.columnWidths)

  return (
    <box>
      <text>
        <span style={textStyle({ fg: ctx.borderColor })}>{"\u2500".repeat(totalWidth)}</span>
      </text>
      {children}
    </box>
  )
}

// ── TableRow ─────────────────────────────────────────────────────────────

export interface TableRowProps {
  children: ReactNode
}

/** Renders a single row of padded, aligned cells. */
export function TableRow({ children }: TableRowProps) {
  const ctx = useTableContext()
  const parts: ReactNode[] = []
  let colIdx = 0

  Children.forEach(children, (child) => {
    if (!isValidElement<TableCellProps>(child)) return

    const text = extractCellText(child.props.children)
    const span = child.props.colSpan ?? 1
    const align = child.props.align ?? "left"
    const cellColor = child.props.color
    const isHead = child.type === TableHead

    // Calculate width (accounting for colSpan)
    let spanWidth = 0
    for (let i = 0; i < span && (colIdx + i) < ctx.columnWidths.length; i++) {
      spanWidth += ctx.columnWidths[colIdx + i]
      if (i > 0) spanWidth += 1
    }
    if (spanWidth === 0) spanWidth = text.length + ctx.padding * 2

    const padded = padCell(text, spanWidth, ctx.padding, align)

    if (colIdx > 0) {
      parts.push(
        <span key={`sep-${colIdx}`} style={textStyle({ fg: ctx.borderColor, dim: true })}>
          {" "}
        </span>,
      )
    }

    const color = cellColor ?? (isHead ? ctx.headerColor : ctx.foregroundColor)
    const dim = !isHead && !cellColor

    parts.push(
      <span key={`cell-${colIdx}`} style={textStyle({ fg: color, dim })}>
        {padded}
      </span>,
    )

    colIdx += span
  })

  return <text>{parts}</text>
}

// ── TableHead ────────────────────────────────────────────────────────────

export interface TableHeadProps {
  children: ReactNode
  /** Text alignment within the cell. @default "left" */
  align?: "left" | "right" | "center"
  /** Override text color for this header cell. */
  color?: string
  /** Number of columns this cell should span. @default 1 */
  colSpan?: number
}

/**
 * Declares a header cell. Does not render itself —
 * TableRow reads the children prop to build the styled row.
 */
export function TableHead(_props: TableHeadProps) {
  return null
}

// ── TableCell ────────────────────────────────────────────────────────────

export interface TableCellProps {
  children: ReactNode
  /** Text alignment within the cell. @default "left" */
  align?: "left" | "right" | "center"
  /** Override text color for this body cell. */
  color?: string
  /** Number of columns this cell should span. @default 1 */
  colSpan?: number
}

/**
 * Declares a body cell. Does not render itself —
 * TableRow reads the children prop to build the styled row.
 */
export function TableCell(_props: TableCellProps) {
  return null
}

// ── TableCaption ─────────────────────────────────────────────────────────

export interface TableCaptionProps {
  children: ReactNode
}

/** Dim caption text rendered outside the table grid. */
export function TableCaption({ children }: TableCaptionProps) {
  const ctx = useTableContext()
  return (
    <text>
      <span style={textStyle({ fg: ctx.borderColor, dim: true })}>
        {extractCellText(children)}
      </span>
    </text>
  )
}

// ── Table (data-driven convenience wrapper) ────────────────────────

export interface TableProps<T extends ScalarDict> {
  /** Array of row objects to display. */
  data: T[]
  /** Ordered subset of keys to show as columns. Defaults to all keys. */
  columns?: (keyof T)[]
  /** Cell padding in characters. @default 1 */
  padding?: number
  /** Override header text color. Defaults to theme.foreground. */
  headerColor?: string
  /** Override border/separator color. Defaults to theme.muted. */
  borderColor?: string
}

/** Data-driven table — pass an array of objects and get a formatted table. */
export function Table<T extends ScalarDict>({
  data,
  columns: columnsProp,
  padding = 1,
  headerColor,
  borderColor,
}: TableProps<T>) {
  const cols = getColumns(data, columnsProp)

  return (
    <TableRoot padding={padding} headerColor={headerColor} borderColor={borderColor}>
      <TableHeader>
        <TableRow>
          {cols.map((col) => (
            <TableHead key={String(col)}>{String(col)}</TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((row, index) => (
          <TableRow key={index}>
            {cols.map((col) => (
              <TableCell key={String(col)}>
                {row[col] == null ? "" : String(row[col])}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </TableRoot>
  )
}
