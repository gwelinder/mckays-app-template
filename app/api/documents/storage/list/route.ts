import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { getSupabaseClient } from "@/lib/supabase-client"
import { getBoardDocumentsByCompanyAction } from "@/actions/db/board-document-actions"

const BUCKET_NAME = process.env.BOARD_DOCUMENTS_BUCKET || "board-documents"

export async function GET(req: Request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get company ID from URL
    const { searchParams } = new URL(req.url)
    const companyId = searchParams.get("companyId")

    if (!companyId) {
      return NextResponse.json({ error: "Missing company ID" }, { status: 400 })
    }

    // Get documents from database
    const result = await getBoardDocumentsByCompanyAction(companyId)
    if (!result.isSuccess) {
      return NextResponse.json({ error: result.message }, { status: 500 })
    }

    // Get storage files
    const supabase = await getSupabaseClient()
    const { data: files, error: listError } = await supabase.storage
      .from(BUCKET_NAME)
      .list(`${userId}/${companyId}`)

    if (listError) {
      console.error("List error:", listError)
      return NextResponse.json(
        { error: "Failed to list files" },
        { status: 500 }
      )
    }

    // Combine database and storage information
    const documents = result.data.map(doc => {
      const file = files?.find(f => f.name === doc.name)
      return {
        ...doc,
        size: file?.metadata?.size || 0,
        lastModified: file?.metadata?.lastModified || doc.updatedAt,
        storageMetadata: file?.metadata || {}
      }
    })

    return NextResponse.json({
      success: true,
      data: documents
    })
  } catch (error) {
    console.error("List error:", error)
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to list documents"
      },
      { status: 500 }
    )
  }
}
