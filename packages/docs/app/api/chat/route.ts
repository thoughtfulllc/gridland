import { createOpenRouter } from "@openrouter/ai-sdk-provider"
import { streamText, convertToModelMessages, type UIMessage } from "ai"

const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
})

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json()

  if (!process.env.OPENROUTER_API_KEY) {
    return Response.json({ error: { message: "OPENROUTER_API_KEY not set" } }, { status: 500 })
  }

  const result = streamText({
    model: openrouter.chat("openai/gpt-4o-mini"),
    messages: await convertToModelMessages(messages),
  })

  return result.toUIMessageStreamResponse()
}
