// @ts-nocheck — OpenTUI intrinsic elements conflict with React's HTML/SVG types
"use client"
import { useState, useEffect, useRef } from "react"
import { DemoWindow } from "@/components/ui/demo-window"
import { Timeline, StatusBar } from "@gridland/ui"
import type { Step } from "@gridland/ui"
import { useKeyboard } from "@gridland/core"

// ── Animated demo ───────────────────────────────────────────────────

const ALL_STEPS: (Step & { delay: number })[] = [
  { tool: "Read", label: "Reading codebase \u2014 src/", status: "done", delay: 1800 },
  { tool: "Think", label: "Planning changes \u2014 auth module", status: "done", delay: 2500 },
  { tool: "Edit", label: "Editing files \u2014 4 files", status: "done", delay: 3200 },
  { tool: "Bash", label: "Running tests \u2014 vitest", status: "done", delay: 2000 },
  { tool: "Edit", label: "Fixing test \u2014 routes.test.ts", status: "done", delay: 1500 },
]

type Phase = "running" | "done"

function TimelineApp() {
  const [expanded, setExpanded] = useState(true)
  const [phase, setPhase] = useState<Phase>("running")
  const [stepIndex, setStepIndex] = useState(0)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useKeyboard((event) => {
    if (event.name === "E" && event.ctrl && event.shift) setExpanded((v) => !v)
    if (event.name === "r") restart()
  })

  function restart() {
    if (timerRef.current) clearTimeout(timerRef.current)
    setPhase("running")
    setStepIndex(0)
  }

  useEffect(() => {
    if (phase !== "running") return
    if (stepIndex < ALL_STEPS.length) {
      const delay = ALL_STEPS[stepIndex]!.delay
      timerRef.current = setTimeout(() => setStepIndex((i) => i + 1), delay)
    } else {
      timerRef.current = setTimeout(() => setPhase("done"), 500)
    }
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [phase, stepIndex])

  useEffect(() => {
    if (phase === "done") {
      timerRef.current = setTimeout(() => restart(), 3000)
    }
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [phase])

  const steps: Step[] = ALL_STEPS.map((s, i) => {
    if (i < stepIndex) return { ...s, status: "done" as const }
    if (i === stepIndex && phase === "running") return { ...s, status: "running" as const }
    return { ...s, status: phase === "done" ? ("done" as const) : ("pending" as const) }
  })

  const elapsedMs = ALL_STEPS.slice(0, stepIndex).reduce((sum, s) => sum + s.delay, 0)
  const totalMs = ALL_STEPS.reduce((sum, s) => sum + s.delay, 0)

  return (
    <box flexDirection="column" flexGrow={1}>
      <box flexDirection="column" padding={1} flexGrow={1}>
        <Timeline
          steps={steps}
          duration={phase === "done" ? `${(totalMs / 1000).toFixed(1)}s` : `${(elapsedMs / 1000).toFixed(1)}s`}
          collapsed={!expanded}
        />
      </box>
      <box paddingX={1} paddingBottom={1}>
        <StatusBar items={[
          { key: "ctrl+shift+e", label: "toggle" },
          { key: "r", label: "restart" },
        ]} />
      </box>
    </box>
  )
}

export default function TimelineDemo() {
  return (
    <DemoWindow title="Timeline" tuiStyle={{ width: "100%", height: 340 }}>
      <TimelineApp />
    </DemoWindow>
  )
}

// ── Static examples for docs ────────────────────────────────────────

export function TimelineCollapsedDemo() {
  return (
    <DemoWindow title="Timeline (collapsed)" tuiStyle={{ width: "100%", height: 100 }}>
      <box padding={1}>
        <Timeline
          steps={[
            { tool: "Read", label: "Reading files", status: "done" },
            { tool: "Edit", label: "Applying changes", status: "done" },
          ]}
          duration="3.2s"
          collapsed
        />
      </box>
    </DemoWindow>
  )
}

export function TimelineExpandedDemo() {
  return (
    <DemoWindow title="Timeline (expanded)" tuiStyle={{ width: "100%", height: 240 }}>
      <box padding={1}>
        <Timeline
          steps={[
            { tool: "Read", label: "Reading codebase \u2014 src/", status: "done" },
            { tool: "Think", label: "Planning changes \u2014 auth module", status: "done" },
            { tool: "Edit", label: "Editing files \u2014 4 files", status: "running" },
            { tool: "Bash", label: "Running tests \u2014 vitest", status: "pending" },
          ]}
          duration="4.3s"
          collapsed={false}
        />
      </box>
    </DemoWindow>
  )
}

export function TimelineWithOutputDemo() {
  return (
    <DemoWindow title="Timeline (with output)" tuiStyle={{ width: "100%", height: 260 }}>
      <box padding={1}>
        <Timeline
          steps={[
            { tool: "Read", label: "Reading config", status: "done" },
            { tool: "Bash", label: "Running tests \u2014 vitest", status: "error", output: "FAIL src/auth.test.ts \u2014 expected 200, got 401" },
            { tool: "Edit", label: "Fixing auth handler", status: "running" },
          ]}
          duration="2.1s"
          collapsed={false}
        />
      </box>
    </DemoWindow>
  )
}
