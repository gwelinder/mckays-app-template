"use server"

import { generateObject } from "ai"
import { perplexity } from "@ai-sdk/perplexity"
import { z } from "zod"
import { CompanyDataResponse, CompanyTrend } from "./types"
import { ActionState } from "@/types"

export async function validateCVR(cvr: string): Promise<boolean> {
  return /^\d{8}$/.test(cvr)
}

export async function fetchCompanyData(
  search: string
): Promise<ActionState<CompanyDataResponse>> {
  const url = `https://cvrapi.dk/api?search=${encodeURIComponent(
    search
  )}&country=dk`

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "board-ai"
      }
    })

    if (!response.ok) {
      const errorText = await response.text()
      if (errorText.includes("QUOTA_EXCEEDED")) {
        return {
          isSuccess: false,
          message: "Daily API limit reached. Please try again tomorrow."
        }
      }
      if (errorText.includes("NOT_FOUND")) {
        return {
          isSuccess: false,
          message:
            "Company not found. Please check the CVR number or company name."
        }
      }
      return {
        isSuccess: false,
        message: `Failed to fetch company data: ${errorText}`
      }
    }

    const data = await response.json()

    // The API returns null for empty fields, let's clean that up
    const cleanedData = Object.fromEntries(
      Object.entries(data).filter(([_, value]) => value !== null)
    )

    return {
      isSuccess: true,
      message: "Company data fetched successfully",
      data: cleanedData as CompanyDataResponse
    }
  } catch (error) {
    console.error("Error fetching company data:", error)
    return {
      isSuccess: false,
      message: "Failed to fetch company data"
    }
  }
}

export async function analyzeCompanyTrends(
  companyData: Record<string, any>
): Promise<ActionState<CompanyTrend[]>> {
  try {
    const query = `Based on this company data, what are the top 3 most relevant industry trends or categories that best match this company? Return only a JSON array of 3 objects with 'category' and 'confidence' fields, no explanation needed: ${JSON.stringify(companyData)}`

    const response = generateObject({
      model: perplexity("sonar-pro"),
      messages: [
        {
          role: "user",
          content: query
        }
      ],
      schema: z.array(
        z.object({
          category: z.string(),
          confidence: z.number().min(0).max(1)
        })
      )
    })

    if (!response) {
      return {
        isSuccess: false,
        message: "Failed to analyze company trends"
      }
    }

    const data = await response
    if (!data.object) {
      return {
        isSuccess: false,
        message: "No trends analysis available"
      }
    }

    return {
      isSuccess: true,
      message: "Company trends analyzed successfully",
      data: data.object
    }
  } catch (error) {
    console.error("Error analyzing company trends:", error)
    return {
      isSuccess: false,
      message: "Failed to analyze company trends"
    }
  }
}

export async function parseMetadata(
  data: CompanyDataResponse
): Promise<Record<string, any>> {
  // Keep only the fields we want to store as metadata
  const metadataFields = [
    "vat",
    "industrydesc",
    "startdate",
    "employees",
    "phone",
    "email",
    "address",
    "zipcode",
    "city",
    "cityname",
    "protected",
    "companydesc",
    "companytype",
    "productionunits",
    "owners"
  ]

  const metadata = Object.fromEntries(
    Object.entries(data)
      .filter(
        ([key, value]) =>
          metadataFields.includes(key) && value !== null && value !== undefined
      )
      .map(([key, value]) => [
        key,
        typeof value === "object" ? JSON.stringify(value) : value
      ])
  )

  return metadata
}

export async function formatCompanyTrends(
  trends: CompanyTrend[]
): Promise<string> {
  return JSON.stringify(trends.map(t => t.category))
}

export async function sanitizeCompanyData(
  data: Record<string, any>
): Promise<Record<string, string>> {
  return Object.fromEntries(
    Object.entries(data)
      .filter(([_, value]) => value != null)
      .map(([key, value]) => [
        key,
        typeof value === "object" ? JSON.stringify(value) : String(value)
      ])
  )
}
