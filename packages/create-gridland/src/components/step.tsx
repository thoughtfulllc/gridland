import React from "react"

interface StepProps {
  label: string
  active: boolean
  completed: boolean
  children: React.ReactNode
}

export function Step({ label, active, completed, children }: StepProps) {
  if (!active && !completed) return null

  return (
    <box flexDirection="column" marginBottom={1}>
      <text fg={completed ? "#a3be8c" : "#88c0d0"}>
        {completed ? "✓" : "›"} {label}
      </text>
      {active && <box marginLeft={2}>{children}</box>}
    </box>
  )
}
