/**
 * Converts browser KeyboardEvent to terminal escape sequences.
 * Returns the string to send to the terminal, or null if the event
 * should not be forwarded.
 */
export function keyEventToSequence(e: KeyboardEvent): string | null {
  // Ctrl+key combinations
  if (e.ctrlKey && !e.altKey && !e.metaKey) {
    const key = e.key.toLowerCase()
    if (key >= "a" && key <= "z") {
      return String.fromCharCode(key.charCodeAt(0) - 96) // Ctrl+A = 0x01, etc.
    }
    if (key === "[") return "\x1b"
    if (key === "\\") return "\x1c"
    if (key === "]") return "\x1d"
    if (key === "^") return "\x1e"
    if (key === "_") return "\x1f"
    return null
  }

  // Alt+key combinations (send ESC prefix)
  if (e.altKey && !e.ctrlKey && !e.metaKey) {
    if (e.key.length === 1) {
      return "\x1b" + e.key
    }
  }

  // Don't process meta/cmd key combos (browser shortcuts)
  if (e.metaKey) return null

  switch (e.key) {
    case "Enter":
      return "\r"
    case "Backspace":
      return "\x7f"
    case "Tab":
      return e.shiftKey ? "\x1b[Z" : "\t"
    case "Escape":
      return "\x1b"
    case "ArrowUp":
      return "\x1b[A"
    case "ArrowDown":
      return "\x1b[B"
    case "ArrowRight":
      return "\x1b[C"
    case "ArrowLeft":
      return "\x1b[D"
    case "Home":
      return "\x1b[H"
    case "End":
      return "\x1b[F"
    case "PageUp":
      return "\x1b[5~"
    case "PageDown":
      return "\x1b[6~"
    case "Insert":
      return "\x1b[2~"
    case "Delete":
      return "\x1b[3~"
    case "F1":
      return "\x1bOP"
    case "F2":
      return "\x1bOQ"
    case "F3":
      return "\x1bOR"
    case "F4":
      return "\x1bOS"
    case "F5":
      return "\x1b[15~"
    case "F6":
      return "\x1b[17~"
    case "F7":
      return "\x1b[18~"
    case "F8":
      return "\x1b[19~"
    case "F9":
      return "\x1b[20~"
    case "F10":
      return "\x1b[21~"
    case "F11":
      return "\x1b[23~"
    case "F12":
      return "\x1b[24~"
    default:
      // Printable characters
      if (e.key.length === 1) {
        return e.key
      }
      return null
  }
}
