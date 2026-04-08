import { useState } from "react"
import { FixtureWrapper } from "../fixture-wrapper"
import { ThemeProvider, darkTheme, lightTheme, useTheme } from "../../../../packages/ui/components/theme"
import { useKeyboard, FocusProvider, useFocus } from "@gridland/utils"

function ThemeContent({ isDark, onToggle }: { isDark: boolean; onToggle: () => void }) {
  const theme = useTheme()
  const { focusRef } = useFocus({ id: "themed", autoFocus: true })

  useKeyboard((event: any) => {
    if (event.name === "t") onToggle()
  }, { global: true })

  return (
    <box ref={focusRef} flexDirection="column" padding={1} gap={1}>
      <text fg={isDark ? "#cdd6f4" : "#4c4f69"}>Theme: {isDark ? "dark" : "light"}</text>
      <text fg={theme.foreground}>Foreground text</text>
      <text fg={theme.primary}>Primary color</text>
      <text fg={theme.muted}>Muted text</text>
      <box border borderStyle="single" borderColor={theme.border} paddingX={1} height={3}>
        <text fg={theme.foreground}>Bordered box</text>
      </box>
    </box>
  )
}

export function ThemeSwitchFixture() {
  const [isDark, setIsDark] = useState(true)

  return (
    <FixtureWrapper cols={40} rows={10}>
      <ThemeProvider theme={isDark ? darkTheme : lightTheme}>
        <FocusProvider>
          <ThemeContent isDark={isDark} onToggle={() => setIsDark((prev) => !prev)} />
        </FocusProvider>
      </ThemeProvider>
    </FixtureWrapper>
  )
}
