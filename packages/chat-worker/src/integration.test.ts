/**
 * Integration tests for the chat worker.
 * Requires the worker to be running: `bun run chat:dev`
 */
import { describe, it, expect } from "bun:test"

const WORKER_URL = "http://localhost:8787"
const ALLOWED_ORIGIN = "http://localhost:3000"

async function chatRequest(
  body: unknown,
  options: { origin?: string; method?: string; path?: string } = {},
) {
  const { origin = ALLOWED_ORIGIN, method = "POST", path = "/chat" } = options
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  }
  if (origin) headers["Origin"] = origin

  return fetch(`${WORKER_URL}${path}`, {
    method,
    headers,
    ...(method !== "GET" && method !== "OPTIONS"
      ? { body: typeof body === "string" ? body : JSON.stringify(body) }
      : {}),
  })
}

describe("Chat Worker Integration", () => {
  it("CORS preflight returns correct headers", async () => {
    const res = await fetch(`${WORKER_URL}/chat`, {
      method: "OPTIONS",
      headers: { Origin: ALLOWED_ORIGIN },
    })

    expect(res.status).toBe(204)
    expect(res.headers.get("Access-Control-Allow-Origin")).toBe(ALLOWED_ORIGIN)
    expect(res.headers.get("Access-Control-Allow-Methods")).toContain("POST")
    expect(res.headers.get("Access-Control-Allow-Headers")).toContain(
      "Content-Type",
    )
  })

  it("rejects GET to /chat with 405", async () => {
    const res = await chatRequest(null, { method: "GET" })
    expect(res.status).toBe(405)
  })

  it("returns 404 for unknown paths", async () => {
    const res = await chatRequest(null, { method: "POST", path: "/unknown" })
    expect(res.status).toBe(404)
  })

  it("returns 500 for malformed JSON", async () => {
    const res = await fetch(`${WORKER_URL}/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Origin: ALLOWED_ORIGIN,
      },
      body: "not-json",
    })

    expect(res.status).toBe(500)
    const body = await res.json()
    expect(body).toHaveProperty("error")
    expect(res.headers.get("Access-Control-Allow-Origin")).toBe(ALLOWED_ORIGIN)
  })

  it("streams a response for valid chat messages", async () => {
    const res = await chatRequest({
      messages: [
        {
          id: "test-1",
          role: "user",
          content: "Say hello in exactly one word.",
          parts: [{ type: "text", text: "Say hello in exactly one word." }],
        },
      ],
    })

    expect(res.status).toBe(200)
    expect(res.headers.get("Access-Control-Allow-Origin")).toBe(ALLOWED_ORIGIN)

    // Verify it's a streaming response (SSE or similar)
    const contentType = res.headers.get("Content-Type") ?? ""
    expect(
      contentType.includes("text/event-stream") ||
        contentType.includes("text/plain"),
    ).toBe(true)

    // Read the stream and verify we get data
    const text = await res.text()
    expect(text.length).toBeGreaterThan(0)
  }, 30_000) // Allow 30s for API call
})
