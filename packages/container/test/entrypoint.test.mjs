import { describe, it, expect } from "bun:test";
import { readPackageFile } from "./helpers.mjs";

const entrypoint = readPackageFile("entrypoint.sh");

describe("entrypoint.sh: structure", () => {
  it("starts with a shebang", () => {
    expect(entrypoint.startsWith("#!/bin/sh")).toBe(true);
  });

  it("uses set -e for error handling", () => {
    expect(entrypoint).toContain("set -e");
  });

  it("requires SOURCE_VALUE environment variable", () => {
    expect(entrypoint).toContain("SOURCE_VALUE");
    expect(entrypoint).toContain("SOURCE_VALUE is required");
  });

  it("defaults SOURCE_TYPE to npm", () => {
    expect(entrypoint).toContain('SOURCE_TYPE="${SOURCE_TYPE:-npm}"');
  });
});

describe("entrypoint.sh: shared run_package function", () => {
  it("defines a run_package function", () => {
    expect(entrypoint).toContain("run_package()");
  });

  it("checks for package.json existence", () => {
    expect(entrypoint).toContain("if [ ! -f package.json ]");
  });

  it("errors when package.json is missing", () => {
    expect(entrypoint).toContain("Error: no package.json found");
  });

  it("resolves entry from bin, main, or index.js", () => {
    expect(entrypoint).toContain("p.bin");
    expect(entrypoint).toContain("p.main");
    expect(entrypoint).toContain("index.js");
  });
});

describe("entrypoint.sh: npm handler", () => {
  it("handles npm source type", () => {
    expect(entrypoint).toContain("npm)");
  });

  it("installs the npm package with bun", () => {
    expect(entrypoint).toContain('bun add "$SOURCE_VALUE"');
  });

  it("creates a minimal package.json instead of bun init", () => {
    expect(entrypoint).toContain("echo '{}' > package.json");
    expect(entrypoint).not.toContain("bun init");
  });

  it("finds and runs the bin executable", () => {
    expect(entrypoint).toContain("bun pm bin");
  });

  it("falls back to bun run if no bin found", () => {
    expect(entrypoint).toContain('bun run "$SOURCE_VALUE"');
  });
});

describe("entrypoint.sh: git handler", () => {
  it("handles git source type", () => {
    expect(entrypoint).toContain("git)");
  });

  it("clones with depth 1 for speed", () => {
    expect(entrypoint).toContain("git clone --depth 1");
  });

  it("installs dependencies after clone", () => {
    const gitSection = entrypoint.split("git)")[1].split(";;")[0];
    expect(gitSection).toContain("bun install");
  });

  it("uses shared run_package function", () => {
    const gitSection = entrypoint.split("git)")[1].split(";;")[0];
    expect(gitSection).toContain("run_package");
  });
});

describe("entrypoint.sh: local handler", () => {
  it("handles local source type", () => {
    expect(entrypoint).toContain("local)");
  });

  it("copies source from mounted path", () => {
    expect(entrypoint).toContain("cp -r /app/source");
  });

  it("installs dependencies for local source", () => {
    const localSection = entrypoint.split("local)")[1].split(";;")[0];
    expect(localSection).toContain("bun install");
  });

  it("uses shared run_package function", () => {
    const localSection = entrypoint.split("local)")[1].split(";;")[0];
    expect(localSection).toContain("run_package");
  });
});

describe("entrypoint.sh: error handling", () => {
  it("handles unknown source types", () => {
    expect(entrypoint).toContain("Unknown source type");
    expect(entrypoint).toContain("exit 1");
  });

  it("uses exec for process replacement", () => {
    const execCount = (entrypoint.match(/\bexec\b/g) || []).length;
    expect(execCount).toBeGreaterThanOrEqual(3);
  });
});
