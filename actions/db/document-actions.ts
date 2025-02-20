import { db } from "@/db/db"
import {
  documentsTable,
  InsertDocument,
  type SelectDocument,
  analysisTable
} from "@/db/schema"
import { ActionState } from "@/types"
import { eq, desc } from "drizzle-orm"

// Document Management Functions
export async function getDocumentsByUser(
  userId: string
): Promise<SelectDocument[]> {
  return await db
    .select()
    .from(documentsTable)
    .where(eq(documentsTable.userId, userId))
    .orderBy(desc(documentsTable.createdAt))
}

export async function insertDocument(
  params: InsertDocument
): Promise<SelectDocument> {
  const [newDoc] = await db.insert(documentsTable).values(params).returning()
  return newDoc
}

export async function deleteDocumentById(documentId: string): Promise<void> {
  // First, delete all related analysis
  const analysisToDelete = await db
    .select()
    .from(analysisTable)
    .where(eq(analysisTable.documentId, documentId))
  /* 
    for (const analysis of analysisToDelete) {
      // Delete related observations
      await db
        .delete(schema.observations)
        .where(eq(schema.observations.analysisId, analysis.analysisId));
  
      // Delete related reports
      await db
        .delete(schema.reports)
        .where(eq(schema.reports.analysisId, analysis.analysisId));
  
      // Delete related observability traces
      await db
        .delete(schema.observabilityTraces)
        .where(eq(schema.observabilityTraces.analysisId, analysis.analysisId));
    }
  
    // Delete the analysis records
    await db
      .delete(schema.analysis)
      .where(eq(schema.analysis.documentId, documentId)); */

  // Finally, delete the document
  await db.delete(documentsTable).where(eq(documentsTable.id, documentId))
}

export async function getDocumentById(
  documentId: string
): Promise<SelectDocument | undefined> {
  const [doc] = await db
    .select()
    .from(documentsTable)
    .where(eq(documentsTable.id, documentId))
  return doc
}

export async function getDocumentsByCompanyId(
  companyId: string
): Promise<SelectDocument[]> {
  return await db
    .select()
    .from(documentsTable)
    .where(eq(documentsTable.companyId, companyId))
    .orderBy(desc(documentsTable.createdAt))
}
