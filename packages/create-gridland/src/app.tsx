import React, { useState } from "react"
import { SelectInput, TextInput, Spinner, Ascii } from "@gridland/ui"
import { Confirm } from "./components/confirm.js"
import { Step } from "./components/step.js"
import { validateProjectName } from "./helpers/validate.js"
import type { Framework } from "./scaffold.js"

export interface WizardResult {
  projectName: string
  framework: Framework
  installDeps: boolean
  initGit: boolean
}

interface CreateGridlandAppProps {
  initialName?: string
  onComplete: (result: WizardResult) => void
}

const DEFAULT_NAME = "my-gridland-app"

const frameworkItems = [
  { label: "Vite", value: "vite" as Framework },
  { label: "Next.js", value: "next" as Framework },
]

type WizardStep = "name" | "framework" | "install" | "git" | "done"

export function CreateGridlandApp({ initialName, onComplete }: CreateGridlandAppProps) {
  const [step, setStep] = useState<WizardStep>(initialName ? "framework" : "name")
  const [nameInput, setNameInput] = useState(initialName ?? "")
  const [framework, setFramework] = useState<Framework | null>(null)
  const [installDeps, setInstallDeps] = useState<boolean | null>(null)
  const [error, setError] = useState<string | null>(null)

  const resolvedName = nameInput || DEFAULT_NAME

  const handleNameSubmit = (value: string) => {
    const name = value || DEFAULT_NAME
    const validation = validateProjectName(name)
    if (!validation.valid) {
      setError(validation.message!)
      return
    }
    setError(null)
    setStep("framework")
  }

  const handleFrameworkSelect = (item: { value: Framework }) => {
    setFramework(item.value)
    setStep("install")
  }

  const handleInstallConfirm = (value: boolean) => {
    setInstallDeps(value)
    setStep("git")
  }

  const handleGitConfirm = (value: boolean) => {
    setStep("done")
    onComplete({
      projectName: resolvedName,
      framework: framework!,
      installDeps: installDeps!,
      initGit: value,
    })
  }

  return (
    <box flexDirection="column" padding={1}>
      <Ascii text="GRIDLAND" font="tiny" color="#88c0d0" />
      <box marginBottom={1}>
        <text fg="#81a1c1">Create a new Gridland project</text>
      </box>

      <Step
        label={step === "name" ? "Project name" : `Project name: ${resolvedName}`}
        active={step === "name"}
        completed={step !== "name"}
      >
        <box flexDirection="column">
          <TextInput
            value={nameInput}
            onChange={setNameInput}
            onSubmit={handleNameSubmit}
            placeholder={DEFAULT_NAME}
            focus={step === "name"}
          />
          {error && <text fg="#bf616a">{error}</text>}
        </box>
      </Step>

      <Step label="Framework" active={step === "framework"} completed={!!framework}>
        <SelectInput
          items={frameworkItems}
          onSelect={handleFrameworkSelect}
          focus={step === "framework"}
        />
      </Step>

      <Step label="Install dependencies?" active={step === "install"} completed={installDeps !== null}>
        <Confirm
          onConfirm={handleInstallConfirm}
          focus={step === "install"}
        />
      </Step>

      <Step label="Initialize git repository?" active={step === "git"} completed={step === "done"}>
        <Confirm
          onConfirm={handleGitConfirm}
          focus={step === "git"}
        />
      </Step>

      {step === "done" && (
        <box marginTop={1}>
          <Spinner variant="dots" text="Scaffolding project..." />
        </box>
      )}
    </box>
  )
}
