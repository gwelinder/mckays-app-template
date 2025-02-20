import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { getSupabaseClient } from "@/lib/supabase-client"

const BUCKET_NAME = process.env.BOARD_DOCUMENTS_BUCKET || "board-documents"

export async function DELETE(req: Request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get file path from URL
    const { searchParams } = new URL(req.url)
    const filePath = searchParams.get("path")
    const companyId = searchParams.get("companyId")

    if (!filePath || !companyId) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      )
    }

    // Verify file belongs to user and company
    if (!filePath.startsWith(`${userId}/${companyId}/`)) {
      return NextResponse.json(
        { error: "Unauthorized access to file" },
        { status: 403 }
      )
    }

    // Delete from storage
    const supabase = await getSupabaseClient()
    const { error: deleteError } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([filePath])

    if (deleteError) {
      console.error("Delete error:", deleteError)
      return NextResponse.json(
        { error: "Failed to delete file" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        path: filePath
      }
    })
  } catch (error) {
    console.error("Delete error:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to delete file"
      },
      { status: 500 }
    )
  }
}
