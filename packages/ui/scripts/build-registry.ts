#!/usr/bin/env bun
/**
 * build-registry.ts
 * Generates shadcn-compatible registry files for @gridland/ui components.
 *
 * Output:
 *   packages/ui/registry.json       - Main registry index
 *   packages/ui/registry/*.json     - Individual item JSONs with embedded source
 *   packages/ui/registry/ui/*.tsx   - Source files with rewritten imports
 */

import { readFileSync, writeFileSync, mkdirSync } from "fs"
import { join, resolve } from "path"

const ROOT = resolve(import.meta.dir, "..")
const COMPONENTS_DIR = join(ROOT, "components")
const REGISTRY_DIR = join(ROOT, "registry")
const REGISTRY_UI_DIR = join(REGISTRY_DIR, "ui")

// Ensure output directories exist
mkdirSync(REGISTRY_DIR, { recursive: true })
mkdirSync(REGISTRY_UI_DIR, { recursive: true })

// ── Import path rewriting ─────────────────────────────────────────────

const IMPORT_REWRITES: [RegExp, string][] = [
  // Theme (all sub-paths consolidated into single file)
  [/(from\s+["'])\.\.\/theme\/index(["'])/g, "$1./theme$2"],
  [/(from\s+["'])\.\.\/theme\/types(["'])/g, "$1./theme$2"],
  [/(from\s+["'])\.\.\/theme\/themes(["'])/g, "$1./theme$2"],
  [/(from\s+["'])\.\.\/theme\/theme-context(["'])/g, "$1./theme$2"],
  [/(from\s+["'])\.\.\/theme\/use-focus-styles(["'])/g, "$1./theme$2"],
  [/(from\s+["'])\.\.\/theme(["'])/g, "$1./theme$2"],
  // Utilities
  [/(from\s+["'])\.\.\/text-style(["'])/g, "$1./text-style$2"],
  [/(from\s+["'])\.\.\/provider\/provider(["'])/g, "$1./provider$2"],
  [/(from\s+["'])\.\.\/breakpoints\/use-breakpoints(["'])/g, "$1./breakpoints$2"],
  // Cross-component
  [/(from\s+["'])\.\.\/prompt-input\/prompt-input(["'])/g, "$1./prompt-input$2"],
  [/(from\s+["'])\.\.\/chain-of-thought\/chain-of-thought(["'])/g, "$1./chain-of-thought$2"],
  [/(from\s+["'])\.\.\/status-bar\/status-bar(["'])/g, "$1./status-bar$2"],
  // External packages (keep as-is, but normalize command-registry)
  [/(from\s+["'])\.\/command-registry(["'])/g, "$1./command-registry$2"],
]

function rewriteImports(source: string): string {
  let result = source
  for (const [pattern, replacement] of IMPORT_REWRITES) {
    result = result.replace(pattern, replacement)
  }
  return result
}

// ── Theme consolidation ───────────────────────────────────────────────
// Merge types.ts, themes.ts, and theme-context.tsx into a single file.

function buildThemeSource(): string {
  const types = readFileSync(join(COMPONENTS_DIR, "theme/types.ts"), "utf-8")
  const themes = readFileSync(join(COMPONENTS_DIR, "theme/themes.ts"), "utf-8")
  const context = readFileSync(join(COMPONENTS_DIR, "theme/theme-context.tsx"), "utf-8")
  const focusStyles = readFileSync(join(COMPONENTS_DIR, "theme/use-focus-styles.ts"), "utf-8")

  // Strip local imports that reference sibling files (now merged)
  const cleanThemes = themes
    .replace(/import\s+type\s+\{[^}]+\}\s+from\s+["']\.\/types["']\s*\n?/g, "")

  const cleanContext = context
    .replace(/import\s+type\s+\{[^}]+\}\s+from\s+["']\.\/types["']\s*\n?/g, "")
    .replace(/import\s+\{[^}]+\}\s+from\s+["']\.\/themes["']\s*\n?/g, "")

  const cleanFocusStyles = focusStyles
    .replace(/import\s+\{[^}]+\}\s+from\s+["']\.\/theme-context["']\s*\n?/g, "")

  return [types.trim(), cleanThemes.trim(), cleanContext.trim(), cleanFocusStyles.trim()].join("\n\n")
}

// ── Registry item configs ─────────────────────────────────────────────

interface ItemConfig {
  name: string
  type: "registry:ui"
  title: string
  description: string
  registryDependencies: string[]
  /** Source file path relative to components/ dir. null = custom builder. */
  srcPath: string | null
  /** Output file extension */
  ext: string
}

const ITEMS: ItemConfig[] = [
  // ── Utilities ──
  {
    name: "theme",
    type: "registry:ui",
    title: "Theme",
    description: "Theme context, provider, and built-in dark/light themes",
    registryDependencies: [],
    srcPath: null,
    ext: ".tsx",
  },
  {
    name: "text-style",
    type: "registry:ui",
    title: "Text Style",
    description: "Helper to convert text decoration flags to opentui style objects",
    registryDependencies: [],
    srcPath: "text-style.ts",
    ext: ".ts",
  },
  {
    name: "provider",
    type: "registry:ui",
    title: "Provider",
    description: "GridlandProvider root component with theme and keyboard context",
    registryDependencies: ["theme"],
    srcPath: "provider/provider.tsx",
    ext: ".tsx",
  },
  {
    name: "breakpoints",
    type: "registry:ui",
    title: "Breakpoints",
    description: "Responsive breakpoints hook using terminal dimensions",
    registryDependencies: [],
    srcPath: "breakpoints/use-breakpoints.ts",
    ext: ".ts",
  },
  // ── Components ──
  {
    name: "ascii",
    type: "registry:ui",
    title: "Ascii",
    description: "ASCII art text renderer using figlet fonts",
    registryDependencies: ["theme"],
    srcPath: "ascii/ascii.tsx",
    ext: ".tsx",
  },
  {
    name: "chat",
    type: "registry:ui",
    title: "Chat",
    description: "Vertical chat interface with messages, tool calls, streaming, and input",
    registryDependencies: ["theme", "text-style", "prompt-input"],
    srcPath: "chat/chat.tsx",
    ext: ".tsx",
  },
  {
    name: "gradient",
    type: "registry:ui",
    title: "Gradient",
    description: "Color gradient text renderer with named and custom gradients",
    registryDependencies: [],
    srcPath: "gradient/gradient.tsx",
    ext: ".tsx",
  },
  {
    name: "link",
    type: "registry:ui",
    title: "Link",
    description: "Clickable hyperlink with configurable underline styles",
    registryDependencies: ["theme"],
    srcPath: "link/link.tsx",
    ext: ".tsx",
  },
  {
    name: "message",
    type: "registry:ui",
    title: "Message",
    description: "AI chat message with role-based styling and streaming support",
    registryDependencies: ["theme", "text-style"],
    srcPath: "message/message.tsx",
    ext: ".tsx",
  },
  {
    name: "modal",
    type: "registry:ui",
    title: "Modal",
    description: "Bordered overlay container with focus trapping, optional title, and Escape key handling",
    registryDependencies: ["theme", "text-style", "provider"],
    srcPath: "modal/modal.tsx",
    ext: ".tsx",
  },
  {
    name: "multi-select",
    type: "registry:ui",
    title: "Multi Select",
    description: "Multi-selection list with keyboard navigation and grouping",
    registryDependencies: ["theme", "text-style", "provider"],
    srcPath: "multi-select/multi-select.tsx",
    ext: ".tsx",
  },
  {
    name: "prompt-input",
    type: "registry:ui",
    title: "Prompt Input",
    description: "Rich text input with autocomplete, history, and AI chat status integration",
    registryDependencies: ["theme", "text-style", "provider"],
    srcPath: "prompt-input/prompt-input.tsx",
    ext: ".tsx",
  },
  {
    name: "select-input",
    type: "registry:ui",
    title: "Select Input",
    description: "Single-selection list with keyboard navigation and grouping",
    registryDependencies: ["theme", "text-style", "provider"],
    srcPath: "select-input/select-input.tsx",
    ext: ".tsx",
  },
  {
    name: "spinner",
    type: "registry:ui",
    title: "Spinner",
    description: "Animated loading spinner with 5 built-in variants",
    registryDependencies: ["theme"],
    srcPath: "spinner/spinner.tsx",
    ext: ".tsx",
  },
  {
    name: "status-bar",
    type: "registry:ui",
    title: "Status Bar",
    description: "Bottom status bar with keybinding hints",
    registryDependencies: ["theme", "text-style"],
    srcPath: "status-bar/status-bar.tsx",
    ext: ".tsx",
  },
  {
    name: "tab-bar",
    type: "registry:ui",
    title: "Tab Bar",
    description: "Tabbed navigation with compound component API and keyboard support",
    registryDependencies: ["theme", "text-style", "provider"],
    srcPath: "tab-bar/tab-bar.tsx",
    ext: ".tsx",
  },
  {
    name: "table",
    type: "registry:ui",
    title: "Table",
    description: "Data table with auto-sizing columns and Unicode borders",
    registryDependencies: ["theme", "text-style"],
    srcPath: "table/table.tsx",
    ext: ".tsx",
  },
  {
    name: "terminal-window",
    type: "registry:ui",
    title: "Terminal Window",
    description: "macOS-style terminal window frame with traffic light buttons",
    registryDependencies: [],
    srcPath: "terminal-window/terminal-window.tsx",
    ext: ".tsx",
  },
  {
    name: "text-input",
    type: "registry:ui",
    title: "Text Input",
    description: "Single-line text input with labels, validation, and controlled/uncontrolled modes",
    registryDependencies: ["theme", "text-style"],
    srcPath: "text-input/text-input.tsx",
    ext: ".tsx",
  },
  {
    name: "chain-of-thought",
    type: "registry:ui",
    title: "Chain of Thought",
    description: "Step-by-step progress chain of thought with animated status indicators",
    registryDependencies: ["theme", "text-style"],
    srcPath: "chain-of-thought/chain-of-thought.tsx",
    ext: ".tsx",
  },
  {
    name: "side-nav",
    type: "registry:ui",
    title: "Side Nav",
    description: "Sidebar navigation with focus system integration and keyboard-driven interaction",
    registryDependencies: ["text-style", "status-bar"],
    srcPath: "side-nav/side-nav.tsx",
    ext: ".tsx",
  },
]

// ── Build ─────────────────────────────────────────────────────────────

interface RegistryFile {
  path: string
  type: string
  content: string
}

interface RegistryItem {
  name: string
  type: string
  title: string
  description: string
  registryDependencies?: string[]
  files: RegistryFile[]
}

const registryItems: RegistryItem[] = []

for (const item of ITEMS) {
  // Read and transform source
  let source: string
  if (item.name === "theme") {
    source = buildThemeSource()
  } else {
    const raw = readFileSync(join(COMPONENTS_DIR, item.srcPath!), "utf-8")
    source = rewriteImports(raw)
  }

  const fileName = `${item.name}${item.ext}`
  const filePath = `registry/ui/${fileName}`

  // Write source file to registry/ui/
  writeFileSync(join(REGISTRY_UI_DIR, fileName), source)

  // Build registry item
  // Prefix registryDependencies with @gridland/ so shadcn resolves them
  // from the gridland registry namespace rather than the default shadcn registry.
  const namespacedDeps = item.registryDependencies.map((dep) => `@gridland/${dep}`)

  const registryItem: RegistryItem = {
    name: item.name,
    type: item.type,
    title: item.title,
    description: item.description,
    ...(namespacedDeps.length > 0
      ? { registryDependencies: namespacedDeps }
      : {}),
    files: [{ path: filePath, type: item.type, content: source }],
  }

  registryItems.push(registryItem)

  // Write individual item JSON
  const itemJson = {
    $schema: "https://ui.shadcn.com/schema/registry-item.json",
    ...registryItem,
  }
  writeFileSync(
    join(REGISTRY_DIR, `${item.name}.json`),
    JSON.stringify(itemJson, null, 2) + "\n",
  )
}

// Write main registry.json
const registry = {
  $schema: "https://ui.shadcn.com/schema/registry.json",
  name: "gridland-ui",
  homepage: "https://gridland.io",
  items: registryItems,
}

writeFileSync(
  join(ROOT, "registry.json"),
  JSON.stringify(registry, null, 2) + "\n",
)

console.log(`Built ${registryItems.length} registry items`)
console.log(`  Registry: ${join(ROOT, "registry.json")}`)
console.log(`  Items:    ${REGISTRY_DIR}/`)
console.log(`  Sources:  ${REGISTRY_UI_DIR}/`)
