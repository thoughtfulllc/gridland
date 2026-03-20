import { describe, it, expect, beforeAll, beforeEach, afterEach } from "bun:test"
import { execSync, spawn, type ChildProcess } from "node:child_process"
import fs from "node:fs"
import net from "node:net"
import path from "node:path"
import os from "node:os"
import { chromium, type Browser } from "@playwright/test"

const CLI_PATH = path.resolve(__dirname, "../dist/index.js")
const MONOREPO_ROOT = path.resolve(__dirname, "../../..")

// Pre-pack local packages as tarballs so e2e tests install real npm-like
// packages (not file: links which cause resolution issues with Vite/Rollup).
let tarballs: Record<string, string> = {}

beforeAll(() => {
  const tarballDir = fs.mkdtempSync(path.join(os.tmpdir(), "gridland-tarballs-"))
  const packages: Record<string, string> = {
    "@gridland/utils": path.join(MONOREPO_ROOT, "packages/utils"),
    "@gridland/bun": path.join(MONOREPO_ROOT, "packages/bun"),
    "@gridland/web": path.join(MONOREPO_ROOT, "packages/web"),
    "@gridland/demo": path.join(MONOREPO_ROOT, "packages/demo"),
  }
  for (const [name, pkgDir] of Object.entries(packages)) {
    const output = execSync(`npm pack --pack-destination ${tarballDir}`, {
      cwd: pkgDir,
      encoding: "utf-8",
      timeout: 30000,
    }).trim()
    // npm pack outputs the filename on the last line
    const filename = output.split("\n").pop()!.trim()
    tarballs[name] = path.join(tarballDir, filename)
  }
})

describe("tarball hygiene", () => {
  // This test validates that published tarballs don't contain workspace:* deps
  // (npm can't resolve them). It only runs when deps have been swapped to real
  // versions (i.e., during the publish flow). In normal dev, workspace:* is
  // expected and the test is skipped.
  const webPkg = fs.readFileSync(path.resolve(MONOREPO_ROOT, "packages/web/package.json"), "utf-8")
  const isPublishReady = !webPkg.includes('"workspace:')
  const testFn = isPublishReady ? it : it.skip

  testFn("no workspace:* in packed package.json files", () => {
    for (const [name, tarball] of Object.entries(tarballs)) {
      const extractDir = fs.mkdtempSync(path.join(os.tmpdir(), "tarball-check-"))
      execSync(`tar xzf ${tarball} -C ${extractDir}`, { timeout: 10000 })
      const pkgJson = fs.readFileSync(path.join(extractDir, "package", "package.json"), "utf-8")
      fs.rmSync(extractDir, { recursive: true, force: true })
      expect(pkgJson).not.toContain("workspace:")
    }
  })
})

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

/**
 * Override @gridland/* dependencies with local tarball paths so e2e tests
 * work without requiring packages to be published to npm first.
 */
function useLocalPackages(projectName: string) {
  const projectDir = path.join(tmpDir, projectName)
  const pkgPath = path.join(projectDir, "package.json")
  const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"))

  for (const [name, tarball] of Object.entries(tarballs)) {
    if (pkg.dependencies?.[name]) {
      pkg.dependencies[name] = `file:${tarball}`
    }
  }

  // Force nested @gridland/* deps (e.g. @gridland/web's dep on @gridland/utils)
  // to use local tarballs instead of pulling from npm registry.
  pkg.overrides = pkg.overrides || {}
  for (const [name, tarball] of Object.entries(tarballs)) {
    pkg.overrides[name] = `file:${tarball}`
  }

  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n")
}

describe("e2e: vite project", () => {
  it("builds successfully", () => {
    runCli("test-vite --framework vite --no-git --no-install")
    useLocalPackages("test-vite")
    runInProject("test-vite", "bun install")
    runInProject("test-vite", "bun run build")

    expect(fs.existsSync(path.join(tmpDir, "test-vite", "dist"))).toBe(true)
  }, 60000)

  it("typescript compiles clean", () => {
    runCli("test-vite-tsc --framework vite --no-git --no-install")
    useLocalPackages("test-vite-tsc")
    runInProject("test-vite-tsc", "bun install")
    runInProject("test-vite-tsc", "npx tsc --noEmit")
  }, 60000)
})

describe("e2e: next project", () => {
  it("builds successfully", () => {
    runCli("test-next --framework next --no-git --no-install")
    useLocalPackages("test-next")
    runInProject("test-next", "bun install")
    runInProject("test-next", "bun run build")

    expect(fs.existsSync(path.join(tmpDir, "test-next", ".next"))).toBe(true)
  }, 60000)

  it("typescript compiles clean", () => {
    runCli("test-next-tsc --framework next --no-git --no-install")
    useLocalPackages("test-next-tsc")
    runInProject("test-next-tsc", "bun install")
    runInProject("test-next-tsc", "npx tsc --noEmit")
  }, 60000)
})

// ── Dev server smoke tests ─────────────────────────────────────────────

function findFreePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = net.createServer()
    server.listen(0, "127.0.0.1", () => {
      const port = (server.address() as net.AddressInfo).port
      server.close(() => resolve(port))
    })
    server.on("error", reject)
  })
}

async function waitForServer(url: string, timeoutMs = 60000): Promise<void> {
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url)
      if (res.ok) return
    } catch {
      // server not ready yet
    }
    await Bun.sleep(500)
  }
  throw new Error(`Server at ${url} did not become ready within ${timeoutMs}ms`)
}

function scaffoldAndInstall(projectName: string, framework: string) {
  runCli(`${projectName} --framework ${framework} --no-git --no-install`)
  useLocalPackages(projectName)
  runInProject(projectName, "bun install")
}

/**
 * Load a URL in a headless browser and collect any console errors.
 * Returns the list of error messages (empty = no errors).
 */
async function collectBrowserErrors(browser: Browser, url: string): Promise<string[]> {
  const context = await browser.newContext()
  const page = await context.newPage()
  const errors: string[] = []

  page.on("console", (msg) => {
    if (msg.type() === "error") {
      const text = msg.text()
      // Ignore React DevTools suggestion and favicon 404
      if (text.includes("Download the React DevTools")) return
      if (text.includes("favicon.ico")) return
      errors.push(text)
    }
  })
  page.on("pageerror", (err) => {
    errors.push(err.message)
  })

  await page.goto(url, { waitUntil: "networkidle" })
  // Give async module init a moment to settle
  await page.waitForTimeout(2000)
  await context.close()
  return errors
}

describe("e2e: vite dev server", () => {
  it("loads without console errors", async () => {
    const port = await findFreePort()
    const projectName = "test-vite-dev"
    scaffoldAndInstall(projectName, "vite")

    const projectDir = path.join(tmpDir, projectName)
    const child = spawn("npx", ["vite", "--port", String(port)], {
      cwd: projectDir,
      stdio: ["ignore", "pipe", "pipe"],
    })

    const browser = await chromium.launch()
    try {
      const url = `http://localhost:${port}`
      await waitForServer(url)

      const errors = await collectBrowserErrors(browser, url)
      expect(errors).toEqual([])
    } finally {
      await browser.close()
      child.kill("SIGTERM")
    }
  }, 90000)
})

describe("e2e: next dev server", () => {
  it("loads without console errors", async () => {
    const port = await findFreePort()
    const projectName = "test-next-dev"
    scaffoldAndInstall(projectName, "next")

    const projectDir = path.join(tmpDir, projectName)
    const child = spawn("npx", ["next", "dev", "--port", String(port)], {
      cwd: projectDir,
      stdio: ["ignore", "pipe", "pipe"],
    })

    const browser = await chromium.launch()
    try {
      const url = `http://localhost:${port}`
      await waitForServer(url, 90000)

      const errors = await collectBrowserErrors(browser, url)
      expect(errors).toEqual([])
    } finally {
      await browser.close()
      child.kill("SIGTERM")
    }
  }, 120000)
})
