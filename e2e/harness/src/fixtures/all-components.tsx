// @ts-nocheck — OpenTUI intrinsic elements conflict with React's HTML/SVG types
import { FixtureWrapper } from "../fixture-wrapper"
import { Table } from "../../../../packages/polyterm-ui/components/table/table"
import { SelectInput } from "../../../../packages/polyterm-ui/components/select-input/select-input"
import { TextInput } from "../../../../packages/polyterm-ui/components/text-input/text-input"
import { Link } from "../../../../packages/polyterm-ui/components/link/link"

const tableData = [
  { name: "Alice", role: "Engineer", status: "Active" },
  { name: "Bob", role: "Designer", status: "Active" },
]

const selectItems = [
  { label: "TypeScript", value: "ts" },
  { label: "JavaScript", value: "js" },
  { label: "Python", value: "py" },
]

export function AllComponentsFixture() {
  return (
    <FixtureWrapper cols={70} rows={24}>
      <box padding={1} flexDirection="column" gap={1}>
        <text fg="#88c0d0" bold>All Components</text>

        <Table data={tableData} headerColor="cyan" borderColor="#5e81ac" />

        <box flexDirection="column" gap={1}>
          <text fg="#d8dee9" bold>Select:</text>
          <SelectInput items={selectItems} textColor="#d8dee9" selectedTextColor="#88c0d0" />
        </box>

        <box flexDirection="column" gap={1}>
          <text fg="#d8dee9" bold>Input:</text>
          <TextInput placeholder="Type here..." prompt="> " />
        </box>

        <Link url="https://opentui.dev">Visit opentui.dev</Link>
      </box>
    </FixtureWrapper>
  )
}
