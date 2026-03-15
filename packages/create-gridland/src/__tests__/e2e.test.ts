import { describe, it, expect, beforeAll, beforeEach, afterEach } from "bun:test"
import { execSync, spawn, type ChildProcess } from "node:child_process"
import fs from "node:fs"
import net from "node:net"
import path from "node:path"
import os from "node:os"

const CLI_PATH = path.resolve(__dirname, "../../dist/index.js")
const MONOREPO_ROOT = path.resolve(__dirname, "../../../..")

// Pre-pack local packages as tarballs so e2e tests install real npm-like
// packages (not file: links which cause resolution issues with Vite/Rollup).
let tarballs: Record<string, string> = {}

beforeAll(() => {
  const tarballDir = fs.mkdtempSync(path.join(os.tmpdir(), "gridland-tarballs-"))
  const packages: Record<string, string> = {
    "@gridland/core": path.join(MONOREPO_ROOT, "packages/core"),
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

  // Force nested @gridland/* deps (e.g. @gridland/web's dep on @gridland/core)
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

describe("e2e: vite dev server", () => {
  it("starts and serves the page without errors", async () => {
    const port = await findFreePort()
    const projectName = "test-vite-dev"
    scaffoldAndInstall(projectName, "vite")

    const projectDir = path.join(tmpDir, projectName)
    const child = spawn("npx", ["vite", "--port", String(port)], {
      cwd: projectDir,
      stdio: ["ignore", "pipe", "pipe"],
    })

    let stderr = ""
    child.stderr?.on("data", (chunk: Buffer) => { stderr += chunk.toString() })

    try {
      const url = `http://localhost:${port}`
      await waitForServer(url)

      const response = await fetch(url)
      expect(response.ok).toBe(true)

      const html = await response.text()
      expect(html).toContain('<div id="root">')
      expect(html).not.toContain("Internal Server Error")
    } finally {
      child.kill("SIGTERM")
    }
  }, 90000)
})

describe("e2e: next dev server", () => {
  it("starts and serves the page without errors", async () => {
    const port = await findFreePort()
    const projectName = "test-next-dev"
    scaffoldAndInstall(projectName, "next")

    const projectDir = path.join(tmpDir, projectName)
    const child = spawn("npx", ["next", "dev", "--port", String(port)], {
      cwd: projectDir,
      stdio: ["ignore", "pipe", "pipe"],
    })

    let stderr = ""
    child.stderr?.on("data", (chunk: Buffer) => { stderr += chunk.toString() })

    try {
      const url = `http://localhost:${port}`
      await waitForServer(url, 90000)

      const response = await fetch(url)
      expect(response.ok).toBe(true)

      const html = await response.text()
      expect(html).toContain("<html")
      expect(html).not.toContain("Internal Server Error")
      expect(html).not.toContain("Application error")
    } finally {
      child.kill("SIGTERM")
    }
  }, 120000)
})
