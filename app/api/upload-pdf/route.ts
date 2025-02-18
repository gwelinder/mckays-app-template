"use server"

import { auth } from "@clerk/nextjs/server"
import { uploadPdfStorageAction } from "@/actions/storage/upload-pdf"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  try {
    // Verify authentication
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await req.formData()
    const file = formData.get("file")

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "File not provided" }, { status: 400 })
    }

    const result = await uploadPdfStorageAction(file)
    return NextResponse.json(result)
  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
