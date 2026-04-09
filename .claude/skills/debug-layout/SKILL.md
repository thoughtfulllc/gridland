---
name: debug-layout
description: Diagnose layout issues in Gridland components. Spawns the layout-debugger agent with the relevant component. Use when a component renders incorrectly or layout looks wrong.
---

Diagnose layout issues in a Gridland component.

1. If `$ARGUMENTS` provided, find the component file matching the argument (component name or file path).

2. If no argument, ask which component has the layout issue.

3. Read the component file to understand its JSX structure.

4. Spawn the `layout-debugger` agent with the component file path and a description of the visual problem.

5. Present the diagnosis: what's wrong, why, and how to fix it.

6. Suggest running `bun run demo <component-name>` to visually verify the fix.
