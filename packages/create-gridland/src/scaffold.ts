import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export const FRAMEWORKS = ["vite", "next"] as const
export type Framework = (typeof FRAMEWORKS)[number]

export interface ScaffoldOptions {
  projectName: string
  framework: Framework
  targetDir: string
}

function getTemplatesDir(): string {
  // dist/ is one level below package root, src/ is also one level below
  // Try both ../templates and ../../templates to handle either case
  for (const rel of ["../templates", "../../templates"]) {
    const dir = path.resolve(__dirname, rel)
    if (fs.existsSync(dir)) return dir
  }
  throw new Error("Could not find templates directory")
}

function copyDir(src: string, dest: string, replacements: Record<string, string>) {
  fs.mkdirSync(dest, { recursive: true })

  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name)
    let destName = entry.name

    // Rename _gitignore to .gitignore
    if (destName === "_gitignore") {
      destName = ".gitignore"
    }

    const destPath = path.join(dest, destName)

    if (entry.isDirectory()) {
      copyDir(srcPath, destPath, replacements)
    } else {
      const ext = path.extname(entry.name).toLowerCase()
      const textExts = new Set([".ts", ".tsx", ".js", ".jsx", ".json", ".html", ".css", ".md", ".txt", ".yaml", ".yml", ".toml", ".env", ".gitignore", ""])

      if (textExts.has(ext) || entry.name.startsWith("_") || entry.name.startsWith(".")) {
        let content = fs.readFileSync(srcPath, "utf-8")
        for (const [token, value] of Object.entries(replacements)) {
          content = content.replaceAll(token, value)
        }
        fs.writeFileSync(destPath, content)
      } else {
        fs.copyFileSync(srcPath, destPath)
      }
    }
  }
}

export function scaffold({ projectName, framework, targetDir }: ScaffoldOptions): void {
  const templatesDir = getTemplatesDir()
  const sharedDir = path.join(templatesDir, "shared")
  const frameworkDir = path.join(templatesDir, framework)

  const replacements: Record<string, string> = {
    "{{PROJECT_NAME}}": projectName,
  }

  // Create target directory
  fs.mkdirSync(targetDir, { recursive: true })

  // Copy shared files first, then framework-specific files take precedence
  copyDir(sharedDir, targetDir, replacements)
  copyDir(frameworkDir, targetDir, replacements)
}
