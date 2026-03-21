// @ts-nocheck
import { useTheme } from "@gridland/ui"
import { isBrowser } from "@gridland/utils"

const UNDERLINE = 1 << 3

export function LinksBox() {
  const theme = useTheme()
  const docsHref = isBrowser() ? `${window.location.origin}/docs` : 'https://gridland.io/docs'

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
        <a href="https://github.com/thoughtfulllc/gridland" style={{ attributes: UNDERLINE, fg: theme.accent }}>
          {" GitHub"}
        </a>
        <span>{"  "}</span>
        <span>📖</span>
        <a href={docsHref} style={{ attributes: UNDERLINE, fg: theme.accent }}>
          {" Docs"}
        </a>
      </text>
    </box>
  )
}
