// @ts-nocheck — OpenTUI intrinsic elements conflict with React's HTML/SVG types
import type { ReactNode } from "react"
import { Table } from "../components/table/table"
import { Gradient } from "../components/gradient/gradient"
import { Spinner } from "../components/spinner/spinner"
import { SelectInput } from "../components/select-input/select-input"
import { MultiSelect } from "../components/multi-select/multi-select"
import { TextInput } from "../components/text-input/text-input"
import { Link } from "../components/link/link"
import { TabBar } from "../components/tab-bar/tab-bar"
import { StatusBar } from "../components/status-bar/status-bar"
import { Modal } from "../components/modal/modal"
import { ChatPanel } from "../components/chat/chat"
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
  {
    name: "tab-bar",
    cols: 60,
    rows: 4,
    jsx: () => (
      <box padding={1} flexDirection="column" gap={1}>
        <TabBar label="View" options={["Files", "Search", "Git"]} selectedIndex={0} activeColor="cyan" />
        <TabBar options={["Tab1", "Tab2", "Tab3"]} selectedIndex={1} focused={false} />
      </box>
    ),
  },
  {
    name: "status-bar",
    cols: 70,
    rows: 4,
    jsx: () => (
      <box padding={1} flexDirection="column" gap={1}>
        <StatusBar
          items={[
            { key: "Tab", label: "switch focus" },
            { key: "\u2190\u2192", label: "navigate" },
            { key: "q", label: "quit" },
          ]}
        />
        <StatusBar
          extra="main.ts"
          items={[
            { key: "Ctrl+S", label: "save" },
            { key: "Ctrl+Q", label: "quit" },
          ]}
        />
      </box>
    ),
  },
  {
    name: "modal",
    cols: 50,
    rows: 10,
    jsx: () => (
      <Modal title="Settings" borderColor="blue">
        <box paddingX={1}>
          <text fg="#d8dee9">Modal content goes here</text>
        </box>
      </Modal>
    ),
  },
  {
    name: "chat",
    cols: 60,
    rows: 14,
    jsx: () => (
      <ChatPanel
        messages={[
          { id: "1", role: "user", content: "Hello, can you help me?" },
          { id: "2", role: "assistant", content: "Sure! Let me look into that." },
          { id: "3", role: "user", content: "Can you read my file?" },
        ]}
        activeToolCalls={[
          { id: "t1", title: "Read file", status: "in_progress" },
          { id: "t2", title: "Edit file", status: "completed" },
        ]}
        streamingText="Reading the file now"
        onSendMessage={() => {}}
      />
    ),
  },
]
