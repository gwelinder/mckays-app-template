import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { getSupabaseClient } from "@/lib/supabase-client"
import { validateFile } from "../../process/validation"

const BUCKET_NAME = process.env.BOARD_DOCUMENTS_BUCKET || "board-documents"

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

    return NextResponse.json({
      success: true,
      data: {
        url: publicUrl,
        path: filePath,
        size: file.size,
        type: file.type
      }
    })
  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to upload file"
      },
      { status: 500 }
    )
  }
}
