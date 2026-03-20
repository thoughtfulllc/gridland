// @ts-nocheck
import { useState, useRef } from "react"
import { useKeyboard } from "@gridland/utils"
import { StatusBar } from "@gridland/ui"

const pointerColors = ["#ef4444", "#f97316", "#eab308", "#22c55e", "#3b82f6", "#8b5cf6"]
const pointerColorNames = ["Red", "Orange", "Yellow", "Green", "Blue", "Purple"]

function HoverBox() {
  const [hovering, setHovering] = useState(false)
  return (
    <box
      border
      borderStyle="rounded"
      borderColor={hovering ? "#22c55e" : "#555"}
      width={20}
      height={5}
      onMouseOver={() => setHovering(true)}
      onMouseOut={() => setHovering(false)}
    >
      <box padding={1}>
        <text style={{ fg: hovering ? "#22c55e" : "#888", bold: hovering }}>
          {hovering ? "Mouse inside!" : "Hover me"}
        </text>
      </box>
    </box>
  )
}

export function PointerApp() {
  const [selected, setSelected] = useState<number | null>(null)
  const [clickCount, setClickCount] = useState(0)
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null)

  const selectedRef = useRef<number | null>(null)
  const clickCountRef = useRef(0)
  selectedRef.current = selected
  clickCountRef.current = clickCount

  useKeyboard((event) => {
    const cur = selectedRef.current ?? -1
    if (event.name === "right" || event.name === "tab") {
      const next = (cur + 1) % pointerColors.length
      selectedRef.current = next
      setSelected(next)
    } else if (event.name === "left") {
      const next = (cur - 1 + pointerColors.length) % pointerColors.length
      selectedRef.current = next
      setSelected(next)
    }
    event.preventDefault()
  })

  return (
    <box flexDirection="column" flexGrow={1} padding={1}>
      <box flexDirection="row" gap={1}>
        {pointerColors.map((color, i) => (
          <box
            key={color}
            flexGrow={1}
            height={3}
            border
            borderStyle="rounded"
            borderColor={i === selected ? color : "#555"}
            onMouseDown={(e: any) => {
              clickCountRef.current++
              setClickCount(clickCountRef.current)
              selectedRef.current = i
              setSelected(i)
              setMousePos({ x: e.x, y: e.y })
            }}
          >
            <text style={{ fg: color, bold: i === selected }}>
              {i === selected ? `▸ ${pointerColorNames[i]}` : ` ${pointerColorNames[i]}`}
            </text>
          </box>
        ))}
      </box>
      <box height={1} />
      <box flexDirection="row" gap={2}>
        <HoverBox />
        <box flexDirection="column" flexGrow={1} paddingTop={1}>
          <text style={{ fg: selected !== null ? pointerColors[selected] : "#888" }}>
            {selected !== null ? `Clicked ${pointerColorNames[selected]}` : "Click a color"}
            {clickCount > 0 ? `  (${clickCount} clicks)` : ""}
          </text>
          <text style={{ dim: true, fg: "#888" }}>
            {mousePos ? `mouse: ${mousePos.x}, ${mousePos.y}` : ""}
          </text>
        </box>
      </box>
      <box paddingX={1} paddingBottom={1}>
        <StatusBar items={[
          { key: "click", label: "select" },
          { key: "←→", label: "keyboard nav" },
        ]} />
      </box>
    </box>
  )
}
