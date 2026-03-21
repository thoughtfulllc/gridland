// @ts-nocheck
import { textStyle, useBreakpoints, useTheme } from '@gridland/ui'
import { useMemo } from 'react'
import { InstallBox } from './install-box'
import { LinksBox } from './links-box'
import { Logo } from './logo'
import { MatrixBackground } from './matrix-background'

interface LandingAppProps {
  useKeyboard: any
}

export function LandingApp({ useKeyboard }: LandingAppProps) {
  const theme = useTheme()
  const { width, height, isNarrow, isTiny, isMobile } = useBreakpoints()

  // Approximate the bordered box position for matrix background clear rect
  const isBrowser = typeof document !== 'undefined'
  const { clearRect, installLinksClearRect } = useMemo(() => {
    const logoHeight = isTiny ? 2 : isNarrow ? 13 : 7
    const logoExtra = isBrowser ? 1 : 0
    const gap = isMobile ? 0 : 1
    const installLinksTop = 3 + logoHeight + logoExtra + gap
    const installLinksHeight = 3
    const boxTop = installLinksTop + installLinksHeight + gap + 1
    const bh = height - boxTop - 1
    return {
      clearRect: { top: boxTop, left: 1, width: width - 2, height: bh },
      installLinksClearRect: { top: installLinksTop, left: 1, width: width - 2, height: installLinksHeight },
    }
  }, [width, height, isTiny, isNarrow, isMobile, isBrowser])

  return (
    <box width="100%" height="100%" position="relative">
      <MatrixBackground width={width} height={height} clearRect={clearRect} clearRects={isBrowser ? undefined : [installLinksClearRect]} />
      <box position="absolute" top={0} left={0} width={width} height={height} zIndex={1} flexDirection="column" shouldFill={false}>
        <box flexGrow={1} flexDirection="column" paddingTop={3} paddingLeft={1} paddingRight={1} paddingBottom={1} gap={isMobile ? 0 : 1} shouldFill={false}>
          <box flexShrink={0} shouldFill={false}>
            <Logo compact={isTiny} narrow={isNarrow} mobile={isMobile} />
          </box>
          <box flexDirection="row" flexWrap="wrap" justifyContent="center" gap={isMobile ? 0 : 1} flexShrink={0} shouldFill={false}>
            <box border borderStyle="rounded" borderColor={theme.border} paddingX={1} flexDirection="column" flexShrink={0}>
              <text>
                <span style={textStyle({ dim: true })}>$ </span>
                <span style={textStyle({ bold: true })}>bunx </span>
                <span style={textStyle({ fg: theme.accent })}>@gridland/demo landing</span>
              </text>
            </box>
            <InstallBox />
            <LinksBox />
          </box>
          <box flexGrow={1} border borderStyle="rounded" borderColor={theme.border} flexDirection="column" overflow="hidden">
          </box>
        </box>
      </box>
    </box>
  )
}
