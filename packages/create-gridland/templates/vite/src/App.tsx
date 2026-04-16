// @ts-nocheck
import { TUI } from "@gridland/web"
import { useKeyboard } from "@gridland/utils"
import { LandingApp } from "@gridland/demo/landing"

export function App() {
  return (
    <TUI style={{ width: "100vw", height: "100vh" }} backgroundColor="#1a1a2e">
      <LandingApp useKeyboard={useKeyboard} />
    </TUI>
  )
}
