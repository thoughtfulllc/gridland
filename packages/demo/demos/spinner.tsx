// @ts-nocheck
import { FocusProvider } from "@gridland/utils"
import { SpinnerPicker } from "@gridland/ui"

export function SpinnerApp() {
  return (
    <FocusProvider>
      <box flexDirection="column" flexGrow={1}>
        <SpinnerPicker focusId="spinner-picker" autoFocus />
      </box>
    </FocusProvider>
  )
}
