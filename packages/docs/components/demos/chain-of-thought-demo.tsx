// @ts-nocheck — OpenTUI intrinsic elements conflict with React's HTML/SVG types
"use client"
import { useState, useEffect, useRef } from "react"
import { DemoWindow } from "@/components/ui/demo-window"
import { ChainOfThought, ChainOfThoughtHeader, ChainOfThoughtContent, ChainOfThoughtStep, StatusBar } from "@gridland/ui"
import type { Step } from "@gridland/ui"
import { useKeyboard } from "@gridland/utils"

// ── Animated demo ───────────────────────────────────────────────────

const ALL_STEPS: (Step & { delay: number })[] = [
  { tool: "Read", label: "Reading codebase", description: "src/", status: "done", delay: 1800 },
  { tool: "Think", label: "Planning changes", description: "auth module", status: "done", delay: 2500 },
  { tool: "Edit", label: "Editing files", description: "4 files", status: "done", delay: 3200 },
  { tool: "Bash", label: "Running tests", description: "vitest", status: "done", delay: 2000 },
  { tool: "Edit", label: "Fixing test", description: "routes.test.ts", status: "done", delay: 1500 },
]

type Phase = "running" | "done"

function ChainOfThoughtApp() {
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
  const durationStr = phase === "done"
    ? `${(totalMs / 1000).toFixed(1)}s`
    : `${(elapsedMs / 1000).toFixed(1)}s`

  return (
    <box flexDirection="column" flexGrow={1}>
      <box flexDirection="column" padding={1} flexGrow={1}>
        <ChainOfThought open={expanded} onOpenChange={setExpanded}>
          <ChainOfThoughtHeader duration={durationStr} />
          <ChainOfThoughtContent>
            {steps.map((step, i) => (
              <ChainOfThoughtStep
                key={i}
                label={step.label}
                description={step.description}
                status={step.status}
                isLast={i === steps.length - 1}
              >
                {step.output}
              </ChainOfThoughtStep>
            ))}
          </ChainOfThoughtContent>
        </ChainOfThought>
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

export default function ChainOfThoughtDemo() {
  return (
    <DemoWindow title="Chain of Thought" tuiStyle={{ width: "100%", height: 340 }}>
      <ChainOfThoughtApp />
    </DemoWindow>
  )
}

// ── Static examples for docs ────────────────────────────────────────

export function ChainOfThoughtCollapsedDemo() {
  return (
    <DemoWindow title="Chain of Thought (collapsed)" tuiStyle={{ width: "100%", height: 100 }}>
      <box padding={1}>
        <ChainOfThought>
          <ChainOfThoughtHeader duration="3.2s" />
          <ChainOfThoughtContent>
            <ChainOfThoughtStep label="Reading files" isLast />
          </ChainOfThoughtContent>
        </ChainOfThought>
      </box>
    </DemoWindow>
  )
}

export function ChainOfThoughtExpandedDemo() {
  return (
    <DemoWindow title="Chain of Thought (expanded)" tuiStyle={{ width: "100%", height: 240 }}>
      <box padding={1}>
        <ChainOfThought defaultOpen>
          <ChainOfThoughtHeader duration="4.3s" />
          <ChainOfThoughtContent>
            <ChainOfThoughtStep label="Reading codebase" description="src/" status="done" />
            <ChainOfThoughtStep label="Planning changes" description="auth module" status="done" />
            <ChainOfThoughtStep label="Editing files" description="4 files" status="running" />
            <ChainOfThoughtStep label="Running tests" description="vitest" status="pending" isLast />
          </ChainOfThoughtContent>
        </ChainOfThought>
      </box>
    </DemoWindow>
  )
}

export function ChainOfThoughtWithOutputDemo() {
  return (
    <DemoWindow title="Chain of Thought (with output)" tuiStyle={{ width: "100%", height: 260 }}>
      <box padding={1}>
        <ChainOfThought defaultOpen>
          <ChainOfThoughtHeader duration="2.1s" />
          <ChainOfThoughtContent>
            <ChainOfThoughtStep label="Reading config" status="done" />
            <ChainOfThoughtStep label="Running tests" description="vitest" status="error">
              FAIL src/auth.test.ts — expected 200, got 401
            </ChainOfThoughtStep>
            <ChainOfThoughtStep label="Fixing auth handler" status="running" isLast />
          </ChainOfThoughtContent>
        </ChainOfThought>
      </box>
    </DemoWindow>
  )
}
