// @ts-nocheck — OpenTUI intrinsic elements conflict with React's HTML/SVG types
import { FixtureWrapper } from "../fixture-wrapper"
import { Table } from "../../../../packages/polyterm-ui/components/table/table"

const tableData = [
  { name: "Alice", role: "Engineer", status: "Active" },
  { name: "Bob", role: "Designer", status: "Active" },
  { name: "Charlie", role: "PM", status: "Away" },
]

export function TableFixture() {
  return (
    <FixtureWrapper cols={60} rows={12}>
      <box padding={1}>
        <Table data={tableData} headerColor="cyan" borderColor="#5e81ac" />
      </box>
    </FixtureWrapper>
  )
}
