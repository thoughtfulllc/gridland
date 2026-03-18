// @ts-nocheck — OpenTUI intrinsic elements conflict with React's HTML/SVX types
"use client"
import { useState, useRef } from "react"
import { DemoWindow } from "@/components/ui/demo-window"
import { useKeyboard } from "@gridland/utils"

const colors = ["#ef4444", "#f97316", "#eab308", "#22c55e", "#3b82f6", "#8b5cf6"]
const colorNames = ["Red", "Orange", "Yellow", "Green", "Blue", "Purple"]

function ClickableCell({ color, name, onClick, isSelected }: {
  color: string
  name: string
  onClick: () => void
  isSelected: boolean
}) {
  return (
    <box
      flexGrow={1}
      height={3}
      border
      borderStyle={isSelected ? "heavy" : "single"}
      borderColor={isSelected ? color : "#555"}
      onMouseDown={onClick}
    >
      <text style={{ fg: color, bold: isSelected }}>
        {isSelected ? `▸ ${name}` : ` ${name}`}
      </text>
    </box>
  )
}

function PointerDemoApp() {
  const [selected, setSelected] = useState<number | null>(null)
  const [clickCount, setClickCount] = useState(0)
  const [lastAction, setLastAction] = useState("Click a color")

  const selectedRef = useRef<number | null>(null)
  const clickCountRef = useRef(0)
  selectedRef.current = selected
  clickCountRef.current = clickCount

  // Also support keyboard navigation as fallback
  useKeyboard((event) => {
    const cur = selectedRef.current ?? -1
    if (event.name === "right" || event.name === "tab") {
      const next = (cur + 1) % colors.length
      selectedRef.current = next
      setSelected(next)
      setLastAction(`Selected ${colorNames[next]}`)
    } else if (event.name === "left") {
      const next = (cur - 1 + colors.length) % colors.length
      selectedRef.current = next
      setSelected(next)
      setLastAction(`Selected ${colorNames[next]}`)
    }
    event.preventDefault()
  })

  return (
    <box flexDirection="column" flexGrow={1} padding={1}>
      <box flexDirection="row" gap={1}>
        {colors.map((color, i) => (
          <ClickableCell
            key={color}
            color={color}
            name={colorNames[i]}
            isSelected={i === selected}
            onClick={() => {
              clickCountRef.current++
              setClickCount(clickCountRef.current)
              selectedRef.current = i
              setSelected(i)
              setLastAction(`Clicked ${colorNames[i]}`)
            }}
          />
        ))}
      </box>
      <box height={1} />
      <text style={{ fg: selected !== null ? colors[selected] : "#888" }}>
        {lastAction}
        {clickCount > 0 ? `  (${clickCount} clicks)` : ""}
      </text>
      <text style={{ dim: true, fg: "#888" }}>click a cell  ←→ keyboard nav</text>
    </box>
  )
}

export default function PointerDemo() {
  return (
    <DemoWindow title="Pointer Events" tuiStyle={{ width: "100%", height: 180 }}>
      <PointerDemoApp />
    </DemoWindow>
  )
}
