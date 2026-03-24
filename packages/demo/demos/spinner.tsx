// @ts-nocheck
import { useKeyboard } from "@gridland/utils"
import { SpinnerPicker } from "@gridland/ui"

export function SpinnerApp() {
  return (
    <box flexDirection="column" flexGrow={1}>
      <SpinnerPicker useKeyboard={useKeyboard} />
    </box>
  )
}
