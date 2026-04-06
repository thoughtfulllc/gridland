// @ts-nocheck
"use client"
import { DemoWindow } from "@/components/ui/demo-window"
import { ChainOfThoughtApp } from "@demos/chain-of-thought"
import { ChainOfThought, ChainOfThoughtHeader, ChainOfThoughtContent, ChainOfThoughtStep } from "@gridland/ui"

export default function ChainOfThoughtDemo() {
  return (
    <DemoWindow title="Chain of Thought" tuiStyle={{ width: "100%", height: 340 }} autoFocus>
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
          <ChainOfThoughtHeader duration="4.3s">Build pipeline</ChainOfThoughtHeader>
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
