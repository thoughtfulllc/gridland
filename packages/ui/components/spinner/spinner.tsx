import { useEffect, useState } from "react"
import { useTheme } from "../theme/index"

const VARIANTS = {
  dots: { frames: ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"], interval: 83 },
  pulse: { frames: ["·", "∙", "●", "∙", "·", "·", "·"], interval: 180 },
  meter: { frames: ["▱▱▱", "▰▱▱", "▰▰▱", "▰▰▰", "▰▰▱", "▰▱▱", "▱▱▱"], interval: 143 },
  bloom: { frames: ["·", "✦", "✧", "✹", "✺", "❋", "✸", "✵", "✸", "❋", "✺", "✹", "✧", "✦", "·", "·"], interval: 100 },
  ellipsis: { frames: ["   ", ".  ", ".. ", "..."], interval: 333 },
} as const

export type SpinnerVariant = keyof typeof VARIANTS

export const VARIANT_NAMES = Object.keys(VARIANTS) as SpinnerVariant[]

export interface SpinnerProps {
  variant?: SpinnerVariant
  text?: string
  color?: string
}

export function Spinner({ variant = "dots", text, color }: SpinnerProps) {
  const theme = useTheme()
  const resolvedColor = color ?? theme.accent
  const { frames, interval } = VARIANTS[variant]
  const [frame, setFrame] = useState(0)

  useEffect(() => {
    setFrame(0)
    const timer = setInterval(() => {
      setFrame((prev) => (prev + 1) % frames.length)
    }, interval)
    return () => clearInterval(timer)
  }, [variant])

  return (
    <text>
      <span style={{ fg: resolvedColor }}>{frames[frame]}</span>
      {text ? <span style={{ fg: theme.foreground }}> {text}</span> : null}
    </text>
  )
}
