#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { existsSync, realpathSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const IMAGE_NAME = "ghcr.io/cjroth/gridland-container:latest";

function usage() {
  console.log(`Usage: gridland-container <source> [options] [-- <args...>]

Run CLI/TUI apps inside hardened Docker containers.

Source types:
  ./path or /path       Local directory (mounted read-only)
  owner/repo            GitHub shorthand
  https://...           Git URL
  package-name          npm package

Options:
  --no-network          Disable network access inside container
  --memory <limit>      Memory limit (default: 512m)
  --build               Force local Docker image build
  -h, --help            Show this help

Examples:
  gridland-container chalk-animation
  gridland-container ./my-app
  gridland-container cjroth/gridland -- gradient
  gridland-container some-tui --no-network`);
  process.exit(0);
}

// Parse arguments
const args = process.argv.slice(2);

if (args.length === 0 || args[0] === "-h" || args[0] === "--help") {
  usage();
}

let source = null;
let noNetwork = false;
let memory = "512m";
let forceBuild = false;
let forwardedArgs = [];

let i = 0;
while (i < args.length) {
  const arg = args[i];
  if (arg === "--") {
    forwardedArgs = args.slice(i + 1);
    break;
  } else if (arg === "--no-network") {
    noNetwork = true;
  } else if (arg === "--memory") {
    i++;
    memory = args[i];
    if (!memory) {
      console.error("Error: --memory requires a value");
      process.exit(1);
    }
  } else if (arg === "--build") {
    forceBuild = true;
  } else if (arg.startsWith("-")) {
    console.error(`Unknown option: ${arg}`);
    process.exit(1);
  } else if (!source) {
    source = arg;
  } else {
    console.error(`Unexpected argument: ${arg}`);
    process.exit(1);
  }
  i++;
}

if (!source) {
  console.error("Error: <source> is required\n");
  usage();
}

// Detect source type
function detectSourceType(src) {
  // Local path: starts with . or / or exists on filesystem
  if (src.startsWith(".") || src.startsWith("/") || existsSync(src)) {
    return "local";
  }
  // Git URL: contains :// or ends with .git or matches owner/repo
  if (src.includes("://") || src.endsWith(".git")) {
    return "git";
  }
  if (/^[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+$/.test(src)) {
    return "git";
  }
  // Otherwise: npm package
  return "npm";
}

function resolveSourceValue(src, type) {
  if (type === "local") {
    return resolve(src);
  }
  if (type === "git") {
    if (src.includes("://") || src.endsWith(".git")) {
      return src;
    }
    // owner/repo shorthand
    return `https://github.com/${src}`;
  }
  return src;
}

// Check Docker is available
function checkDocker() {
  const result = spawnSync("docker", ["info"], { stdio: "ignore" });
  if (result.status !== 0) {
    console.error("Error: Docker is not installed or not running.");
    console.error("Install Docker from https://docs.docker.com/get-docker/");
    process.exit(1);
  }
}

// Ensure image is available
function ensureImage() {
  if (forceBuild) {
    buildImage();
    return;
  }

  console.log(`Pulling ${IMAGE_NAME}...`);
  const pull = spawnSync("docker", ["pull", IMAGE_NAME], { stdio: "inherit" });
  if (pull.status !== 0) {
    console.log("Pull failed, building locally...");
    buildImage();
  }
}

function buildImage() {
  const pkgDir = resolve(fileURLToPath(import.meta.url), "../..");
  console.log("Building container image...");
  const build = spawnSync("docker", ["build", "-t", IMAGE_NAME, pkgDir], {
    stdio: "inherit",
  });
  if (build.status !== 0) {
    console.error("Error: Docker build failed");
    process.exit(1);
  }
}

// Main
checkDocker();

const sourceType = detectSourceType(source);
const sourceValue = resolveSourceValue(source, sourceType);

ensureImage();

// Construct docker run command
const dockerArgs = [
  "run", "--rm",
  "--cap-drop=ALL",
  "--security-opt=no-new-privileges",
  "--read-only",
  "--tmpfs", "/tmp:rw,noexec,nosuid,size=256m",
  "--memory", memory,
  "--pids-limit", "256",
  "-e", `SOURCE_TYPE=${sourceType}`,
  "-e", `SOURCE_VALUE=${sourceValue}`,
  "-e", "BUN_INSTALL_CACHE_DIR=/tmp/.bun-cache",
];

// TTY handling
if (process.stdin.isTTY) {
  dockerArgs.push("-it");
} else {
  dockerArgs.push("-i");
}

if (noNetwork) {
  dockerArgs.push("--network", "none");
}

if (sourceType === "local") {
  const absPath = realpathSync(resolve(sourceValue));
  dockerArgs.push("-v", `${absPath}:/app/source:ro`);
}

dockerArgs.push(IMAGE_NAME);

// Forward args after --
if (forwardedArgs.length > 0) {
  dockerArgs.push(...forwardedArgs);
}

const result = spawnSync("docker", dockerArgs, { stdio: "inherit" });
process.exit(result.status ?? 1);
