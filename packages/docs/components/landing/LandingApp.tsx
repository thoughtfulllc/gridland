// @ts-nocheck
import { useState } from "react"
import { StatusBar, textStyle, useTheme } from "@gridland/ui"
import { useKeyboard, useTerminalDimensions } from "@opentui/react"
import { Logo } from "./Logo"
import { InstallBox } from "./InstallBox"
import { LinksBox } from "./LinksBox"
import { SnakeGame } from "./SnakeGame"
import { AboutModal } from "./AboutModal"

export default function LandingApp() {
  const theme = useTheme()
  const { width, height } = useTerminalDimensions()
  const [showAbout, setShowAbout] = useState(false)

  const isNarrow = width < 60
  const isTiny = width < 40

  useKeyboard((event: any) => {
    if (event.key === "?" && !showAbout) {
      setShowAbout(true)
    }
  })

  // Reserve space for logo (~7 lines), install/links (~3 lines), statusbar (1 line), padding/gaps (~6 lines)
  const snakeHeight = Math.max(4, height - (isTiny ? 10 : isNarrow ? 14 : 16))
  const snakeWidth = Math.max(8, width - 4) // account for border + padding

  if (showAbout) {
    return (
      <box flexDirection="column" width="100%" height="100%">
        <box flexGrow={1}>
          <AboutModal onClose={() => setShowAbout(false)} />
        </box>
        <StatusBar items={[{ key: "Esc", label: "close" }]} />
      </box>
    )
  }

  return (
    <box flexDirection="column" width="100%" height="100%">
      <box flexGrow={1} flexDirection="column" paddingTop={3} paddingLeft={1} paddingRight={1} paddingBottom={1} gap={1}>
        <box flexShrink={0}>
          <Logo compact={isTiny} narrow={isNarrow} />
        </box>
        <box flexDirection={isNarrow ? "column" : "row"} gap={1} flexShrink={0}>
          <InstallBox />
          <LinksBox />
        </box>
        <SnakeGame width={snakeWidth} height={snakeHeight} />
      </box>
      <StatusBar
        items={[
          { key: "\u2190\u2191\u2193\u2192", label: "move" },
          { key: "p", label: "pause" },
          { key: "r", label: "restart" },
          { key: "?", label: "about" },
        ]}
      />
    </box>
  )
}
