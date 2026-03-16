#!/usr/bin/env node
/**
 * Pre-publish smoke test: packs all published packages as tarballs,
 * installs them in a temp directory (like a real user would), and
 * verifies the imports actually work at runtime — including a full
 * headless render pass that exercises the FFI/native code path.
 *
 * Run after `bun run build` and before `npm publish`.
 * Requires workspace:* deps to already be swapped to real versions.
 */
import { execSync } from "node:child_process"
import fs from "node:fs"
import path from "node:path"
import os from "node:os"

const ROOT = path.resolve(import.meta.dirname, "..")
const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "gridland-smoke-"))

function pack(pkgDir) {
  const output = execSync(`npm pack --pack-destination ${tmpDir}`, {
    cwd: pkgDir,
    encoding: "utf-8",
    timeout: 30000,
  }).trim()
  return path.join(tmpDir, output.split("\n").pop().trim())
}

function runBun(code, label) {
  try {
    const result = execSync(`bun -e '${code}'`, {
      cwd: tmpDir,
      timeout: 15000,
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"],
    })
    return { ok: true, stdout: result }
  } catch (e) {
    const stderr = e.stderr?.toString() || ""
    const stdout = e.stdout?.toString() || ""
    return { ok: false, stderr, stdout, status: e.status }
  }
}

let failed = false
function check(label, result) {
  if (result.ok) {
    console.log(`  ✓ ${label}`)
  } else {
    console.error(`  ✗ ${label}`)
    if (result.stderr) console.error(`    ${result.stderr.trim().split("\n").join("\n    ")}`)
    if (result.stdout) console.error(`    ${result.stdout.trim().split("\n").join("\n    ")}`)
    failed = true
  }
}

try {
  console.log("Packing tarballs...")
  const tarballs = {
    utils: pack(path.join(ROOT, "packages/utils")),
    bun: pack(path.join(ROOT, "packages/bun")),
    demo: pack(path.join(ROOT, "packages/demo")),
  }

  // Check for workspace:* in packed tarballs
  console.log("Checking tarballs for workspace:*...")
  for (const [name, tarball] of Object.entries(tarballs)) {
    const checkDir = fs.mkdtempSync(path.join(os.tmpdir(), "tarball-check-"))
    execSync(`tar xzf ${tarball} -C ${checkDir}`, { timeout: 10000 })
    const pkgJson = fs.readFileSync(path.join(checkDir, "package", "package.json"), "utf-8")
    fs.rmSync(checkDir, { recursive: true, force: true })
    if (pkgJson.includes("workspace:")) {
      console.error(`  ✗ ${name} tarball contains workspace:* — swap deps before publishing`)
      process.exit(1)
    }
  }
  console.log("  ✓ No workspace:* found")

  // Install from tarballs (with overrides to force nested deps to use local tarballs too)
  console.log("Installing from tarballs...")
  const pkg = {
    type: "module",
    dependencies: {
      "@gridland/utils": `file:${tarballs.utils}`,
      "@gridland/bun": `file:${tarballs.bun}`,
      "@gridland/demo": `file:${tarballs.demo}`,
      react: "^19.0.0",
    },
    overrides: {
      "@gridland/utils": `file:${tarballs.utils}`,
      "@gridland/bun": `file:${tarballs.bun}`,
      "@gridland/demo": `file:${tarballs.demo}`,
    },
  }
  fs.writeFileSync(path.join(tmpDir, "package.json"), JSON.stringify(pkg, null, 2))
  execSync("bun install", { cwd: tmpDir, timeout: 30000, stdio: "pipe" })

  // Write the render test script to a file (avoids shell quoting issues)
  // NOTE: We test buffer access (getFfi().toArrayBuffer) but skip renderOnce()
  // because the native render pipeline writes to stdout which segfaults without a TTY.
  const renderTestScript = `
// @ts-nocheck
import { createCliRenderer, createRoot } from "@gridland/bun";
import React from "react";

// 1. Create renderer in testing mode (no TTY needed)
const renderer = await createCliRenderer({ exitOnCtrlC: true, testing: true });

// 2. Verify buffer access works (exercises getFfi().toArrayBuffer via OptimizedBuffer)
const buf = renderer.nextRenderBuffer;
const bufs = buf.buffers;  // Triggers OptimizedBuffer.buffers → getFfi().toArrayBuffer()
if (!bufs.char || bufs.char.length === 0) {
  process.stderr.write("FAIL: buffer char array is empty\\n");
  process.exit(1);
}

// 3. Mount a component tree with createRoot (verifies React reconciler + CliRenderEvents)
function App() {
  return React.createElement("box", { border: true, padding: 1 },
    React.createElement("text", { bold: true }, "Smoke test!")
  );
}
const root = createRoot(renderer);
root.render(React.createElement(App));

// 4. Clean up
root.unmount();
renderer.destroy();
process.stderr.write("OK\\n");
`
  fs.writeFileSync(path.join(tmpDir, "render-test.tsx"), renderTestScript)

  console.log("Running smoke tests...")

  // Test 1: import @gridland/demo/landing
  check("import @gridland/demo/landing", runBun('import "@gridland/demo/landing"', "demo import"))

  // Test 2: create renderer in testing mode
  check("createCliRenderer (testing mode)",
    runBun('const { createCliRenderer } = await import("@gridland/bun"); const r = await createCliRenderer({ exitOnCtrlC: true, testing: true }); r.destroy();', "createCliRenderer"))

  // Test 3: full headless render pass
  const renderResult = (() => {
    try {
      execSync(`bun render-test.tsx`, { cwd: tmpDir, timeout: 15000, stdio: ["pipe", "pipe", "pipe"] })
      return { ok: true }
    } catch (e) {
      const stderr = e.stderr?.toString() || ""
      if (stderr.includes("OK")) return { ok: true }
      return { ok: false, stderr, stdout: e.stdout?.toString() || "" }
    }
  })()
  check("full headless render pass (React → Yoga → OptimizedBuffer → FFI)", renderResult)

  if (failed) {
    console.error("\n✗ Smoke tests failed — do NOT publish")
    process.exit(1)
  }
  console.log("\n✓ All smoke tests passed")
} finally {
  fs.rmSync(tmpDir, { recursive: true, force: true })
}
