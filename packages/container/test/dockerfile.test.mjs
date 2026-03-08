import { describe, it, expect } from "bun:test";
import { readPackageFile } from "./helpers.mjs";

const dockerfile = readPackageFile("Dockerfile");
const lines = dockerfile
  .split("\n")
  .map((l) => l.trim())
  .filter(Boolean);

describe("Dockerfile: base image", () => {
  it("uses bun alpine as base", () => {
    expect(lines[0]).toMatch(/^FROM oven\/bun:\S+-alpine$|^FROM oven\/bun:1-alpine$/);
  });
});

describe("Dockerfile: dependencies", () => {
  it("installs git for cloning repos", () => {
    const installLine = lines.find((l) => l.includes("apk add"));
    expect(installLine).toContain("git");
  });

  it("installs nodejs for broader compatibility", () => {
    const installLine = lines.find((l) => l.includes("apk add"));
    expect(installLine).toContain("nodejs");
  });

  it("does not install npm (unused)", () => {
    const installLine = lines.find((l) => l.includes("apk add"));
    expect(installLine).not.toContain("npm");
  });

  it("uses --no-cache for smaller image", () => {
    const installLine = lines.find((l) => l.includes("apk add"));
    expect(installLine).toContain("--no-cache");
  });
});

describe("Dockerfile: security", () => {
  it("creates a non-root runner user", () => {
    expect(dockerfile).toContain("adduser");
    expect(dockerfile).toContain("runner");
  });

  it("switches to non-root user", () => {
    expect(lines).toContain("USER runner");
  });

  it("USER comes after COPY (entrypoint is owned by root, run as user)", () => {
    const copyIdx = lines.findIndex((l) => l.startsWith("COPY"));
    const userIdx = lines.findIndex((l) => l === "USER runner");
    expect(copyIdx).toBeLessThan(userIdx);
  });
});

describe("Dockerfile: entrypoint", () => {
  it("copies entrypoint script with exec permissions in one layer", () => {
    const copyLine = lines.find(
      (l) => l.startsWith("COPY") && l.includes("entrypoint")
    );
    expect(copyLine).toContain("--chmod=755");
  });

  it("sets entrypoint", () => {
    const entryLine = lines.find((l) => l.startsWith("ENTRYPOINT"));
    expect(entryLine).toContain("entrypoint.sh");
  });
});
