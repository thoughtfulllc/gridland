"use client"

import { TUI } from "@gridland/web"

function GridlandDemo() {
  return (
    <box flexDirection="column" width="100%" height="100%" padding={1}>
      <box
        border
        borderStyle="rounded"
        borderColor="#88c0d0"
        backgroundColor="#2e3440"
        title=" Gridland App "
        titleAlignment="center"
        flexDirection="column"
        padding={1}
      >
        <text fg="#a3be8c">Welcome to Gridland!</text>
        <text fg="#81a1c1">
          This is rendered directly to an HTML5 Canvas.
        </text>
        <text fg="#b48ead">
          No xterm.js. No terminal emulator. Just pixels.
        </text>
        <text fg="#ebcb8b">Running inside Next.js with SSR safety built in.</text>
      </box>
      <box flexDirection="row" gap={1} marginTop={1}>
        <box
          border
          borderStyle="rounded"
          borderColor="#5e81ac"
          backgroundColor="#2e3440"
          flexGrow={1}
          flexDirection="column"
          padding={1}
        >
          <text fg="#d8dee9" bold>
            Features
          </text>
          <text fg="#81a1c1">• Canvas-based rendering</text>
          <text fg="#81a1c1">• React reconciler</text>
          <text fg="#81a1c1">• SSR-safe component</text>
          <text fg="#81a1c1">• No dynamic imports needed</text>
          <text fg="#81a1c1">• Auto-resize</text>
        </box>
        <box
          border
          borderStyle="rounded"
          borderColor="#bf616a"
          backgroundColor="#2e3440"
          flexGrow={1}
          flexDirection="column"
          padding={1}
        >
          <text fg="#d8dee9" bold>
            Stack
          </text>
          <text fg="#81a1c1">• React 19</text>
          <text fg="#81a1c1">• Next.js 15</text>
          <text fg="#81a1c1">• TypeScript</text>
          <text fg="#81a1c1">• yoga-layout</text>
        </box>
      </box>
    </box>
  )
}

export default function Home() {
  return (
    <TUI style={{ width: "100vw", height: "100vh" }}>
      <GridlandDemo />
    </TUI>
  )
}
