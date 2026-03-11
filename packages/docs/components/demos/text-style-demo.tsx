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

export default function TextStyleDemo() {
  return (
    <DemoWindow title="Text Style" tuiStyle={{ width: "100%", height: 260 }}>
      <TextStyleApp />
    </DemoWindow>
  )
}
