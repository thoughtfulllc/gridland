// @ts-nocheck — OpenTUI intrinsic elements conflict with React's HTML/SVG types
"use client"
import { useState, useRef, useEffect, type ReactNode, type CSSProperties } from "react"
import { useTheme as usePageTheme } from "next-themes"
import { TUI } from "@gridland/web"
import {
  HeadlessRenderer,
  setHeadlessRootRenderableClass,
  createHeadlessRoot,
} from "@gridland/web"
import { ThemeProvider, darkTheme, lightTheme } from "@gridland/ui"
import { RootRenderable } from "../../../core/src/Renderable"
import { TerminalWindow } from "@/components/ui/mac-window"

// One-time global setup
setHeadlessRootRenderableClass(RootRenderable)

export interface DemoWindowProps {
  title?: string
  className?: string
  tuiStyle?: CSSProperties
  cols?: number
  rows?: number
  cursorHighlight?: boolean
  autoFocus?: boolean
  children: ReactNode
}

export function DemoWindow({
  title,
  className,
  tuiStyle,
  cols = 80,
  rows = 24,
  cursorHighlight = false,
  autoFocus = false,
  children,
}: DemoWindowProps) {
  const { resolvedTheme } = usePageTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  // Until mounted, default to dark to match SSR; after mount, use actual page theme
  const isLight = mounted && resolvedTheme === "light"
  const tuiTheme = isLight ? lightTheme : darkTheme

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

  const activeBtnClass = "text-xs px-2 py-0.5 transition-colors cursor-pointer hover:opacity-80 bg-[#d4d4d4] text-[#1a1a1a] dark:bg-[#3a3a4c] dark:text-[#cdd6f4]"
  const inactiveBtnClass = "text-xs px-2 py-0.5 transition-colors cursor-pointer hover:opacity-80 bg-transparent text-[#888] dark:text-[#6c7086]"

  const titleBarRight = (
    <div className="flex justify-end">
      <div className="inline-flex rounded-md overflow-hidden border border-[#d4d4d4] dark:border-[#313244]">
        <button
          type="button"
          className={`${mode === "browser" ? activeBtnClass : inactiveBtnClass} border-r border-[#d4d4d4] dark:border-[#313244]`}
          onClick={() => setMode("browser")}
        >
          Browser
        </button>
        <button
          type="button"
          className={mode === "ssr" ? activeBtnClass : inactiveBtnClass}
          onClick={switchToSSR}
        >
          SSR
        </button>
      </div>
      <a
        href="/docs/guides/ssr-for-agents"
        title="SSR for Agents"
        className="ml-1.5 inline-flex items-center justify-center rounded-full text-xs px-1.5 py-0.5 transition-colors border border-[#d4d4d4] dark:border-[#313244] no-underline text-[#888] dark:text-[#6c7086]"
      >
        ?
      </a>
    </div>
  )

  return (
    <TerminalWindow title={title} className={className} titleBarRight={titleBarRight}>
      <div className="overflow-x-auto overscroll-x-none">
        <div style={{ display: mode === "browser" ? "block" : "none" }}>
          <TUI style={tuiStyle} autoFocus={autoFocus} backgroundColor={tuiTheme.background} cursorHighlight={cursorHighlight}>
            <ThemeProvider theme={tuiTheme}>{children}</ThemeProvider>
          </TUI>
        </div>
        {mode === "ssr" && asciiText != null && (
          <pre
            className="bg-[#f5f5f5] text-[#1a1a1a] dark:bg-[#1e1e2e] dark:text-[#cdd6f4]"
            style={{
              margin: 0,
              padding: "8px 12px",
              fontFamily:
                "'JetBrains Mono', 'Fira Code', 'Cascadia Code', 'Consolas', monospace",
              fontSize: 14,
              lineHeight: 1.3,
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
