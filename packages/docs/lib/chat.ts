/**
 * Chat API configuration for connecting useChat to the Cloudflare Worker.
 *
 * The worker proxies requests to OpenRouter, handling auth and CORS.
 * This module provides the config needed to bypass the default Next.js
 * /api/chat route and hit the worker directly — required for static
 * site deployments (e.g. Render) where there is no backend.
 *
 * In @ai-sdk/react v3.x, the `api` and `fetch` options must be passed
 * via a `transport` object (DefaultChatTransport), not as top-level
 * useChat options.
 */

import { DefaultChatTransport } from "ai"

const CHAT_WORKER_URL =
  process.env.NEXT_PUBLIC_CHAT_API_URL ?? "http://localhost:8787/chat"

/** Transport that routes chat requests to the Cloudflare Worker */
export const chatTransport = new DefaultChatTransport({
  api: CHAT_WORKER_URL,
})
