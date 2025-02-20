"use server"

import { db } from "@/db/db"
import { companiesTable, type SelectCompany } from "@/db/schema"
import { eq, and, desc, like } from "drizzle-orm"
import { auth } from "@clerk/nextjs/server"
import { ActionState } from "@/types"

export async function getCompanyById(
  companyId: string
): Promise<ActionState<SelectCompany>> {
  try {
    const { userId } = await auth()
    if (!userId) {
      return {
        isSuccess: false,
        message: "Unauthorized: User not authenticated"
      }
    }

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

    return {
      isSuccess: true,
      message: "Company retrieved successfully",
      data: company
    }
  } catch (error) {
    console.error("Error getting company:", error)
    return {
      isSuccess: false,
      message: "Failed to get company"
    }
  }
}

export async function getCompaniesByUser(
  userId: string
): Promise<ActionState<SelectCompany[]>> {
  try {
    const companies = await db
      .select()
      .from(companiesTable)
      .where(eq(companiesTable.userId, userId))
      .orderBy(desc(companiesTable.createdAt))

    return {
      isSuccess: true,
      message: "Companies retrieved successfully",
      data: companies
    }
  } catch (error) {
    console.error("Error getting companies:", error)
    return {
      isSuccess: false,
      message: "Failed to get companies"
    }
  }
}

export async function searchCompaniesByName(
  searchTerm: string
): Promise<ActionState<SelectCompany[]>> {
  try {
    const { userId } = await auth()
    if (!userId) {
      return {
        isSuccess: false,
        message: "Unauthorized: User not authenticated"
      }
    }

    const companies = await db
      .select()
      .from(companiesTable)
      .where(
        and(
          eq(companiesTable.userId, userId),
          like(companiesTable.name, `%${searchTerm}%`)
        )
      )
      .orderBy(desc(companiesTable.createdAt))

    return {
      isSuccess: true,
      message: "Companies searched successfully",
      data: companies
    }
  } catch (error) {
    console.error("Error searching companies:", error)
    return {
      isSuccess: false,
      message: "Failed to search companies"
    }
  }
}

export async function getCompaniesByCVR(
  cvr: string
): Promise<ActionState<SelectCompany[]>> {
  try {
    const { userId } = await auth()
    if (!userId) {
      return {
        isSuccess: false,
        message: "Unauthorized: User not authenticated"
      }
    }

    const companies = await db
      .select()
      .from(companiesTable)
      .where(
        and(eq(companiesTable.userId, userId), eq(companiesTable.cvr, cvr))
      )
      .orderBy(desc(companiesTable.createdAt))

    return {
      isSuccess: true,
      message: "Companies retrieved successfully",
      data: companies
    }
  } catch (error) {
    console.error("Error getting companies by CVR:", error)
    return {
      isSuccess: false,
      message: "Failed to get companies by CVR"
    }
  }
}
