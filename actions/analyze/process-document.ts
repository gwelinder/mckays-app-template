import { getSupabaseClient } from "@/lib/supabase-client"
import { google } from "@ai-sdk/google"
import { streamObject } from "ai"
import { ActionState } from "@/types"
import { UnstructuredClient } from "unstructured-client"
import { Strategy } from "unstructured-client/sdk/models/shared"
import { z } from "zod"

const BUCKET_NAME = process.env.BOARD_DOCUMENTS_BUCKET || "board-documents"

// Initialize the Unstructured client
const unstructuredClient = new UnstructuredClient({
  serverURL: process.env.UNSTRUCTURED_API_URL,
  security: {
    apiKeyAuth: process.env.UNSTRUCTURED_API_KEY
  }
})

// Supported file types
export const SUPPORTED_FILE_TYPES = ["pdf", "xlsx", "docx", "pptx"] as const
export type SupportedFileType = (typeof SUPPORTED_FILE_TYPES)[number]

interface ProcessDocumentInput {
  filePaths: string[]
  prompt: string
}

interface ExtractedElement {
  type: string
  text: string
  metadata: {
    page_number?: number
    filename?: string
    category?: string
    [key: string]: any
  }
}

interface ProcessedDocument {
  fileName: string
  fileData: Blob
  extractedText: string
  metadata: {
    fileType: SupportedFileType
    totalPages?: number
    totalSheets?: number
    totalTables?: number
    [key: string]: any
  }
}

function getFileType(fileName: string): SupportedFileType {
  const extension = fileName.split(".").pop()?.toLowerCase()
  if (
    !extension ||
    !SUPPORTED_FILE_TYPES.includes(extension as SupportedFileType)
  ) {
    throw new Error(`Unsupported file type: ${extension}`)
  }
  return extension as SupportedFileType
}

// Analysis result schema
export const analysisSchema = z.object({
  executiveSummary: z.string(),
  keyFindings: z.array(
    z.object({
      description: z.string(),
      severity: z.enum(["critical", "high", "medium", "low"]),
      status: z.literal("open")
    })
  ),
  recommendations: z.array(z.string())
})

export type AnalysisResult = z.infer<typeof analysisSchema>

export async function processDocumentAction({
  filePaths,
  prompt
}: ProcessDocumentInput): Promise<ActionState<{ stream: Response }>> {
  try {
    const supabase = await getSupabaseClient()

    // Process each file
    const processedFiles = await Promise.all(
      filePaths.map(async filePath => {
        // Clean the file path
        const cleanPath = filePath.includes("/storage/v1/object/public/")
          ? new URL(filePath).pathname
              .split("/storage/v1/object/public/")[1]
              .split("/")
              .slice(1)
              .join("/")
          : filePath

        // Download the file
        const { data: fileData, error: downloadError } = await supabase.storage
          .from(BUCKET_NAME)
          .download(cleanPath)

        if (downloadError || !fileData) {
          console.error("Download error:", downloadError)
          throw new Error(`Failed to download file: ${cleanPath}`)
        }

        const fileName = cleanPath.split("/").pop() || "document"
        const fileType = getFileType(fileName)

        // Process with Unstructured
        const unstructuredResponse = await unstructuredClient.general.partition(
          {
            partitionParameters: {
              files: {
                content: await fileData.arrayBuffer(),
                fileName
              },
              strategy: Strategy.HiRes,
              // Format-specific settings
              ...(fileType === "xlsx" && {
                // XLSX specific settings
                preserveFormulas: true,
                extractCellFormats: true,
                includeHeaderFooter: true
              }),
              ...(fileType === "docx" && {
                // DOCX specific settings
                preserveFormatting: true,
                includeHeaderFooter: true,
                extractImages: true
              }),
              splitPdfPage: fileType === "pdf",
              splitPdfAllowFailed: fileType === "pdf",
              splitPdfConcurrencyLevel: fileType === "pdf" ? 15 : undefined,
              languages: ["eng"]
            }
          }
        )

        if (
          unstructuredResponse.statusCode !== 200 ||
          !unstructuredResponse.elements
        ) {
          console.error("Unstructured error:", unstructuredResponse)
          throw new Error(`Failed to extract text from file: ${cleanPath}`)
        }

        // Format-specific metadata extraction
        const metadata: ProcessedDocument["metadata"] = {
          fileType,
          fileName
        }

        // Process elements based on file type
        const elements = unstructuredResponse.elements as ExtractedElement[]
        const processedElements = elements.map(element => {
          let formattedText = element.text

          // Format-specific element processing
          switch (fileType) {
            case "xlsx":
              if (element.metadata?.sheet_name) {
                formattedText = `[Sheet: ${element.metadata.sheet_name}] ${formattedText}`
              }
              if (element.metadata?.cell_format) {
                metadata.hasCellFormatting = true
              }
              break
            case "docx":
              if (element.metadata?.style_name) {
                metadata.hasStyleFormatting = true
              }
              break
          }

          return {
            ...element,
            text: formattedText
          }
        })

        // Update metadata based on file type
        switch (fileType) {
          case "xlsx":
            metadata.totalSheets = new Set(
              elements.map(e => e.metadata?.sheet_name)
            ).size
            metadata.totalTables = elements.filter(
              e => e.type === "table"
            ).length
            break
          case "pdf":
          case "docx":
            metadata.totalPages = Math.max(
              ...elements.map(e => e.metadata?.page_number || 0),
              0
            )
            break
        }

        return {
          fileName,
          fileData,
          metadata,
          extractedText: processedElements
            .map(element => {
              const location =
                fileType === "xlsx"
                  ? `[File: ${fileName}, Sheet: ${element.metadata?.sheet_name || "unknown"}]`
                  : `[File: ${fileName}, Page: ${element.metadata?.page_number || "unknown"}]`

              return `${location} [${element.metadata?.category || "unknown"}]: ${element.text}`
            })
            .join("\n\n")
        }
      })
    )

    // Combine all extracted text with metadata
    const combinedText = processedFiles
      .map(file => {
        const metadataStr = Object.entries(file.metadata)
          .map(([key, value]) => `${key}: ${value}`)
          .join(", ")
        return `=== Document: ${file.fileName} ===\nMetadata: ${metadataStr}\n\nContent:\n${file.extractedText}`
      })
      .join("\n\n=== Next Document ===\n\n")

    // Stream the analysis using Gemini
    const stream = await streamObject({
      model: google("gemini-2.0-flash"),
      schema: analysisSchema,
      output: "array",
      messages: [
        {
          role: "user",
          content: [
            ...(await Promise.all(
              processedFiles.map(async file => ({
                type: "file" as const,
                mimeType: `application/${file.metadata.fileType}`,
                data: await file.fileData.arrayBuffer()
              }))
            )),
            {
              type: "text",
              text: `${prompt}\n\nAnalyze the following documents together:\n${combinedText}`
            }
          ]
        }
      ]
    })

    // Return the streaming response
    return {
      isSuccess: true,
      message: "Documents processed successfully",
      data: {
        stream: stream.toTextStreamResponse()
      }
    }
  } catch (error) {
    console.error("Error processing documents:", error)
    return {
      isSuccess: false,
      message:
        error instanceof Error ? error.message : "Failed to process documents"
    }
  }
}
