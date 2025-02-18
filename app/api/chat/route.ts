import { anthropic } from "@ai-sdk/anthropic"
import { streamText } from "ai"

export const maxDuration = 30

export async function POST(req: Request) {
  const { messages } = await req.json()

  const result = streamText({
    model: anthropic("claude-3-5-sonnet-latest"),
    messages
  })

  return result.toDataStreamResponse()
}
