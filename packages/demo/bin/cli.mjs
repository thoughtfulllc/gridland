#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const AVAILABLE_DEMOS = JSON.parse(
  readFileSync(join(__dirname, "../dist/demo-names.json"), "utf-8")
);

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

const { runDemo } = await import("../dist/run.js");
await runDemo(name);
