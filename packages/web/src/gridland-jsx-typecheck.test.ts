import { describe, it, expect } from "bun:test"
import { spawnSync } from "node:child_process"
import path from "node:path"

const tscPath = path.resolve(import.meta.dir, "../node_modules/.bin/tsc")
const projectDir = path.resolve(import.meta.dir, "../test/type-check")

describe("gridland-jsx.d.ts type checking", () => {
  it("valid JSX compiles and invalid JSX is rejected", () => {
    const result = spawnSync(tscPath, ["--noEmit", "--project", projectDir], {
      cwd: projectDir,
      timeout: 30_000,
    })
    const stdout = result.stdout?.toString() ?? ""
    const stderr = result.stderr?.toString() ?? ""
    if (result.status !== 0) {
      throw new Error(`tsc failed (exit ${result.status}):\n${stdout}\n${stderr}`)
    }
    expect(result.status).toBe(0)
  })
})
