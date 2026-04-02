// @ts-nocheck
import { useKeyboard } from "@gridland/utils"
import { GradientApp } from "./gradient"
import { AsciiApp } from "./ascii"
import { TableApp } from "./table"
import { SpinnerApp } from "./spinner"
import { SelectInputApp } from "./select-input"
import { MultiSelectApp } from "./multi-select"
import { PromptInputApp } from "./prompt-input"
import { TextInputApp } from "./text-input"
import { LinkApp } from "./link"
import { TabBarApp } from "./tabs"
import { StatusBarApp } from "./status-bar"
import { ModalApp } from "./modal"
import { PrimitivesApp } from "./primitives"
import { ChatApp } from "./chat"
import { ChainOfThoughtApp } from "./chain-of-thought"
import { MessageApp } from "./message"
import { TerminalWindowApp } from "./terminal-window"
import { FocusApp } from "./focus"
import { FocusGridApp } from "./focus-grid"
import { FocusChatApp } from "./focus-chat"
import { PointerApp } from "./pointer"
import { CursorHighlightApp } from "./cursor-highlight"
import { TextStyleApp } from "./text-style"
import { HeadlessApp } from "./headless"
import { ThemingApp } from "./theming"
import { LandingApp } from "../src/landing"
import { RippleApp } from "./ripple"
import { PuzzleApp } from "./puzzle"
import { SideNavApp } from "./side-nav"

export {
  GradientApp,
  AsciiApp,
  TableApp,
  SpinnerApp,
  SelectInputApp,
  MultiSelectApp,
  PromptInputApp,
  TextInputApp,
  LinkApp,
  TabBarApp,
  StatusBarApp,
  ModalApp,
  PrimitivesApp,
  ChatApp,
  ChainOfThoughtApp,
  MessageApp,
  TerminalWindowApp,
  FocusApp,
  FocusGridApp,
  FocusChatApp,
  PointerApp,
  CursorHighlightApp,
  TextStyleApp,
  HeadlessApp,
  ThemingApp,
  LandingApp,
  RippleApp,
  PuzzleApp,
  SideNavApp,
}

export interface Demo {
  name: string
  app: () => JSX.Element
}

export const demos: Demo[] = [
  { name: "gradient", app: () => <GradientApp /> },
  { name: "ascii", app: () => <AsciiApp /> },
  { name: "table", app: () => <TableApp /> },
  { name: "spinner", app: () => <SpinnerApp /> },
  { name: "select-input", app: () => <SelectInputApp /> },
  { name: "multi-select", app: () => <MultiSelectApp /> },
  { name: "prompt-input", app: () => <PromptInputApp /> },
  { name: "text-input", app: () => <TextInputApp /> },
  { name: "link", app: () => <LinkApp /> },
  { name: "tabs", app: () => <TabBarApp /> },
  { name: "status-bar", app: () => <StatusBarApp /> },
  { name: "modal", app: () => <ModalApp /> },
  { name: "primitives", app: () => <PrimitivesApp /> },
  { name: "chat", app: () => <ChatApp /> },
  { name: "chain-of-thought", app: () => <ChainOfThoughtApp /> },
  { name: "message", app: () => <MessageApp /> },
  { name: "terminal-window", app: () => <TerminalWindowApp /> },
  { name: "focus-grid", app: () => <FocusGridApp /> },
  { name: "focus-chat", app: () => <FocusChatApp /> },
  { name: "focus", app: () => <FocusApp /> },
  { name: "pointer", app: () => <PointerApp /> },
  { name: "cursor-highlight", app: () => <CursorHighlightApp /> },
  { name: "text-style", app: () => <TextStyleApp /> },
  { name: "headless", app: () => <HeadlessApp /> },
  { name: "theming", app: () => <ThemingApp /> },
  { name: "landing", app: () => <LandingApp useKeyboard={useKeyboard} /> },
  { name: "ripple", app: () => <RippleApp /> },
  { name: "puzzle", app: () => <PuzzleApp /> },
  { name: "side-nav", app: () => <SideNavApp /> },
]
