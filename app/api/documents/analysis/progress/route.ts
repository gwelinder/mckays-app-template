import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { z } from "zod"
import { db } from "@/db/db"
import { analysisTable } from "@/db/schema"
import { eq } from "drizzle-orm"

// Request validation schema
const requestSchema = z.object({
  analysisId: z.string(),
  status: z.enum(["pending", "processing", "completed", "failed"]),
  step: z.string(),
  progress: z.number().min(0).max(100),
  details: z.object({}).optional()
})

export const runtime = "edge"

interface AnalysisMetadata {
  currentTool?: string
  toolStatus?: "processing" | "completed"
  toolArgs?: unknown
  toolResult?: unknown
  [key: string]: unknown
}

interface AnalysisProgressEvent {
  type: "analysis_progress"
  status: string
  progress: number
  currentStep?: string
  summary?: string | null
  completedAt?: string | null
  tool?: {
    name: string
    status: "processing" | "completed"
    args?: unknown
    result?: unknown
  }
}

export async function POST(req: Request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Validate request body
    const body = await req.json()
    const validationResult = requestSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Invalid request body", details: validationResult.error },
        { status: 400 }
      )
    }

    const { analysisId, status, step, progress, details } =
      validationResult.data

    // Broadcast progress event
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({
              type: "analysis_progress",
              data: {
                analysisId,
                status,
                step,
                progress,
                details
              }
            })}\n\n`
          )
        )
        controller.close()
      }
    })

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive"
      }
    })
  } catch (error) {
    console.error("Progress error:", error)
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to update progress"
      },
      { status: 500 }
    )
  }
}

export async function GET(req: Request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return new Response("Unauthorized", { status: 401 })
    }

    const url = new URL(req.url)
    const analysisId = url.searchParams.get("analysisId")
    if (!analysisId) {
      return new Response("Analysis ID is required", { status: 400 })
    }

    // Verify user has access to the analysis
    const [analysis] = await db
      .select()
      .from(analysisTable)
      .where(eq(analysisTable.id, analysisId))

    if (!analysis) {
      return new Response("Analysis not found", { status: 404 })
    }

    // Create SSE stream
    const stream = new ReadableStream({
      start: async controller => {
        // Helper to send SSE messages
        const sendEvent = (event: AnalysisProgressEvent) => {
          controller.enqueue(`data: ${JSON.stringify(event)}\n\n`)
        }

        // Send initial state
        sendEvent({
          type: "analysis_progress",
          status: analysis.status,
          progress: 0,
          currentStep: "Initializing analysis"
        })

        // Set up interval to check progress
        const checkProgress = setInterval(async () => {
          const [currentAnalysis] = await db
            .select()
            .from(analysisTable)
            .where(eq(analysisTable.id, analysisId))

          if (!currentAnalysis) {
            clearInterval(checkProgress)
            controller.enqueue(
              `data: ${JSON.stringify({
                type: "error",
                code: "ANALYSIS_NOT_FOUND",
                message: "Analysis not found"
              })}\n\n`
            )
            controller.close()
            return
          }

          // Calculate progress based on status and metadata
          let progress = 0
          let currentStep = ""
          const metadata = currentAnalysis.metadata as AnalysisMetadata | null

          switch (currentAnalysis.status) {
            case "pending":
              progress = 0
              currentStep = "Waiting to start"
              break
            case "in_progress":
              // Check metadata for more detailed progress
              if (metadata?.currentTool) {
                progress = 50
                currentStep = `Processing: ${metadata.currentTool}`
              } else {
                progress = 25
                currentStep = "Processing document"
              }
              break
            case "needs_review":
              progress = 75
              currentStep = "Awaiting review"
              break
            case "completed":
              progress = 100
              currentStep = "Analysis complete"
              break
            case "rejected":
              progress = 100
              currentStep = "Analysis rejected"
              break
            case "failed":
              progress = 100
              currentStep = "Analysis failed"
              break
            default:
              progress = 0
              currentStep = "Unknown status"
          }

          // Send detailed progress event
          sendEvent({
            type: "analysis_progress",
            status: currentAnalysis.status,
            progress,
            currentStep,
            summary: currentAnalysis.summary,
            completedAt: currentAnalysis.completedAt?.toISOString(),
            tool: metadata?.currentTool
              ? {
                  name: metadata.currentTool,
                  status: metadata.toolStatus || "processing",
                  args: metadata.toolArgs,
                  result: metadata.toolResult
                }
              : undefined
          })

          // Stop checking if analysis is complete or failed
          if (
            ["completed", "rejected", "failed"].includes(currentAnalysis.status)
          ) {
            clearInterval(checkProgress)
            controller.close()
          }
        }, 2000) // Check every 2 seconds

        // Clean up interval when client disconnects
        req.signal.addEventListener("abort", () => {
          clearInterval(checkProgress)
          controller.close()
        })
      }
    })

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive"
      }
    })
  } catch (error) {
    console.error("Error in analysis progress:", error)
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "An error occurred"
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    )
  }
}
