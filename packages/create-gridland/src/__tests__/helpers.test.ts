import { describe, it, expect, beforeEach, afterEach } from "bun:test"
import fs from "node:fs"
import path from "node:path"
import os from "node:os"
import { validateProjectName, checkDirectory } from "../helpers/validate"
import { detectPackageManager } from "../helpers/package-manager"

describe("validateProjectName", () => {
  it("accepts valid names", () => {
    expect(validateProjectName("my-app").valid).toBe(true)
    expect(validateProjectName("my-gridland-app").valid).toBe(true)
    expect(validateProjectName("app123").valid).toBe(true)
    expect(validateProjectName("my.app").valid).toBe(true)
    expect(validateProjectName("@scope/my-app").valid).toBe(true)
  })

  it("rejects empty name", () => {
    const result = validateProjectName("")
    expect(result.valid).toBe(false)
  })

  it("rejects names with spaces", () => {
    const result = validateProjectName("my app")
    expect(result.valid).toBe(false)
  })

  it("rejects names with uppercase", () => {
    const result = validateProjectName("MyApp")
    expect(result.valid).toBe(false)
  })

  it("rejects names with special characters", () => {
    const result = validateProjectName("my@app!")
    expect(result.valid).toBe(false)
  })
})

describe("checkDirectory", () => {
  let tmpDir: string

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "create-gridland-test-"))
  })

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true })
  })

  it("detects non-existent directory", () => {
    const result = checkDirectory(path.join(tmpDir, "does-not-exist"))
    expect(result.exists).toBe(false)
    expect(result.empty).toBe(true)
  })

  it("detects empty directory", () => {
    const dir = path.join(tmpDir, "empty")
    fs.mkdirSync(dir)
    const result = checkDirectory(dir)
    expect(result.exists).toBe(true)
    expect(result.empty).toBe(true)
  })

  it("detects non-empty directory", () => {
    const dir = path.join(tmpDir, "notempty")
    fs.mkdirSync(dir)
    fs.writeFileSync(path.join(dir, "file.txt"), "content")
    const result = checkDirectory(dir)
    expect(result.exists).toBe(true)
    expect(result.empty).toBe(false)
  })
})

describe("detectPackageManager", () => {
  const originalAgent = process.env.npm_config_user_agent

  afterEach(() => {
    if (originalAgent !== undefined) {
      process.env.npm_config_user_agent = originalAgent
    } else {
      delete process.env.npm_config_user_agent
    }
  })

  it("detects npm", () => {
    process.env.npm_config_user_agent = "npm/10.0.0 node/v20.0.0"
    expect(detectPackageManager()).toBe("npm")
  })

  it("detects yarn", () => {
    process.env.npm_config_user_agent = "yarn/1.22.0 npm/? node/v20.0.0"
    expect(detectPackageManager()).toBe("yarn")
  })

  it("detects pnpm", () => {
    process.env.npm_config_user_agent = "pnpm/8.0.0 npm/? node/v20.0.0"
    expect(detectPackageManager()).toBe("pnpm")
  })

  it("detects bun", () => {
    process.env.npm_config_user_agent = "bun/1.0.0"
    expect(detectPackageManager()).toBe("bun")
  })

  it("defaults to npm when unset", () => {
    delete process.env.npm_config_user_agent
    expect(detectPackageManager()).toBe("npm")
  })
})
