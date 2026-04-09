import { useState } from "react"
import { FixtureWrapper } from "../fixture-wrapper"
import { Modal } from "../../../../packages/ui/components/modal/modal"
import { GridlandProvider } from "../../../../packages/ui/components/provider/provider"
import { ThemeProvider, darkTheme } from "../../../../packages/ui/components/theme"
import { useFocus, FocusProvider, useKeyboard } from "@gridland/utils"

function ModalTrigger({ onOpen }: { onOpen: () => void }) {
  const { isFocused, isSelected, focusRef } = useFocus({ id: "trigger", autoFocus: true, selectable: true })

  useKeyboard((event: any) => {
    if (event.name === "o") onOpen()
  }, { global: true })

  return (
    <box ref={focusRef} border borderStyle="single" borderColor={isFocused ? "#89b4fa" : "#45475a"} paddingX={1} height={3}>
      <text fg="#cdd6f4">Trigger{isFocused ? " (focused)" : ""} - press 'o' to open</text>
    </box>
  )
}

export function ModalInteractiveFixture() {
  const [open, setOpen] = useState(false)

  return (
    <FixtureWrapper cols={50} rows={12}>
      <ThemeProvider theme={darkTheme}>
        <GridlandProvider>
          <FocusProvider selectable>
            <box flexDirection="column">
              <ModalTrigger onOpen={() => setOpen(true)} />
              <text fg="#6c7086">Modal: {open ? "open" : "closed"}</text>
              {open && (
                <Modal title="Test Modal" useKeyboard={useKeyboard} onClose={() => setOpen(false)}>
                  <box padding={1}>
                    <text fg="#cdd6f4">Modal content here</text>
                  </box>
                </Modal>
              )}
            </box>
          </FocusProvider>
        </GridlandProvider>
      </ThemeProvider>
    </FixtureWrapper>
  )
}
