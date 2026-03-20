// @ts-nocheck
import { useKeyboard } from "@gridland/utils"
import { SpinnerPicker, StatusBar } from "@gridland/ui"

export function SpinnerApp() {
  return (
    <box flexDirection="column" flexGrow={1}>
      <box flexGrow={1}>
        <SpinnerPicker useKeyboard={useKeyboard} />
      </box>
      <box paddingX={1} paddingBottom={1}>
        <StatusBar items={[{ key: "←→", label: "change variant" }]} />
      </box>
    </box>
  )
}
