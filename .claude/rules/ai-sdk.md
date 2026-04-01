---
paths:
  - "packages/ui/components/chat/**"
  - "packages/ui/components/message/**"
  - "packages/ui/components/prompt-input/**"
  - "packages/ui/components/chain-of-thought/**"
  - "packages/chat-worker/**"
  - "packages/docs/components/demos/*chat*"
  - "packages/docs/components/demos/*message*"
  - "packages/docs/components/demos/render-message-parts*"
---

# AI SDK Conventions

The framework must remain AI-SDK agnostic. Component interfaces must not depend on any specific SDK.

- `ChatStatus` is our own type: `"ready" | "submitted" | "streaming" | "error"` — defined in `packages/ui/components/prompt-input/prompt-input.tsx`, never imported from any SDK
- `UIMessagePart` (when needed) must come from `"ai"` package, NOT `"@ai-sdk/react"`
- Tool call part type: `"dynamic-tool"` for dynamically defined tools (AI SDK v6) — NOT `"tool-invocation"` (old v2). Static tools use `tool-${toolName}` pattern.
- Tool state values: `"input-streaming"` | `"input-available"` | `"approval-requested"` | `"output-available"` | `"output-error"`
- `useChat` prop for pre-populated messages: `messages` (not `initialMessages`)
- Component props use Gridland-specific types (e.g., `ChatMessage[]`, `MessageRole`), not SDK-specific shapes — no AI SDK types in prop interfaces

## Anti-Patterns

- SDK-specific types in component prop interfaces
- `UIMessagePart` from `"@ai-sdk/react"` (must be from `"ai"`)
- `"tool-invocation"` part type (use `"dynamic-tool"`)
