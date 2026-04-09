import { describe, it, expect, afterEach } from "bun:test"
import { renderTui, cleanup } from "../../../testing/src/index"
import {
  Table,
  TableRoot,
  TableHeader,
  TableBody,
  TableFooter,
  TableRow,
  TableHead,
  TableCell,
  TableCaption,
} from "./table"

afterEach(() => cleanup())

describe("Table snapshots", () => {
  it("renders a compound table", () => {
    const { screen } = renderTui(
      <box padding={1}>
        <TableRoot headerColor="cyan" borderColor="#5e81ac">
          <TableHeader>
            <TableRow>
              <TableHead>name</TableHead>
              <TableHead>role</TableHead>
              <TableHead>status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell>Alice</TableCell>
              <TableCell>Engineer</TableCell>
              <TableCell>Active</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Bob</TableCell>
              <TableCell>Designer</TableCell>
              <TableCell>Active</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Charlie</TableCell>
              <TableCell>PM</TableCell>
              <TableCell>Away</TableCell>
            </TableRow>
          </TableBody>
        </TableRoot>
      </box>,
      { cols: 60, rows: 12 },
    )
    expect(screen.text()).toMatchSnapshot()
  })

  it("renders a Table", () => {
    const data = [
      { name: "Alice", role: "Engineer", status: "Active" },
      { name: "Bob", role: "Designer", status: "Active" },
      { name: "Charlie", role: "PM", status: "Away" },
    ]
    const { screen } = renderTui(
      <box padding={1}>
        <Table data={data} headerColor="cyan" borderColor="#5e81ac" />
      </box>,
      { cols: 60, rows: 12 },
    )
    expect(screen.text()).toMatchSnapshot()
  })

  it("renders with footer and caption", () => {
    const { screen } = renderTui(
      <TableRoot>
        <TableCaption>Recent invoices</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>item</TableHead>
            <TableHead>amount</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>Widget</TableCell>
            <TableCell>$10</TableCell>
          </TableRow>
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell>Total</TableCell>
            <TableCell>$10</TableCell>
          </TableRow>
        </TableFooter>
      </TableRoot>,
      { cols: 30, rows: 10 },
    )
    expect(screen.text()).toMatchSnapshot()
  })

  it("renders with empty data", () => {
    const { screen } = renderTui(
      <Table data={[]} />,
      { cols: 40, rows: 6 },
    )
    expect(screen.text()).toMatchSnapshot()
  })
})
