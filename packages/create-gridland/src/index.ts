import { Command } from "commander"
import pc from "picocolors"
import { scaffold, FRAMEWORKS, type Framework } from "./scaffold.js"
import { DEFAULT_NAME } from "./constants.js"
import { detectPackageManager, getDevCommand } from "./helpers/package-manager.js"
import { installDependencies } from "./helpers/install.js"
import { gitInit } from "./helpers/git.js"
import { validateProjectName, checkDirectory, resolveTargetDir } from "./helpers/validate.js"

const program = new Command()

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
      // Interactive mode: lazy-import React + opentui to avoid loading
      // these heavy deps when running in non-interactive mode
      const [{ createCliRenderer }, { createRoot }, React, { CreateGridlandApp }] =
        await Promise.all([
          import("@opentui/core"),
          import("@opentui/react"),
          import("react"),
          import("./app.js"),
        ])

      type WizardResult = import("./app.js").WizardResult

      const renderer = createCliRenderer()
      const root = createRoot(renderer)

      await new Promise<void>((resolve) => {
        root.render(
          React.createElement(CreateGridlandApp, {
            initialName: projectNameArg,
            onComplete: async (result: WizardResult) => {
              root.unmount()
              renderer.cleanup()

              await runScaffold({
                ...result,
                overwrite: options.overwrite,
                pm,
              })
              resolve()
            },
          })
        )
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

program.parse()
