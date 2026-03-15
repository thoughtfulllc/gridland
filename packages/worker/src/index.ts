import { createOpenRouter } from "@openrouter/ai-sdk-provider"
import { streamText, convertToModelMessages, type UIMessage } from "ai"

interface Env {
  OPENROUTER_API_KEY: string
  ALLOWED_ORIGIN: string
  CF_AIG_ACCOUNT_ID?: string
  CF_AIG_GATEWAY_ID?: string
  CHAT_RATE_LIMITER: RateLimit
}

function corsHeaders(env: Env) {
  return {
    "Access-Control-Allow-Origin": env.ALLOWED_ORIGIN,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  }
}

function isOriginAllowed(request: Request, env: Env): boolean {
  const origin = request.headers.get("Origin")
  if (!origin) return false
  return origin === env.ALLOWED_ORIGIN
}

function getBaseURL(env: Env): string | undefined {
  if (env.CF_AIG_ACCOUNT_ID && env.CF_AIG_GATEWAY_ID) {
    return `https://gateway.ai.cloudflare.com/v1/${env.CF_AIG_ACCOUNT_ID}/${env.CF_AIG_GATEWAY_ID}/openrouter`
  }
  return undefined
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // CORS preflight
    if (request.method === "OPTIONS") {
      if (!isOriginAllowed(request, env)) {
        return new Response("Forbidden", { status: 403 })
      }
      return new Response(null, { status: 204, headers: corsHeaders(env) })
    }

    if (request.method !== "POST") {
      return new Response("Method not allowed", { status: 405 })
    }

    // Origin check
    if (!isOriginAllowed(request, env)) {
      return new Response("Forbidden", { status: 403 })
    }

    // Rate limiting (keyed by client IP)
    const clientIP = request.headers.get("CF-Connecting-IP") ?? "unknown"
    const { success } = await env.CHAT_RATE_LIMITER.limit({ key: clientIP })
    if (!success) {
      return new Response(
        JSON.stringify({ error: "Rate limit exceeded" }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders(env),
          },
        },
      )
    }

    try {
      const { messages }: { messages: UIMessage[] } = await request.json()

      const openrouter = createOpenRouter({
        apiKey: env.OPENROUTER_API_KEY,
        baseURL: getBaseURL(env),
      })

      const result = streamText({
        model: openrouter.chat("openai/gpt-4o-mini"),
        messages: await convertToModelMessages(messages),
      })

      const response = result.toUIMessageStreamResponse()

      for (const [key, value] of Object.entries(corsHeaders(env))) {
        response.headers.set(key, value)
      }

      return response
    } catch (error) {
      return new Response(
        JSON.stringify({ error: "Internal server error" }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders(env),
          },
        },
      )
    }
  },
}
