// @ts-nocheck — OpenTUI intrinsic elements conflict with React's HTML/SVG types
"use client"
import { useState, useCallback, useRef, useEffect } from "react"
import { TUI } from "@gridland/web"
import type { BrowserRenderer } from "@gridland/web"

function bufferToHtml(buffer: {
  char: Uint32Array
  fg: Float32Array
  bg: Float32Array
  width: number
  height: number
}): string {
  const lines: string[] = []

  for (let row = 0; row < buffer.height; row++) {
    let line = ""
    let runChars = ""
    let runFg = ""
    let runBg = ""

    const flushRun = () => {
      if (runChars.length === 0) return
      const hasBg = runBg !== "rgba(0,0,0,0)"
      if (runFg || hasBg) {
        let style = ""
        if (runFg) style += `color:${runFg};`
        if (hasBg) style += `background:${runBg};`
        line += `<span style="${style}">${escapeHtml(runChars)}</span>`
      } else {
        line += escapeHtml(runChars)
      }
      runChars = ""
    }

    for (let col = 0; col < buffer.width; col++) {
      const idx = row * buffer.width + col
      const off = idx * 4

      const fr = Math.round(buffer.fg[off] * 255)
      const fg = Math.round(buffer.fg[off + 1] * 255)
      const fb = Math.round(buffer.fg[off + 2] * 255)
      const fa = buffer.fg[off + 3]

      const br = Math.round(buffer.bg[off] * 255)
      const bg = Math.round(buffer.bg[off + 1] * 255)
      const bb = Math.round(buffer.bg[off + 2] * 255)
      const ba = buffer.bg[off + 3]

      const cellFg = fa > 0 ? `rgb(${fr},${fg},${fb})` : ""
      const cellBg =
        ba > 0 ? `rgba(${br},${bg},${bb},${ba.toFixed(2)})` : "rgba(0,0,0,0)"

      const charCode = buffer.char[idx]
      const ch = charCode === 0 ? " " : String.fromCodePoint(charCode)

      if (col === 0) {
        runFg = cellFg
        runBg = cellBg
        runChars = ch
      } else if (cellFg === runFg && cellBg === runBg) {
        runChars += ch
      } else {
        flushRun()
        runFg = cellFg
        runBg = cellBg
        runChars = ch
      }
    }
    flushRun()
    lines.push(line)
  }

  return lines.join("\n")
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
}

function GridlandDemo() {
  return (
    <box flexDirection="column" width="100%" height="100%" padding={1}>
      <box
        border={true}
        borderStyle="rounded"
        borderColor="#88c0d0"
        backgroundColor="#2e3440"
        title=" Gridland — SSR Demo "
        titleAlignment="center"
        flexDirection="column"
        padding={1}
      >
        <text fg="#a3be8c">Welcome to Gridland!</text>
        <text fg="#81a1c1">
          This is rendered directly to an HTML5 Canvas.
        </text>
        <text fg="#b48ead">
          Toggle the button below to see what an agent sees.
        </text>
      </box>

      <box marginTop={1} flexDirection="row" gap={2}>
        <box
          border={true}
          borderStyle="single"
          borderColor="#5e81ac"
          flexGrow={1}
          padding={1}
          flexDirection="column"
        >
          <text fg="#ebcb8b" bold={true}>
            Features
          </text>
          <text fg="#d8dee9">• Canvas-based rendering</text>
          <text fg="#d8dee9">• React reconciler</text>
          <text fg="#d8dee9">• Yoga layout engine</text>
          <text fg="#d8dee9">• Keyboard input</text>
          <text fg="#d8dee9">• Auto-resize</text>
        </box>

        <box
          border={true}
          borderStyle="single"
          borderColor="#bf616a"
          flexGrow={1}
          padding={1}
          flexDirection="column"
        >
          <text fg="#ebcb8b" bold={true}>
            Stack
          </text>
          <text fg="#d8dee9">• React 19</text>
          <text fg="#d8dee9">• Vite 6</text>
          <text fg="#d8dee9">• TypeScript</text>
          <text fg="#d8dee9">• yoga-layout</text>
        </box>
      </box>

      <box
        marginTop={1}
        border={true}
        borderStyle="rounded"
        borderColor="#a3be8c"
        padding={1}
        flexDirection="column"
      >
        <text fg="#ebcb8b" bold={true}>
          About this demo
        </text>
        <text fg="#d8dee9">
          Click the &quot;Agent View&quot; toggle in the bottom-right to see
        </text>
        <text fg="#d8dee9">
          how this page looks as raw Unicode characters — the same
        </text>
        <text fg="#d8dee9">
          output that an LLM or screen reader would receive.
        </text>
      </box>
    </box>
  )
}

export default function SSRPage() {
  const [showText, setShowText] = useState(false)
  const [htmlContent, setHtmlContent] = useState("")
  const rendererRef = useRef<BrowserRenderer | null>(null)
  const intervalRef = useRef<number | null>(null)

  const handleReady = useCallback((renderer: BrowserRenderer) => {
    rendererRef.current = renderer
  }, [])

  useEffect(() => {
    if (showText && rendererRef.current) {
      const snap = () => {
        const buf = rendererRef.current!.buffer
        setHtmlContent(bufferToHtml(buf))
      }
      snap()
      intervalRef.current = window.setInterval(snap, 200)
      return () => {
        if (intervalRef.current) window.clearInterval(intervalRef.current)
      }
    }
  }, [showText])

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        position: "relative",
        background: "#1e1e2e",
      }}
    >
      {/* Canvas TUI layer */}
      <div
        style={{
          width: "100%",
          height: "100%",
          visibility: showText ? "hidden" : "visible",
        }}
      >
        <TUI
          style={{ width: "100%", height: "100%" }}
          backgroundColor="#1e1e2e"
          onReady={handleReady}
        >
          <GridlandDemo />
        </TUI>
      </div>

      {/* Agent text view layer */}
      {showText && (
        <pre
          style={{
            position: "absolute",
            inset: 0,
            margin: 0,
            padding: 0,
            background: "#1e1e2e",
            color: "#cdd6f4",
            fontFamily:
              "'JetBrains Mono', 'Fira Code', 'Cascadia Code', 'Consolas', monospace",
            fontSize: "14px",
            lineHeight: "1.4",
            overflow: "auto",
            whiteSpace: "pre",
            zIndex: 10,
          }}
          dangerouslySetInnerHTML={{ __html: htmlContent }}
        />
      )}

      {/* Toggle button */}
      <button
        onClick={() => setShowText((v) => !v)}
        style={{
          position: "fixed",
          bottom: 20,
          right: 20,
          zIndex: 100,
          padding: "10px 18px",
          borderRadius: 8,
          border: `2px solid ${showText ? "#a3be8c" : "#5e81ac"}`,
          background: showText ? "#a3be8c" : "#5e81ac",
          color: "#1e1e2e",
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 13,
          fontWeight: 700,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: 8,
          boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
          transition: "all 0.15s ease",
        }}
      >
        <span style={{ fontSize: 16 }}>{showText ? "\u{1F441}" : "\u{1F916}"}</span>
        {showText ? "Canvas View" : "Agent View"}
      </button>
    </div>
  )
}
