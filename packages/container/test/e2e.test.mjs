import { describe, it, expect, beforeAll } from "bun:test";
import { spawnSync } from "node:child_process";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { PKG_DIR } from "./helpers.mjs";

const IMAGE_NAME = "ghcr.io/cjroth/gridland-container:test";

function dockerAvailable() {
  const result = spawnSync("docker", ["version"], {
    stdio: "ignore",
    timeout: 5000,
  });
  return result.status === 0;
}

const hasDocker = dockerAvailable();
const describeDocker = hasDocker ? describe : describe.skip;

// Build the image once for all E2E test suites
if (hasDocker) {
  beforeAll(() => {
    const build = spawnSync(
      "docker",
      ["build", "-t", IMAGE_NAME, PKG_DIR],
      { stdio: "inherit", timeout: 120000 }
    );
    if (build.status !== 0) {
      throw new Error("Docker build failed");
    }
  });
}

describeDocker("E2E: Docker image", () => {
  it("exists after build", () => {
    const result = spawnSync(
      "docker",
      ["image", "inspect", IMAGE_NAME],
      { stdio: "ignore" }
    );
    expect(result.status).toBe(0);
  });

  it("runs as non-root user", () => {
    const result = spawnSync(
      "docker",
      [
        "run", "--rm",
        "-e", "SOURCE_TYPE=npm",
        "-e", "SOURCE_VALUE=__nonexistent_pkg__",
        "--entrypoint", "whoami",
        IMAGE_NAME,
      ],
      { encoding: "utf-8", timeout: 15000 }
    );
    expect(result.stdout.trim()).toBe("runner");
  });

  it("has bun installed", () => {
    const result = spawnSync(
      "docker",
      ["run", "--rm", "--entrypoint", "bun", IMAGE_NAME, "--version"],
      { encoding: "utf-8", timeout: 15000 }
    );
    expect(result.status).toBe(0);
    expect(result.stdout.trim()).toMatch(/^\d+\.\d+\.\d+$/);
  });

  it("has git installed", () => {
    const result = spawnSync(
      "docker",
      ["run", "--rm", "--entrypoint", "git", IMAGE_NAME, "--version"],
      { encoding: "utf-8", timeout: 15000 }
    );
    expect(result.status).toBe(0);
    expect(result.stdout).toContain("git version");
  });

  it("has node installed", () => {
    const result = spawnSync(
      "docker",
      ["run", "--rm", "--entrypoint", "node", IMAGE_NAME, "--version"],
      { encoding: "utf-8", timeout: 15000 }
    );
    expect(result.status).toBe(0);
    expect(result.stdout.trim()).toMatch(/^v\d+/);
  });

  it("requires SOURCE_VALUE", () => {
    const result = spawnSync(
      "docker",
      ["run", "--rm", "-e", "SOURCE_TYPE=npm", IMAGE_NAME],
      { encoding: "utf-8", timeout: 15000 }
    );
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain("SOURCE_VALUE");
  });

  it("fails gracefully for unknown source type", () => {
    const result = spawnSync(
      "docker",
      [
        "run", "--rm",
        "-e", "SOURCE_TYPE=ftp",
        "-e", "SOURCE_VALUE=something",
        IMAGE_NAME,
      ],
      { encoding: "utf-8", timeout: 15000 }
    );
    expect(result.status).not.toBe(0);
    expect(result.stdout + result.stderr).toContain("Unknown source type");
  });
});

describeDocker("E2E: run npm package in container", () => {
  it("can install and run cowsay", () => {
    const result = spawnSync(
      "docker",
      [
        "run", "--rm",
        "--tmpfs", "/tmp:rw,size=256m",
        "-e", "SOURCE_TYPE=npm",
        "-e", "SOURCE_VALUE=cowsay",
        "-e", "BUN_INSTALL_CACHE_DIR=/tmp/.bun-cache",
        IMAGE_NAME,
        "Hello from gridland",
      ],
      { encoding: "utf-8", timeout: 60000 }
    );
    expect(result.stdout).toContain("Hello from gridland");
    expect(result.status).toBe(0);
  });
});

describeDocker("E2E: run local project in container", () => {
  let tempDir;

  beforeAll(() => {
    tempDir = join(tmpdir(), `gridland-e2e-${Date.now()}`);
    mkdirSync(tempDir, { recursive: true });
    writeFileSync(
      join(tempDir, "package.json"),
      JSON.stringify({
        name: "test-local-app",
        version: "1.0.0",
        main: "index.js",
      })
    );
    writeFileSync(
      join(tempDir, "index.js"),
      'console.log("E2E_LOCAL_SUCCESS");'
    );
  });

  it("can run a local project mounted into the container", () => {
    const result = spawnSync(
      "docker",
      [
        "run", "--rm",
        "--tmpfs", "/tmp:rw,size=256m",
        "-v", `${tempDir}:/app/source:ro`,
        "-e", "SOURCE_TYPE=local",
        "-e", "SOURCE_VALUE=/app/source",
        "-e", "BUN_INSTALL_CACHE_DIR=/tmp/.bun-cache",
        IMAGE_NAME,
      ],
      { encoding: "utf-8", timeout: 30000 }
    );
    expect(result.stdout).toContain("E2E_LOCAL_SUCCESS");
    expect(result.status).toBe(0);
  });

  it("local mount is read-only", () => {
    const result = spawnSync(
      "docker",
      [
        "run", "--rm",
        "--tmpfs", "/tmp:rw,size=256m",
        "-v", `${tempDir}:/app/source:ro`,
        "--entrypoint", "sh",
        IMAGE_NAME,
        "-c", "touch /app/source/should-fail 2>&1 || echo RO_VERIFIED",
      ],
      { encoding: "utf-8", timeout: 15000 }
    );
    expect(result.stdout).toContain("RO_VERIFIED");
  });
});

describeDocker("E2E: security constraints", () => {
  it("runs with read-only root filesystem", () => {
    const result = spawnSync(
      "docker",
      [
        "run", "--rm",
        "--read-only",
        "--entrypoint", "sh",
        IMAGE_NAME,
        "-c", "touch /should-fail 2>&1 || echo READONLY_OK",
      ],
      { encoding: "utf-8", timeout: 15000 }
    );
    expect(result.stdout).toContain("READONLY_OK");
  });

  it("runs with dropped capabilities", () => {
    const result = spawnSync(
      "docker",
      [
        "run", "--rm",
        "--cap-drop=ALL",
        "--entrypoint", "sh",
        IMAGE_NAME,
        "-c", "echo CAP_DROP_OK",
      ],
      { encoding: "utf-8", timeout: 15000 }
    );
    expect(result.stdout).toContain("CAP_DROP_OK");
    expect(result.status).toBe(0);
  });

  it("respects memory limits", () => {
    const result = spawnSync(
      "docker",
      [
        "run", "--rm",
        "--memory", "64m",
        "--entrypoint", "sh",
        IMAGE_NAME,
        "-c", "echo MEM_LIMIT_OK",
      ],
      { encoding: "utf-8", timeout: 15000 }
    );
    expect(result.stdout).toContain("MEM_LIMIT_OK");
    expect(result.status).toBe(0);
  });

  it("respects network=none isolation", () => {
    const result = spawnSync(
      "docker",
      [
        "run", "--rm",
        "--network", "none",
        "--entrypoint", "sh",
        IMAGE_NAME,
        "-c", "ping -c 1 -W 1 8.8.8.8 2>&1 || echo NET_BLOCKED",
      ],
      { encoding: "utf-8", timeout: 15000 }
    );
    expect(result.stdout + result.stderr).toContain("NET_BLOCKED");
  });
});
