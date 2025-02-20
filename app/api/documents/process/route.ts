import { NextResponse } from "next/server"
import { validateFile } from "./validation"
import { extractText, formatExtractedText } from "./extraction"
import { auth } from "@clerk/nextjs/server"
import { getSupabaseClient } from "@/lib/supabase-client"
import { createBoardDocumentAction } from "@/actions/db/board-document-actions"
import { documentTypeEnum } from "@/db/schema"
import {
  generateDocumentMetadata,
  preliminaryAnswerChainAgent
} from "@/actions/documents/processing/chains"
import { recursiveTextSplitter } from "@/actions/documents/processing/chunking"

const BUCKET_NAME = process.env.BOARD_DOCUMENTS_BUCKET || "board-documents"
const CHUNK_SIZE = 7500 // Optimized for text-embedding-3-large
const CHUNK_OVERLAP = 200

// Map file types to document types
const fileTypeToDocType: Record<
  string,
  (typeof documentTypeEnum.enumValues)[number]
> = {
  pdf: "report",
  xlsx: "financial",
  docx: "report",
  pptx: "report"
}

export async function POST(req: Request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get file and metadata from request
    const formData = await req.formData()
    const file = formData.get("file") as File | null
    const companyId = formData.get("companyId") as string | null

    if (!file || !companyId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // Validate file
    const validationResult = await validateFile(file)
    if (!validationResult.isValid) {
      return NextResponse.json(
        { error: validationResult.error },
        { status: 400 }
      )
    }

    // Extract text and metadata using Unstructured
    const extractionResult = await extractText(file, file.name)
    const formattedText = formatExtractedText(extractionResult)

    // Generate document metadata using LLM
    const { object: metadata } = await generateDocumentMetadata(
      formattedText,
      userId
    )

    // Split text into chunks for analysis
    const chunks = recursiveTextSplitter(formattedText, {
      chunkSize: CHUNK_SIZE,
      chunkOverlap: CHUNK_OVERLAP
    })

    // Process chunks with preliminary analysis
    const analysisResults = await Promise.all(
      chunks.map(async chunk => {
        const { object } = await preliminaryAnswerChainAgent(chunk, userId)
        return object
      })
    )

    // Upload to storage
    const supabase = await getSupabaseClient()
    const filePath = `${userId}/${companyId}/${file.name}`

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, file, {
        upsert: false,
        contentType: file.type
      })

    if (uploadError) {
      console.error("Upload error:", uploadError)
      return NextResponse.json(
        { error: "Failed to upload file" },
        { status: 500 }
      )
    }

    // Get public URL
    const {
      data: { publicUrl }
    } = supabase.storage.from(BUCKET_NAME).getPublicUrl(filePath)

    // Create document record with enhanced metadata
    const result = await createBoardDocumentAction({
      companyId,
      userId,
      name: file.name,
      type: fileTypeToDocType[extractionResult.metadata.fileType] || "other",
      url: publicUrl,
      status: "processing",
      metadata: {
        ...extractionResult.metadata,
        ...metadata,
        extractedElements: extractionResult.elements.length,
        processingDate: new Date().toISOString(),
        chunks: chunks.length,
        analysis: analysisResults.map(result => ({
          preliminary_answers: [
            result.preliminary_answer_1,
            result.preliminary_answer_2
          ],
          tags: result.tags,
          hypothetical_questions: [
            result.hypothetical_question_1,
            result.hypothetical_question_2
          ]
        }))
      }
    })

    if (!result.isSuccess) {
      // Cleanup uploaded file if database insert fails
      await supabase.storage.from(BUCKET_NAME).remove([filePath])
      return NextResponse.json({ error: result.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: {
        document: result.data,
        extraction: {
          elements: extractionResult.elements,
          metadata: {
            ...extractionResult.metadata,
            ...metadata
          }
        },
        analysis: analysisResults
      }
    })
  } catch (error) {
    console.error("Processing error:", error)
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to process document"
      },
      { status: 500 }
    )
  }
}
