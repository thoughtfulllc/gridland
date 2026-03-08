// @ts-nocheck
import { useState } from "react"
import { StatusBar, textStyle, useTheme, useBreakpoints } from "@gridland/ui"
import { useKeyboard } from "@opentui/react"
import { Logo } from "./Logo"
import { InstallBox } from "./InstallBox"
import { LinksBox } from "./LinksBox"
import { MatrixRain } from "./MatrixRain"
import { AboutModal } from "./AboutModal"

export default function LandingApp() {
  const theme = useTheme()
  const { width, height, isNarrow, isTiny, isMobile } = useBreakpoints()
  const [showAbout, setShowAbout] = useState(false)

  useKeyboard((event: any) => {
    if (event.name === "a" && !showAbout) {
      setShowAbout(true)
    }
    if (event.name === "q" && showAbout) {
      setShowAbout(false)
    }
  })

  // Reserve space for logo (~7 lines), install/links (~3 lines), statusbar (1 line), padding/gaps (~6 lines)
  const gameHeight = Math.max(4, height - (isTiny ? 10 : isNarrow ? 14 : 16))
  const gameWidth = Math.max(8, width - 4) // account for border + padding

  if (showAbout) {
    return (
      <box flexDirection="column" width="100%" height="100%">
        <box flexGrow={1}>
          <AboutModal onClose={() => setShowAbout(false)} />
        </box>
        <StatusBar items={[{ key: "q", label: "close" }]} />
      </box>
    )
  }

  return (
    <box flexDirection="column" width="100%" height="100%">
      <box flexGrow={1} flexDirection="column" paddingTop={3} paddingLeft={1} paddingRight={1} paddingBottom={1} gap={1}>
        <box flexShrink={0}>
          <Logo compact={isTiny} narrow={isNarrow} mobile={isMobile} />
        </box>
        <box flexDirection={isNarrow ? "column" : "row"} gap={1} flexShrink={0}>
          <InstallBox />
          <LinksBox />
        </box>
        <MatrixRain width={gameWidth} height={gameHeight} />
      </box>
      <StatusBar
        items={[
          { key: "a", label: "about" },
        ]}
      />
    </box>
  )
}
