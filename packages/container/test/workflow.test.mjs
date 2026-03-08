import { describe, it, expect } from "bun:test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "yaml";

const WORKFLOW_PATH = resolve(
  fileURLToPath(import.meta.url),
  "../../../../.github/workflows/container.yml"
);

let workflow;
let raw;

try {
  raw = readFileSync(WORKFLOW_PATH, "utf-8");
  workflow = parse(raw);
} catch {
  workflow = null;
  raw = "";
}

describe("CI workflow: structure", () => {
  it("workflow file exists and parses as valid YAML", () => {
    expect(workflow).not.toBeNull();
  });

  it("has a descriptive name", () => {
    expect(workflow.name).toBeTruthy();
  });
});

describe("CI workflow: triggers", () => {
  it("triggers on push to main", () => {
    expect(workflow.on.push.branches).toContain("main");
  });

  it("triggers on pull requests to main", () => {
    expect(workflow.on.pull_request.branches).toContain("main");
  });

  it("only triggers on container package changes", () => {
    expect(workflow.on.push.paths).toContain("packages/container/**");
    expect(workflow.on.pull_request.paths).toContain("packages/container/**");
  });

  it("supports manual dispatch", () => {
    expect(workflow.on).toHaveProperty("workflow_dispatch");
  });
});

describe("CI workflow: registry config", () => {
  it("uses GHCR registry", () => {
    expect(workflow.env.REGISTRY).toBe("ghcr.io");
  });

  it("has correct image name", () => {
    expect(workflow.env.IMAGE_NAME).toContain("gridland-container");
  });
});

describe("CI workflow: job config", () => {
  const job = workflow?.jobs?.["build-and-push"];

  it("has a build-and-push job", () => {
    expect(job).toBeTruthy();
  });

  it("runs on ubuntu-latest", () => {
    expect(job["runs-on"]).toBe("ubuntu-latest");
  });

  it("has contents:read permission", () => {
    expect(job.permissions.contents).toBe("read");
  });

  it("has packages:write permission for GHCR", () => {
    expect(job.permissions.packages).toBe("write");
  });
});

describe("CI workflow: build steps", () => {
  const steps = workflow?.jobs?.["build-and-push"]?.steps ?? [];
  const stepNames = steps.map((s) => s.name ?? s.uses ?? "").join("|");

  it("checks out code", () => {
    expect(steps.some((s) => s.uses?.includes("checkout"))).toBe(true);
  });

  it("logs into GHCR", () => {
    expect(steps.some((s) => s.uses?.includes("login-action"))).toBe(true);
  });

  it("uses GITHUB_TOKEN for auth (not a custom secret)", () => {
    const loginStep = steps.find((s) => s.uses?.includes("login-action"));
    expect(loginStep.with.password).toContain("GITHUB_TOKEN");
  });

  it("extracts metadata for tags", () => {
    expect(steps.some((s) => s.uses?.includes("metadata-action"))).toBe(true);
  });

  it("builds and pushes the image", () => {
    expect(steps.some((s) => s.uses?.includes("build-push-action"))).toBe(
      true
    );
  });

  it("only pushes on non-PR events", () => {
    const buildStep = steps.find((s) =>
      s.uses?.includes("build-push-action")
    );
    expect(buildStep.with.push).toContain("pull_request");
  });

  it("uses packages/container as build context", () => {
    const buildStep = steps.find((s) =>
      s.uses?.includes("build-push-action")
    );
    expect(buildStep.with.context).toBe("packages/container");
  });
});
