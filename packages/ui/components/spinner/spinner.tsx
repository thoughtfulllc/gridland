import { useEffect, useState } from "react"
import { useTheme } from "../theme/index"

const VARIANTS = {
  dots: { frames: ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"], interval: 80 },
  pulse: { frames: ["·", "∙", "●", "∙", "·", "·", "·"], interval: 180 },
  meter: { frames: ["▱▱▱", "▰▱▱", "▰▰▱", "▰▰▰", "▰▰▱", "▰▱▱", "▱▱▱"], interval: 143 },
  bloom: { frames: ["·", "✦", "✧", "✹", "✺", "❋", "✸", "✵", "✸", "❋", "✺", "✹", "✧", "✦", "·", "·"], interval: 100 },
  ellipsis: { frames: ["   ", ".  ", ".. ", "..."], interval: 333 },
} as const

export type SpinnerVariant = keyof typeof VARIANTS
export type SpinnerStatus = "spinning" | "success" | "error" | "warning" | "info"

export const VARIANT_NAMES = Object.keys(VARIANTS) as SpinnerVariant[]

const STATUS_SYMBOLS: Record<Exclude<SpinnerStatus, "spinning">, string> = {
  success: "✔",
  error: "✖",
  warning: "⚠",
  info: "ℹ",
}

export interface SpinnerProps {
  variant?: SpinnerVariant
  text?: string
  color?: string
  status?: SpinnerStatus
}

export function Spinner({ variant = "dots", text, color, status = "spinning" }: SpinnerProps) {
  const theme = useTheme()
  const { frames, interval } = VARIANTS[variant]
  const [frame, setFrame] = useState(0)

  useEffect(() => {
    if (status !== "spinning") return
    setFrame(0)
    const timer = setInterval(() => {
      setFrame((prev) => (prev + 1) % frames.length)
    }, interval)
    return () => clearInterval(timer)
  }, [variant, status])

  if (status !== "spinning") {
    const symbol = STATUS_SYMBOLS[status]
    const statusColor =
      status === "success" ? theme.success :
      status === "error" ? theme.error :
      status === "warning" ? theme.warning :
      theme.accent
    return (
      <text>
        <span style={{ fg: statusColor }}>{symbol}</span>
        {text ? <span style={{ fg: theme.foreground }}> {text}</span> : null}
      </text>
    )
  }

  const resolvedColor = color ?? theme.accent
  return (
    <text>
      <span style={{ fg: resolvedColor }}>{frames[frame]}</span>
      {text ? <span style={{ fg: theme.foreground }}> {text}</span> : null}
    </text>
  )
}
