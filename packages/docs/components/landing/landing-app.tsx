// @ts-nocheck
import { useState } from "react"
import { StatusBar, useTheme, useBreakpoints } from "@gridland/ui"
import { Logo } from "./logo"
import { InstallBox } from "./install-box"
import { LinksBox } from "./links-box"
import { MatrixBackground } from "./matrix-background"
import { AboutModal } from "./about-modal"

interface LandingAppProps {
  useKeyboard: any
}

export function LandingApp({ useKeyboard }: LandingAppProps) {
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

  if (showAbout) {
    return (
      <box flexDirection="column" width="100%" height="100%">
        <box flexGrow={1}>
          <AboutModal onClose={() => setShowAbout(false)} useKeyboard={useKeyboard} />
        </box>
        <StatusBar items={[{ key: "q", label: "close" }]} />
      </box>
    )
  }

  // Approximate the bordered box position:
  // paddingTop(3) + logo(~7 for full, ~13 for narrow, ~2 for tiny) + gap + install/links(3) + gap
  const isBrowser = typeof document !== "undefined"
  const logoHeight = isTiny ? 2 : isNarrow ? 13 : 7
  // Browser logo has an extra spacer line before subtitle
  const logoExtra = isBrowser ? 1 : 0
  const gap = isMobile ? 0 : 1
  const installLinksTop = 3 + logoHeight + logoExtra + gap
  const installLinksHeight = 3
  const boxTop = installLinksTop + installLinksHeight + gap + 1
  // paddingLeft(1) to paddingRight(1), statusbar takes 1 row at bottom
  const boxHeight = height - boxTop - 1 - 1
  const clearRect = { top: boxTop, left: 1, width: width - 2, height: boxHeight }
  const installLinksClearRect = { top: installLinksTop, left: 1, width: width - 2, height: installLinksHeight }

  return (
    <box width="100%" height="100%" position="relative">
      <MatrixBackground width={width} height={height} clearRect={clearRect} clearRects={[installLinksClearRect]} />
      <box
        position="absolute"
        top={0}
        left={0}
        width={width}
        height={height}
        zIndex={1}
        flexDirection="column"
        shouldFill={false}
      >
        <box flexGrow={1} flexDirection="column" paddingTop={3} paddingLeft={1} paddingRight={1} paddingBottom={1} gap={isMobile ? 0 : 1} shouldFill={false}>
          <box flexShrink={0} shouldFill={false}>
            <Logo compact={isTiny} narrow={isNarrow} mobile={isMobile} />
          </box>
          <box flexDirection={isNarrow ? "column" : "row"} gap={isMobile ? 0 : 1} flexShrink={0} shouldFill={false}>
            <InstallBox />
            <LinksBox />
          </box>
          <box
            flexGrow={1}
            border
            borderStyle="rounded"
            borderColor={theme.border}
          />
        </box>
        <StatusBar
          items={[
            { key: "a", label: "about" },
          ]}
        />
      </box>
    </box>
  )
}
