#!/usr/bin/env bun
/**
 * build-registry.ts — emits shadcn-compatible registry items for @gridland/ui.
 *
 * Source files under packages/ui/{components,lib,hooks}/ already import each
 * other through `@/registry/gridland/{ui,lib,hooks}/*` aliases. The emitter
 * reads those files verbatim and inlines their content into the JSON; the
 * shadcn CLI rewrites the aliases to the user's `components.json` aliases at
 * install time. This script does no import transformation of its own.
 *
 * Output:
 *   packages/docs/public/r/index.json      — registry manifest
 *   packages/docs/public/r/{name}.json     — one file per registry item
 */
import { readFileSync, writeFileSync, mkdirSync } from "fs"
import { join, resolve } from "path"

const PKG_ROOT = resolve(import.meta.dir, "..")
const OUTPUT_DIR = resolve(PKG_ROOT, "../docs/public/r")
mkdirSync(OUTPUT_DIR, { recursive: true })

type ItemType = "registry:ui" | "registry:lib" | "registry:hook"

interface FileConfig {
  /** Path inside packages/ui, e.g. "lib/theme/themes.ts" */
  src: string
  /** Path emitted in the JSON, e.g. "registry/gridland/lib/theme/themes.ts" */
  registryPath: string
  type: ItemType
}

interface ItemConfig {
  name: string
  type: ItemType
  title: string
  description: string
  files: FileConfig[]
  /** npm packages the emitted source imports from. */
  dependencies?: string[]
  /** Cross-item deps (bare names — the emitter adds the @gridland/ prefix). */
  registryDependencies?: string[]
  categories?: string[]
}

// ── Items ──────────────────────────────────────────────────────────────

const ITEMS: ItemConfig[] = [
  // Utilities (registry:lib / registry:hook)
  {
    name: "theme",
    type: "registry:lib",
    title: "Theme",
    description: "Theme context, provider, built-in dark/light themes, and theme-aware focus style hooks",
    files: [
      { src: "lib/theme/types.ts",          registryPath: "registry/gridland/lib/theme/types.ts",          type: "registry:lib" },
      { src: "lib/theme/themes.ts",         registryPath: "registry/gridland/lib/theme/themes.ts",         type: "registry:lib" },
      { src: "lib/theme/theme-context.tsx", registryPath: "registry/gridland/lib/theme/theme-context.tsx", type: "registry:lib" },
      { src: "lib/theme/use-focus-styles.ts", registryPath: "registry/gridland/lib/theme/use-focus-styles.ts", type: "registry:lib" },
      { src: "lib/theme/index.ts",          registryPath: "registry/gridland/lib/theme/index.ts",          type: "registry:lib" },
    ],
    dependencies: ["@gridland/utils"],
    categories: ["theme"],
  },
  {
    name: "text-style",
    type: "registry:lib",
    title: "Text Style",
    description: "Converts text-decoration flags to OpenTUI style objects with the correct attribute bitmask",
    files: [
      { src: "lib/text-style.ts", registryPath: "registry/gridland/lib/text-style.ts", type: "registry:lib" },
    ],
    categories: ["utility"],
  },
  {
    name: "use-breakpoints",
    type: "registry:hook",
    title: "useBreakpoints",
    description: "Responsive breakpoints hook that reads terminal/canvas dimensions",
    files: [
      { src: "hooks/use-breakpoints.ts", registryPath: "registry/gridland/hooks/use-breakpoints.ts", type: "registry:hook" },
    ],
    dependencies: ["@gridland/utils"],
    categories: ["utility"],
  },

  // Components (registry:ui)
  {
    name: "provider",
    type: "registry:ui",
    title: "GridlandProvider",
    description: "Root provider supplying theme and keyboard context",
    files: [
      { src: "components/provider/provider.tsx", registryPath: "registry/gridland/ui/provider/provider.tsx", type: "registry:ui" },
    ],
    registryDependencies: ["theme"],
    categories: ["primitive"],
  },
  {
    name: "ascii",
    type: "registry:ui",
    title: "Ascii",
    description: "ASCII art text renderer with built-in font styles (terminal-only — requires Zig FFI)",
    files: [
      { src: "components/ascii/ascii.tsx", registryPath: "registry/gridland/ui/ascii/ascii.tsx", type: "registry:ui" },
    ],
    registryDependencies: ["theme"],
    categories: ["primitive"],
  },
  {
    name: "gradient",
    type: "registry:ui",
    title: "Gradient",
    description: "Color gradient text renderer with named presets and custom gradients",
    files: [
      { src: "components/gradient/gradient.tsx", registryPath: "registry/gridland/ui/gradient/gradient.tsx", type: "registry:ui" },
    ],
    categories: ["primitive"],
  },
  {
    name: "link",
    type: "registry:ui",
    title: "Link",
    description: "Clickable hyperlink with configurable underline styles",
    files: [
      { src: "components/link/link.tsx", registryPath: "registry/gridland/ui/link/link.tsx", type: "registry:ui" },
    ],
    registryDependencies: ["theme"],
    categories: ["primitive"],
  },
  {
    name: "message",
    type: "registry:ui",
    title: "Message",
    description: "AI chat message with role-based styling and streaming support",
    files: [
      { src: "components/message/message.tsx", registryPath: "registry/gridland/ui/message/message.tsx", type: "registry:ui" },
    ],
    registryDependencies: ["theme", "text-style"],
    categories: ["feedback"],
  },
  {
    name: "modal",
    type: "registry:ui",
    title: "Modal",
    description: "Bordered overlay with focus trapping, optional title, and Escape-to-close",
    files: [
      { src: "components/modal/modal.tsx", registryPath: "registry/gridland/ui/modal/modal.tsx", type: "registry:ui" },
    ],
    dependencies: ["@gridland/utils"],
    registryDependencies: ["theme", "text-style", "provider"],
    categories: ["overlay"],
  },
  {
    name: "multi-select",
    type: "registry:ui",
    title: "MultiSelect",
    description: "Multi-selection list with keyboard navigation, grouping, and select-all",
    files: [
      { src: "components/multi-select/multi-select.tsx", registryPath: "registry/gridland/ui/multi-select/multi-select.tsx", type: "registry:ui" },
    ],
    registryDependencies: ["theme", "text-style", "provider"],
    categories: ["input"],
  },
  {
    name: "prompt-input",
    type: "registry:ui",
    title: "PromptInput",
    description: "Rich text input with autocomplete, command registry, and chat status integration",
    files: [
      { src: "components/prompt-input/prompt-input.tsx",     registryPath: "registry/gridland/ui/prompt-input/prompt-input.tsx",     type: "registry:ui" },
      { src: "components/prompt-input/command-registry.tsx", registryPath: "registry/gridland/ui/prompt-input/command-registry.tsx", type: "registry:ui" },
    ],
    registryDependencies: ["theme", "text-style", "provider"],
    categories: ["input"],
  },
  {
    name: "select-input",
    type: "registry:ui",
    title: "SelectInput",
    description: "Single-selection list with keyboard navigation and grouping",
    files: [
      { src: "components/select-input/select-input.tsx", registryPath: "registry/gridland/ui/select-input/select-input.tsx", type: "registry:ui" },
    ],
    registryDependencies: ["theme", "text-style", "provider"],
    categories: ["input"],
  },
  {
    name: "spinner",
    type: "registry:ui",
    title: "Spinner",
    description: "Animated loading spinner with 5 built-in variants and status states",
    files: [
      { src: "components/spinner/spinner.tsx", registryPath: "registry/gridland/ui/spinner/spinner.tsx", type: "registry:ui" },
    ],
    registryDependencies: ["theme"],
    categories: ["feedback"],
  },
  {
    name: "status-bar",
    type: "registry:ui",
    title: "StatusBar",
    description: "Bottom status bar with keybinding hints",
    files: [
      { src: "components/status-bar/status-bar.tsx", registryPath: "registry/gridland/ui/status-bar/status-bar.tsx", type: "registry:ui" },
    ],
    registryDependencies: ["theme", "text-style"],
    categories: ["primitive"],
  },
  {
    name: "tab-bar",
    type: "registry:ui",
    title: "Tabs",
    description: "Tabbed navigation with compound component API and keyboard navigation",
    files: [
      { src: "components/tab-bar/tab-bar.tsx", registryPath: "registry/gridland/ui/tab-bar/tab-bar.tsx", type: "registry:ui" },
    ],
    registryDependencies: ["theme", "text-style", "provider"],
    categories: ["navigation"],
  },
  {
    name: "table",
    type: "registry:ui",
    title: "Table",
    description: "Data table with auto-sized columns and Unicode borders",
    files: [
      { src: "components/table/table.tsx", registryPath: "registry/gridland/ui/table/table.tsx", type: "registry:ui" },
    ],
    registryDependencies: ["theme", "text-style"],
    categories: ["layout"],
  },
  {
    name: "terminal-window",
    type: "registry:ui",
    title: "TerminalWindow",
    description: "macOS-style terminal window chrome with traffic-light buttons (HTML/web-only)",
    files: [
      { src: "components/terminal-window/terminal-window.tsx", registryPath: "registry/gridland/ui/terminal-window/terminal-window.tsx", type: "registry:ui" },
    ],
    categories: ["layout"],
  },
  {
    name: "text-input",
    type: "registry:ui",
    title: "TextInput",
    description: "Single-line text input with labels, validation, and controlled/uncontrolled modes",
    files: [
      { src: "components/text-input/text-input.tsx", registryPath: "registry/gridland/ui/text-input/text-input.tsx", type: "registry:ui" },
    ],
    registryDependencies: ["theme", "text-style"],
    categories: ["input"],
  },
  {
    name: "chain-of-thought",
    type: "registry:ui",
    title: "ChainOfThought",
    description: "Step-by-step reasoning chain with animated status indicators",
    files: [
      { src: "components/chain-of-thought/chain-of-thought.tsx", registryPath: "registry/gridland/ui/chain-of-thought/chain-of-thought.tsx", type: "registry:ui" },
    ],
    registryDependencies: ["theme", "text-style"],
    categories: ["feedback"],
  },
  {
    name: "side-nav",
    type: "registry:ui",
    title: "SideNav",
    description: "Sidebar navigation with focus system integration and keyboard-driven interaction",
    files: [
      { src: "components/side-nav/side-nav.tsx", registryPath: "registry/gridland/ui/side-nav/side-nav.tsx", type: "registry:ui" },
    ],
    dependencies: ["@gridland/utils"],
    registryDependencies: ["theme", "text-style", "status-bar"],
    categories: ["navigation"],
  },
]

// ── Emit ───────────────────────────────────────────────────────────────

interface EmittedFile {
  path: string
  type: string
  content: string
}

interface EmittedItem {
  $schema?: string
  name: string
  type: string
  title: string
  description: string
  categories?: string[]
  dependencies?: string[]
  registryDependencies?: string[]
  files: EmittedFile[]
}

const items: EmittedItem[] = []

for (const item of ITEMS) {
  const files: EmittedFile[] = item.files.map((f) => ({
    path: f.registryPath,
    type: f.type,
    content: readFileSync(join(PKG_ROOT, f.src), "utf-8"),
  }))

  const namespaced = item.registryDependencies?.map((d) => `@gridland/${d}`)

  const emitted: EmittedItem = {
    name: item.name,
    type: item.type,
    title: item.title,
    description: item.description,
    ...(item.categories?.length ? { categories: item.categories } : {}),
    ...(item.dependencies?.length ? { dependencies: item.dependencies } : {}),
    ...(namespaced?.length ? { registryDependencies: namespaced } : {}),
    files,
  }

  items.push(emitted)

  writeFileSync(
    join(OUTPUT_DIR, `${item.name}.json`),
    JSON.stringify({ $schema: "https://ui.shadcn.com/schema/registry-item.json", ...emitted }, null, 2) + "\n",
  )
}

writeFileSync(
  join(OUTPUT_DIR, "index.json"),
  JSON.stringify(
    {
      $schema: "https://ui.shadcn.com/schema/registry.json",
      name: "gridland-ui",
      homepage: "https://gridland.io",
      items,
    },
    null,
    2,
  ) + "\n",
)

console.log(`Built ${items.length} registry items → ${OUTPUT_DIR}`)
