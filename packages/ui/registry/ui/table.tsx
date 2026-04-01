import { createContext, useContext, Children, isValidElement, Fragment } from "react"
import type { ReactNode } from "react"
import { textStyle } from "./text-style"
import { useTheme } from "./theme"

// ── Types ────────────────────────────────────────────────────────────────

type Scalar = string | number | boolean | null | undefined
type ScalarDict = { [key: string]: Scalar }

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

interface ColumnInfo<T> {
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

export function padCell(value: string, width: number, padding: number): string {
  const rightPad = width - value.length - padding
  return " ".repeat(padding) + value + " ".repeat(Math.max(0, rightPad))
}

// ── Helpers: extract cell text from React tree ───────────────────────────

function extractCellText(node: ReactNode): string {
  if (node == null) return ""
  if (typeof node === "string") return node
  if (typeof node === "number" || typeof node === "boolean") return String(node)
  if (Array.isArray(node)) return node.map(extractCellText).join("")
  return ""
}

function collectColumnWidths(children: ReactNode, padding: number): number[] {
  const columnMaxWidths: number[] = []

  Children.forEach(children, (section) => {
    if (!isValidElement(section)) return
    if (section.type === TableCaption) return

    Children.forEach(section.props.children, (row: ReactNode) => {
      if (!isValidElement(row)) return

      let colIdx = 0
      Children.forEach(row.props.children, (cell: ReactNode) => {
        if (!isValidElement(cell)) return
        const text = extractCellText(cell.props.children)
        const width = text.length + padding * 2
        if (colIdx >= columnMaxWidths.length) {
          columnMaxWidths.push(width)
        } else {
          columnMaxWidths[colIdx] = Math.max(columnMaxWidths[colIdx], width)
        }
        colIdx++
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
  const parts: any[] = []
  let colIdx = 0

  Children.forEach(children, (child) => {
    if (!isValidElement(child)) return

    const text = extractCellText(child.props.children)
    const width = ctx.columnWidths[colIdx] ?? text.length + ctx.padding * 2
    const padded = padCell(text, width, ctx.padding)
    const isHead = child.type === TableHead

    if (colIdx > 0) {
      parts.push(
        <span key={`sep-${colIdx}`} style={textStyle({ fg: ctx.borderColor, dim: true })}>
          {" "}
        </span>,
      )
    }

    if (isHead) {
      parts.push(
        <span key={`cell-${colIdx}`} style={textStyle({ fg: ctx.headerColor })}>
          {padded}
        </span>,
      )
    } else {
      parts.push(
        <span key={`cell-${colIdx}`} style={textStyle({ fg: ctx.foregroundColor, dim: true })}>
          {padded}
        </span>,
      )
    }

    colIdx++
  })

  return <text>{parts}</text>
}

// ── TableHead ────────────────────────────────────────────────────────────

export interface TableHeadProps {
  children: ReactNode
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
