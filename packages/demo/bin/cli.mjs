#!/usr/bin/env node
import { execSync, spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const AVAILABLE_DEMOS = [
  "gradient", "ascii", "table", "spinner", "select-input",
  "multi-select", "text-input", "link", "tab-bar", "status-bar",
  "modal", "primitives", "chat", "terminal", "landing",
];

const name = process.argv[2];

if (!name || name === "--help" || name === "-h") {
  console.log("Usage: gridland-demo <demo-name>\n");
  console.log("Available demos:");
  for (const d of AVAILABLE_DEMOS) {
    console.log(`  ${d}`);
  }
  console.log("\nExamples:");
  console.log("  npx @gridland/demo ascii");
  console.log("  bunx @gridland/demo gradient");
  process.exit(name ? 0 : 1);
}

if (!AVAILABLE_DEMOS.includes(name)) {
  console.error(`Unknown demo: "${name}"`);
  console.error(`Available: ${AVAILABLE_DEMOS.join(", ")}`);
  process.exit(1);
}

function hasBun() {
  try {
    execSync("bun --version", { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

const useBun = hasBun();

const workDir = mkdtempSync(join(tmpdir(), "gridland-demo-"));

function cleanup() {
  try {
    rmSync(workDir, { recursive: true, force: true });
  } catch {}
}
process.on("exit", cleanup);
process.on("SIGINT", () => { cleanup(); process.exit(130); });
process.on("SIGTERM", () => { cleanup(); process.exit(143); });

console.log("Setting up demo...");

try {
  execSync(`git clone --depth 1 -q https://github.com/cjroth/gridland.git "${workDir}/gridland"`, {
    stdio: "inherit",
  });

  const repoDir = join(workDir, "gridland");

  // Trim workspaces to only what demos need — avoids installing heavy deps
  // like Next.js that fail in Alpine/musl containers (@next/swc-linux-arm64-gnu)
  const pkgPath = join(repoDir, "package.json");
  const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
  pkg.workspaces = ["packages/web", "packages/ui", "packages/testing"];
  writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n");

  if (useBun) {
    execSync("bun install", { cwd: repoDir, stdio: ["ignore", "ignore", "inherit"] });
  } else {
    execSync("npm install", { cwd: repoDir, stdio: ["ignore", "ignore", "inherit"] });
  }

  console.log(`Running ${name} demo...`);

  const demoScript = join("packages", "ui", "scripts", "demo.tsx");

  if (useBun) {
    spawnSync("bun", ["run", "--tsconfig-override", "packages/ui/tsconfig.json", demoScript, name], {
      cwd: repoDir,
      stdio: "inherit",
    });
  } else {
    spawnSync("npx", ["tsx", "--tsconfig", "packages/ui/tsconfig.json", demoScript, name], {
      cwd: repoDir,
      stdio: "inherit",
    });
  }
} catch (err) {
  console.error("Failed to run demo:", err.message);
  process.exit(1);
}
