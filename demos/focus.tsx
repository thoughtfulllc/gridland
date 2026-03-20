// @ts-nocheck
"use client"
import { useState, useRef } from "react"
import { useKeyboard } from "@gridland/utils"
import { StatusBar } from "@gridland/ui"

const focusPanels = [
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

export function FocusApp() {
  const [panelIndex, setPanelIndex] = useState(0)
  const [entered, setEntered] = useState(false)
  const [cursors, setCursors] = useState([0, 0, 0])
  const [selections, setSelections] = useState<(string | null)[]>([null, null, null])

  const panelRef = useRef(0)
  const enteredRef = useRef(false)
  const cursorsRef = useRef([0, 0, 0])
  panelRef.current = panelIndex
  enteredRef.current = entered
  cursorsRef.current = cursors

  useKeyboard((event) => {
    const pi = panelRef.current
    if (enteredRef.current) {
      const items = focusPanels[pi].items
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
      if (event.name === "right" || event.name === "tab") {
        const next = (pi + 1) % focusPanels.length
        panelRef.current = next
        setPanelIndex(next)
      } else if (event.name === "left") {
        const next = (pi - 1 + focusPanels.length) % focusPanels.length
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
    <box flexDirection="column" flexGrow={1}>
      <box flexDirection="row" gap={1} padding={1} flexGrow={1}>
        {focusPanels.map((panel, i) => {
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
                    <box flexDirection="column">
                      {panel.items.map((item, j) => {
                        const highlighted = active && j === cursors[i]
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
                  </>
                )}
              </box>
            </box>
          )
        })}
      </box>
      <box paddingX={1} paddingBottom={1}>
        <StatusBar
          items={entered
            ? [{ key: "↑↓", label: "select" }, { key: "enter", label: "confirm" }, { key: "esc", label: "back" }]
            : [{ key: "←→", label: "navigate" }, { key: "enter", label: "select" }, { key: "tab", label: "next" }]
          }
        />
      </box>
    </box>
  )
}
