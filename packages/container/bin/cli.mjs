#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { realpathSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  detectSourceType,
  resolveSourceValue,
  parseArgs,
  buildDockerArgs,
} from "../lib.mjs";

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
let parsed;
try {
  parsed = parseArgs(process.argv.slice(2));
} catch (err) {
  console.error(`Error: ${err.message}`);
  process.exit(1);
}

if (parsed.help) {
  usage();
}

const { source, noNetwork, memory, forceBuild, forwardedArgs } = parsed;

// Check Docker is available
function checkDocker() {
  const result = spawnSync("docker", ["version"], {
    stdio: "ignore",
    timeout: 5000,
  });
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
let sourceValue = resolveSourceValue(source, sourceType);

// Resolve local paths to real absolute paths for Docker volume mounts
if (sourceType === "local") {
  sourceValue = realpathSync(sourceValue);
}

ensureImage();

const dockerArgs = buildDockerArgs({
  sourceType,
  sourceValue,
  noNetwork,
  memory,
  isTTY: process.stdin.isTTY,
  imageName: IMAGE_NAME,
  forwardedArgs,
});

const result = spawnSync("docker", dockerArgs, { stdio: "inherit" });
process.exit(result.status ?? 1);
