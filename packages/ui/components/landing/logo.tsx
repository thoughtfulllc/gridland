// @ts-nocheck
import { useState, useEffect, useRef, useMemo } from "react"
import { Gradient, GRADIENTS, generateGradient } from "../gradient/gradient"
import { textStyle } from "../text-style"
import figlet from "figlet"
// @ts-ignore
import ansiShadow from "figlet/importable-fonts/ANSI Shadow.js"

figlet.parseFont("ANSI Shadow", ansiShadow)

function makeArt(text: string) {
  return figlet
    .textSync(text, { font: "ANSI Shadow" as any })
    .split("\n")
    .filter((l: string) => l.trimEnd().length > 0)
    .join("\n")
}

const fullArt = makeArt("gridland")
const gridArt = makeArt("grid")
const landArt = makeArt("land")
const ART_HEIGHT = 6 // ANSI Shadow font produces 6 lines

function useAnimation(duration = 1000) {
  const isBrowser = typeof document !== "undefined"
  const [progress, setProgress] = useState(isBrowser ? 0 : 1)
  const startTime = useRef<number | null>(null)

  useEffect(() => {
    if (!isBrowser) return
    let raf: number
    const tick = (time: number) => {
      if (startTime.current === null) startTime.current = time
      const elapsed = time - startTime.current
      const t = Math.min(1, elapsed / duration)
      const eased = 1 - Math.pow(1 - t, 3)
      setProgress(eased)
      if (t < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  return progress
}

/** Renders text with gradient colors, revealing characters left-to-right.
 *  Non-space characters are rendered as positioned runs so that space gaps
 *  are truly empty (allowing a background layer to show through). */
function RevealGradient({ children, revealCol }: { children: string; revealCol: number }) {
  const gradientColors = GRADIENTS.instagram
  const lines = children.split("\n")
  const maxLength = Math.max(...lines.map((l) => l.length))

  if (maxLength === 0) return <text>{children}</text>

  const hexColors = useMemo(() => generateGradient(gradientColors, maxLength), [maxLength])

  return (
    <box position="relative" width={maxLength} height={lines.length} shouldFill={false}>
      {lines.map((line, lineIndex) => {
        const runs: Array<{ start: number; chars: string[] }> = []
        let current: { start: number; chars: string[] } | null = null

        for (let i = 0; i < line.length; i++) {
          const revealed = i <= revealCol
          const char = line[i]
          const isVisible = revealed && char !== " "

          if (isVisible) {
            if (!current) {
              current = { start: i, chars: [] }
            }
            current.chars.push(char)
          } else {
            if (current) {
              runs.push(current)
              current = null
            }
          }
        }
        if (current) runs.push(current)

        return runs.map((run, runIndex) => (
          <box
            key={`${lineIndex}-${runIndex}`}
            position="absolute"
            top={lineIndex}
            left={run.start}
            shouldFill={false}
          >
            <text shouldFill={false}>
              {run.chars.map((char, ci) => (
                <span
                  key={ci}
                  style={{ fg: hexColors[run.start + ci] }}
                >
                  {char}
                </span>
              ))}
            </text>
          </box>
        ))
      })}
    </box>
  )
}

export function Logo({ compact, narrow, mobile }: { compact?: boolean; narrow?: boolean; mobile?: boolean }) {
  const isBrowser = typeof document !== "undefined"
  const progress = useAnimation(900)

  // Drop: animate top offset from -ART_HEIGHT to 0
  const artHeight = compact ? 1 : narrow ? ART_HEIGHT * 2 : ART_HEIGHT
  const dropOffset = Math.round((1 - progress) * -artHeight)

  // Reveal: sweep columns left-to-right, slightly behind the drop
  const revealProgress = Math.max(0, Math.min(1, (progress - 0.1) / 0.7))
  const maxWidth = compact ? 8 : narrow ? 40 : 62
  const revealCol = Math.round(revealProgress * (maxWidth + 4)) - 2

  const taglineOpacity = Math.max(0, Math.min(1, (progress - 0.7) / 0.3))

  const subtitle = (
    <>
      <text>{" "}</text>
      <box flexDirection="column" alignItems="center" width="100%" shouldFill={false}>
        <text style={textStyle({ dim: true })} opacity={taglineOpacity} wrapMode="word" textAlign="center" width="100%" shouldFill={false}>{"A framework for building terminal apps, built on "}<a href="https://opentui.com" style={{ attributes: 72 }}>OpenTUI</a>{" + React." + (mobile ? " " : "\n") + "(Gridland apps, like this website, work in the browser and terminal.)"}</text>
      </box>
    </>
  )

  // In CLI mode (no requestAnimationFrame), render without overflow/position wrappers
  if (!isBrowser) {
    const art = compact ? "gridland" : narrow ? gridArt + "\n" + landArt : fullArt
    return (
      <box flexDirection="column" flexShrink={0} width="100%" alignItems="center">
        <Gradient name="instagram">{art}</Gradient>
        <text>{" "}</text>
        <box flexDirection="column" alignItems="center" width="100%" shouldFill={false}>
          <text style={textStyle({ dim: true })} shouldFill={false}>A framework for building terminal apps, built on OpenTUI + React.{"\n"}(Gridland apps, like this website, work in the browser and terminal.)</text>
        </box>
      </box>
    )
  }

  if (compact) {
    return (
      <box flexDirection="column" flexShrink={0} width="100%" shouldFill={false}>
        <box height={artHeight} overflow="hidden" position="relative" width="100%" flexShrink={0} shouldFill={false}>
          <box position="absolute" top={dropOffset} width="100%" flexDirection="column" alignItems="center" shouldFill={false}>
            <RevealGradient revealCol={revealCol}>gridland</RevealGradient>
          </box>
        </box>
        {subtitle}
      </box>
    )
  }

  if (narrow) {
    return (
      <box flexDirection="column" flexShrink={0} width="100%" shouldFill={false}>
        <box height={artHeight} overflow="hidden" position="relative" width="100%" flexShrink={0} shouldFill={false}>
          <box position="absolute" top={dropOffset} width="100%" flexDirection="column" alignItems="center" shouldFill={false}>
            <RevealGradient revealCol={revealCol}>{gridArt}</RevealGradient>
            <RevealGradient revealCol={revealCol}>{landArt}</RevealGradient>
          </box>
        </box>
        {subtitle}
      </box>
    )
  }

  return (
    <box flexDirection="column" flexShrink={0} width="100%" shouldFill={false}>
      <box height={artHeight} overflow="hidden" position="relative" width="100%" flexShrink={0} shouldFill={false}>
        <box position="absolute" top={dropOffset} width="100%" flexDirection="column" alignItems="center" shouldFill={false}>
          <RevealGradient revealCol={revealCol}>{fullArt}</RevealGradient>
        </box>
      </box>
      {subtitle}
    </box>
  )
}
