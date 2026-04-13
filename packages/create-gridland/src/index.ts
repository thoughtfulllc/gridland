import { spawnSync } from "node:child_process"
import { Command } from "commander"
import pc from "picocolors"
import { scaffold, FRAMEWORKS, type Framework } from "./scaffold.js"
import { DEFAULT_NAME } from "./constants.js"
import { detectPackageManager, getDevCommand, getDlxCommand } from "./helpers/package-manager.js"
import { installDependencies } from "./helpers/install.js"
import { gitInit } from "./helpers/git.js"
import { validateProjectName, checkDirectory, resolveTargetDir } from "./helpers/validate.js"

const program = new Command()

// Stop root-level option parsing once we hit a subcommand so that
// `add spinner --yes` goes to the add subcommand, not the root
// (both commands legitimately define --yes and --overwrite).
program.enablePositionalOptions()

program
  .name("create-gridland")
  .description("Create a new Gridland project")
  .version("0.1.0")
  .argument("[project-name]", "Name of the project")
  .option("--framework <framework>", "Framework to use (vite or next)")
  .option("--no-install", "Skip dependency installation")
  .option("--no-git", "Skip git initialization")
  .option("--yes", "Use defaults for all prompts")
  .option("--overwrite", "Overwrite existing directory")
  .action(async (projectNameArg: string | undefined, options: {
    framework?: string
    install: boolean
    git: boolean
    yes: boolean
    overwrite: boolean
  }) => {
    const pm = detectPackageManager()

    // Non-interactive mode: all required info provided via flags
    const isNonInteractive = options.yes || (projectNameArg && options.framework)

    if (isNonInteractive) {
      const projectName = projectNameArg || DEFAULT_NAME
      const frameworkInput = options.framework || "vite"

      if (!(FRAMEWORKS as readonly string[]).includes(frameworkInput)) {
        console.error(pc.red(`Invalid framework: ${frameworkInput}. Use ${FRAMEWORKS.map(f => `"${f}"`).join(" or ")}.`))
        process.exit(1)
      }

      const framework = frameworkInput as Framework
      const validation = validateProjectName(projectName)
      if (!validation.valid) {
        console.error(pc.red(validation.message!))
        process.exit(1)
      }

      await runScaffold({
        projectName,
        framework,
        installDeps: options.install,
        initGit: options.git,
        overwrite: options.overwrite,
        pm,
      })
    } else {
      const { promptProjectName, promptFramework, promptInstallDeps, promptInitGit } =
        await import("./prompts.js")

      console.log("\n  GRIDLAND\n")
      console.log("  Create a new Gridland project\n")

      const projectName = await promptProjectName(projectNameArg)
      const validation = validateProjectName(projectName)
      if (!validation.valid) {
        console.error(pc.red(validation.message!))
        process.exit(1)
      }

      const framework = await promptFramework()
      const installDeps = await promptInstallDeps()
      const initGit = await promptInitGit()

      await runScaffold({
        projectName,
        framework,
        installDeps,
        initGit,
        overwrite: options.overwrite,
        pm,
      })
    }
  })

interface RunScaffoldOptions {
  projectName: string
  framework: Framework
  installDeps: boolean
  initGit: boolean
  overwrite: boolean
  pm: ReturnType<typeof detectPackageManager>
}

async function runScaffold({
  projectName,
  framework,
  installDeps,
  initGit,
  overwrite,
  pm,
}: RunScaffoldOptions) {
  const targetDir = resolveTargetDir(projectName)
  const dirCheck = checkDirectory(targetDir)

  if (dirCheck.exists && !dirCheck.empty && !overwrite) {
    console.error(
      pc.red(`Directory "${projectName}" is not empty. Use --overwrite to overwrite.`)
    )
    process.exit(1)
  }

  console.log()
  console.log(pc.cyan(`Scaffolding ${framework} project in ${pc.bold(targetDir)}...`))
  console.log()

  scaffold({ projectName, framework, targetDir })

  console.log(pc.green("✓ Project scaffolded"))

  if (installDeps) {
    console.log(pc.cyan(`Installing dependencies with ${pm}...`))
    const success = installDependencies(targetDir, pm)
    if (success) {
      console.log(pc.green("✓ Dependencies installed"))
    } else {
      console.log(pc.yellow("⚠ Failed to install dependencies. Run install manually."))
    }
  }

  if (initGit) {
    const gitOk = gitInit(targetDir)
    if (gitOk) {
      console.log(pc.green("✓ Git repository initialized"))
    }
  }

  console.log()
  console.log(pc.bold("Next steps:"))
  console.log()
  console.log(pc.cyan(`  cd ${projectName}`))
  if (!installDeps) {
    console.log(pc.cyan(`  ${pm} install`))
  }
  console.log(pc.cyan(`  ${getDevCommand(pm)}`))
  console.log()
}

program
  .command("add [components...]")
  .description("Add Gridland components to the current project via the shadcn registry")
  .option("--yes", "Skip prompts — accept all defaults")
  .option("--overwrite", "Overwrite existing files without prompting")
  .option("--cwd <path>", "Working directory (defaults to current)")
  .option("--dry-run", "Print the resolved command without executing it")
  .action((components: string[], opts: {
    yes?: boolean
    overwrite?: boolean
    cwd?: string
    dryRun?: boolean
  }) => {
    if (!components || components.length === 0) {
      console.error(pc.red("Specify at least one component, e.g. create-gridland add spinner"))
      process.exit(1)
    }

    const names = components.map(toGridlandRef)
    const [dlxFile, ...dlxPrefix] = getDlxCommand(detectPackageManager())
    const flags: string[] = []
    if (opts.yes) flags.push("--yes")
    if (opts.overwrite) flags.push("--overwrite")
    if (opts.cwd) flags.push("--cwd", opts.cwd)

    const args = [...dlxPrefix, "shadcn@latest", "add", ...names, ...flags]

    if (opts.dryRun) {
      // Informational preview. Not fed to any shell.
      console.log([dlxFile, ...args].join(" "))
      return
    }

    console.log(pc.cyan(`→ ${dlxFile} ${args.join(" ")}`))
    const result = spawnSync(dlxFile, args, {
      cwd: opts.cwd ?? process.cwd(),
      stdio: "inherit",
    })
    if (result.error || result.signal != null || (result.status != null && result.status !== 0)) {
      console.error(pc.red("Failed to add components."))
      process.exit(result.status ?? 1)
    }
  })

/** Normalize a component arg: bare name → `@gridland/<name>`;
 *  already-namespaced (`@gridland/...` or `@other/...`) → passed through. */
function toGridlandRef(raw: string): string {
  if (raw.startsWith("@")) return raw
  return `@gridland/${raw}`
}

program.parse()
