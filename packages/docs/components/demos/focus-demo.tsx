// @ts-nocheck — OpenTUI intrinsic elements conflict with React's HTML/SVX types
"use client"
import { useState, useRef } from "react"
import { DemoWindow } from "@/components/ui/demo-window"
import { useKeyboard } from "@gridland/utils"

const panelData = [
  {
    label: "Language",
    items: [
      { label: "TypeScript", value: "ts" },
      { label: "JavaScript", value: "js" },
      { label: "Python", value: "py" },
    ],
  },
  {
    label: "Framework",
    items: [
      { label: "React", value: "react" },
      { label: "Vue", value: "vue" },
      { label: "Svelte", value: "svelte" },
    ],
  },
  {
    label: "Runtime",
    items: [
      { label: "Bun", value: "bun" },
      { label: "Node", value: "node" },
      { label: "Deno", value: "deno" },
    ],
  },
]

function MiniSelect({ items, active, cursor }: {
  items: { label: string; value: string }[]
  active: boolean
  cursor: number
}) {
  return (
    <box flexDirection="column">
      {items.map((item, i) => {
        const highlighted = active && i === cursor
        return (
          <text key={item.value} style={{
            fg: highlighted ? "#22c55e" : active ? "#ccc" : "#666",
            bold: highlighted,
          }}>
            {highlighted ? " ▸ " : "   "}{item.label}
          </text>
        )
      })}
    </box>
  )
}

function FocusDemoApp() {
  const [panelIndex, setPanelIndex] = useState(0)
  const [entered, setEntered] = useState(false)
  const [cursors, setCursors] = useState([0, 0, 0])
  const [selections, setSelections] = useState<(string | null)[]>([null, null, null])

  // Refs for values accessed inside keyboard handler
  const panelRef = useRef(0)
  const enteredRef = useRef(false)
  const cursorsRef = useRef([0, 0, 0])
  panelRef.current = panelIndex
  enteredRef.current = entered
  cursorsRef.current = cursors

  useKeyboard((event) => {
    const pi = panelRef.current
    if (enteredRef.current) {
      const items = panelData[pi].items
      const cur = cursorsRef.current[pi]
      if (event.name === "down" || event.name === "j") {
        const next = (cur + 1) % items.length
        cursorsRef.current = [...cursorsRef.current]
        cursorsRef.current[pi] = next
        setCursors([...cursorsRef.current])
      } else if (event.name === "up" || event.name === "k") {
        const next = (cur - 1 + items.length) % items.length
        cursorsRef.current = [...cursorsRef.current]
        cursorsRef.current[pi] = next
        setCursors([...cursorsRef.current])
      } else if (event.name === "return") {
        const selected = items[cursorsRef.current[pi]].label
        setSelections((s) => { const n = [...s]; n[pi] = selected; return n })
        enteredRef.current = false
        setEntered(false)
      } else if (event.name === "escape") {
        enteredRef.current = false
        setEntered(false)
      }
    } else {
      if (event.name === "down" || event.name === "tab") {
        const next = (pi + 1) % panelData.length
        panelRef.current = next
        setPanelIndex(next)
      } else if (event.name === "up") {
        const next = (pi - 1 + panelData.length) % panelData.length
        panelRef.current = next
        setPanelIndex(next)
      } else if (event.name === "return") {
        enteredRef.current = true
        setEntered(true)
      }
    }
    event.preventDefault()
  })

  return (
    <box flexDirection="column" flexGrow={1} padding={1}>
      <text style={{ dim: true, fg: "#888" }}>
        {entered ? "↑↓ select  enter confirm  esc back" : "↑↓ navigate  enter select  tab next"}
      </text>
      <box height={1} />
      <box flexDirection="row" gap={1} flexGrow={1}>
        {panelData.map((panel, i) => {
          const focused = i === panelIndex
          const active = focused && entered
          const selected = selections[i]
          return (
            <box
              key={panel.label}
              border
              borderStyle="rounded"
              borderColor={active ? "#22c55e" : focused ? "#3b82f6" : "#555"}
              flexGrow={1}
            >
              <box flexDirection="column" padding={1}>
                <text style={{
                  fg: active ? "#22c55e" : focused ? "#3b82f6" : "#888",
                  bold: focused,
                }}>
                  {focused ? "▸ " : "  "}{panel.label}
                  {selected ? `: ${selected}` : ""}
                </text>
                {(active || (!entered && focused)) && (
                  <>
                    <box height={1} />
                    <MiniSelect items={panel.items} active={active} cursor={cursors[i]} />
                  </>
                )}
              </box>
            </box>
          )
        })}
      </box>
    </box>
  )
}

export default function FocusDemo() {
  return (
    <DemoWindow title="Focus & Navigation" tuiStyle={{ width: "100%", height: 340 }}>
      <FocusDemoApp />
    </DemoWindow>
  )
}
