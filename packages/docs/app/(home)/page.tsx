// @ts-nocheck — OpenTUI intrinsic elements conflict with React's HTML/SVG types
"use client"
import { TUI } from "@gridland/web"
import { LandingApp } from "../../components/landing"
import { useKeyboard } from "@gridland/utils"

export default function HomePage() {
  return (
    <TUI style={{ width: "100vw", height: "100vh" }} backgroundColor="#1a1a2e">
      <LandingApp useKeyboard={useKeyboard} />
    </TUI>
  )
}
