"use client"

import { darkTheme, lightTheme, type Theme } from "@gridland/ui"

const tokenNames = Object.keys(darkTheme) as (keyof Theme)[]

function hexLuminance(hex: string): number {
  const c = hex.replace("#", "")
  const r = parseInt(c.slice(0, 2), 16) / 255
  const g = parseInt(c.slice(2, 4), 16) / 255
  const b = parseInt(c.slice(4, 6), 16) / 255
  return 0.299 * r + 0.587 * g + 0.114 * b
}

function Swatch({ color, label }: { color: string; label: string }) {
  const textColor = hexLuminance(color) > 0.5 ? "#000000" : "#ffffff"
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
      <div
        style={{
          width: 120,
          height: 120,
          borderRadius: 12,
          backgroundColor: color,
          border: "1px solid rgba(128,128,128,0.15)",
          display: "flex",
          alignItems: "flex-end",
          padding: 10,
        }}
      >
        <span style={{ fontSize: 12, fontWeight: 500, fontFamily: "var(--fd-font-mono)", color: textColor }}>
          {color}
        </span>
      </div>
      <span style={{ fontSize: 11, color: "var(--fd-muted-foreground)", fontFamily: "var(--fd-font-mono)" }}>
        {label}
      </span>
    </div>
  )
}

function ThemeGrid({ theme }: { theme: Theme }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
      {tokenNames.map((name) => (
        <Swatch key={name} color={theme[name]} label={name} />
      ))}
    </div>
  )
}

export function DarkThemeDisplay() {
  return <ThemeGrid theme={darkTheme} />
}

export function LightThemeDisplay() {
  return <ThemeGrid theme={lightTheme} />
}
