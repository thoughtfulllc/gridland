import React from "react"
import { MultiSelect } from "@opentui/ui"

export function App() {
  return (
    <box
      border={true}
      borderStyle="rounded"
      borderColor="#88c0d0"
      backgroundColor="#2e3440"
      title=" MultiSelect Demo "
      titleAlignment="center"
      flexDirection="column"
      padding={1}
      width="100%"
      height="100%"
    >
      <text fg="#4c566a">--- MultiSelect ---</text>
      <MultiSelect
        items={[
          { label: "React", value: "react" },
          { label: "Solid", value: "solid" },
          { label: "Vue", value: "vue" },
          { label: "Svelte", value: "svelte" },
        ]}
        onSubmit={(items) => console.log("Submitted:", items.map((i) => i.label))}
      />
    </box>
  )
}
