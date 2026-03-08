import { describe, it, expect, beforeEach, afterEach } from "bun:test"
import { execSync } from "node:child_process"
import fs from "node:fs"
import path from "node:path"
import os from "node:os"

const CLI_PATH = path.resolve(__dirname, "../../dist/index.js")

let tmpDir: string

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "create-gridland-e2e-"))
})

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true })
})

function runCli(args: string): string {
  return execSync(`bun ${CLI_PATH} ${args}`, {
    cwd: tmpDir,
    encoding: "utf-8",
    timeout: 30000,
  })
}

function runInProject(projectName: string, cmd: string): string {
  return execSync(cmd, {
    cwd: path.join(tmpDir, projectName),
    encoding: "utf-8",
    timeout: 120000,
  })
}

describe("e2e: vite project", () => {
  it("builds successfully", () => {
    runCli("test-vite --framework vite --no-git")
    runInProject("test-vite", "bun run build")

    expect(fs.existsSync(path.join(tmpDir, "test-vite", "dist"))).toBe(true)
  })

  it("typescript compiles clean", () => {
    runCli("test-vite-tsc --framework vite --no-git")
    runInProject("test-vite-tsc", "npx tsc --noEmit")
  })
})

describe("e2e: next project", () => {
  it("builds successfully", () => {
    runCli("test-next --framework next --no-git")
    runInProject("test-next", "bun run build")

    expect(fs.existsSync(path.join(tmpDir, "test-next", ".next"))).toBe(true)
  })

  it("typescript compiles clean", () => {
    runCli("test-next-tsc --framework next --no-git")
    runInProject("test-next-tsc", "npx tsc --noEmit")
  })
})
