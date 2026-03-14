// @ts-nocheck — OpenTUI intrinsic elements conflict with React's HTML/SVG types
"use client"
import { useState } from "react"
import { DemoWindow } from "@/components/ui/demo-window"
import { Tabs, TabsList, TabsTrigger, TabsContent, TabBar, StatusBar, textStyle, useTheme } from "@gridland/ui"
import { useKeyboard } from "@opentui/react"

// ── Simple demo (legacy TabBar API) ─────────────────────────────────────

const simpleTabs = ["Files", "Search", "Git", "Debug"]

function SimpleTabBarApp() {
  const [selectedIndex, setSelectedIndex] = useState(0)

  useKeyboard((event) => {
    if (event.name === "left") {
      setSelectedIndex((i) => (i > 0 ? i - 1 : simpleTabs.length - 1))
    }
    if (event.name === "right") {
      setSelectedIndex((i) => (i < simpleTabs.length - 1 ? i + 1 : 0))
    }
  })

  return (
    <box flexDirection="column" flexGrow={1}>
      <box padding={1}>
        <TabBar options={simpleTabs} selectedIndex={selectedIndex} />
      </box>
      <box flexGrow={1} />
      <box paddingX={1} paddingBottom={1}>
        <StatusBar items={[{ key: "←→", label: "switch tab" }]} />
      </box>
    </box>
  )
}

// ── Content demo (compound Tabs API) ────────────────────────────────────

const tabFiles = ["index.ts", "config.ts", "routes.ts"]

const fileContent: Record<string, string[]> = {
  "index.ts": [
    'import { createApp } from "./app"',
    'import { loadConfig } from "./config"',
    "",
    "const config = loadConfig()",
    "const app = createApp(config)",
    "",
    "app.listen(config.port, () => {",
    '  console.log(`Running on :${config.port}`)',
    "})",
  ],
  "config.ts": [
    "export interface Config {",
    "  port: number",
    "  dbUrl: string",
    "  debug: boolean",
    "}",
    "",
    "export function loadConfig(): Config {",
    "  return {",
    "    port: Number(process.env.PORT) || 3000,",
    '    dbUrl: process.env.DATABASE_URL ?? "",',
    '    debug: process.env.DEBUG === "true",',
    "  }",
    "}",
  ],
  "routes.ts": [
    'import { Router } from "express"',
    "",
    "export const routes = Router()",
    "",
    'routes.get("/health", (_, res) => {',
    '  res.json({ status: "ok" })',
    "})",
  ],
}

function CodeBlock({ lines }: { lines: string[] }) {
  const theme = useTheme()
  return (
    <box flexDirection="column" paddingX={1} paddingTop={1}>
      {lines.map((line, i) => (
        <text key={i}>
          <span style={textStyle({ dim: true, fg: theme.muted })}>
            {(i + 1).toString().padStart(2)} │{" "}
          </span>
          <span style={textStyle({ fg: theme.foreground })}>{line}</span>
        </text>
      ))}
    </box>
  )
}

function ContentTabBarApp() {
  const [activeTab, setActiveTab] = useState("index.ts")

  useKeyboard((event) => {
    const idx = tabFiles.indexOf(activeTab)
    if (event.name === "left") {
      setActiveTab(tabFiles[(idx - 1 + tabFiles.length) % tabFiles.length])
    }
    if (event.name === "right") {
      setActiveTab(tabFiles[(idx + 1) % tabFiles.length])
    }
  })

  return (
    <box flexDirection="column" flexGrow={1}>
      <box paddingX={1} paddingTop={1}>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="index.ts">index.ts</TabsTrigger>
            <TabsTrigger value="config.ts">config.ts</TabsTrigger>
            <TabsTrigger value="routes.ts">routes.ts</TabsTrigger>
          </TabsList>
          <TabsContent value="index.ts">
            <CodeBlock lines={fileContent["index.ts"]} />
          </TabsContent>
          <TabsContent value="config.ts">
            <CodeBlock lines={fileContent["config.ts"]} />
          </TabsContent>
          <TabsContent value="routes.ts">
            <CodeBlock lines={fileContent["routes.ts"]} />
          </TabsContent>
        </Tabs>
      </box>
      <box flexGrow={1} />
      <box paddingX={1} paddingBottom={1}>
        <StatusBar items={[{ key: "←→", label: "switch tab" }]} />
      </box>
    </box>
  )
}

// ── Exports ──────────────────────────────────────────────────────────────

export function TabsSimpleDemo() {
  return (
    <DemoWindow title="TabBar" tuiStyle={{ width: "100%", height: 120 }}>
      <SimpleTabBarApp />
    </DemoWindow>
  )
}

export default function TabsDemo() {
  return (
    <DemoWindow title="Tabs – with content" tuiStyle={{ width: "100%", height: 380 }}>
      <ContentTabBarApp />
    </DemoWindow>
  )
}
