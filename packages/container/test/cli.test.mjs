import { describe, it, expect } from "bun:test";
import { runCli } from "./helpers.mjs";

describe("CLI: help and usage", () => {
  it("shows help with --help", () => {
    const { stdout, status } = runCli(["--help"]);
    expect(stdout).toContain("Usage: gridland-container");
    expect(stdout).toContain("Source types:");
    expect(stdout).toContain("Options:");
    expect(stdout).toContain("--no-network");
    expect(stdout).toContain("--memory");
    expect(stdout).toContain("--build");
    expect(status).toBe(0);
  });

  it("shows help with -h", () => {
    const { stdout, status } = runCli(["-h"]);
    expect(stdout).toContain("Usage: gridland-container");
    expect(status).toBe(0);
  });

  it("exits with error when no arguments provided", () => {
    const { stderr, status } = runCli([]);
    expect(stderr).toContain("<source> is required");
    expect(status).toBe(1);
  });

  it("shows examples in help output", () => {
    const { stdout } = runCli(["--help"]);
    expect(stdout).toContain("Examples:");
    expect(stdout).toContain("chalk-animation");
    expect(stdout).toContain("./my-app");
    expect(stdout).toContain("cjroth/gridland");
  });
});

describe("CLI: argument validation", () => {
  it("exits with error for unknown flags", () => {
    const { stderr, status } = runCli(["my-app", "--foobar"]);
    expect(stderr).toContain("Unknown option: --foobar");
    expect(status).toBe(1);
  });

  it("exits with error when --memory lacks a value", () => {
    const { stderr, status } = runCli(["my-app", "--memory"]);
    expect(stderr).toContain("--memory requires a value");
    expect(status).toBe(1);
  });

  it("exits with error for extra positional args", () => {
    const { stderr, status } = runCli(["app1", "app2"]);
    expect(stderr).toContain("Unexpected argument: app2");
    expect(status).toBe(1);
  });

  it("exits with error when source is missing (flags only)", () => {
    const { stderr, status } = runCli(["--no-network"]);
    expect(stderr).toContain("<source> is required");
    expect(status).toBe(1);
  });
});

describe("CLI: Docker detection", () => {
  it("exits with error when docker is not available", () => {
    const { status } = runCli(["chalk"], {
      env: {
        PATH: "/usr/local/bin:/usr/bin:/bin",
        DOCKER_HOST: "tcp://127.0.0.1:1",
      },
    });
    expect(status).not.toBe(0);
  });
});
