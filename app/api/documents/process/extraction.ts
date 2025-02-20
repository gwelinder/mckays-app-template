import { UnstructuredClient } from "unstructured-client"
import { Strategy } from "unstructured-client/sdk/models/shared"
import { getFileType } from "./validation"
import type { SupportedFileType } from "@/actions/analyze/process-document"

// Initialize the Unstructured client
const unstructuredClient = new UnstructuredClient({
  serverURL: process.env.UNSTRUCTURED_API_URL,
  security: {
    apiKeyAuth: process.env.UNSTRUCTURED_API_KEY
  }
})

export interface ExtractedElement {
  type: string
  text: string
  metadata: {
    page_number?: number
    filename?: string
    category?: string
    sheet_name?: string
    cell_format?: any
    style_name?: string
    [key: string]: any
  }
}

export interface ExtractionResult {
  elements: ExtractedElement[]
  metadata: {
    fileType: SupportedFileType
    fileName: string
    totalPages?: number
    totalSheets?: number
    totalTables?: number
    hasCellFormatting?: boolean
    hasStyleFormatting?: boolean
    [key: string]: any
  }
}

export async function extractText(
  file: File | Blob,
  fileName: string
): Promise<ExtractionResult> {
  const fileType = getFileType(fileName)

  // Process with Unstructured
  const response = await unstructuredClient.general.partition({
    partitionParameters: {
      files: {
        content: await file.arrayBuffer(),
        fileName
      },
      strategy: Strategy.HiRes,
      // Format-specific settings
      ...(fileType === "xlsx" && {
        preserveFormulas: true,
        extractCellFormats: true,
        includeHeaderFooter: true
      }),
      ...(fileType === "docx" && {
        preserveFormatting: true,
        includeHeaderFooter: true,
        extractImages: true
      }),
      splitPdfPage: fileType === "pdf",
      splitPdfAllowFailed: fileType === "pdf",
      splitPdfConcurrencyLevel: fileType === "pdf" ? 15 : undefined,
      languages: ["eng"]
    }
  })

  if (response.statusCode !== 200 || !response.elements) {
    throw new Error(`Failed to extract text from file: ${fileName}`)
  }

  // Format-specific metadata extraction
  const metadata: ExtractionResult["metadata"] = {
    fileType,
    fileName
  }

  // Process elements based on file type
  const elements = response.elements.map(element => {
    const extractedElement: ExtractedElement = {
      type: element.type || "unknown",
      text: element.text,
      metadata: {
        ...element.metadata,
        category: element.metadata?.category || "unknown"
      }
    }

    // Format-specific element processing
    switch (fileType) {
      case "xlsx":
        if (extractedElement.metadata?.sheet_name) {
          extractedElement.text = `[Sheet: ${extractedElement.metadata.sheet_name}] ${extractedElement.text}`
        }
        if (extractedElement.metadata?.cell_format) {
          metadata.hasCellFormatting = true
        }
        break
      case "docx":
        if (extractedElement.metadata?.style_name) {
          metadata.hasStyleFormatting = true
        }
        break
    }

    return extractedElement
  })

  // Update metadata based on file type
  switch (fileType) {
    case "xlsx":
      metadata.totalSheets = new Set(
        elements.map(e => e.metadata?.sheet_name)
      ).size
      metadata.totalTables = elements.filter(e => e.type === "table").length
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
    elements,
    metadata
  }
}

export function formatExtractedText(result: ExtractionResult): string {
  const { elements, metadata } = result

  const metadataStr = Object.entries(metadata)
    .map(([key, value]) => `${key}: ${value}`)
    .join(", ")

  const formattedElements = elements.map(element => {
    const location =
      metadata.fileType === "xlsx"
        ? `[File: ${metadata.fileName}, Sheet: ${element.metadata?.sheet_name || "unknown"}]`
        : `[File: ${metadata.fileName}, Page: ${element.metadata?.page_number || "unknown"}]`

    return `${location} [${element.metadata?.category || "unknown"}]: ${element.text}`
  })

  return `=== Document: ${metadata.fileName} ===\nMetadata: ${metadataStr}\n\nContent:\n${formattedElements.join("\n\n")}`
}
