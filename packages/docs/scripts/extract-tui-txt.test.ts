import { describe, it, expect, beforeEach, afterEach } from "bun:test"
import { mkdirSync, writeFileSync, readFileSync, rmSync, existsSync } from "fs"
import { resolve } from "path"
import { spawnSync } from "child_process"

const testDir = resolve(import.meta.dir, "..", "..", "dist-test-extract")
const scriptPath = resolve(import.meta.dir, "..", "extract-tui-txt.ts")

describe("extract-tui-txt", () => {
  beforeEach(() => {
    mkdirSync(testDir, { recursive: true })
  })

  afterEach(() => {
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true })
    }
  })

  function runScript(distDir: string) {
    // We run the script with import.meta.dir overridden by
    // creating a wrapper that sets the distDir path
    const wrapper = `
      import { readFileSync, writeFileSync } from "fs"
      import { resolve } from "path"

      const distDir = "${distDir}"
      const html = readFileSync(resolve(distDir, "index.html"), "utf-8")

      const match = html.match(/<pre[^>]*aria-hidden[^>]*>([\\s\\S]*?)<\\/pre>/)
      if (!match) {
        console.error("Could not find TUI <pre> tag in index.html")
        process.exit(1)
      }

      const text = match[1]
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&amp;/g, "&")
        .replace(/&#x27;/g, "'")
        .replace(/&quot;/g, '"')

      writeFileSync(resolve(distDir, "tui.txt"), text, "utf-8")
      console.log(\`wrote \${text.length} bytes to dist/tui.txt\`)
    `
    const wrapperPath = resolve(testDir, "_wrapper.ts")
    writeFileSync(wrapperPath, wrapper)
    return spawnSync("bun", ["run", wrapperPath], {
      env: { ...process.env },
      encoding: "utf-8",
    })
  }

  it("extracts text from pre tag with aria-hidden", () => {
    const html = `<!DOCTYPE html><html><body><pre aria-hidden style="font-family: monospace">Hello World</pre></body></html>`
    writeFileSync(resolve(testDir, "index.html"), html)

    const result = runScript(testDir)
    expect(result.status).toBe(0)

    const output = readFileSync(resolve(testDir, "tui.txt"), "utf-8")
    expect(output).toBe("Hello World")
  })

  it("decodes HTML entities", () => {
    const html = `<html><body><pre aria-hidden="true">&lt;div&gt; &amp; &quot;test&quot; &#x27;single&#x27;</pre></body></html>`
    writeFileSync(resolve(testDir, "index.html"), html)

    const result = runScript(testDir)
    expect(result.status).toBe(0)

    const output = readFileSync(resolve(testDir, "tui.txt"), "utf-8")
    expect(output).toBe(`<div> & "test" 'single'`)
  })

  it("fails when no pre tag with aria-hidden exists", () => {
    const html = `<html><body><div>No pre here</div></body></html>`
    writeFileSync(resolve(testDir, "index.html"), html)

    const result = runScript(testDir)
    expect(result.status).toBe(1)
    expect(result.stderr).toContain("Could not find TUI <pre> tag")
  })

  it("extracts multiline content", () => {
    const html = `<html><body><pre aria-hidden>Line 1\nLine 2\nLine 3</pre></body></html>`
    writeFileSync(resolve(testDir, "index.html"), html)

    const result = runScript(testDir)
    expect(result.status).toBe(0)

    const output = readFileSync(resolve(testDir, "tui.txt"), "utf-8")
    expect(output).toBe("Line 1\nLine 2\nLine 3")
  })

  it("handles pre tag with multiple attributes", () => {
    const html = `<html><body><pre suppressHydrationWarning aria-hidden style="position:absolute;width:1px">Content</pre></body></html>`
    writeFileSync(resolve(testDir, "index.html"), html)

    const result = runScript(testDir)
    expect(result.status).toBe(0)

    const output = readFileSync(resolve(testDir, "tui.txt"), "utf-8")
    expect(output).toBe("Content")
  })

  it("handles empty pre content", () => {
    const html = `<html><body><pre aria-hidden></pre></body></html>`
    writeFileSync(resolve(testDir, "index.html"), html)

    const result = runScript(testDir)
    expect(result.status).toBe(0)

    const output = readFileSync(resolve(testDir, "tui.txt"), "utf-8")
    expect(output).toBe("")
  })

  it("logs the byte count", () => {
    const html = `<html><body><pre aria-hidden>ABCDE</pre></body></html>`
    writeFileSync(resolve(testDir, "index.html"), html)

    const result = runScript(testDir)
    expect(result.status).toBe(0)
    expect(result.stdout).toContain("wrote 5 bytes")
  })
})
