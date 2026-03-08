// @ts-nocheck — OpenTUI intrinsic elements conflict with React's HTML/SVG types
"use client"
import { useState, useRef, type ReactNode, type CSSProperties } from "react"
import { TUI } from "@gridland/web"
import {
  HeadlessRenderer,
  setHeadlessRootRenderableClass,
  createHeadlessRoot,
} from "@gridland/web"
import { RootRenderable } from "@opentui/core"
import { TerminalWindow } from "@/components/ui/mac-window"

// One-time global setup
setHeadlessRootRenderableClass(RootRenderable)

export interface DemoWindowProps {
  title?: string
  className?: string
  tuiStyle?: CSSProperties
  cols?: number
  rows?: number
  children: ReactNode
}

export function DemoWindow({
  title,
  className,
  tuiStyle,
  cols = 80,
  rows = 24,
  children,
}: DemoWindowProps) {
  const [mode, setMode] = useState<"browser" | "ssr">("browser")
  const [asciiText, setAsciiText] = useState<string | null>(null)
  const asciiGeneratedRef = useRef(false)

  const switchToSSR = () => {
    if (!asciiGeneratedRef.current) {
      const renderer = new HeadlessRenderer({ cols, rows })
      const root = createHeadlessRoot(renderer)
      const text = root.renderToText(children)
      root.unmount()
      setAsciiText(text)
      asciiGeneratedRef.current = true
    }
    setMode("ssr")
  }

  const titleBarRight = (
    <div className="flex justify-end">
      <div
        className="inline-flex rounded-md overflow-hidden"
        style={{ border: "1px solid #313244" }}
      >
        <button
          type="button"
          className="text-xs px-2 py-0.5 transition-colors cursor-pointer hover:opacity-80"
          style={{
            backgroundColor:
              mode === "browser" ? "#3a3a4c" : "transparent",
            color: mode === "browser" ? "#cdd6f4" : "#6c7086",
            borderRight: "1px solid #313244",
          }}
          onClick={() => setMode("browser")}
        >
          Browser
        </button>
        <button
          type="button"
          className="text-xs px-2 py-0.5 transition-colors cursor-pointer hover:opacity-80"
          style={{
            backgroundColor:
              mode === "ssr" ? "#3a3a4c" : "transparent",
            color: mode === "ssr" ? "#cdd6f4" : "#6c7086",
          }}
          onClick={switchToSSR}
        >
          SSR
        </button>
      </div>
      <a
        href="/docs/guides/ssr-for-agents"
        title="SSR for Agents"
        className="ml-1.5 inline-flex items-center justify-center rounded-full text-xs px-1.5 py-0.5 transition-colors"
        style={{ color: "#6c7086", border: "1px solid #313244", textDecoration: "none" }}
      >
        ?
      </a>
    </div>
  )

  return (
    <TerminalWindow title={title} className={className} titleBarRight={titleBarRight}>
      <div className="overflow-x-auto overscroll-x-none">
        <div style={{ display: mode === "browser" ? "block" : "none" }}>
          <TUI style={tuiStyle} autoFocus={false}>{children}</TUI>
        </div>
        {mode === "ssr" && asciiText != null && (
          <pre
            style={{
              margin: 0,
              padding: "8px 12px",
              fontFamily:
                "'JetBrains Mono', 'Fira Code', 'Cascadia Code', 'Consolas', monospace",
              fontSize: 14,
              lineHeight: 1.3,
              backgroundColor: "#1e1e2e",
              color: "#cdd6f4",
              whiteSpace: "pre",
              overflowX: "auto",
            }}
          >
            {asciiText}
          </pre>
        )}
      </div>
    </TerminalWindow>
  )
}
