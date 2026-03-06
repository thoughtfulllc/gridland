// @ts-nocheck
import { useState, useEffect, useRef } from "react"
import { Gradient, textStyle, GRADIENTS, generateGradient } from "@gridland/ui"
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
  const [progress, setProgress] = useState(0)
  const startTime = useRef<number | null>(null)

  useEffect(() => {
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

/** Renders text with gradient colors, revealing characters left-to-right */
function RevealGradient({ children, revealCol }: { children: string; revealCol: number }) {
  const gradientColors = GRADIENTS.instagram
  const lines = children.split("\n")
  const maxLength = Math.max(...lines.map((l) => l.length))

  if (maxLength === 0) return <text>{children}</text>

  const hexColors = generateGradient(gradientColors, maxLength)

  return (
    <>
      {lines.map((line, lineIndex) => (
        <text key={lineIndex}>
          {line.split("").map((char, charIndex) => {
            const revealed = charIndex <= revealCol
            return (
              <span
                key={charIndex}
                style={{ fg: revealed ? hexColors[charIndex] : undefined }}
              >
                {revealed ? char : " "}
              </span>
            )
          })}
        </text>
      ))}
    </>
  )
}

export function Logo({ compact, narrow }: { compact?: boolean; narrow?: boolean }) {
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
      <box flexDirection="column" alignItems="center" width="100%">
        <text style={textStyle({ dim: true })} opacity={taglineOpacity} wrapMode="word" textAlign="center" width="100%">A framework for building terminal apps, built on OpenTUI + React.</text>
        <text style={textStyle({ dim: true })} opacity={taglineOpacity} wrapMode="word" textAlign="center" width="100%">(Gridland apps, like this website, work in the browser and terminal.)</text>
      </box>
    </>
  )

  if (compact) {
    return (
      <box flexDirection="column" flexShrink={0} width="100%">
        <box height={artHeight} overflow="hidden" position="relative" width="100%" flexShrink={0}>
          <box position="absolute" top={dropOffset} width="100%" flexDirection="column" alignItems="center">
            <RevealGradient revealCol={revealCol}>gridland</RevealGradient>
          </box>
        </box>
        {subtitle}
      </box>
    )
  }

  if (narrow) {
    return (
      <box flexDirection="column" flexShrink={0} width="100%">
        <box height={artHeight} overflow="hidden" position="relative" width="100%" flexShrink={0}>
          <box position="absolute" top={dropOffset} width="100%" flexDirection="column" alignItems="center">
            <RevealGradient revealCol={revealCol}>{gridArt}</RevealGradient>
            <RevealGradient revealCol={revealCol}>{landArt}</RevealGradient>
          </box>
        </box>
        {subtitle}
      </box>
    )
  }

  return (
    <box flexDirection="column" flexShrink={0} width="100%">
      <box height={artHeight} overflow="hidden" position="relative" width="100%" flexShrink={0}>
        <box position="absolute" top={dropOffset} width="100%" flexDirection="column" alignItems="center">
          <RevealGradient revealCol={revealCol}>{fullArt}</RevealGradient>
        </box>
      </box>
      {subtitle}
    </box>
  )
}
