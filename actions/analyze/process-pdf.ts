"use server"

import { getSupabaseClient } from "@/lib/supabase-client"
import { google } from "@ai-sdk/google"
import { generateText } from "ai"
import { ActionState } from "@/types"
import { UnstructuredClient } from "unstructured-client"
import { Strategy } from "unstructured-client/sdk/models/shared"

const BUCKET_NAME = process.env.PDF_BUCKET_NAME || "pdf-uploads"

// Initialize the Unstructured client
const unstructuredClient = new UnstructuredClient({
  serverURL: process.env.UNSTRUCTURED_API_URL,
  security: {
    apiKeyAuth: process.env.UNSTRUCTURED_API_KEY
  }
})

export async function processPdfAction(
  filePath: string,
  prompt: string
): Promise<ActionState<{ report: string }>> {
  try {
    // 1. Get authenticated Supabase client
    const supabase = await getSupabaseClient()

    // 2. Download the file
    const { data: fileData, error: downloadError } = await supabase.storage
      .from(BUCKET_NAME)
      .download(filePath)

    if (downloadError || !fileData) {
      console.error("Download error:", downloadError)
      throw new Error("Failed to download file from storage")
    }

    // 3. Process with Unstructured using the client library
    const unstructuredResponse = await unstructuredClient.general.partition({
      partitionParameters: {
        files: {
          content: await fileData.arrayBuffer(),
          fileName: filePath.split("/").pop() || "document.pdf"
        },
        strategy: Strategy.HiRes,
        splitPdfPage: true,
        splitPdfAllowFailed: true,
        splitPdfConcurrencyLevel: 15,
        languages: ["eng"]
      }
    })

    if (
      unstructuredResponse.statusCode !== 200 ||
      !unstructuredResponse.elements
    ) {
      console.error("Unstructured error:", unstructuredResponse)
      throw new Error("Failed to extract text from PDF")
    }

    // 4. Process the structured elements
    const extractedText = unstructuredResponse.elements
      .map(element => {
        // Include metadata about the element's location in the document
        return `[Page ${element.metadata?.page_number || "unknown"}, ${
          element.metadata?.category || "unknown"
        }]: ${element.text}`
      })
      .join("\n\n")

    // 5. Process with Gemini using both PDF and structured text
    const result = await generateText({
      model: google("gemini-2.0-flash"),
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `${prompt}\n\nStructured document content:\n${extractedText}`
            },
            {
              type: "file",
              mimeType: "application/pdf",
              data: await fileData.arrayBuffer()
            }
          ]
        }
      ]
    })

    return {
      isSuccess: true,
      message: "PDF processed successfully",
      data: { report: result.text }
    }
  } catch (error) {
    console.error("Error processing PDF:", error)
    return {
      isSuccess: false,
      message: error instanceof Error ? error.message : "Failed to process PDF"
    }
  }
}
