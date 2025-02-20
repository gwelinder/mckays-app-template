"use server"

import { db } from "@/db/db"
import {
  InsertTrendAnalysis,
  SelectTrendAnalysis,
  trendAnalysesTable
} from "@/db/schema"
import { ActionState } from "@/types"
import { eq } from "drizzle-orm"

export async function createTrendAnalysisAction(
  analysis: InsertTrendAnalysis
): Promise<ActionState<SelectTrendAnalysis>> {
  try {
    const [newAnalysis] = await db
      .insert(trendAnalysesTable)
      .values(analysis)
      .returning()

    return {
      isSuccess: true,
      message: "Trend analysis created successfully",
      data: newAnalysis
    }
  } catch (error) {
    console.error("Error creating trend analysis:", error)
    return { isSuccess: false, message: "Failed to create trend analysis" }
  }
}

export async function getTrendAnalysesAction(
  companyId: string
): Promise<ActionState<SelectTrendAnalysis[]>> {
  try {
    const analyses = await db.query.trendAnalyses.findMany({
      where: eq(trendAnalysesTable.companyId, companyId),
      orderBy: trendAnalyses => [trendAnalyses.createdAt]
    })

    return {
      isSuccess: true,
      message: "Trend analyses retrieved successfully",
      data: analyses
    }
  } catch (error) {
    console.error("Error getting trend analyses:", error)
    return { isSuccess: false, message: "Failed to get trend analyses" }
  }
}

export async function updateTrendAnalysisAction(
  id: string,
  data: Partial<InsertTrendAnalysis>
): Promise<ActionState<SelectTrendAnalysis>> {
  try {
    const [updatedAnalysis] = await db
      .update(trendAnalysesTable)
      .set(data)
      .where(eq(trendAnalysesTable.id, id))
      .returning()

    return {
      isSuccess: true,
      message: "Trend analysis updated successfully",
      data: updatedAnalysis
    }
  } catch (error) {
    console.error("Error updating trend analysis:", error)
    return { isSuccess: false, message: "Failed to update trend analysis" }
  }
}

export async function deleteTrendAnalysisAction(
  id: string
): Promise<ActionState<void>> {
  try {
    await db.delete(trendAnalysesTable).where(eq(trendAnalysesTable.id, id))
    return {
      isSuccess: true,
      message: "Trend analysis deleted successfully",
      data: undefined
    }
  } catch (error) {
    console.error("Error deleting trend analysis:", error)
    return { isSuccess: false, message: "Failed to delete trend analysis" }
  }
}
