// @ts-nocheck — OpenTUI intrinsic elements conflict with React's HTML/SVG types
"use client"
import { useState, useEffect } from "react"
import { TUI } from "@gridland/web"
import { LandingApp } from "@gridland/demo/landing"
import { useKeyboard } from "@gridland/utils"

function useResponsiveFontSize() {
  const [fontSize, setFontSize] = useState(14)
  useEffect(() => {
    const update = () => {
      // Block font needs ~72 cols. Monospace char width ≈ fontSize * 0.6.
      // Compute the largest font size that gives at least 72 cols.
      const needed = Math.floor(window.innerWidth / (72 * 0.6))
      setFontSize(Math.max(9, Math.min(14, needed)))
    }
    update()
    window.addEventListener("resize", update)
    return () => window.removeEventListener("resize", update)
  }, [])
  return fontSize
}

export default function HomePage() {
  const fontSize = useResponsiveFontSize()
  return (
    <TUI style={{ width: "100vw", height: "100vh" }} fontSize={fontSize} backgroundColor="#1a1a2e">
      <LandingApp useKeyboard={useKeyboard} />
    </TUI>
  )
}
