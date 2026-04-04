// @ts-nocheck
"use client"
import { useState, useRef, useCallback } from "react"
import { useKeyboard, useFocus, FocusProvider, useShortcuts, useFocusedShortcuts } from "@gridland/utils"
import {
  StatusBar,
  PromptInput,
  Message,
  ChainOfThought, ChainOfThoughtHeader, ChainOfThoughtContent, ChainOfThoughtStep,
  useFocusBorderStyle,
  useFocusDividerStyle,
} from "@gridland/ui"

function CotSection() {
  const { isFocused, isSelected, isAnySelected, focusId, focusRef } = useFocus({ id: "cot", autoFocus: true })
  const [cotOpen, setCotOpen] = useState(false)

  useKeyboard((event) => {
    if (event.name === "return") {
      setCotOpen((v) => !v)
      event.preventDefault()
    }
  }, { focusId, selectedOnly: true })

  useShortcuts(
    isSelected
      ? [{ key: "enter", label: "expand/collapse" }, { key: "esc", label: "back" }]
      : [{ key: "↑↓", label: "navigate" }, { key: "tab", label: "cycle" }, { key: "enter", label: "select" }],
    focusId,
  )

  const { borderColor, borderStyle } = useFocusBorderStyle({ isFocused, isSelected, isAnySelected })

  return (
    <box ref={focusRef} marginTop={1} border borderStyle={borderStyle} borderColor={borderColor}>
      <ChainOfThought open={cotOpen} onOpenChange={setCotOpen}>
        <ChainOfThoughtHeader duration="1.2s" />
        <ChainOfThoughtContent>
          <ChainOfThoughtStep label="Searched docs" status="done" isLast />
        </ChainOfThoughtContent>
      </ChainOfThought>
    </box>
  )
}

function PromptSection() {
  const { isFocused, isSelected, isAnySelected, focusId, focusRef } = useFocus({ id: "prompt" })
  const promptHandlerRef = useRef<((event: any) => void) | null>(null)

  const captureKeyboard = useCallback((handler: (event: any) => void) => {
    promptHandlerRef.current = handler
  }, [])

  useKeyboard((event) => {
    promptHandlerRef.current?.(event)
  }, { focusId, selectedOnly: true })

  useShortcuts(
    isSelected
      ? [{ key: "⏎", label: "send" }, { key: "esc", label: "back" }]
      : [{ key: "↑↓", label: "navigate" }, { key: "tab", label: "cycle" }, { key: "enter", label: "select" }],
    focusId,
  )

  const { dividerColor, dividerDashed } = useFocusDividerStyle({ isFocused, isSelected, isAnySelected })

  return (
    <box ref={focusRef}>
      <PromptInput
        placeholder="Type a message..."
        status="ready"
        dividerColor={dividerColor}
        dividerDashed={dividerDashed}
        useKeyboard={captureKeyboard}
      />
    </box>
  )
}

function FocusChatStatusBar() {
  const shortcuts = useFocusedShortcuts()
  return (
    <box paddingX={1} paddingBottom={1}>
      <StatusBar items={shortcuts} />
    </box>
  )
}

export function FocusChatApp() {
  return (
    <FocusProvider selectable>
      <box flexDirection="column" flexGrow={1}>
        <box flexDirection="column" flexGrow={1}>
          <box flexDirection="column" paddingX={1} paddingTop={1} flexGrow={1}>
            <Message role="user">
              <Message.Content>
                <Message.Text>How do I set up keyboard navigation?</Message.Text>
              </Message.Content>
            </Message>
            <CotSection />
            <Message role="assistant">
              <Message.Content>
                <Message.Text>Use the useKeyboard hook to listen for key events. Wrap your app in a FocusProvider to enable tab navigation between focusable components.</Message.Text>
              </Message.Content>
            </Message>
          </box>
          <PromptSection />
        </box>
        <FocusChatStatusBar />
      </box>
    </FocusProvider>
  )
}
