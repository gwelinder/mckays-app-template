"use server"

import { db } from "@/db/db"
import { documentsTable, type SelectDocument } from "@/db/schema"
import { eq } from "drizzle-orm"
import { auth } from "@clerk/nextjs/server"
import { ActionState } from "@/types"

export async function getDocumentsByCompany(
  companyId: string
): Promise<SelectDocument[]> {
  const { userId } = await auth()
  if (!userId) throw new Error("Unauthorized")

  return db
    .select()
    .from(documentsTable)
    .where(eq(documentsTable.companyId, companyId))
}

export async function deleteDocumentsByCompany(
  companyId: string
): Promise<ActionState<void>> {
  try {
    const { userId } = await auth()
    if (!userId) throw new Error("Unauthorized")

    await db
      .delete(documentsTable)
      .where(eq(documentsTable.companyId, companyId))

    return {
      isSuccess: true,
      message: "Documents deleted successfully",
      data: undefined
    }
  } catch (error) {
    console.error("Error deleting documents:", error)
    return {
      isSuccess: false,
      message:
        error instanceof Error ? error.message : "Failed to delete documents"
    }
  }
}
