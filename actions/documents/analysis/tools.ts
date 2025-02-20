"use server"

import { tool } from "ai"
import { z } from "zod"
import { UnstructuredClient } from "unstructured-client"
import { Strategy } from "unstructured-client/sdk/models/shared"
import { getSupabaseClient } from "@/lib/supabase-client"
import { db } from "@/db/db"
import { documentsTable, findingsTable } from "@/db/schema"
import { eq } from "drizzle-orm"
import { recursiveTextSplitter } from "../processing/chunking"
import { generateDocumentMetadata } from "../processing/chains"

const BUCKET_NAME = process.env.BOARD_DOCUMENTS_BUCKET || "board-documents"
const CHUNK_SIZE = 7500 // Optimized for text-embedding-3-large
const CHUNK_OVERLAP = 200

// Initialize the Unstructured client
const unstructuredClient = new UnstructuredClient({
  serverURL: process.env.UNSTRUCTURED_API_URL,
  security: {
    apiKeyAuth: process.env.UNSTRUCTURED_API_KEY
  }
})

// Tool for extracting and processing document content
export const extractContent = tool({
  description:
    "Extract and structure content from board documents with enhanced metadata",
  parameters: z.object({
    documentId: z.string(),
    documentType: z.enum([
      "board_minutes",
      "financial_report",
      "policy_document",
      "strategic_plan",
      "audit_report",
      "risk_assessment",
      "compliance_report"
    ]),
    userId: z.string()
  }),
  execute: async ({ documentId, documentType, userId }) => {
    try {
      // Get document from database
      const [doc] = await db
        .select()
        .from(documentsTable)
        .where(eq(documentsTable.id, documentId))

      if (!doc) throw new Error("Document not found")

      // Download file from Supabase
      const supabase = await getSupabaseClient()
      const path = new URL(doc.url).pathname.split(`${BUCKET_NAME}/`)[1]
      const { data: fileData, error: downloadError } = await supabase.storage
        .from(BUCKET_NAME)
        .download(path)

      if (downloadError || !fileData) {
        throw new Error(`Failed to download file: ${downloadError?.message}`)
      }

      // Process with Unstructured
      const response = await unstructuredClient.general.partition({
        partitionParameters: {
          files: {
            content: await fileData.arrayBuffer(),
            fileName: path.split("/").pop() || "document.pdf"
          },
          strategy: Strategy.HiRes,
          splitPdfPage: true,
          splitPdfAllowFailed: true,
          splitPdfConcurrencyLevel: 15,
          languages: ["eng"]
        }
      })

      if (response.statusCode !== 200 || !response.elements) {
        throw new Error("Failed to extract text from document")
      }

      // Structure the content based on document type
      const structuredContent = response.elements.map(element => ({
        type: element.metadata?.category || "unknown",
        pageNumber: element.metadata?.page_number,
        text: element.text,
        metadata: element.metadata
      }))

      // Combine text for metadata generation
      const combinedText = structuredContent.map(c => c.text).join("\n\n")

      // Generate enhanced metadata
      const { object: metadata } = await generateDocumentMetadata(
        combinedText,
        userId
      )

      // Split text into chunks for analysis
      const chunks = recursiveTextSplitter(combinedText, {
        chunkSize: CHUNK_SIZE,
        chunkOverlap: CHUNK_OVERLAP
      })

      return {
        documentId,
        documentType,
        content: structuredContent,
        metadata: {
          ...metadata,
          totalPages: Math.max(
            ...structuredContent.map(c => c.pageNumber || 0),
            0
          ),
          extractedAt: new Date().toISOString(),
          chunks: chunks.length
        },
        chunks
      }
    } catch (error) {
      console.error("Error extracting content:", error)
      throw error
    }
  }
})

// Tool for analyzing financial data with enhanced validation
export const analyzeFinancials = tool({
  description:
    "Analyze financial data for inconsistencies, trends, and regulatory compliance",
  parameters: z.object({
    content: z.array(
      z.object({
        type: z.string(),
        pageNumber: z.number().optional(),
        text: z.string(),
        metadata: z.any()
      })
    ),
    metrics: z.array(z.string()).optional(),
    region: z.string().optional(),
    companyId: z.string(),
    reportingPeriod: z.string().optional()
  }),
  execute: async ({
    content,
    metrics = [],
    region,
    companyId,
    reportingPeriod
  }) => {
    // Extract and validate financial data
    const financialData = content
      .map(section => {
        const matches = section.text.match(/\$?\d+([.,]\d{1,2})?%?/g) || []
        return matches.map(match => ({
          value: match,
          context: section.text.substring(
            Math.max(0, section.text.indexOf(match) - 50),
            section.text.indexOf(match) + match.length + 50
          ),
          pageNumber: section.pageNumber,
          category: section.type
        }))
      })
      .flat()

    // Group data by category for analysis
    const categorizedData = financialData.reduce(
      (acc, item) => {
        const category = item.category || "uncategorized"
        acc[category] = acc[category] || []
        acc[category].push(item)
        return acc
      },
      {} as Record<string, typeof financialData>
    )

    return {
      extractedData: financialData,
      categorizedData,
      analysis: {
        byCategory: Object.entries(categorizedData).map(([category, data]) => ({
          category,
          count: data.length,
          summary: `Found ${data.length} financial figures in ${category}`
        })),
        potentialIssues: [], // To be implemented with specific validation rules
        recommendations: [] // To be implemented with specific recommendations
      },
      metadata: {
        companyId,
        region,
        reportingPeriod,
        processedAt: new Date().toISOString()
      }
    }
  }
})

// Tool for checking compliance with enhanced regional support
export const checkCompliance = tool({
  description:
    "Check document against compliance policies and regulations with regional context",
  parameters: z.object({
    content: z.array(
      z.object({
        type: z.string(),
        pageNumber: z.number().optional(),
        text: z.string(),
        metadata: z.any()
      })
    ),
    policyType: z.enum(["governance", "financial", "regulatory"]),
    region: z.string(),
    companyId: z.string(),
    documentType: z.string()
  }),
  execute: async ({ content, policyType, region, companyId, documentType }) => {
    // This would be expanded with actual compliance rules
    return {
      compliant: true,
      findings: [],
      recommendations: [],
      metadata: {
        companyId,
        region,
        policyType,
        documentType,
        checkedAt: new Date().toISOString()
      }
    }
  }
})

// Tool for submitting findings with enhanced categorization
export const submitFindings = tool({
  description: "Submit findings from document analysis",
  parameters: z.object({
    analysisId: z.string().uuid(),
    findings: z.array(
      z.object({
        type: z.enum([
          "inconsistency",
          "missing_information",
          "compliance_issue",
          "financial_discrepancy",
          "risk_flag",
          "action_required",
          "policy_violation"
        ]),
        severity: z.enum(["info", "low", "medium", "high", "critical"]),
        title: z.string(),
        description: z.string(),
        location: z.string().optional(),
        context: z.string().optional(),
        suggestedAction: z.string().optional(),
        metadata: z.record(z.any()).optional()
      })
    )
  }),
  execute: async ({
    analysisId,
    findings
  }: {
    analysisId: string
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
      metadata?: Record<string, any>
    }>
  }) => {
    try {
      const insertedFindings = await Promise.all(
        findings.map(finding =>
          db
            .insert(findingsTable)
            .values({
              analysisId,
              type: finding.type,
              severity: finding.severity,
              status: "open",
              title: finding.title,
              description: finding.description,
              location: finding.location,
              context: finding.context,
              suggestedAction: finding.suggestedAction,
              metadata: finding.metadata
            })
            .returning()
        )
      )

      return {
        success: true,
        message: `Successfully submitted ${findings.length} findings`,
        findings: insertedFindings
      }
    } catch (error) {
      console.error("Error submitting findings:", error)
      return {
        success: false,
        message: "Failed to submit findings",
        error: error instanceof Error ? error.message : "Unknown error"
      }
    }
  }
})

export const tools = {
  extractContent,
  analyzeFinancials,
  checkCompliance,
  submitFindings
}
