import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve, join } from "node:path";
import { fileURLToPath } from "node:url";

export const PKG_DIR = resolve(fileURLToPath(import.meta.url), "../..");

export const CLI_PATH = join(PKG_DIR, "bin/cli.mjs");

export function readPackageFile(relativePath) {
  return readFileSync(join(PKG_DIR, relativePath), "utf-8");
}

export function runCli(args, { env = {} } = {}) {
  const result = spawnSync("bun", ["run", CLI_PATH, ...args], {
    encoding: "utf-8",
    timeout: 10000,
    env: { ...process.env, ...env },
    stdio: ["pipe", "pipe", "pipe"],
  });
  return {
    stdout: result.stdout ?? "",
    stderr: result.stderr ?? "",
    status: result.status,
  };
}
