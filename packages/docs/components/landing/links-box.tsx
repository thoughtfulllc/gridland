// @ts-nocheck
import { useTheme } from "@gridland/ui"

const UNDERLINE = 1 << 3

export function LinksBox() {
  const theme = useTheme()

  return (
    <box
      border
      borderStyle="rounded"
      borderColor={theme.border}
      paddingX={1}
      flexDirection="column"
      flexShrink={0}
    >
      <text>
        <span>🐱</span>
        <a href="https://github.com/cjroth/gridland" style={{ attributes: UNDERLINE, fg: theme.accent }}>
          {" GitHub"}
        </a>
        <span>{"  "}</span>
        <span>📖</span>
        <a href="https://gridland.io/docs" style={{ attributes: UNDERLINE, fg: theme.accent }}>
          {" Docs"}
        </a>
      </text>
    </box>
  )
}
