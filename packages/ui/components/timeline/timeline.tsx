import { useState, useEffect, useRef } from "react"
import { textStyle } from "../text-style"
import { useTheme } from "../theme/index"
import type { Theme } from "../theme/index"

const DOTS = ["\u25CB", "\u25D4", "\u25D1", "\u25D5", "\u25CF"] // ○ ◔ ◑ ◕ ●

// ── Step type ───────────────────────────────────────────────────────

export interface Step {
  /** Tool or operation name (e.g. "Think", "Search", "Read"). */
  tool: string
  /** Description of the step (e.g. "Analyzing question scope"). */
  label: string
  /** Duration string (e.g. "0.6s", "400ms"). */
  duration?: string
  /** Current status. */
  status: "done" | "running" | "pending" | "error"
  /** Output or detail text shown below the step. */
  output?: string
}

// ── Timeline props ──────────────────────────────────────────────────

export interface TimelineProps {
  /** Step timeline entries. */
  steps?: Step[]
  /** Total duration string shown in the header (e.g. "120ms", "1.2s"). */
  duration?: string
  /** Whether the step list is collapsed. Defaults to true. */
  collapsed?: boolean
  /** Optional header label. Defaults to "Thought for". */
  headerLabel?: string
}

// ── Step status helpers ─────────────────────────────────────────────

function getStepDot(status: string): string {
  return status === "pending" ? "\u25CB" : "\u25CF"  // ○ or ●
}

function getStepColor(status: string, theme: Theme): string {
  switch (status) {
    case "done": return theme.success
    case "running": return theme.primary
    case "pending": return theme.muted
    case "error": return theme.error
    default: return theme.muted
  }
}

// ── StepRow ─────────────────────────────────────────────────────────

function StepRow({ step, isLast, theme, frame }: {
  step: Step
  isLast: boolean
  theme: Theme
  frame: number
}) {
  const color = getStepColor(step.status, theme)
  const isActive = step.status === "running"
  const isPending = step.status === "pending"
  const pipe = "\u2502" // │

  // Animated spinner for running, static dot for done/pending/error
  const dot = isActive
    ? DOTS[frame % DOTS.length]!
    : getStepDot(step.status)

  // Split label at " — " to color the main part and dim the detail
  const dashIdx = step.label.indexOf(" \u2014 ")
  const mainLabel = dashIdx >= 0 ? step.label.slice(0, dashIdx) : step.label
  const detail = dashIdx >= 0 ? step.label.slice(dashIdx) : ""

  return (
    <box flexDirection="column" marginLeft={1}>
      {/* Step row: ● Label — detail */}
      <text>
        <span style={textStyle({ fg: color })}>{dot}</span>
        <span>{" "}</span>
        <span style={textStyle({ fg: isPending ? undefined : color, dim: isPending, bold: isActive })}>{mainLabel}</span>
        {detail && <span style={textStyle({ dim: true })}>{detail}</span>}
      </text>
      {/* Output line with pipe gutter */}
      {step.output && (
        <text>
          <span style={textStyle({ fg: color, dim: true })}>{pipe + "  "}</span>
          <span style={textStyle({ fg: step.status === "error" ? theme.error : theme.accent })}>{step.output}</span>
        </text>
      )}
      {/* Vertical pipe connector to next step */}
      {!isLast && (
        <text>
          <span style={textStyle({ fg: color, dim: true })}>{pipe}</span>
        </text>
      )}
    </box>
  )
}

// ── Timeline component ──────────────────────────────────────────────

export function Timeline({
  steps,
  duration,
  collapsed = true,
  headerLabel = "Thought for",
}: TimelineProps) {
  const theme = useTheme()
  const arrow = collapsed ? "\u25B6" : "\u25BC"  // ▶ or ▼
  const durationStr = duration ?? "0ms"
  const hasRunning = steps?.some(s => s.status === "running") ?? false

  // Animate spinner frame at 150ms when any step is running
  const [frame, setFrame] = useState(0)
  const alive = useRef(true)
  useEffect(() => { alive.current = true; return () => { alive.current = false } }, [])
  useEffect(() => {
    if (!hasRunning) return
    const id = setInterval(() => { if (alive.current) setFrame(f => f + 1) }, 150)
    return () => clearInterval(id)
  }, [hasRunning])

  return (
    <box flexDirection="column">
      <text>
        <span style={textStyle({ fg: theme.muted })}>{arrow}</span>
        <span style={textStyle({ dim: true })}>{" " + headerLabel + " " + durationStr}</span>
      </text>
      {!collapsed && steps && steps.map((step, i) => (
        <StepRow
          key={`step-${i}`}
          step={step}
          isLast={i === steps.length - 1}
          theme={theme}
          frame={frame}
        />
      ))}
    </box>
  )
}
