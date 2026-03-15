import { describe, it, expect } from "bun:test";
import { resolve } from "node:path";
import {
  detectSourceType,
  resolveSourceValue,
  parseArgs,
  buildDockerArgs,
} from "../lib.mjs";

// --- detectSourceType ---

describe("detectSourceType", () => {
  it("detects relative paths starting with ./", () => {
    expect(detectSourceType("./my-app")).toBe("local");
    expect(detectSourceType("./foo/bar")).toBe("local");
    expect(detectSourceType(".")).toBe("local");
    expect(detectSourceType("./")).toBe("local");
  });

  it("detects absolute paths starting with /", () => {
    expect(detectSourceType("/usr/local/app")).toBe("local");
    expect(detectSourceType("/tmp/demo")).toBe("local");
  });

  it("detects HTTPS git URLs", () => {
    expect(detectSourceType("https://github.com/user/repo")).toBe("git");
    expect(detectSourceType("https://gitlab.com/user/repo")).toBe("git");
  });

  it("detects SSH git URLs", () => {
    expect(detectSourceType("git://github.com/user/repo")).toBe("git");
  });

  it("detects .git suffix URLs", () => {
    expect(detectSourceType("user/repo.git")).toBe("git");
    expect(detectSourceType("some-host/project.git")).toBe("git");
  });

  it("detects owner/repo GitHub shorthand", () => {
    expect(detectSourceType("cjroth/gridland")).toBe("git");
    expect(detectSourceType("facebook/react")).toBe("git");
    expect(detectSourceType("user-name/repo.js")).toBe("git");
    expect(detectSourceType("org_name/my-app")).toBe("git");
  });

  it("detects npm packages (simple names)", () => {
    expect(detectSourceType("chalk")).toBe("npm");
    expect(detectSourceType("chalk-animation")).toBe("npm");
    expect(detectSourceType("my-cool-tui")).toBe("npm");
  });

  it("detects scoped npm packages", () => {
    expect(detectSourceType("@gridland/demo")).toBe("npm");
    expect(detectSourceType("@types/node")).toBe("npm");
  });

  it("does not confuse deeply nested paths with owner/repo", () => {
    expect(detectSourceType("a/b/c")).toBe("npm");
  });
});

// --- resolveSourceValue ---

describe("resolveSourceValue", () => {
  it("resolves local paths to absolute", () => {
    const result = resolveSourceValue("./my-app", "local");
    expect(result).toBe(resolve("./my-app"));
    expect(result.startsWith("/")).toBe(true);
  });

  it("passes through full git URLs", () => {
    const url = "https://github.com/cjroth/gridland";
    expect(resolveSourceValue(url, "git")).toBe(url);
  });

  it("passes through .git URLs", () => {
    const url = "git@github.com:cjroth/gridland.git";
    expect(resolveSourceValue(url, "git")).toBe(url);
  });

  it("expands owner/repo shorthand to GitHub URL", () => {
    expect(resolveSourceValue("cjroth/gridland", "git")).toBe(
      "https://github.com/cjroth/gridland"
    );
    expect(resolveSourceValue("facebook/react", "git")).toBe(
      "https://github.com/facebook/react"
    );
  });

  it("passes through npm package names unchanged", () => {
    expect(resolveSourceValue("chalk", "npm")).toBe("chalk");
    expect(resolveSourceValue("@gridland/demo", "npm")).toBe("@gridland/demo");
  });
});

// --- parseArgs ---

describe("parseArgs", () => {
  it("parses a bare source argument", () => {
    const result = parseArgs(["chalk"]);
    expect(result).toEqual({
      source: "chalk",
      noNetwork: false,
      memory: "512m",
      forceBuild: false,
      forwardedArgs: [],
    });
  });

  it("parses --no-network flag", () => {
    const result = parseArgs(["my-app", "--no-network"]);
    expect(result.noNetwork).toBe(true);
    expect(result.source).toBe("my-app");
  });

  it("parses --memory option", () => {
    const result = parseArgs(["my-app", "--memory", "1g"]);
    expect(result.memory).toBe("1g");
  });

  it("parses --build flag", () => {
    const result = parseArgs(["my-app", "--build"]);
    expect(result.forceBuild).toBe(true);
  });

  it("returns help flag for -h", () => {
    expect(parseArgs(["-h"])).toEqual({ help: true });
  });

  it("returns help flag for --help", () => {
    expect(parseArgs(["--help"])).toEqual({ help: true });
  });

  it("captures forwarded args after --", () => {
    const result = parseArgs(["my-app", "--", "gradient", "--speed", "fast"]);
    expect(result.source).toBe("my-app");
    expect(result.forwardedArgs).toEqual(["gradient", "--speed", "fast"]);
  });

  it("handles flags before source", () => {
    const result = parseArgs(["--no-network", "my-app"]);
    expect(result.source).toBe("my-app");
    expect(result.noNetwork).toBe(true);
  });

  it("handles all options combined", () => {
    const result = parseArgs([
      "--no-network",
      "--memory",
      "2g",
      "--build",
      "cjroth/gridland",
      "--",
      "arg1",
      "arg2",
    ]);
    expect(result).toEqual({
      source: "cjroth/gridland",
      noNetwork: true,
      memory: "2g",
      forceBuild: true,
      forwardedArgs: ["arg1", "arg2"],
    });
  });

  it("throws when no source is provided", () => {
    expect(() => parseArgs([])).toThrow("<source> is required");
  });

  it("throws on unknown option", () => {
    expect(() => parseArgs(["my-app", "--verbose"])).toThrow(
      "Unknown option: --verbose"
    );
  });

  it("throws when --memory has no value", () => {
    expect(() => parseArgs(["my-app", "--memory"])).toThrow(
      "--memory requires a value"
    );
  });

  it("throws on extra positional arguments", () => {
    expect(() => parseArgs(["my-app", "extra"])).toThrow(
      "Unexpected argument: extra"
    );
  });

  it("handles -- with no forwarded args", () => {
    const result = parseArgs(["my-app", "--"]);
    expect(result.forwardedArgs).toEqual([]);
  });
});

// --- buildDockerArgs ---

describe("buildDockerArgs", () => {
  const baseOpts = {
    sourceType: "npm",
    sourceValue: "chalk",
    noNetwork: false,
    memory: "512m",
    isTTY: false,
    imageName: "ghcr.io/test/image:latest",
    forwardedArgs: [],
  };

  it("includes security hardening flags", () => {
    const args = buildDockerArgs(baseOpts);
    expect(args).toContain("--cap-drop=ALL");
    expect(args).toContain("--security-opt=no-new-privileges");
    expect(args).toContain("--read-only");
  });

  it("includes tmpfs for /tmp", () => {
    const args = buildDockerArgs(baseOpts);
    const tmpfsIdx = args.indexOf("--tmpfs");
    expect(tmpfsIdx).not.toBe(-1);
    expect(args[tmpfsIdx + 1]).toBe("/tmp:rw,exec,nosuid,size=256m");
  });

  it("includes memory limit", () => {
    const args = buildDockerArgs(baseOpts);
    const memIdx = args.indexOf("--memory");
    expect(memIdx).not.toBe(-1);
    expect(args[memIdx + 1]).toBe("512m");
  });

  it("uses custom memory limit", () => {
    const args = buildDockerArgs({ ...baseOpts, memory: "2g" });
    const memIdx = args.indexOf("--memory");
    expect(args[memIdx + 1]).toBe("2g");
  });

  it("includes PID limit", () => {
    const args = buildDockerArgs(baseOpts);
    const pidIdx = args.indexOf("--pids-limit");
    expect(pidIdx).not.toBe(-1);
    expect(args[pidIdx + 1]).toBe("256");
  });

  it("passes SOURCE_TYPE and SOURCE_VALUE as env vars", () => {
    const args = buildDockerArgs(baseOpts);
    expect(args).toContain("SOURCE_TYPE=npm");
    expect(args).toContain("SOURCE_VALUE=chalk");
  });

  it("sets BUN_INSTALL_CACHE_DIR env var", () => {
    const args = buildDockerArgs(baseOpts);
    expect(args).toContain("BUN_INSTALL_CACHE_DIR=/tmp/.bun-cache");
  });

  it("uses -i without TTY", () => {
    const args = buildDockerArgs({ ...baseOpts, isTTY: false });
    expect(args).toContain("-i");
    expect(args).not.toContain("-it");
  });

  it("uses -it with TTY", () => {
    const args = buildDockerArgs({ ...baseOpts, isTTY: true });
    expect(args).toContain("-it");
  });

  it("does not include --network when noNetwork is false", () => {
    const args = buildDockerArgs({ ...baseOpts, noNetwork: false });
    expect(args).not.toContain("--network");
  });

  it("includes --network none when noNetwork is true", () => {
    const args = buildDockerArgs({ ...baseOpts, noNetwork: true });
    const netIdx = args.indexOf("--network");
    expect(netIdx).not.toBe(-1);
    expect(args[netIdx + 1]).toBe("none");
  });

  it("does not mount volume for non-local sources", () => {
    const args = buildDockerArgs(baseOpts);
    expect(args).not.toContain("-v");
  });

  it("mounts volume read-only for local sources", () => {
    const args = buildDockerArgs({
      ...baseOpts,
      sourceType: "local",
      sourceValue: "/tmp/my-app",
    });
    expect(args).toContain("-v");
    const vIdx = args.indexOf("-v");
    expect(args[vIdx + 1]).toBe("/tmp/my-app:/app/source:ro");
  });

  it("places image name at the end before forwarded args", () => {
    const args = buildDockerArgs(baseOpts);
    const imageIdx = args.indexOf("ghcr.io/test/image:latest");
    expect(imageIdx).toBe(args.length - 1);
  });

  it("appends forwarded args after image name", () => {
    const args = buildDockerArgs({
      ...baseOpts,
      forwardedArgs: ["gradient", "--speed", "fast"],
    });
    const imageIdx = args.indexOf("ghcr.io/test/image:latest");
    expect(args[imageIdx + 1]).toBe("gradient");
    expect(args[imageIdx + 2]).toBe("--speed");
    expect(args[imageIdx + 3]).toBe("fast");
  });

  it("starts with run --rm", () => {
    const args = buildDockerArgs(baseOpts);
    expect(args[0]).toBe("run");
    expect(args[1]).toBe("--rm");
  });

  it("handles git source type env vars", () => {
    const args = buildDockerArgs({
      ...baseOpts,
      sourceType: "git",
      sourceValue: "https://github.com/cjroth/gridland",
    });
    expect(args).toContain("SOURCE_TYPE=git");
    expect(args).toContain(
      "SOURCE_VALUE=https://github.com/cjroth/gridland"
    );
  });
});
