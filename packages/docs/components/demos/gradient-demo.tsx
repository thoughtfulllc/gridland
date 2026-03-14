// @ts-nocheck — OpenTUI intrinsic elements conflict with React's HTML/SVG types
"use client"
import { useState } from "react"
import { DemoWindow } from "@/components/ui/demo-window"
import { Gradient, GRADIENTS, type GradientName, StatusBar, textStyle, useTheme } from "@gridland/ui"
import { useKeyboard } from "@gridland/core"
import figlet from "figlet"
// @ts-ignore — importable-fonts has no type declarations
import ansiShadow from "figlet/importable-fonts/ANSI Shadow.js"

figlet.parseFont("ANSI Shadow", ansiShadow)

const art = figlet.textSync("gridland", { font: "ANSI Shadow" as any })
const lines = art.split("\n").filter((l: string) => l.trimEnd().length > 0)
const gradientNames = Object.keys(GRADIENTS) as GradientName[]

function GradientApp() {
  const theme = useTheme()
  const [index, setIndex] = useState(gradientNames.indexOf("instagram"))
  const name = gradientNames[index]

  useKeyboard((event) => {
    if (event.name === "left") {
      setIndex((i) => (i > 0 ? i - 1 : gradientNames.length - 1))
    }
    if (event.name === "right") {
      setIndex((i) => (i < gradientNames.length - 1 ? i + 1 : 0))
    }
  })

  return (
    <box flexDirection="column" flexGrow={1}>
      <box padding={1} flexDirection="column" alignItems="center" justifyContent="center" flexGrow={1}>
        <Gradient name={name}>{lines.join("\n")}</Gradient>
      </box>
      <box paddingX={1} paddingBottom={1}>
        <StatusBar
          items={[{ key: "←→", label: "gradient" }]}
          extra={<span style={textStyle({ fg: theme.accent, bold: true })}>{name.padEnd(11)}</span>}
        />
      </box>
    </box>
  )
}

export default function GradientDemo() {
  return (
    <DemoWindow title="Gradient" tuiStyle={{ width: "100%", height: 280 }}>
      <GradientApp />
    </DemoWindow>
  )
}
