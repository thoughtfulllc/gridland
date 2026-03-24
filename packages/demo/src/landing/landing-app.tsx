// @ts-nocheck
import { textStyle, useBreakpoints, useTheme } from '@gridland/ui'
import { useMemo, useRef, useState } from 'react'
import { InstallBox } from './install-box'
import { LinksBox } from './links-box'
import { Logo } from './logo'
import { MatrixBackground } from './matrix-background'
import type { MatrixRipple } from './use-matrix'
import { RippleApp } from '../../demos/ripple'
import { PuzzleApp } from '../../demos/puzzle'
import { CanvasApp } from '../../demos/canvas'
import { SnakeApp } from '../../demos/snake'

const DEMOS = ["ripple", "puzzle", "canvas", "snake"]
// Tab chrome is 2 rows (top border + labels); connecting line overlaps game box top border
const TAB_HEIGHT = 2

// Pre-compute tab geometry
const TAB_WIDTHS = DEMOS.map(n => n.length + 4) // ` ${name} ` + 2 border chars
const TAB_POSITIONS: number[] = []
let _pos = 0
for (const w of TAB_WIDTHS) {
  TAB_POSITIONS.push(_pos)
  _pos += w
}

interface LandingAppProps {
  useKeyboard: any
}

export function LandingApp({ useKeyboard }: LandingAppProps) {
  const theme = useTheme()
  const { width, height, isNarrow, isTiny, isMobile } = useBreakpoints()
  const [activeIndex, setActiveIndex] = useState(0)
  const mousePosRef = useRef<{ x: number; y: number } | null>(null)
  const matrixRipplesRef = useRef<MatrixRipple[]>([])

  useKeyboard((event: any) => {
    if (event.name === 'tab') {
      setActiveIndex((prev) => (prev + 1) % DEMOS.length)
      event.preventDefault()
    }
  })

  // Approximate the bordered box position for matrix background clear rect
  const isBrowser = typeof document !== 'undefined'
  const { clearRect, installLinksClearRect, boxTop } = useMemo(() => {
    const logoHeight = isTiny ? 2 : isMobile ? 7 : isNarrow ? 13 : 7
    const logoExtra = isBrowser ? 1 : 0
    const gap = isMobile ? 0 : 1
    const paddingTop = isMobile ? 1 : 3
    const installLinksTop = paddingTop + logoHeight + logoExtra + gap
    const installLinksHeight = 3
    const boxTop = installLinksTop + installLinksHeight + gap + 1
    const bh = height - boxTop - 1
    const bw = Math.min(82, width - 2)
    const bl = Math.floor((width - bw) / 2)
    return {
      clearRect: { top: boxTop, left: bl, width: bw, height: bh },
      installLinksClearRect: { top: installLinksTop, left: 1, width: width - 2, height: installLinksHeight },
      boxTop,
    }
  }, [width, height, isTiny, isNarrow, isMobile, isBrowser])

  // Game box: max 82 wide (including border), shrinks on small terminals
  const MAX_BOX_WIDTH = 82
  const availableWidth = width - 2 // outer paddingX(1) on each side
  const boxWidth = Math.min(MAX_BOX_WIDTH, availableWidth)
  const boxLeft = Math.floor((width - boxWidth) / 2)

  // Mouse offset for embedded demos: box position + tab rows + border
  const mouseOffset = useMemo(() => ({
    x: boxLeft + 1, // box left edge + border(1)
    y: boxTop + TAB_HEIGHT + 1, // boxTop + tab rows + box top border(1)
  }), [boxTop, boxLeft])

  // Container dimensions for demos (inner bordered box size)
  const containerWidth = boxWidth - 2 // minus border(1) on each side
  const maxBoxHeight = 20 // includes tab rows + game box with borders
  const containerHeight = Math.min(height - boxTop - 1 - TAB_HEIGHT, maxBoxHeight - TAB_HEIGHT) // box region minus tab rows, capped

  // ── Tab chrome rendering ──────────────────────────────────────────────
  const activeStart = TAB_POSITIONS[activeIndex]
  const activeWidth = TAB_WIDTHS[activeIndex]
  const activeEnd = activeStart + activeWidth

  // Row 0 is rendered inline as clickable boxes per tab (see JSX below)

  // Row 1: tab labels (active has │ borders, inactive are plain text)
  // Rendered as clickable boxes in a flex row

  // Row 2: connecting line (overlays game box top border)
  // Builds the line that merges the active tab's open bottom with the box top border
  const connectParts: any[] = []
  if (activeStart === 0) {
    // Active tab is flush left — left border continues straight down
    connectParts.push(<span key="cl" style={textStyle({ fg: theme.border })}>│</span>)
    connectParts.push(<span key="gap" style={textStyle({ fg: theme.border })}>{' '.repeat(activeWidth - 2)}</span>)
    connectParts.push(<span key="cr" style={textStyle({ fg: theme.border })}>╰</span>)
  } else {
    // Box top-left corner + fill + active tab connectors
    connectParts.push(
      <span key="left" style={textStyle({ fg: theme.border })}>
        {'╭' + '─'.repeat(activeStart - 1)}
      </span>
    )
    connectParts.push(<span key="cl" style={textStyle({ fg: theme.border })}>╯</span>)
    connectParts.push(<span key="gap" style={textStyle({ fg: theme.border })}>{' '.repeat(activeWidth - 2)}</span>)
    connectParts.push(<span key="cr" style={textStyle({ fg: theme.border })}>╰</span>)
  }
  // Fill remaining width to the right corner
  const rightFill = boxWidth - activeEnd - 1
  if (rightFill > 0) {
    connectParts.push(
      <span key="right" style={textStyle({ fg: theme.border })}>
        {'─'.repeat(rightFill)}
      </span>
    )
  }
  connectParts.push(<span key="corner-r" style={textStyle({ fg: theme.border })}>╮</span>)

  return (
    <box width="100%" height="100%" position="relative">
      <MatrixBackground width={width} height={height} clearRect={clearRect} clearRects={isBrowser ? undefined : [installLinksClearRect]} mousePosRef={mousePosRef} ripplesRef={matrixRipplesRef} />
      <box
        position="absolute" top={0} left={0} width={width} height={height} zIndex={1} flexDirection="column" shouldFill={false}
        onMouseMove={(e: any) => {
          mousePosRef.current = { x: e.x, y: e.y }
        }}
        onMouseDown={(e: any) => {
          matrixRipplesRef.current = [
            ...matrixRipplesRef.current,
            { x: e.x, y: e.y, createdAt: Date.now() },
          ]
        }}
      >
        <box flexGrow={1} flexDirection="column" paddingTop={isMobile ? 1 : 3} paddingLeft={1} paddingRight={1} paddingBottom={1} gap={isMobile ? 0 : 1} shouldFill={false}>
          <box flexShrink={0} shouldFill={false}>
            <Logo compact={isTiny} narrow={isNarrow} mobile={isMobile} />
          </box>
          <box flexDirection="row" flexWrap="wrap" justifyContent="center" gap={isMobile ? 0 : 1} flexShrink={0} shouldFill={false}>
            {!isMobile && (
              <box border borderStyle="rounded" borderColor={theme.border} paddingX={1} flexDirection="column" flexShrink={0}>
                <text>
                  <span style={textStyle({ dim: true })}>$ </span>
                  <span style={textStyle({ bold: true })}>bunx </span>
                  <span style={textStyle({ fg: theme.accent })}>@gridland/demo landing</span>
                </text>
              </box>
            )}
            {!isMobile && <InstallBox />}
            <LinksBox />
          </box>
          {/* Connected tabs + game box */}
          <box flexDirection="column" width={boxWidth} maxWidth={MAX_BOX_WIDTH} maxHeight={20} alignSelf="center" flexGrow={1}>
            {/* Tab top border row (clickable per tab) */}
            <box height={1} flexShrink={0} flexDirection="row" shouldFill={false}>
              {DEMOS.map((name, i) => {
                const isActive = i === activeIndex
                const w = TAB_WIDTHS[i]
                return (
                  <box key={name} width={w} onMouseDown={() => setActiveIndex(i)}>
                    <text style={textStyle({ fg: theme.border })}>
                      {isActive ? '╭' + '─'.repeat(w - 2) + '╮' : ' '.repeat(w)}
                    </text>
                  </box>
                )
              })}
            </box>
            {/* Tab labels row (clickable) */}
            <box height={1} flexShrink={0} flexDirection="row" shouldFill={false}>
              {DEMOS.map((name, i) => {
                const isActive = i === activeIndex
                const w = TAB_WIDTHS[i]
                return (
                  <box key={name} width={w} onMouseDown={() => setActiveIndex(i)}>
                    <text>
                      {isActive ? (
                        <>
                          <span style={textStyle({ fg: theme.border })}>│</span>
                          <span style={textStyle({ bold: true, fg: theme.foreground })}>{` ${name} `}</span>
                          <span style={textStyle({ fg: theme.border })}>│</span>
                        </>
                      ) : (
                        <span style={textStyle({ fg: theme.muted })}>{` ${name} `}</span>
                      )}
                    </text>
                  </box>
                )
              })}
            </box>
            {/* Game box with connecting line overlay on top border */}
            <box position="relative" flexGrow={1}>
              {/* Connecting line: overlays the game box top border */}
              <box position="absolute" top={0} left={0} width={boxWidth} height={1} zIndex={2}>
                <text>{connectParts}</text>
              </box>
              {/* Game box (full border — top border hidden by connecting line) */}
              <box border borderStyle="rounded" borderColor={theme.border} flexGrow={1} flexDirection="column" overflow="hidden">
                {activeIndex === 0 && <RippleApp mouseOffset={mouseOffset} containerWidth={containerWidth} containerHeight={containerHeight} />}
                {activeIndex === 1 && <PuzzleApp containerWidth={containerWidth} containerHeight={containerHeight} />}
                {activeIndex === 2 && <CanvasApp mouseOffset={mouseOffset} containerWidth={containerWidth} containerHeight={containerHeight} />}
                {activeIndex === 3 && <SnakeApp containerWidth={containerWidth} containerHeight={containerHeight} mouseOffset={mouseOffset} />}
              </box>
            </box>
            <box height={1} />
            <box width="100%" alignItems="center" flexDirection="column" shouldFill={false}>
              <text style={textStyle({ dim: true, fg: theme.muted })}>
                {"Made with ❤️ by "}
                <a href="https://cjroth.com" style={{ attributes: 1 << 3, fg: theme.muted }}>Chris Roth</a>
                {" + "}
                <a href="https://jessicacheng.studio" style={{ attributes: 1 << 3, fg: theme.muted }}>Jessica Cheng</a>
              </text>
            </box>
          </box>
        </box>
      </box>
    </box>
  )
}
