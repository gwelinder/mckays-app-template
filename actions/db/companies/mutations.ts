"use server"

import { db } from "@/db/db"
import {
  companiesTable,
  type InsertCompany,
  type SelectCompany
} from "@/db/schema"
import { profilesTable } from "@/db/schema"
import { eq, and } from "drizzle-orm"
import { auth } from "@clerk/nextjs/server"
import { ActionState } from "@/types"
import {
  deleteDocumentById,
  getDocumentsByCompanyId
} from "@/actions/db/document-actions"

export async function createCompany(
  data: InsertCompany
): Promise<ActionState<SelectCompany>> {
  try {
    const { userId } = await auth()
    if (!userId) {
      return {
        isSuccess: false,
        message: "Unauthorized: User not authenticated"
      }
    }

    // Ensure userId is set to the authenticated user
    const companyData = {
      ...data,
      userId
    }

    const [newCompany] = await db
      .insert(companiesTable)
      .values(companyData)
      .returning()

    return {
      isSuccess: true,
      message: "Company created successfully",
      data: newCompany
    }
  } catch (error) {
    console.error("Error creating company:", error)
    return {
      isSuccess: false,
      message: "Failed to create company"
    }
  }
}

export async function updateCompany(
  companyId: string,
  data: Partial<InsertCompany>
): Promise<ActionState<SelectCompany>> {
  try {
    const { userId } = await auth()
    if (!userId) {
      return {
        isSuccess: false,
        message: "Unauthorized: User not authenticated"
      }
    }

    const [updatedCompany] = await db
      .update(companiesTable)
      .set({ ...data, updatedAt: new Date() })
      .where(
        and(eq(companiesTable.id, companyId), eq(companiesTable.userId, userId))
      )
      .returning()

    if (!updatedCompany) {
      return {
        isSuccess: false,
        message: "Company not found or access denied"
      }
    }

    return {
      isSuccess: true,
      message: "Company updated successfully",
      data: updatedCompany
    }
  } catch (error) {
    console.error("Error updating company:", error)
    return {
      isSuccess: false,
      message: "Failed to update company"
    }
  }
}

export async function deleteCompany(
  companyId: string
): Promise<ActionState<void>> {
  try {
    const { userId } = await auth()
    if (!userId) {
      return {
        isSuccess: false,
        message: "Unauthorized: User not authenticated"
      }
    }

    // Check if user owns the company
    const [company] = await db
      .select()
      .from(companiesTable)
      .where(
        and(eq(companiesTable.id, companyId), eq(companiesTable.userId, userId))
      )

    if (!company) {
      return {
        isSuccess: false,
        message: "Company not found or access denied"
      }
    }

    // First, update all profiles to remove this company
    await db
      .update(profilesTable)
      .set({ companyId: null })
      .where(eq(profilesTable.companyId, companyId))

    // Delete all documents for this company
    const documentsToDelete = await getDocumentsByCompanyId(companyId)
    for (const doc of documentsToDelete) {
      await deleteDocumentById(doc.id)
    }

    // Finally, delete the company
    await db
      .delete(companiesTable)
      .where(
        and(eq(companiesTable.id, companyId), eq(companiesTable.userId, userId))
      )

    return {
      isSuccess: true,
      message: "Company deleted successfully",
      data: undefined
    }
  } catch (error) {
    console.error("Error deleting company:", error)
    return {
      isSuccess: false,
      message: "Failed to delete company"
    }
  }
}
