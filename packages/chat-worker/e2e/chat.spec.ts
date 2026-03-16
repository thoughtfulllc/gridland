import { test, expect } from "@playwright/test"

const DOCS_URL = "http://localhost:3000"
const WORKER_URL = "http://localhost:8787"

test.describe("Chat Worker E2E", () => {
  test("AI chat interface sends request to worker and streams response", async ({
    page,
  }) => {
    const postRequests: { method: string; url: string }[] = []
    page.on("request", (r) => {
      if (r.method() === "POST") {
        postRequests.push({ method: r.method(), url: r.url() })
      }
    })

    await page.goto(`${DOCS_URL}/docs/blocks/ai-chat-interface`, {
      waitUntil: "networkidle",
    })
    await expect(page).toHaveTitle(/AI Chat Interface/)

    // Focus the TUI canvas
    const canvas = page.locator("canvas").first()
    await expect(canvas).toBeVisible()
    await canvas.click()

    // Type and send a message
    await page.keyboard.type("Say hi", { delay: 30 })

    const responsePromise = page.waitForResponse(
      (r) => r.url().includes(WORKER_URL) && r.status() === 200,
      { timeout: 15_000 },
    )

    await page.keyboard.press("Enter")

    const response = await responsePromise

    // Verify request went to the worker, not Next.js backend
    expect(response.url()).toContain(WORKER_URL)
    expect(response.status()).toBe(200)

    const workerPost = postRequests.find((r) => r.url.includes(WORKER_URL))
    expect(workerPost).toBeDefined()

    // No requests should go to the default /api/chat route
    const nextApiPost = postRequests.find(
      (r) => r.url.includes("/api/chat") && !r.url.includes(WORKER_URL),
    )
    expect(nextApiPost).toBeUndefined()

    // Wait for streaming to complete
    await page.waitForTimeout(5000)

    await page.screenshot({
      path: "packages/chat-worker/e2e/chat-success.png",
    })
  })
})
