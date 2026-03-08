// Extracts the TUI text from the SSR-rendered index.html <pre> tag
// and writes it to dist/tui.txt. Run after `next build`.

import { readFileSync, writeFileSync } from "fs"
import { resolve } from "path"

const distDir = resolve(import.meta.dir, "..", "dist")
const html = readFileSync(resolve(distDir, "index.html"), "utf-8")

// The SSR <pre> contains the headless-rendered TUI text.
// It's wrapped in: <pre aria-hidden ... style="...">TEXT</pre>
const match = html.match(/<pre[^>]*aria-hidden[^>]*>([\s\S]*?)<\/pre>/)
if (!match) {
  console.error("Could not find TUI <pre> tag in index.html")
  process.exit(1)
}

// Decode HTML entities
const text = match[1]
  .replace(/&lt;/g, "<")
  .replace(/&gt;/g, ">")
  .replace(/&amp;/g, "&")
  .replace(/&#x27;/g, "'")
  .replace(/&quot;/g, '"')

writeFileSync(resolve(distDir, "tui.txt"), text, "utf-8")
console.log(`wrote ${text.length} bytes to dist/tui.txt`)
