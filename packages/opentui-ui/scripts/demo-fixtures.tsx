// @ts-nocheck — OpenTUI intrinsic elements conflict with React's HTML/SVG types
import type { ReactNode } from "react"
import { Table } from "../components/table/table"
import { Gradient } from "../components/gradient/gradient"
import { Spinner } from "../components/spinner/spinner"
import { SelectInput } from "../components/select-input/select-input"
import { MultiSelect } from "../components/multi-select/multi-select"
import { TextInput } from "../components/text-input/text-input"
import { Link } from "../components/link/link"
import figlet from "figlet"
// @ts-ignore — importable-fonts has no type declarations
import ansiShadow from "figlet/importable-fonts/ANSI Shadow.js"

figlet.parseFont("ANSI Shadow", ansiShadow)

export interface DemoFixture {
  name: string
  jsx: () => ReactNode
  cols: number
  rows: number
}

const tableData = [
  { name: "Alice", role: "Engineer", status: "Active" },
  { name: "Bob", role: "Designer", status: "Active" },
  { name: "Charlie", role: "PM", status: "Away" },
]

const selectItems = [
  { label: "TypeScript", value: "ts" },
  { label: "JavaScript", value: "js" },
  { label: "Python", value: "py" },
  { label: "Rust", value: "rs" },
]

const asciiArt = figlet.textSync("OpenTUI", { font: "ANSI Shadow" as any })
const asciiLines = asciiArt.split("\n").filter((l: string) => l.trimEnd().length > 0)

export const fixtures: DemoFixture[] = [
  {
    name: "table",
    cols: 60,
    rows: 12,
    jsx: () => (
      <box padding={1}>
        <Table data={tableData} headerColor="cyan" borderColor="#5e81ac" />
      </box>
    ),
  },
  {
    name: "gradient",
    cols: 60,
    rows: 8,
    jsx: () => (
      <box padding={1} flexDirection="column" gap={1}>
        <Gradient name="rainbow">{"Hello, Gradient!"}</Gradient>
        <Gradient name="passion">{"Passion gradient text"}</Gradient>
        <Gradient name="vice">{"Vice gradient text"}</Gradient>
      </box>
    ),
  },
  {
    name: "spinner",
    cols: 40,
    rows: 6,
    jsx: () => (
      <box padding={1} flexDirection="column" gap={1}>
        <Spinner text="Loading..." color="cyan" />
        <Spinner text="Processing" color="#a3be8c" />
      </box>
    ),
  },
  {
    name: "select-input",
    cols: 40,
    rows: 10,
    jsx: () => (
      <box padding={1} flexDirection="column" gap={1}>
        <text fg="#d8dee9" bold>Choose a language:</text>
        <SelectInput items={selectItems} textColor="#d8dee9" selectedTextColor="#88c0d0" />
      </box>
    ),
  },
  {
    name: "multi-select",
    cols: 40,
    rows: 10,
    jsx: () => (
      <box padding={1} flexDirection="column" gap={1}>
        <text fg="#d8dee9" bold>Select languages:</text>
        <MultiSelect items={selectItems} />
      </box>
    ),
  },
  {
    name: "text-input",
    cols: 50,
    rows: 6,
    jsx: () => (
      <box padding={1} flexDirection="column" gap={1}>
        <text fg="#d8dee9" bold>Enter your name:</text>
        <TextInput placeholder="Type something..." prompt="> " />
      </box>
    ),
  },
  {
    name: "link",
    cols: 50,
    rows: 6,
    jsx: () => (
      <box padding={1} flexDirection="column" gap={1}>
        <text fg="#d8dee9">Click the link below:</text>
        <Link url="https://opentui.dev">Visit opentui.dev</Link>
      </box>
    ),
  },
  {
    name: "ascii",
    cols: 80,
    rows: 14,
    jsx: () => (
      <box padding={1} flexDirection="column">
        {asciiLines.map((line: string, i: number) => (
          <text key={i} fg="#88c0d0" bold>{line}</text>
        ))}
        <text />
        <text fg="#d8dee9" dim>{"  ASCII art via figlet (ANSI Shadow font)"}</text>
      </box>
    ),
  },
  {
    name: "primitives",
    cols: 60,
    rows: 12,
    jsx: () => (
      <box padding={1} flexDirection="column" gap={1}>
        <text fg="#88c0d0" bold>OpenTUI Primitives</text>
        <box border borderStyle="round" borderColor="#5e81ac" padding={1} flexDirection="column">
          <text fg="#a3be8c">Boxes with borders</text>
          <text fg="#d8dee9" dim>Styled text elements</text>
        </box>
      </box>
    ),
  },
]
