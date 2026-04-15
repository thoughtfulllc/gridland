import { useState } from "react"
import { TUI } from "@gridland/web"
import { useKeyboard } from "@gridland/utils"

export function App() {
  const [count, setCount] = useState(0)

  useKeyboard((event) => {
    if (event.name === "up") setCount((n) => n + 1)
    if (event.name === "down") setCount((n) => n - 1)
  })

  return (
    <TUI style={{ width: "100vw", height: "100vh" }} backgroundColor="#1a1a2e">
      <box padding={2} border borderStyle="rounded" borderColor="#7dd3fc">
        <text>Gridland starter — count: {count}</text>
        <text>Press ↑ / ↓ to change</text>
      </box>
    </TUI>
  )
}
