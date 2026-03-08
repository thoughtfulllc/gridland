import { resolve } from "node:path";

const OWNER_REPO_RE = /^[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+$/;

/**
 * Detect whether a source string is a local path, git URL, or npm package.
 */
export function detectSourceType(src) {
  if (src.startsWith(".") || src.startsWith("/")) {
    return "local";
  }
  if (src.includes("://") || src.endsWith(".git")) {
    return "git";
  }
  if (OWNER_REPO_RE.test(src)) {
    return "git";
  }
  return "npm";
}

/**
 * Resolve a source string to a usable value (full URL, absolute path, or package name).
 */
export function resolveSourceValue(src, type) {
  if (type === "local") {
    return resolve(src);
  }
  if (type === "git" && !src.includes("://") && !src.endsWith(".git")) {
    return `https://github.com/${src}`;
  }
  return src;
}

/**
 * Parse CLI arguments into a structured options object.
 * Returns { source, noNetwork, memory, forceBuild, forwardedArgs } or throws.
 */
export function parseArgs(args) {
  let source = null;
  let noNetwork = false;
  let memory = "512m";
  let forceBuild = false;
  let forwardedArgs = [];

  let i = 0;
  while (i < args.length) {
    const arg = args[i];
    if (arg === "--") {
      forwardedArgs = args.slice(i + 1);
      break;
    } else if (arg === "--no-network") {
      noNetwork = true;
    } else if (arg === "--memory") {
      i++;
      memory = args[i];
      if (!memory) {
        throw new Error("--memory requires a value");
      }
    } else if (arg === "--build") {
      forceBuild = true;
    } else if (arg === "-h" || arg === "--help") {
      return { help: true };
    } else if (arg.startsWith("-")) {
      throw new Error(`Unknown option: ${arg}`);
    } else if (!source) {
      source = arg;
    } else {
      throw new Error(`Unexpected argument: ${arg}`);
    }
    i++;
  }

  if (!source) {
    throw new Error("<source> is required");
  }

  return { source, noNetwork, memory, forceBuild, forwardedArgs };
}

/**
 * Build the docker run argument list (everything after `docker`).
 */
export function buildDockerArgs({
  sourceType,
  sourceValue,
  noNetwork,
  memory,
  isTTY,
  imageName,
  forwardedArgs,
}) {
  const dockerArgs = [
    "run",
    "--rm",
    "--cap-drop=ALL",
    "--security-opt=no-new-privileges",
    "--read-only",
    "--tmpfs",
    "/tmp:rw,nosuid,size=256m",
    "--memory",
    memory,
    "--pids-limit",
    "256",
    "-e",
    `SOURCE_TYPE=${sourceType}`,
    "-e",
    `SOURCE_VALUE=${sourceValue}`,
    "-e",
    "BUN_INSTALL_CACHE_DIR=/tmp/.bun-cache",
  ];

  if (isTTY) {
    dockerArgs.push("-it");
  } else {
    dockerArgs.push("-i");
  }

  if (noNetwork) {
    dockerArgs.push("--network", "none");
  }

  if (sourceType === "local") {
    dockerArgs.push("-v", `${sourceValue}:/app/source:ro`);
  }

  dockerArgs.push(imageName);

  if (forwardedArgs.length > 0) {
    dockerArgs.push(...forwardedArgs);
  }

  return dockerArgs;
}
