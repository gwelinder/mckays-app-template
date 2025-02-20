"use server"

import { db } from "@/db/db"
import {
  documentsTable,
  documentVersionsTable,
  type InsertDocument,
  type SelectDocument,
  type SelectDocumentVersion
} from "@/db/schema"
import { analysisTable, findingsTable } from "@/db/schema/analysis-schema"
import { ActionState } from "@/types"
import { eq, and, desc } from "drizzle-orm"
import { auth } from "@clerk/nextjs/server"
import { getSupabaseClient } from "@/lib/supabase-client"

const BUCKET_NAME = process.env.BOARD_DOCUMENTS_BUCKET || "board-documents"

export async function createBoardDocumentAction(
  params: InsertDocument
): Promise<ActionState<SelectDocument>> {
  try {
    const { userId } = await auth()
    if (!userId) throw new Error("Unauthorized")

    const [newDoc] = await db
      .insert(documentsTable)
      .values({ ...params, userId })
      .returning()

    return {
      isSuccess: true,
      message: "Document created successfully",
      data: newDoc
    }
  } catch (error) {
    console.error("Error creating document:", error)
    return {
      isSuccess: false,
      message:
        error instanceof Error ? error.message : "Failed to create document"
    }
  }
}

export async function getBoardDocumentsByCompanyAction(
  companyId: string
): Promise<ActionState<SelectDocument[]>> {
  try {
    const { userId } = await auth()
    if (!userId) throw new Error("Unauthorized")

    const documents = await db
      .select()
      .from(documentsTable)
      .where(
        and(
          eq(documentsTable.companyId, companyId),
          eq(documentsTable.userId, userId)
        )
      )
      .orderBy(desc(documentsTable.createdAt))

    return {
      isSuccess: true,
      message: "Documents retrieved successfully",
      data: documents
    }
  } catch (error) {
    console.error("Error retrieving documents:", error)
    return {
      isSuccess: false,
      message:
        error instanceof Error ? error.message : "Failed to retrieve documents"
    }
  }
}

export async function updateBoardDocumentAction(
  id: string,
  data: Partial<InsertDocument>
): Promise<ActionState<SelectDocument>> {
  try {
    const { userId } = await auth()
    if (!userId) throw new Error("Unauthorized")

    const [updatedDoc] = await db
      .update(documentsTable)
      .set(data)
      .where(and(eq(documentsTable.id, id), eq(documentsTable.userId, userId)))
      .returning()

    if (!updatedDoc) throw new Error("Document not found or unauthorized")

    return {
      isSuccess: true,
      message: "Document updated successfully",
      data: updatedDoc
    }
  } catch (error) {
    console.error("Error updating document:", error)
    return {
      isSuccess: false,
      message:
        error instanceof Error ? error.message : "Failed to update document"
    }
  }
}

export async function deleteBoardDocumentAction(
  id: string
): Promise<ActionState<void>> {
  try {
    const { userId } = await auth()
    if (!userId) throw new Error("Unauthorized")

    // Get document to check ownership and get URL
    const [doc] = await db
      .select()
      .from(documentsTable)
      .where(and(eq(documentsTable.id, id), eq(documentsTable.userId, userId)))

    if (!doc) throw new Error("Document not found or unauthorized")

    // Delete from storage
    const supabase = await getSupabaseClient()
    const path = new URL(doc.url).pathname.split(`${BUCKET_NAME}/`)[1]
    const { error: storageError } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([path])

    if (storageError) throw storageError

    // Delete from database (this will cascade to versions and analysis)
    await db
      .delete(documentsTable)
      .where(and(eq(documentsTable.id, id), eq(documentsTable.userId, userId)))

    return {
      isSuccess: true,
      message: "Document deleted successfully",
      data: undefined
    }
  } catch (error) {
    console.error("Error deleting document:", error)
    return {
      isSuccess: false,
      message:
        error instanceof Error ? error.message : "Failed to delete document"
    }
  }
}

export async function createDocumentVersionAction(
  documentId: string,
  version: string,
  url: string,
  metadata: any
): Promise<ActionState<void>> {
  try {
    const { userId } = await auth()
    if (!userId) throw new Error("Unauthorized")

    await db.insert(documentVersionsTable).values({
      documentId,
      version,
      url,
      metadata,
      createdBy: userId
    })

    return {
      isSuccess: true,
      message: "Document version created successfully",
      data: undefined
    }
  } catch (error) {
    console.error("Error creating document version:", error)
    return {
      isSuccess: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to create document version"
    }
  }
}

export async function getDocumentVersionsAction(
  documentId: string
): Promise<ActionState<SelectDocumentVersion[]>> {
  try {
    const { userId } = await auth()
    if (!userId) throw new Error("Unauthorized")

    const versions = await db
      .select()
      .from(documentVersionsTable)
      .where(eq(documentVersionsTable.documentId, documentId))
      .orderBy(desc(documentVersionsTable.createdAt))

    return {
      isSuccess: true,
      message: "Document versions retrieved successfully",
      data: versions
    }
  } catch (error) {
    console.error("Error retrieving document versions:", error)
    return {
      isSuccess: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to retrieve document versions"
    }
  }
}
