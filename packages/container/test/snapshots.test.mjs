import { describe, it, expect } from "bun:test";
import {
  detectSourceType,
  resolveSourceValue,
  buildDockerArgs,
} from "../lib.mjs";
import { runCli, readPackageFile } from "./helpers.mjs";

describe("Snapshots: CLI help output", () => {
  it("matches help text snapshot", () => {
    const { stdout } = runCli(["--help"]);
    expect(stdout).toMatchSnapshot();
  });
});

describe("Snapshots: Docker args for npm source", () => {
  it("matches docker args snapshot for npm package", () => {
    const args = buildDockerArgs({
      sourceType: "npm",
      sourceValue: "chalk-animation",
      noNetwork: false,
      memory: "512m",
      isTTY: false,
      imageName: "ghcr.io/cjroth/gridland-container:latest",
      forwardedArgs: [],
    });
    expect(args).toMatchSnapshot();
  });
});

describe("Snapshots: Docker args for git source", () => {
  it("matches docker args snapshot for git repo", () => {
    const args = buildDockerArgs({
      sourceType: "git",
      sourceValue: "https://github.com/cjroth/gridland",
      noNetwork: false,
      memory: "512m",
      isTTY: true,
      imageName: "ghcr.io/cjroth/gridland-container:latest",
      forwardedArgs: ["--demo", "gradient"],
    });
    expect(args).toMatchSnapshot();
  });
});

describe("Snapshots: Docker args for local source with all flags", () => {
  it("matches docker args snapshot for locked-down local run", () => {
    const args = buildDockerArgs({
      sourceType: "local",
      sourceValue: "/home/user/my-app",
      noNetwork: true,
      memory: "256m",
      isTTY: true,
      imageName: "ghcr.io/cjroth/gridland-container:latest",
      forwardedArgs: [],
    });
    expect(args).toMatchSnapshot();
  });
});

describe("Snapshots: source detection matrix", () => {
  const cases = [
    ["chalk", "npm"],
    ["chalk-animation", "npm"],
    ["@gridland/demo", "npm"],
    ["./my-app", "local"],
    ["../other", "local"],
    ["/usr/local/app", "local"],
    ["cjroth/gridland", "git"],
    ["facebook/react", "git"],
    ["https://github.com/user/repo", "git"],
    ["git://github.com/user/repo", "git"],
    ["user/repo.git", "git"],
  ];

  it("matches source detection snapshot", () => {
    const results = cases.map(([input, expected]) => ({
      input,
      detected: detectSourceType(input),
      expected,
    }));
    expect(results).toMatchSnapshot();
  });
});

describe("Snapshots: source resolution matrix", () => {
  it("matches source resolution snapshot", () => {
    const results = [
      { input: "chalk", type: "npm", resolved: resolveSourceValue("chalk", "npm") },
      {
        input: "cjroth/gridland",
        type: "git",
        resolved: resolveSourceValue("cjroth/gridland", "git"),
      },
      {
        input: "https://github.com/user/repo",
        type: "git",
        resolved: resolveSourceValue("https://github.com/user/repo", "git"),
      },
      {
        input: "user/repo.git",
        type: "git",
        resolved: resolveSourceValue("user/repo.git", "git"),
      },
    ];
    expect(results).toMatchSnapshot();
  });
});

describe("Snapshots: Dockerfile content", () => {
  it("matches Dockerfile snapshot", () => {
    expect(readPackageFile("Dockerfile")).toMatchSnapshot();
  });
});

describe("Snapshots: entrypoint.sh content", () => {
  it("matches entrypoint snapshot", () => {
    expect(readPackageFile("entrypoint.sh")).toMatchSnapshot();
  });
});
