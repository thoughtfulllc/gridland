import { describe, it, expect, beforeEach, afterEach } from "bun:test"
import fs from "node:fs"
import path from "node:path"
import os from "node:os"
import { scaffold } from "../scaffold"

let tmpDir: string

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "create-gridland-test-"))
})

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true })
})

describe("scaffold vite", () => {
  it("produces correct file tree", () => {
    const targetDir = path.join(tmpDir, "test-app")
    scaffold({ projectName: "test-app", framework: "vite", targetDir })

    const expected = [
      "package.json",
      "vite.config.ts",
      "tsconfig.json",
      "index.html",
      "src/main.tsx",
      "src/App.tsx",
      ".gitignore",
      "gridland-jsx.d.ts",
    ]

    for (const file of expected) {
      expect(fs.existsSync(path.join(targetDir, file))).toBe(true)
    }

    // No Next.js files
    expect(fs.existsSync(path.join(targetDir, "next.config.ts"))).toBe(false)
    expect(fs.existsSync(path.join(targetDir, "app"))).toBe(false)
  })

  it("has correct imports (not monorepo-relative)", () => {
    const targetDir = path.join(tmpDir, "test-app")
    scaffold({ projectName: "test-app", framework: "vite", targetDir })

    const viteConfig = fs.readFileSync(path.join(targetDir, "vite.config.ts"), "utf-8")
    expect(viteConfig).toContain('from "@gridland/web/vite-plugin"')
    expect(viteConfig).not.toContain("../../packages/")

    const app = fs.readFileSync(path.join(targetDir, "src/App.tsx"), "utf-8")
    expect(app).toContain('from "@gridland/web"')
    expect(app).toContain('from "@gridland/utils"')
    expect(app).not.toContain("../../../packages/")
  })

  it("has correct dependencies", () => {
    const targetDir = path.join(tmpDir, "test-app")
    scaffold({ projectName: "test-app", framework: "vite", targetDir })

    const pkg = JSON.parse(fs.readFileSync(path.join(targetDir, "package.json"), "utf-8"))
    expect(pkg.dependencies["@gridland/web"]).toBeDefined()
    expect(pkg.dependencies["react"]).toBeDefined()
    expect(pkg.dependencies["react-dom"]).toBeDefined()
    expect(pkg.devDependencies["vite"]).toBeDefined()
    expect(pkg.devDependencies["@vitejs/plugin-react"]).toBeDefined()
    expect(pkg.devDependencies["typescript"]).toBeDefined()
    expect(pkg.dependencies["next"]).toBeUndefined()
  })
})

describe("scaffold next", () => {
  it("produces correct file tree", () => {
    const targetDir = path.join(tmpDir, "test-app")
    scaffold({ projectName: "test-app", framework: "next", targetDir })

    const expected = [
      "package.json",
      "next.config.ts",
      "tsconfig.json",
      "next-env.d.ts",
      "app/layout.tsx",
      "app/page.tsx",
      ".gitignore",
      "gridland-jsx.d.ts",
    ]

    for (const file of expected) {
      expect(fs.existsSync(path.join(targetDir, file))).toBe(true)
    }
  })

  it("has correct imports", () => {
    const targetDir = path.join(tmpDir, "test-app")
    scaffold({ projectName: "test-app", framework: "next", targetDir })

    const nextConfig = fs.readFileSync(path.join(targetDir, "next.config.ts"), "utf-8")
    expect(nextConfig).toContain('from "@gridland/web/next-plugin"')

    const app = fs.readFileSync(path.join(targetDir, "app/gridland-app.tsx"), "utf-8")
    expect(app).toContain('"@gridland/web"')
    expect(app).toContain('"@gridland/utils"')
    expect(app).toContain('"use client"')
  })

  it("has correct dependencies", () => {
    const targetDir = path.join(tmpDir, "test-app")
    scaffold({ projectName: "test-app", framework: "next", targetDir })

    const pkg = JSON.parse(fs.readFileSync(path.join(targetDir, "package.json"), "utf-8"))
    expect(pkg.dependencies["@gridland/web"]).toBeDefined()
    expect(pkg.dependencies["react"]).toBeDefined()
    expect(pkg.dependencies["react-dom"]).toBeDefined()
    expect(pkg.dependencies["next"]).toBeDefined()
    expect(pkg.dependencies["vite"]).toBeUndefined()
    expect(pkg.devDependencies?.["vite"]).toBeUndefined()
  })
})

describe("token replacement", () => {
  it("replaces project name in package.json", () => {
    const targetDir = path.join(tmpDir, "my-cool-app")
    scaffold({ projectName: "my-cool-app", framework: "vite", targetDir })

    const pkg = JSON.parse(fs.readFileSync(path.join(targetDir, "package.json"), "utf-8"))
    expect(pkg.name).toBe("my-cool-app")
  })
})

describe("_gitignore rename", () => {
  it("renames _gitignore to .gitignore", () => {
    const targetDir = path.join(tmpDir, "test-app")
    scaffold({ projectName: "test-app", framework: "vite", targetDir })

    expect(fs.existsSync(path.join(targetDir, ".gitignore"))).toBe(true)
    expect(fs.existsSync(path.join(targetDir, "_gitignore"))).toBe(false)
  })
})

describe("directory handling", () => {
  it("scaffolds into existing empty directory", () => {
    const targetDir = path.join(tmpDir, "existing-dir")
    fs.mkdirSync(targetDir)

    scaffold({ projectName: "existing-dir", framework: "vite", targetDir })
    expect(fs.existsSync(path.join(targetDir, "package.json"))).toBe(true)
  })
})
