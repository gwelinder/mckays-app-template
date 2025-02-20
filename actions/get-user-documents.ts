"use server"

import { auth } from "@clerk/nextjs/server"
import { getSupabaseClient } from "@/lib/supabase-client"

export async function getUserDocuments(companyId: string) {
  const session = await auth()

  if (!session || !session.userId) {
    throw new Error("User not authenticated")
  }

  const supabase = await getSupabaseClient()

  const { data, error } = await supabase.storage
    .from("documents")
    .list(`${session.userId}/${companyId}`)

  if (error) {
    console.error("Error fetching files:", error)
    throw new Error("Failed to fetch files")
  }

  return data.map(file => ({
    url: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/documents/${session.userId}/${companyId}/${file.name}`,
    pathname: file.name,
    size: file.metadata?.size || 0,
    uploadedAt: file.created_at
  }))
}
