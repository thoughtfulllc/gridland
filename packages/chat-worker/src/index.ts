import { createOpenRouter } from "@openrouter/ai-sdk-provider"
import { streamText, type UIMessage, convertToModelMessages } from "ai"

interface Env {
  OPENROUTER_API_KEY: string
  ALLOWED_ORIGINS: string
}

function corsHeaders(request: Request, env: Env): Record<string, string> {
  const origin = request.headers.get("Origin") ?? ""
  const allowed = env.ALLOWED_ORIGINS.split(",").map((s) => s.trim())
  const isAllowed = allowed.includes(origin) || allowed.includes("*")

  return {
    "Access-Control-Allow-Origin": isAllowed ? origin : "",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const cors = corsHeaders(request, env)
    const url = new URL(request.url)

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: cors })
    }

    if (url.pathname !== "/chat") {
      return new Response("Not found", { status: 404, headers: cors })
    }

    if (request.method !== "POST") {
      return new Response("Method not allowed", { status: 405, headers: cors })
    }

    try {
      const { messages, model: requestedModel, reasoning: enableReasoning }:
        { messages: UIMessage[]; model?: string; reasoning?: boolean } = await request.json()

      const openrouter = createOpenRouter({
        apiKey: env.OPENROUTER_API_KEY,
      })

      const modelId = requestedModel || "anthropic/claude-sonnet-4"
      const modelOptions = enableReasoning
        ? { reasoning: { enabled: true, effort: "low" as const } }
        : {}

      const result = streamText({
        model: openrouter.chat(modelId, modelOptions),
        messages: await convertToModelMessages(messages),
      })

      return result.toUIMessageStreamResponse({ headers: cors })
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Internal server error"
      return new Response(JSON.stringify({ error: message }), {
        status: 500,
        headers: { ...cors, "Content-Type": "application/json" },
      })
    }
  },
}
