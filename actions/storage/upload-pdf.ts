"use server"

import { getSupabaseClient } from "@/lib/supabase-client"
import { ActionState } from "@/types"
import { auth } from "@clerk/nextjs/server"

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_TYPES = ["application/pdf"]
const BUCKET_NAME = process.env.BOARD_DOCUMENTS_BUCKET || "board-documents"

function validateFile(file: File): boolean {
  if (file.size > MAX_FILE_SIZE) {
    throw new Error("File size exceeds limit")
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error("Only PDF files are allowed")
  }
  return true
}

export async function uploadPdfStorageAction(
  file: File
): Promise<ActionState<{ path: string }>> {
  try {
    // Get the authenticated user's ID
    const { userId } = await auth()
    if (!userId) {
      throw new Error("Unauthorized")
    }

    validateFile(file)

    // Use the new helper to get an authenticated client
    const supabase = await getSupabaseClient()

    // Create a path that includes the user ID as the first segment
    const timestamp = new Date().toISOString()
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_")
    const fileName = `${userId}/documents/${timestamp}-${sanitizedFileName}`

    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(fileName, file, {
        upsert: false,
        contentType: "application/pdf"
      })

    if (error) {
      console.error("Supabase storage error:", error)
      throw error
    }

    return {
      isSuccess: true,
      message: "File uploaded successfully",
      data: { path: data.path }
    }
  } catch (error) {
    console.error("Error uploading file:", error)
    return {
      isSuccess: false,
      message: error instanceof Error ? error.message : "Failed to upload file"
    }
  }
}
