// @ts-nocheck — OpenTUI intrinsic elements conflict with React's HTML/SVG types
"use client"
import { DemoWindow } from "@/components/ui/demo-window"
import { textStyle, darkTheme } from "@gridland/ui"

const desc = textStyle({ fg: darkTheme.muted })

function TextStyleApp() {
  return (
    <box flexDirection="column" padding={1} gap={0}>
      <text>
        <span style={textStyle({ bold: true })}>bold          </span>
        <span style={desc}>textStyle({"{"} bold: true {"}"})</span>
      </text>
      <text>
        <span style={textStyle({ dim: true })}>dim           </span>
        <span style={desc}>textStyle({"{"} dim: true {"}"})</span>
      </text>
      <text>
        <span style={textStyle({ italic: true })}>italic        </span>
        <span style={desc}>textStyle({"{"} italic: true {"}"})</span>
      </text>
      <text>
        <span style={textStyle({ underline: true })}>underline     </span>
        <span style={desc}>textStyle({"{"} underline: true {"}"})</span>
      </text>
      <text>
        <span style={textStyle({ inverse: true })}>inverse       </span>
        <span style={desc}>textStyle({"{"} inverse: true {"}"})</span>
      </text>
      <text> </text>
      <text>
        <span style={textStyle({ fg: darkTheme.primary })}>fg color      </span>
        <span style={desc}>textStyle({"{"} fg: "#FF71CE" {"}"})</span>
      </text>
      <text>
        <span style={textStyle({ fg: darkTheme.foreground, bg: darkTheme.secondary })}>bg color      </span>
        <span style={desc}>textStyle({"{"} fg: "#F0E6FF", bg: "#B967FF" {"}"})</span>
      </text>
      <text> </text>
      <text>
        <span style={textStyle({ fg: darkTheme.accent, bold: true, underline: true })}>combined      </span>
        <span style={desc}>textStyle({"{"} fg: "#01CDFE", bold: true, underline: true {"}"})</span>
      </text>
    </box>
  )
}

function DirectTextStyleApp() {
  return (
    <box flexDirection="column" padding={1} gap={0}>
      <text style={textStyle({ fg: darkTheme.primary, bold: true })}>
        Single style applied to the entire text element
      </text>
    </box>
  )
}

function MixedSpanStyleApp() {
  return (
    <box flexDirection="column" padding={1} gap={0}>
      <text>
        <span style={textStyle({ fg: darkTheme.primary, bold: true })}>Server </span>
        <span style={textStyle({ fg: darkTheme.success })}>running </span>
        <span style={textStyle({ fg: darkTheme.muted, dim: true })}>on port 3000</span>
      </text>
      <text>
        <span style={textStyle({ fg: darkTheme.error, bold: true })}>Error: </span>
        <span style={textStyle({ fg: darkTheme.foreground })}>connection refused </span>
        <span style={textStyle({ fg: darkTheme.muted, dim: true })}>(retry in 5s)</span>
      </text>
      <text>
        <span style={textStyle({ fg: darkTheme.secondary, bold: true })}>{"▸ "}</span>
        <span style={textStyle({ fg: darkTheme.foreground })}>Deploy to </span>
        <span style={textStyle({ fg: darkTheme.accent, underline: true })}>production</span>
      </text>
    </box>
  )
}

export default function TextStyleDemo() {
  return (
    <DemoWindow title="Text Style" tuiStyle={{ width: "100%", height: 260 }}>
      <TextStyleApp />
    </DemoWindow>
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
