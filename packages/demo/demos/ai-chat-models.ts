/**
 * Central model definitions for the chat interface.
 *
 * Follows the Vercel AI chatbot pattern: models defined in one place,
 * selection persisted client-side, passed to the API via request body.
 */

export interface ChatModel {
  /** OpenRouter model ID, e.g. "anthropic/claude-sonnet-4" */
  id: string
  /** Short display name shown in the UI */
  name: string
  /** Provider grouping */
  provider: "anthropic" | "google" | "openai"
  /** One-line description */
  description: string
  /** Whether this model supports extended thinking / reasoning */
  supportsReasoning?: boolean
}

export const chatModels: ChatModel[] = [
  {
    id: "anthropic/claude-sonnet-4",
    name: "claude-sonnet-4",
    provider: "anthropic",
    description: "Fast and capable",
    supportsReasoning: true,
  },
  {
    id: "anthropic/claude-3.5-haiku",
    name: "claude-haiku-3.5",
    provider: "anthropic",
    description: "Quick and lightweight",
  },
  {
    id: "google/gemini-2.5-flash",
    name: "gemini-2.5-flash",
    provider: "google",
    description: "Fast multimodal",
  },
  {
    id: "openai/gpt-4o-mini",
    name: "gpt-4o-mini",
    provider: "openai",
    description: "Compact and efficient",
  },
]

export const DEFAULT_MODEL_ID = chatModels[0].id

const STORAGE_KEY = "gridland-chat-model"

export function loadSelectedModel(): string {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    // Validate against known models — guards against stale IDs from renamed models
    if (stored && chatModels.some(m => m.id === stored)) return stored
    return DEFAULT_MODEL_ID
  } catch {
    return DEFAULT_MODEL_ID
  }
}

export function saveSelectedModel(modelId: string) {
  try {
    localStorage.setItem(STORAGE_KEY, modelId)
  } catch {
    // ignore quota errors
  }
}

export function getModelById(id: string): ChatModel | undefined {
  return chatModels.find(m => m.id === id)
}

export function getNextModelId(currentId: string): string {
  const index = chatModels.findIndex(m => m.id === currentId)
  return chatModels[(index + 1) % chatModels.length].id
}
