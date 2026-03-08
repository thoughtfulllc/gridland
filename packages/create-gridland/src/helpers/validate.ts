import fs from "node:fs"
import path from "node:path"

const validNameRegex = /^(?:@[a-z0-9-*~][a-z0-9-*._~]*\/)?[a-z0-9-~][a-z0-9-._~]*$/

export function validateProjectName(name: string): { valid: boolean; message?: string } {
  if (!name) {
    return { valid: false, message: "Project name cannot be empty" }
  }

  if (!validNameRegex.test(name)) {
    return {
      valid: false,
      message: "Project name must be lowercase and URL-friendly (a-z, 0-9, hyphens, dots)",
    }
  }

  return { valid: true }
}

export function checkDirectory(targetDir: string): { exists: boolean; empty: boolean } {
  try {
    const files = fs.readdirSync(targetDir)
    const isEmpty = files.length === 0 || (files.length === 1 && files[0] === ".git")
    return { exists: true, empty: isEmpty }
  } catch {
    return { exists: false, empty: true }
  }
}

export function resolveTargetDir(projectName: string): string {
  return path.resolve(process.cwd(), projectName)
}
