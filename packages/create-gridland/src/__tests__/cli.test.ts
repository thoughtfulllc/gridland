import { describe, it, expect, beforeEach, afterEach } from "bun:test"
import { execSync } from "node:child_process"
import fs from "node:fs"
import path from "node:path"
import os from "node:os"

const CLI_PATH = path.resolve(__dirname, "../../dist/index.js")

let tmpDir: string

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "create-gridland-cli-test-"))
})

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true })
})

function run(args: string): string {
  return execSync(`bun ${CLI_PATH} ${args}`, {
    cwd: tmpDir,
    encoding: "utf-8",
    timeout: 30000,
  })
}

describe("CLI non-interactive", () => {
  it("scaffolds a vite project", () => {
    const output = run("test-vite-app --framework vite --no-install --no-git")
    expect(output).toContain("Project scaffolded")
    expect(fs.existsSync(path.join(tmpDir, "test-vite-app", "package.json"))).toBe(true)
    expect(fs.existsSync(path.join(tmpDir, "test-vite-app", "vite.config.ts"))).toBe(true)
  })

  it("scaffolds a next project", () => {
    const output = run("test-next-app --framework next --no-install --no-git")
    expect(output).toContain("Project scaffolded")
    expect(fs.existsSync(path.join(tmpDir, "test-next-app", "package.json"))).toBe(true)
    expect(fs.existsSync(path.join(tmpDir, "test-next-app", "next.config.ts"))).toBe(true)
  })

  it("errors on invalid framework", () => {
    let error: Error | null = null
    try {
      run("test-app --framework invalid --no-install --no-git")
    } catch (e) {
      error = e as Error
    }
    expect(error).not.toBeNull()
  })

  it("shows help", () => {
    const output = run("--help")
    expect(output).toContain("create-gridland")
    expect(output).toContain("--framework")
  })

  it("scaffolds with --yes flag using defaults", () => {
    const output = run("--yes --no-install --no-git")
    expect(output).toContain("Project scaffolded")
    expect(fs.existsSync(path.join(tmpDir, "my-gridland-app", "package.json"))).toBe(true)
  })
})
