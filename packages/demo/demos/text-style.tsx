// @ts-nocheck
import { textStyle, useTheme } from "@gridland/ui"

export function TextStyleApp() {
  const theme = useTheme()
  const desc = textStyle({ fg: theme.muted })
  return (
    <box flexDirection="column" padding={1} gap={0}>
      <text>
        <span style={textStyle({ fg: theme.foreground, bold: true })}>bold          </span>
        <span style={desc}>textStyle({"{"} bold: true {"}"})</span>
      </text>
      <text>
        <span style={textStyle({ fg: theme.foreground, dim: true })}>dim           </span>
        <span style={desc}>textStyle({"{"} dim: true {"}"})</span>
      </text>
      <text>
        <span style={textStyle({ fg: theme.foreground, italic: true })}>italic        </span>
        <span style={desc}>textStyle({"{"} italic: true {"}"})</span>
      </text>
      <text>
        <span style={textStyle({ fg: theme.foreground, underline: true })}>underline     </span>
        <span style={desc}>textStyle({"{"} underline: true {"}"})</span>
      </text>
      <text>
        <span style={textStyle({ inverse: true })}>inverse       </span>
        <span style={desc}>textStyle({"{"} inverse: true {"}"})</span>
      </text>
      <text> </text>
      <text>
        <span style={textStyle({ fg: theme.primary })}>fg color      </span>
        <span style={desc}>textStyle({"{"} fg: theme.primary {"}"})</span>
      </text>
      <text>
        <span style={textStyle({ fg: theme.foreground, bg: theme.secondary })}>bg color      </span>
        <span style={desc}>textStyle({"{"} fg: theme.foreground, bg: theme.secondary {"}"})</span>
      </text>
      <text> </text>
      <text>
        <span style={textStyle({ fg: theme.accent, bold: true, underline: true })}>combined      </span>
        <span style={desc}>textStyle({"{"} fg: theme.accent, bold: true, underline: true {"}"})</span>
      </text>
    </box>
  )
}
