import { google } from "@ai-sdk/google"
import { createDataStreamResponse, Message, streamText } from "ai"
import { tools } from "@/actions/documents/analysis/tools"
import { auth } from "@clerk/nextjs/server"
import { db } from "@/db/db"
import { documentsTable, analysisTable, findingsTable } from "@/db/schema"
import { eq } from "drizzle-orm"
import { z } from "zod"

export const maxDuration = 300 // 5 minutes

// Request validation schema
const requestSchema = z.object({
  documentIds: z.array(z.string()),
  companyId: z.string(),
  type: z.enum([
    "governance",
    "financial",
    "compliance",
    "risk",
    "strategy",
    "minutes",
    "report",
    "policy",
    "other"
  ]),
  title: z.string()
})

function serializeFinding(finding: any) {
  return {
    id: finding.id,
    type: finding.type,
    severity: finding.severity,
    status: finding.status,
    title: finding.title,
    description: finding.description,
    location: finding.location,
    context: finding.context,
    suggestedAction: finding.suggestedAction,
    metadata: finding.metadata
      ? JSON.parse(JSON.stringify(finding.metadata))
      : null,
    createdAt: finding.createdAt.toISOString(),
    updatedAt: finding.updatedAt.toISOString(),
    reviewedAt: finding.reviewedAt?.toISOString() || null
  }
}

function serializeToolResult(result: any) {
  return JSON.parse(JSON.stringify(result))
}

export async function POST(req: Request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return new Response("Unauthorized", { status: 401 })
    }

    const {
      messages,
      documentId
    }: { messages: Message[]; documentId: string } = await req.json()

    // Verify document exists and user has access
    const [document] = await db
      .select()
      .from(documentsTable)
      .where(eq(documentsTable.id, documentId))

    if (!document) {
      return new Response("Document not found", { status: 404 })
    }

    // Create analysis record
    const [analysis] = await db
      .insert(analysisTable)
      .values({
        documentId,
        analyzerId: userId,
        status: "in_progress",
        companyId: document.companyId,
        type: document.type,
        documentUrl: document.url,
        title: "",
        summary: "",
        findings: "",
        recommendations: "",
        metadata: null
      })
      .returning()

    return createDataStreamResponse({
      execute: async dataStream => {
        // Immediately send initialization status
        dataStream.writeData({
          type: "analysis_status",
          status: "initialized",
          analysisId: analysis.id
        })

        const result = await streamText({
          model: google("gemini-pro"),
          messages: [
            {
              role: "system",
              content: `You are an expert board document analyzer. Your task is to:
                1. Extract and understand document content
                2. Analyze for inconsistencies and issues
                3. Check compliance with policies
                4. Submit structured findings
                
                Focus on:
                - Financial accuracy and consistency
                - Policy compliance
                - Risk identification
                - Action item tracking
                - Missing information
                
                Be thorough and precise in your analysis.
                Require human confirmation for critical issues.
                Provide clear, actionable findings.`
            },
            ...messages
          ],
          tools,
          maxSteps: 15,
          onStepFinish: async ({ text, toolCalls, toolResults }) => {
            // Update analysis status and findings in the database
            if (toolCalls?.length > 0) {
              const lastToolCall = toolCalls[toolCalls.length - 1]
              if (lastToolCall.toolName === "submitFindings") {
                const args = lastToolCall.args as unknown as {
                  findings: Array<{
                    type:
                      | "inconsistency"
                      | "missing_information"
                      | "compliance_issue"
                      | "financial_discrepancy"
                      | "risk_flag"
                      | "action_required"
                      | "policy_violation"
                    severity: "info" | "low" | "medium" | "high" | "critical"
                    title: string
                    description: string
                    location?: string
                    context?: string
                    suggestedAction?: string
                  }>
                  summary: string
                  requiresHumanReview: boolean
                }

                // Update analysis
                await db
                  .update(analysisTable)
                  .set({
                    status: args.requiresHumanReview
                      ? "needs_review"
                      : "completed",
                    summary: args.summary,
                    completedAt: new Date(),
                    metadata: {
                      currentTool: lastToolCall.toolName,
                      toolStatus: "completed",
                      toolArgs: args,
                      toolResult: toolResults?.[toolResults.length - 1]?.result
                    }
                  })
                  .where(eq(analysisTable.id, analysis.id))

                // Insert findings
                if (args.findings?.length > 0) {
                  const insertedFindings = await db
                    .insert(findingsTable)
                    .values(
                      args.findings.map(finding => ({
                        analysisId: analysis.id,
                        type: finding.type,
                        severity: finding.severity,
                        title: finding.title,
                        description: finding.description,
                        location: finding.location,
                        context: finding.context,
                        suggestedAction: finding.suggestedAction
                      }))
                    )
                    .returning()

                  // Send findings as message annotations
                  dataStream.writeMessageAnnotation({
                    findings: insertedFindings.map(serializeFinding),
                    requiresHumanReview: args.requiresHumanReview
                  })
                }
              } else {
                // Update metadata for other tools
                await db
                  .update(analysisTable)
                  .set({
                    metadata: {
                      currentTool: lastToolCall.toolName,
                      toolStatus: "processing",
                      toolArgs: lastToolCall.args
                    }
                  })
                  .where(eq(analysisTable.id, analysis.id))
              }

              // Send progress updates
              dataStream.writeData({
                type: "analysis_progress",
                tool: {
                  name: lastToolCall.toolName,
                  status: "processing",
                  args: JSON.parse(JSON.stringify(lastToolCall.args))
                }
              })
            }

            if (toolResults?.length > 0) {
              const lastResult = toolResults[toolResults.length - 1]
              dataStream.writeData({
                type: "analysis_progress",
                tool: {
                  name: lastResult.toolName,
                  status: "completed",
                  result: serializeToolResult(lastResult.result)
                }
              })
            }
          },
          onFinish: () => {
            // Send completion status
            dataStream.writeData({
              type: "analysis_status",
              status: "completed",
              analysisId: analysis.id
            })
          }
        })

        // Merge the result into the data stream
        result.mergeIntoDataStream(dataStream)
      },
      onError: error => {
        // Return a user-friendly error message
        return error instanceof Error
          ? `Analysis failed: ${error.message}`
          : "Analysis failed due to an unknown error"
      }
    })
  } catch (error) {
    console.error("Error in document analysis:", error)
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "An error occurred"
      }),
      { status: 500 }
    )
  }
}
