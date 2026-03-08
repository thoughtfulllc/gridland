import { TUI } from "@gridland/web"

function GridlandDemo() {
  return (
    <box
      flexDirection="column"
      width="100%"
      height="100%"
      padding={1}
    >
      <box
        border={true}
        borderStyle="rounded"
        borderColor="#88c0d0"
        backgroundColor="#2e3440"
        title=" Gridland App "
        titleAlignment="center"
        flexDirection="column"
        padding={1}
      >
        <text fg="#a3be8c">Welcome to Gridland!</text>
        <text fg="#81a1c1">This is rendered directly to an HTML5 Canvas.</text>
        <text fg="#b48ead">No xterm.js. No terminal emulator. Just pixels.</text>
      </box>

      <box marginTop={1} flexDirection="row" gap={2}>
        <box
          border={true}
          borderStyle="single"
          borderColor="#5e81ac"
          flexGrow={1}
          padding={1}
          flexDirection="column"
        >
          <text fg="#ebcb8b" bold={true}>Features</text>
          <text fg="#d8dee9">• Canvas-based rendering</text>
          <text fg="#d8dee9">• React reconciler</text>
          <text fg="#d8dee9">• Yoga layout engine</text>
          <text fg="#d8dee9">• Keyboard input</text>
          <text fg="#d8dee9">• Auto-resize</text>
        </box>

        <box
          border={true}
          borderStyle="single"
          borderColor="#bf616a"
          flexGrow={1}
          padding={1}
          flexDirection="column"
        >
          <text fg="#ebcb8b" bold={true}>Stack</text>
          <text fg="#d8dee9">• React 19</text>
          <text fg="#d8dee9">• Vite 6</text>
          <text fg="#d8dee9">• TypeScript</text>
          <text fg="#d8dee9">• yoga-layout</text>
        </box>
      </box>
    </box>
  )
}

export function App() {
  return (
    <TUI style={{ width: "100vw", height: "100vh" }}>
      <GridlandDemo />
    </TUI>
  )
}
