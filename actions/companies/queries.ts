"use server"

import { cookies } from "next/headers"
import { auth } from "@clerk/nextjs/server"
import { ActionState } from "@/types"
import { CompanyResponse, type Company } from "./types"
import {
  getCompanyById as dbGetCompanyById,
  getCompaniesByUser,
  searchCompaniesByName,
  getCompaniesByCVR
} from "@/actions/db/companies/queries"

export async function getCompany(
  companyId: string
): Promise<ActionState<Company>> {
  return dbGetCompanyById(companyId)
}

export async function getCompanies(): Promise<ActionState<CompanyResponse>> {
  try {
    const { userId } = await auth()
    if (!userId) {
      return {
        isSuccess: false,
        message: "Unauthorized: User not authenticated"
      }
    }

    const result = await getCompaniesByUser(userId)
    if (!result.isSuccess) {
      return result
    }

    const cookieStore = await cookies()
    const selectedCompanyId = cookieStore.get("selectedCompanyId")?.value

    // Verify the selected company belongs to the user
    const validSelectedCompanyId = selectedCompanyId
      ? result.data.some(company => company.id === selectedCompanyId)
        ? selectedCompanyId
        : null
      : null

    return {
      isSuccess: true,
      message: "Companies retrieved successfully",
      data: {
        companies: result.data,
        initialSelectedCompanyId:
          validSelectedCompanyId || result.data[0]?.id || null
      }
    }
  } catch (error) {
    console.error("Error getting companies:", error)
    return {
      isSuccess: false,
      message: "Failed to get companies"
    }
  }
}

export async function searchCompanies(
  searchTerm: string
): Promise<ActionState<Company[]>> {
  return searchCompaniesByName(searchTerm)
}

export async function findCompaniesByCVR(
  cvr: string
): Promise<ActionState<Company[]>> {
  return getCompaniesByCVR(cvr)
}
