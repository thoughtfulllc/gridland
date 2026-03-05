// @ts-nocheck — OpenTUI intrinsic elements conflict with React's HTML/SVG types
import { FixtureWrapper } from "../fixture-wrapper"
import { Modal } from "../../../../packages/polyterm-ui/components/modal/modal"

export function ModalFixture() {
  return (
    <FixtureWrapper cols={50} rows={10}>
      <Modal title="Settings" borderColor="blue">
        <box paddingX={1}>
          <text>Modal content goes here</text>
        </box>
      </Modal>
    </FixtureWrapper>
  )
}
