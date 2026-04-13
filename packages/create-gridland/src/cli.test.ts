import { describe, it, expect, beforeEach, afterEach } from "bun:test"
import { execSync } from "node:child_process"
import fs from "node:fs"
import path from "node:path"
import os from "node:os"

const CLI_PATH = path.resolve(__dirname, "../dist/index.js")

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

describe("CLI add subcommand", () => {
  it("shows help for the add subcommand", () => {
    const output = run("add --help")
    expect(output).toContain("Add Gridland components")
    expect(output).toContain("--yes")
    expect(output).toContain("--overwrite")
    expect(output).toContain("--dry-run")
  })

  it("prints the resolved shadcn command with --dry-run", () => {
    const output = run("add spinner --dry-run")
    expect(output).toContain("shadcn@latest")
    expect(output).toContain("add")
    expect(output).toContain("@gridland/spinner")
  })

  it("passes through already-namespaced components unchanged", () => {
    const output = run("add @gridland/modal --dry-run")
    expect(output).toContain("@gridland/modal")
    expect(output).not.toContain("@gridland/@gridland/")
  })

  it("supports multiple components in one invocation", () => {
    const output = run("add spinner modal --dry-run")
    expect(output).toContain("@gridland/spinner")
    expect(output).toContain("@gridland/modal")
  })

  it("errors when no components are given", () => {
    let error: Error | null = null
    try {
      run("add")
    } catch (e) {
      error = e as Error
    }
    expect(error).not.toBeNull()
  })
})
