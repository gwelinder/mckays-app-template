"use server"

import { getSupabaseClient } from "@/lib/supabase-client"
import { google } from "@ai-sdk/google"
import { generateText } from "ai"
import { ActionState } from "@/types"
import { UnstructuredClient } from "unstructured-client"
import { Strategy } from "unstructured-client/sdk/models/shared"

const BUCKET_NAME = process.env.BOARD_DOCUMENTS_BUCKET || "board-documents"

// Initialize the Unstructured client
const unstructuredClient = new UnstructuredClient({
  serverURL: process.env.UNSTRUCTURED_API_URL,
  security: {
    apiKeyAuth: process.env.UNSTRUCTURED_API_KEY
  }
})

interface ProcessPdfInput {
  filePaths: string[]
  prompt: string
}

export async function processPdfAction({
  filePaths,
  prompt
}: ProcessPdfInput): Promise<ActionState<{ report: string }>> {
  try {
    // 1. Get authenticated Supabase client
    const supabase = await getSupabaseClient()

    // 2. Process each file
    const processedFiles = await Promise.all(
      filePaths.map(async filePath => {
        // Clean the file path to ensure it's just the relative path
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

        // Process with Unstructured
        const unstructuredResponse = await unstructuredClient.general.partition(
          {
            partitionParameters: {
              files: {
                content: await fileData.arrayBuffer(),
                fileName: cleanPath.split("/").pop() || "document.pdf"
              },
              strategy: Strategy.HiRes,
              splitPdfPage: true,
              splitPdfAllowFailed: true,
              splitPdfConcurrencyLevel: 15,
              languages: ["dan"]
            }
          }
        )

        if (
          unstructuredResponse.statusCode !== 200 ||
          !unstructuredResponse.elements
        ) {
          console.error("Unstructured error:", unstructuredResponse)
          throw new Error(`Failed to extract text from PDF: ${cleanPath}`)
        }

        return {
          fileName: cleanPath.split("/").pop() || "document.pdf",
          fileData,
          extractedText: unstructuredResponse.elements
            .map(element => {
              return `[File: ${cleanPath.split("/").pop()}, Page ${
                element.metadata?.page_number || "unknown"
              }, ${element.metadata?.category || "unknown"}]: ${element.text}`
            })
            .join("\n\n")
        }
      })
    )

    // 3. Combine all extracted text
    const combinedText = processedFiles
      .map(file => file.extractedText)
      .join("\n\n=== Next Document ===\n\n")

    // 4. Process with Gemini
    const result = await generateText({
      model: google("gemini-2.0-flash"),
      messages: [
        {
          role: "user",
          content: [
            {
              type: "file",
              mimeType: "application/pdf",
              data: await processedFiles[0].fileData.arrayBuffer()
            },
            {
              type: "file",
              mimeType: "application/pdf",
              data: await processedFiles[1].fileData.arrayBuffer()
            },
            {
              type: "file",
              mimeType: "application/pdf",
              data: await processedFiles[2].fileData.arrayBuffer()
            },
            {
              type: "text",
              text: `${prompt}\n\nAnalyze the following documents together:\n${combinedText}`
            }
          ]
        }
      ]
    })

    return {
      isSuccess: true,
      message: "PDFs processed successfully",
      data: { report: result.text }
    }
  } catch (error) {
    console.error("Error processing PDFs:", error)
    return {
      isSuccess: false,
      message: error instanceof Error ? error.message : "Failed to process PDFs"
    }
  }
}
