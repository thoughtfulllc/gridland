// @ts-nocheck
// Note: LandingApp imports useBreakpoints which depends on @opentui/react's
// useTerminalDimensions. This requires the full opentui core module which isn't
// available in the current test environment. These tests are skipped until the
// test preload is extended to mock @opentui/react hooks.

import { describe, it } from "bun:test"

describe.skip("LandingApp", () => {
  it("renders the main view with status bar", () => {})
  it("shows about modal when 'a' is pressed", () => {})
  it("closes about modal when 'q' is pressed", () => {})
  it("ignores 'q' when about modal is not showing", () => {})
  it("ignores 'a' when about modal is already showing", () => {})
  it("renders a bordered box in main view", () => {})
})
