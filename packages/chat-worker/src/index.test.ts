import { describe, it, expect, mock, beforeEach } from "bun:test"

// Mock the external AI dependencies before importing the worker
mock.module("@openrouter/ai-sdk-provider", () => ({
  createOpenRouter: () => ({
    chat: () => "mock-model",
  }),
}))

mock.module("ai", () => ({
  streamText: () => ({
    toUIMessageStreamResponse: ({ headers }: { headers: Record<string, string> }) =>
      new Response("data: mock-stream\n\n", {
        status: 200,
        headers: { ...headers, "Content-Type": "text/event-stream" },
      }),
  }),
  convertToModelMessages: (messages: unknown[]) => messages,
}))

// Import after mocks are set up
const { default: worker } = await import("./index")

const ENV = {
  OPENROUTER_API_KEY: "test-key-123",
  ALLOWED_ORIGINS: "http://localhost:3000,http://localhost:5173",
}

function makeRequest(
  url: string,
  options: RequestInit & { origin?: string } = {},
) {
  const { origin, ...init } = options
  const headers = new Headers(init.headers)
  if (origin) headers.set("Origin", origin)
  return new Request(url, { ...init, headers })
}

describe("Chat Worker", () => {
  // ─── CORS ───────────────────────────────────────────────────────────

  describe("CORS preflight (OPTIONS)", () => {
    it("returns 204 with CORS headers for allowed origin", async () => {
      const req = makeRequest("http://localhost:8787/chat", {
        method: "OPTIONS",
        origin: "http://localhost:3000",
      })
      const res = await worker.fetch(req, ENV)

      expect(res.status).toBe(204)
      expect(res.headers.get("Access-Control-Allow-Origin")).toBe(
        "http://localhost:3000",
      )
      expect(res.headers.get("Access-Control-Allow-Methods")).toBe(
        "POST, OPTIONS",
      )
      expect(res.headers.get("Access-Control-Allow-Headers")).toBe(
        "Content-Type",
      )
    })

    it("returns empty Allow-Origin for disallowed origin", async () => {
      const req = makeRequest("http://localhost:8787/chat", {
        method: "OPTIONS",
        origin: "http://evil.com",
      })
      const res = await worker.fetch(req, ENV)

      expect(res.status).toBe(204)
      expect(res.headers.get("Access-Control-Allow-Origin")).toBe("")
    })

    it("works for any path on OPTIONS", async () => {
      const req = makeRequest("http://localhost:8787/anything", {
        method: "OPTIONS",
        origin: "http://localhost:5173",
      })
      const res = await worker.fetch(req, ENV)

      expect(res.status).toBe(204)
      expect(res.headers.get("Access-Control-Allow-Origin")).toBe(
        "http://localhost:5173",
      )
    })
  })

  // ─── Routing ────────────────────────────────────────────────────────

  describe("Routing", () => {
    it("returns 404 for non-/chat paths", async () => {
      const req = makeRequest("http://localhost:8787/other", {
        method: "POST",
        origin: "http://localhost:3000",
      })
      const res = await worker.fetch(req, ENV)

      expect(res.status).toBe(404)
      expect(await res.text()).toBe("Not found")
    })

    it("returns 405 for GET to /chat", async () => {
      const req = makeRequest("http://localhost:8787/chat", {
        method: "GET",
        origin: "http://localhost:3000",
      })
      const res = await worker.fetch(req, ENV)

      expect(res.status).toBe(405)
      expect(await res.text()).toBe("Method not allowed")
    })

    it("returns 405 for PUT to /chat", async () => {
      const req = makeRequest("http://localhost:8787/chat", {
        method: "PUT",
        origin: "http://localhost:3000",
      })
      const res = await worker.fetch(req, ENV)

      expect(res.status).toBe(405)
    })

    it("includes CORS headers on error responses", async () => {
      const req = makeRequest("http://localhost:8787/other", {
        method: "POST",
        origin: "http://localhost:3000",
      })
      const res = await worker.fetch(req, ENV)

      expect(res.headers.get("Access-Control-Allow-Origin")).toBe(
        "http://localhost:3000",
      )
    })
  })

  // ─── CORS origin validation ────────────────────────────────────────

  describe("Origin validation", () => {
    it("allows wildcard origin", async () => {
      const env = { ...ENV, ALLOWED_ORIGINS: "*" }
      const req = makeRequest("http://localhost:8787/chat", {
        method: "OPTIONS",
        origin: "http://any-site.com",
      })
      const res = await worker.fetch(req, env)

      expect(res.headers.get("Access-Control-Allow-Origin")).toBe(
        "http://any-site.com",
      )
    })

    it("handles multiple allowed origins with spaces", async () => {
      const env = {
        ...ENV,
        ALLOWED_ORIGINS: " http://a.com , http://b.com ",
      }
      const req = makeRequest("http://localhost:8787/chat", {
        method: "OPTIONS",
        origin: "http://b.com",
      })
      const res = await worker.fetch(req, env)

      expect(res.headers.get("Access-Control-Allow-Origin")).toBe(
        "http://b.com",
      )
    })

    it("returns empty origin when no Origin header is sent", async () => {
      const req = makeRequest("http://localhost:8787/chat", {
        method: "OPTIONS",
      })
      const res = await worker.fetch(req, ENV)

      expect(res.headers.get("Access-Control-Allow-Origin")).toBe("")
    })
  })

  // ─── POST /chat ────────────────────────────────────────────────────

  describe("POST /chat", () => {
    it("returns streaming response for valid messages", async () => {
      const req = makeRequest("http://localhost:8787/chat", {
        method: "POST",
        origin: "http://localhost:3000",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            { id: "1", role: "user", content: "Hello", parts: [] },
          ],
        }),
      })
      const res = await worker.fetch(req, ENV)

      expect(res.status).toBe(200)
      expect(res.headers.get("Content-Type")).toBe("text/event-stream")
      expect(res.headers.get("Access-Control-Allow-Origin")).toBe(
        "http://localhost:3000",
      )
    })

    it("returns 500 for invalid JSON body", async () => {
      const req = makeRequest("http://localhost:8787/chat", {
        method: "POST",
        origin: "http://localhost:3000",
        body: "not json",
      })
      const res = await worker.fetch(req, ENV)

      expect(res.status).toBe(500)
      const body = await res.json()
      expect(body).toHaveProperty("error")
    })

    it("includes CORS headers on 500 error", async () => {
      const req = makeRequest("http://localhost:8787/chat", {
        method: "POST",
        origin: "http://localhost:3000",
        body: "not json",
      })
      const res = await worker.fetch(req, ENV)

      expect(res.status).toBe(500)
      expect(res.headers.get("Access-Control-Allow-Origin")).toBe(
        "http://localhost:3000",
      )
    })
  })
})
