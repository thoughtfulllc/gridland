import "@fontsource/jetbrains-mono/400.css"
import "@fontsource/jetbrains-mono/700.css"
import { createRoot } from "react-dom/client"
import { TableFixture } from "./fixtures/table"
import { SelectInputFixture } from "./fixtures/select-input"
import { SelectInputInteractiveFixture } from "./fixtures/select-input-interactive"
import { TextInputFixture } from "./fixtures/text-input"
import { TextInputInteractiveFixture } from "./fixtures/text-input-interactive"
import { LinkFixture } from "./fixtures/link"
import { BordersFixture } from "./fixtures/borders"
import { AllComponentsFixture } from "./fixtures/all-components"
import { TabBarFixture } from "./fixtures/tab-bar"
import { StatusBarFixture } from "./fixtures/status-bar"
import { ModalFixture } from "./fixtures/modal"
import { SideNavFixture } from "./fixtures/side-nav"
import { SideNavInteractiveFixture } from "./fixtures/side-nav-interactive"
import { PromptInputFixture } from "./fixtures/prompt-input"
import { PromptInputInteractiveFixture } from "./fixtures/prompt-input-interactive"
import { MultiSelectFixture } from "./fixtures/multi-select"
import { MultiSelectInteractiveFixture } from "./fixtures/multi-select-interactive"
import { MessageFixture } from "./fixtures/message"
import { ChainOfThoughtFixture } from "./fixtures/chain-of-thought"
import { SpinnerFixture } from "./fixtures/spinner"
import { AsciiFixture } from "./fixtures/ascii"
import { GradientFixture } from "./fixtures/gradient"
import { FocusLinearFixture } from "./fixtures/focus-linear"
import { FocusSpatialFixture } from "./fixtures/focus-spatial"
import { FocusScopeFixture } from "./fixtures/focus-scope"
import { FocusDisabledFixture } from "./fixtures/focus-disabled"
import { ModalInteractiveFixture } from "./fixtures/modal-interactive"
import { OverflowFixture } from "./fixtures/overflow"
import { EdgeCasesFixture } from "./fixtures/edge-cases"
import { ThemeSwitchFixture } from "./fixtures/theme-switch"
import { CompositionFixture } from "./fixtures/composition"

const routes: Record<string, () => JSX.Element> = {
  "/table": TableFixture,
  "/select-input": SelectInputFixture,
  "/select-input-interactive": SelectInputInteractiveFixture,
  "/text-input": TextInputFixture,
  "/text-input-interactive": TextInputInteractiveFixture,
  "/link": LinkFixture,
  "/borders": BordersFixture,
  "/all-components": AllComponentsFixture,
  "/tab-bar": TabBarFixture,
  "/status-bar": StatusBarFixture,
  "/modal": ModalFixture,
  "/side-nav": SideNavFixture,
  "/side-nav-interactive": SideNavInteractiveFixture,
  "/prompt-input": PromptInputFixture,
  "/prompt-input-interactive": PromptInputInteractiveFixture,
  "/multi-select": MultiSelectFixture,
  "/multi-select-interactive": MultiSelectInteractiveFixture,
  "/message": MessageFixture,
  "/chain-of-thought": ChainOfThoughtFixture,
  "/spinner": SpinnerFixture,
  "/ascii": AsciiFixture,
  "/gradient": GradientFixture,
  "/focus-linear": FocusLinearFixture,
  "/focus-spatial": FocusSpatialFixture,
  "/focus-scope": FocusScopeFixture,
  "/focus-disabled": FocusDisabledFixture,
  "/modal-interactive": ModalInteractiveFixture,
  "/overflow": OverflowFixture,
  "/edge-cases": EdgeCasesFixture,
  "/theme-switch": ThemeSwitchFixture,
  "/composition": CompositionFixture,
}

function App() {
  const path = window.location.pathname
  const Fixture = routes[path]

  if (!Fixture) {
    return (
      <div style={{ color: "#cdd6f4", padding: 20, fontFamily: "JetBrains Mono, monospace" }}>
        <h2>E2E Test Harness</h2>
        <p>Available fixtures:</p>
        <ul>
          {Object.keys(routes).map((route) => (
            <li key={route}>
              <a href={route} style={{ color: "#89b4fa" }}>{route}</a>
            </li>
          ))}
        </ul>
      </div>
    )
  }

  return <Fixture />
}

createRoot(document.getElementById("root")!).render(<App />)
