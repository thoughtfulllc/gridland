// @ts-nocheck
import { describe, it, expect, afterEach } from "bun:test"
import { renderTui, cleanup } from "../../../polyterm-testing/src/index"
import { Table } from "./table"

afterEach(() => cleanup())

describe("Table snapshots", () => {
  it("renders a 3-row table", () => {
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

  it("renders with empty data", () => {
    const { screen } = renderTui(
      <Table data={[]} />,
      { cols: 40, rows: 6 },
    )
    expect(screen.text()).toMatchSnapshot()
  })
})
