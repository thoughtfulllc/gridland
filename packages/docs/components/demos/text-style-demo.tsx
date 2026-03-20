// @ts-nocheck
"use client"
import { DemoWindow } from "@/components/ui/demo-window"
import { TextStyleApp } from "@demos/text-style"
import { textStyle, useTheme } from "@gridland/ui"

export default function TextStyleDemo() {
  return (
    <DemoWindow title="Text Style" tuiStyle={{ width: "100%", height: 260 }}>
      <TextStyleApp />
    </DemoWindow>
  )
}

// ── Docs-only variants ──────────────────────────────────────────────────

function DirectTextStyleApp() {
  const theme = useTheme()
  return (
    <box flexDirection="column" padding={1} gap={0}>
      <text style={textStyle({ fg: theme.primary, bold: true })}>
        Single style applied to the entire text element
      </text>
    </box>
  )
}

function MixedSpanStyleApp() {
  const theme = useTheme()
  return (
    <box flexDirection="column" padding={1} gap={0}>
      <text>
        <span style={textStyle({ fg: theme.primary, bold: true })}>Server </span>
        <span style={textStyle({ fg: theme.success })}>running </span>
        <span style={textStyle({ fg: theme.muted, dim: true })}>on port 3000</span>
      </text>
      <text>
        <span style={textStyle({ fg: theme.error, bold: true })}>Error: </span>
        <span style={textStyle({ fg: theme.foreground })}>connection refused </span>
        <span style={textStyle({ fg: theme.muted, dim: true })}>(retry in 5s)</span>
      </text>
      <text>
        <span style={textStyle({ fg: theme.secondary, bold: true })}>{"▸ "}</span>
        <span style={textStyle({ fg: theme.foreground })}>Deploy to </span>
        <span style={textStyle({ fg: theme.accent, underline: true })}>production</span>
      </text>
    </box>
  )
}

export function DirectTextStyleDemo() {
  return (
    <DemoWindow title="Direct Text Styling" tuiStyle={{ width: "100%", height: 120 }}>
      <DirectTextStyleApp />
    </DemoWindow>
  )
}

export function MixedSpanStyleDemo() {
  return (
    <DemoWindow title="Mixed Span Styling" tuiStyle={{ width: "100%", height: 120 }}>
      <MixedSpanStyleApp />
    </DemoWindow>
  )
}
