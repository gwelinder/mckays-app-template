"use server"

import { db } from "@/db/db"
import {
  analysisTable,
  documentTypeEnum,
  type DocumentType,
  type SelectAnalysis,
  analysisStatusEnum
} from "@/db/schema"
import { companiesTable } from "@/db/schema/companies-schema"
import { ActionState } from "@/types"
import { eq } from "drizzle-orm"
import { auth } from "@clerk/nextjs/server"

interface AnalysisRequest {
  documentIds: string[]
  companyId: string
  type: DocumentType
  title: string
}

export async function createBoardAnalysisAction(
  request: AnalysisRequest
): Promise<ActionState<SelectAnalysis>> {
  try {
    const { userId } = await auth()
    if (!userId) throw new Error("Unauthorized")

    // Validate company exists
    const [company] = await db
      .select()
      .from(companiesTable)
      .where(eq(companiesTable.id, request.companyId))

    if (!company) {
      throw new Error(`Company not found: ${request.companyId}`)
    }

    // Create initial analysis record
    const [analysis] = await db
      .insert(analysisTable)
      .values({
        companyId: request.companyId,
        documentId: null,
        documentIds: request.documentIds,
        documentUrl: null,
        documentUrls: request.documentIds,
        type: request.type,
        title: request.title,
        status: "pending" as const,
        analyzerId: userId,
        findings: {},
        recommendations: [],
        metadata: {
          progress: {
            status: "pending",
            step: "Initializing analysis",
            progress: 0
          }
        }
      })
      .returning()

    // Return the initial analysis record
    return {
      isSuccess: true,
      message: "Analysis created successfully",
      data: analysis
    }
  } catch (error) {
    console.error("Error creating board analysis:", error)
    return {
      isSuccess: false,
      message:
        error instanceof Error ? error.message : "Failed to create analysis"
    }
  }
}

export async function generateAnalysisPrompt(
  type: DocumentType
): Promise<string> {
  const basePrompt = `Analyze the following documents and provide a detailed report. Focus on:`

  const typeSpecificPrompts: Record<DocumentType, string> = {
    governance: `
      - Board oversight effectiveness
      - Decision-making processes
      - Compliance with regulations
      - Risk management practices
      - Stakeholder accountability`,
    financial: `
      - Financial performance metrics and trends
      - Variances from budget/forecast
      - Key risk areas and exposures
      - Compliance with accounting standards
      - Notable changes in financial position`,
    compliance: `
      - Compliance status and violations
      - Regulatory requirements
      - Remediation actions
      - Training and awareness needs
      - Reporting obligations`,
    risk: `
      - Key risks identified
      - Risk ratings and prioritization
      - Mitigation strategies
      - Monitoring and reporting requirements
      - Changes from previous assessments`,
    strategy: `
      - Strategic objectives and goals
      - Implementation timelines
      - Resource requirements
      - Risk assessment and mitigation
      - Performance metrics and KPIs`,
    minutes: `
      - Key decisions and their rationale
      - Action items and responsibilities
      - Attendance and quorum
      - Compliance with governance requirements
      - Follow-up items from previous meetings`,
    report: `
      - Report findings and their severity
      - Control weaknesses identified
      - Recommendations for improvement
      - Management responses
      - Follow-up actions required`,
    policy: `
      - Policy objectives and scope
      - Compliance requirements
      - Implementation guidelines
      - Reporting and monitoring requirements
      - Review and update procedures`,
    other: `
      - Key points and findings
      - Strategic implications
      - Risks and opportunities
      - Required actions
      - Recommendations for improvement`
  }

  return `${basePrompt}\n${typeSpecificPrompts[type]}\n\nProvide a structured analysis with:\n- Executive Summary\n- Key Findings\n- Recommendations\n- Required Actions`
}

export async function listAnalysesAction(
  companyId: string
): Promise<ActionState<SelectAnalysis[]>> {
  try {
    const { userId } = await auth()
    if (!userId) throw new Error("Unauthorized")

    const analyses = await db
      .select()
      .from(analysisTable)
      .where(eq(analysisTable.companyId, companyId))
      .orderBy(analysisTable.createdAt)

    return {
      isSuccess: true,
      message: "Analyses retrieved successfully",
      data: analyses
    }
  } catch (error) {
    console.error("Error listing analyses:", error)
    return {
      isSuccess: false,
      message:
        error instanceof Error ? error.message : "Failed to list analyses"
    }
  }
}

export async function updateAnalysisResultsAction(
  analysisId: string,
  data: {
    summary: string
    findings: Array<{
      description: string
      severity: "critical" | "high" | "medium" | "low"
      status: "open"
    }>
    recommendations: string[]
  }
): Promise<ActionState<SelectAnalysis>> {
  try {
    const { userId } = await auth()
    if (!userId) throw new Error("Unauthorized")

    const [analysis] = await db
      .update(analysisTable)
      .set({
        status: "completed",
        summary: data.summary,
        findings: data.findings,
        recommendations: data.recommendations,
        completedAt: new Date()
      })
      .where(eq(analysisTable.id, analysisId))
      .returning()

    return {
      isSuccess: true,
      message: "Analysis updated successfully",
      data: analysis
    }
  } catch (error) {
    console.error("Error updating analysis:", error)
    return {
      isSuccess: false,
      message:
        error instanceof Error ? error.message : "Failed to update analysis"
    }
  }
}
