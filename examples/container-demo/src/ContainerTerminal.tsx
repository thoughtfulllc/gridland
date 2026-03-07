import { useEffect, useRef, useState, type RefObject } from "react"
import { Terminal } from "@xterm/headless"
import { useXtermBuffer } from "./use-xterm-buffer"
import { keyEventToSequence } from "./keyboard-handler"
import type { BrowserRenderer } from "../../../packages/web/src/browser-renderer"

type Status = "loading" | "booting" | "ready" | "error"

interface ContainerTerminalProps {
  rendererRef: RefObject<BrowserRenderer | null>
}

export function ContainerTerminal({ rendererRef }: ContainerTerminalProps) {
  const [status, setStatus] = useState<Status>("loading")
  const [errorMsg, setErrorMsg] = useState("")
  const terminalRef = useRef<Terminal | null>(null)
  const inputBufferRef = useRef<number[]>([])

  // Initialize headless terminal
  useEffect(() => {
    const terminal = new Terminal({
      cols: 80,
      rows: 24,
      scrollback: 1000,
      allowProposedApi: true,
    })
    terminalRef.current = terminal

    return () => {
      terminal.dispose()
      terminalRef.current = null
    }
  }, [])

  // Load the container WASM and hook up TTY
  useEffect(() => {
    const terminal = terminalRef.current
    if (!terminal) return

    setStatus("booting")

    loadContainer(terminal, inputBufferRef.current).catch((err) => {
      console.error("Failed to load container:", err)
      setErrorMsg(err.message || String(err))
      setStatus("error")
    })

    // Watch for first output to detect boot progress
    let gotOutput = false
    const checkReady = setInterval(() => {
      const line = terminal.buffer.active.getLine(0)
      if (line) {
        const text = line.translateToString(true)
        if (text.trim().length > 0 && !gotOutput) {
          gotOutput = true
          setStatus("ready")
        }
      }
    }, 500)

    return () => clearInterval(checkReady)
  }, [])

  // Keyboard capture on the gridland canvas
  useEffect(() => {
    const renderer = rendererRef.current
    if (!renderer) return

    const canvas = renderer.canvas

    const onKeyDown = (e: KeyboardEvent) => {
      const seq = keyEventToSequence(e)
      if (seq !== null) {
        e.preventDefault()
        e.stopPropagation()
        for (let i = 0; i < seq.length; i++) {
          inputBufferRef.current.push(seq.charCodeAt(i))
        }
      }
    }

    canvas.addEventListener("keydown", onKeyDown, true)
    return () => canvas.removeEventListener("keydown", onKeyDown, true)
  })

  // Handle terminal resize when gridland container resizes
  useEffect(() => {
    const renderer = rendererRef.current
    const terminal = terminalRef.current
    if (!renderer || !terminal) return

    const canvas = renderer.canvas
    const container = canvas.parentElement
    if (!container) return

    const observer = new ResizeObserver(() => {
      const cellSize = renderer.painter.getCellSize()
      if (cellSize.width <= 0 || cellSize.height <= 0) return

      const rect = container.getBoundingClientRect()
      const newCols = Math.max(1, Math.floor(rect.width / cellSize.width))
      const newRows = Math.max(1, Math.floor(rect.height / cellSize.height))

      if (newCols !== terminal.cols || newRows !== terminal.rows) {
        terminal.resize(newCols, newRows)
      }
    })
    observer.observe(container)

    return () => observer.disconnect()
  })

  const rows = useXtermBuffer(terminalRef.current)

  if (status === "error") {
    return (
      <box width="100%" height="100%" justifyContent="center" alignItems="center" flexDirection="column">
        <text fg="#f38ba8">Failed to load container</text>
        <text fg="#a6adc8">{errorMsg}</text>
        <text fg="#585b70" marginTop={1}>
          Run `bun run build-container` first to build the WASM image.
        </text>
      </box>
    )
  }

  if (status === "loading" || status === "booting") {
    return (
      <box width="100%" height="100%" justifyContent="center" alignItems="center" flexDirection="column">
        <text fg="#89b4fa">
          {status === "loading" ? "Loading WASM module..." : "Booting Linux... (this takes 10-30s)"}
        </text>
        <text fg="#585b70" marginTop={1}>riscv64/alpine:3.20 via container2wasm</text>
      </box>
    )
  }

  return (
    <box width="100%" height="100%" flexDirection="column">
      {rows.map((row, y) => (
        <text key={y}>
          {row.spans.map((span, i) => (
            <span
              key={i}
              fg={span.fg ?? "#cdd6f4"}
              bg={span.bg}
              attributes={span.attributes || undefined}
            >
              {span.text}
            </span>
          ))}
        </text>
      ))}
    </box>
  )
}

/**
 * Loads the c2w emscripten module and hooks its stdio into the headless xterm terminal.
 *
 * The c2w TinyEMU build uses emscripten's FS with TTY devices.
 * We use Module.stdin/stdout/stderr callbacks to intercept I/O:
 * - stdin: reads from an input buffer filled by keyboard events
 * - stdout/stderr: writes raw bytes to terminal.write() for ANSI parsing
 */
async function loadContainer(terminal: Terminal, inputBuffer: number[]): Promise<void> {
  // Batch output bytes and flush to terminal
  let outputBuffer: number[] = []
  let flushScheduled = false

  function flushOutput() {
    if (outputBuffer.length > 0) {
      const data = new Uint8Array(outputBuffer)
      outputBuffer = []
      terminal.write(data)
    }
    flushScheduled = false
  }

  function scheduleFlush() {
    if (!flushScheduled) {
      flushScheduled = true
      setTimeout(flushOutput, 0)
    }
  }

  // Set up Module global before loading the script.
  //
  // Important: Do NOT set Module.stdin. When Module.stdin is set, emscripten
  // creates a simple character device (not a TTY) for /dev/stdin. That device's
  // read() returns 0 bytes (EOF) when our callback returns null, causing TinyEMU
  // to exit immediately.
  //
  // Instead, we leave stdin unset so emscripten creates a default TTY device
  // (symlinked /dev/stdin -> /dev/tty). We then patch the TTY's get_char in
  // preRun to feed from our inputBuffer, using Asyncify.handleSleep to block
  // until data is available (instead of returning EOF).
  //
  // We DO set Module.stdout/stderr to capture byte-level output from TinyEMU.
  const Module: any = {
    noInitialRun: false,
    stdout: (charCode: number) => {
      outputBuffer.push(charCode)
      scheduleFlush()
    },
    stderr: (charCode: number) => {
      outputBuffer.push(charCode)
      scheduleFlush()
    },
    print: (text: string) => {
      terminal.write(text + "\r\n")
    },
    printErr: (text: string) => {
      console.warn("[container]", text)
    },
    locateFile: (path: string) => {
      return "/c2w/" + path
    },
    preRun: [function () {
      // Patch TTY.default_tty_ops.get_char to feed from our inputBuffer.
      // The default implementation calls window.prompt() in the browser.
      // We return null when no input is available — the TTY layer converts
      // this to EAGAIN (errno 6), and TinyEMU's emscripten_sleep-based
      // main loop will retry later. We can NOT use Asyncify.handleSleep
      // here because fd_read is called during emscripten_sleep rewinds,
      // and Asyncify doesn't support nested async operations.
      const TTY = Module.TTY
      if (!TTY) {
        console.warn("[container] TTY not available in preRun")
        return
      }

      TTY.default_tty_ops.get_char = function (tty: any) {
        if (tty.input && tty.input.length) {
          return tty.input.shift()
        }
        if (inputBuffer.length > 0) {
          return inputBuffer.shift()!
        }
        // Return null — TTY layer throws EAGAIN, TinyEMU retries via its main loop
        return null
      }
    }],
  }

  ;(window as any).Module = Module

  // Suppress window.prompt — the default TTY get_char falls back to it,
  // which would show a blocking dialog. Our patched get_char handles stdin
  // via Asyncify instead.
  ;(window as any).__originalPrompt = window.prompt
  window.prompt = () => null

  // Load out.js as a script (it reads/modifies the global Module)
  await loadScript("/c2w/out.js")
}

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const script = document.createElement("script")
    script.src = src
    script.onload = () => resolve()
    script.onerror = () => reject(new Error(`Failed to load script: ${src}`))
    document.head.appendChild(script)
  })
}
