// @ts-nocheck — gridland intrinsic elements conflict with React's HTML/SVG types
"use client"
import { useState } from "react"
import { DemoWindow } from "@/components/ui/demo-window"
import { StatusBar, textStyle, useTheme } from "@gridland/ui"
import { useKeyboard } from "@gridland/core"
import figlet from "figlet"
// @ts-ignore — importable-fonts has no type declarations
import ansiShadow from "figlet/importable-fonts/ANSI Shadow.js"
// @ts-ignore
import big from "figlet/importable-fonts/Big.js"
// @ts-ignore
import doom from "figlet/importable-fonts/Doom.js"
// @ts-ignore
import slant from "figlet/importable-fonts/Slant.js"
// @ts-ignore
import speed from "figlet/importable-fonts/Speed.js"
// @ts-ignore
import standard from "figlet/importable-fonts/Standard.js"
// @ts-ignore
import block from "figlet/importable-fonts/Block.js"
// @ts-ignore
import colossal from "figlet/importable-fonts/Colossal.js"

const fonts = [
  { name: "ANSI Shadow", data: ansiShadow },
  { name: "Standard", data: standard },
  { name: "Big", data: big },
  { name: "Doom", data: doom },
  { name: "Slant", data: slant },
  { name: "Speed", data: speed },
  { name: "Block", data: block },
  { name: "Colossal", data: colossal },
] as const

for (const f of fonts) {
  figlet.parseFont(f.name, f.data)
}

function getLines(fontName: string) {
  const art = figlet.textSync("gridland", { font: fontName as any })
  return art.split("\n").filter((l) => l.trimEnd().length > 0)
}

function AsciiApp() {
  const theme = useTheme()
  const [fontIndex, setFontIndex] = useState(fonts.findIndex((f) => f.name === "Colossal"))
  const font = fonts[fontIndex]
  const lines = getLines(font.name)

  useKeyboard((event) => {
    if (event.name === "left") {
      setFontIndex((i) => (i > 0 ? i - 1 : fonts.length - 1))
    }
    if (event.name === "right") {
      setFontIndex((i) => (i < fonts.length - 1 ? i + 1 : 0))
    }
  })

  return (
    <box flexDirection="column" flexGrow={1}>
      <box padding={1} flexDirection="column" alignItems="center" justifyContent="center" flexGrow={1}>
        {lines.map((line, i) => (
          <text key={i} fg={theme.accent} bold>
            {line}
          </text>
        ))}
      </box>
      <box paddingX={1} paddingBottom={1}>
        <StatusBar
          items={[{ key: "←→", label: "change font" }]}
          extra={<span style={textStyle({ fg: theme.accent, bold: true })}>{font.name.padEnd(11)}</span>}
        />
      </box>
    </box>
  )
}

export default function AsciiDemo() {
  return (
    <DemoWindow title="Ascii" tuiStyle={{ width: "100%", height: 280 }}>
      <AsciiApp />
    </DemoWindow>
  )
}
