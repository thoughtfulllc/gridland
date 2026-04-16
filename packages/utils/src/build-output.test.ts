import { describe, it, expect } from "bun:test"
import fs from "node:fs"
import path from "node:path"

const distIndex = path.resolve(import.meta.dir, "../dist/index.js")

describe("build output", () => {
  const content = fs.readFileSync(distIndex, "utf-8")

  it("process polyfill includes NODE_ENV production", () => {
    expect(content).toContain('NODE_ENV: "production"')
  })

  it("does not contain a local `var process` polyfill (would shadow Vite's define)", () => {
    expect(content).not.toContain("var process =")
  })

  it("polyfills process on globalThis so define substitution still works", () => {
    expect(content).toContain("globalThis.process")
  })
})
