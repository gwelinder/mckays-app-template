"use server"

import { processPdfAction } from "@/actions/analyze/process-pdf"

export async function POST(req: Request) {
  const { path, prompt } = await req.json()
  const result = await processPdfAction(path, prompt)
  return new Response(JSON.stringify(result), { status: 200 })
}
