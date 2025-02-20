"use server"

import { auth } from "@clerk/nextjs/server"
import { ActionState } from "@/types"
import { randomUUID } from "crypto"
import { CompanyFormData, CompanyTrend, type Company } from "./types"
import { analyzeCompanyTrends, parseMetadata } from "./utils"
import { createCompany as dbCreateCompany } from "@/actions/db/companies/mutations"

export async function createCompany(
  formData: FormData
): Promise<ActionState<Company>> {
  try {
    const { userId } = await auth()
    if (!userId) {
      return {
        isSuccess: false,
        message: "Unauthorized: User not authenticated"
      }
    }

    // Extract form data
    const data: CompanyFormData = {
      name: formData.get("name") as string,
      cvr: formData.get("cvr") as string,
      description: formData.get("description") as string,
      metadata: formData.get("metadata") as string
    }

    // Parse metadata from CVR API response
    let metadata = {}
    try {
      if (data.metadata) {
        const metadataObj = JSON.parse(data.metadata)

        metadata = await parseMetadata(metadataObj)
      } else {
        console.log("No metadata provided in form data")
      }
    } catch (error) {
      console.error("Error parsing metadata:", error)
    }

    // Get company trends based on the metadata
    const trendsResult = await analyzeCompanyTrends(metadata)

    const trends = trendsResult.isSuccess ? trendsResult.data : []

    const companyData = {
      name: data.name,
      cvr: data.cvr,
      description: data.description || "",
      metadata: metadata,
      vectorStoreId: randomUUID(),
      userId,
      tags: JSON.stringify(trends.map((t: CompanyTrend) => t.category))
    }

    // Create company
    const result = await dbCreateCompany(companyData)

    return result
  } catch (error) {
    console.error("Error creating company:", error)
    return {
      isSuccess: false,
      message:
        error instanceof Error ? error.message : "Failed to create company"
    }
  }
}
