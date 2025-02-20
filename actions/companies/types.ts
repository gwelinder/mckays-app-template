import { SelectCompany } from "@/db/schema"
import { z } from "zod"

// Response Types
export type CompanyResponse = {
  companies: SelectCompany[]
  initialSelectedCompanyId: string | null
}

// Validation Schemas
export const companyDataSchema = z.object({
  vat: z.number().optional(),
  name: z.string().min(1, "Company name is required"),
  cvr: z.string().length(8, "CVR must be 8 digits"),
  address: z.string().optional(),
  zipcode: z.number().optional(),
  city: z.string().optional(),
  description: z.string().optional(),
  metadata: z.record(z.any()).optional(),
  vectorStoreId: z.string().optional(),
  tags: z.string().optional()
})

export type CompanyData = z.infer<typeof companyDataSchema>

// CVR API Response Type
export interface CompanyDataResponse {
  name: string
  cvr: string
  vat?: string
  address?: string
  zipcode?: string
  city?: string
  cityname?: string
  phone?: string
  email?: string
  industrydesc?: string
  companydesc?: string
  companytype?: string
  startdate?: string
  employees?: string
  protected?: string
  productionunits?: string
  owners?: string
  [key: string]: any
}

// Form Types
export interface CompanyFormData {
  name: string
  cvr: string
  description?: string | null
  metadata?: string | null
}

// Company Trend Types
export interface CompanyTrend {
  category: string
  confidence: number
  description?: string
}

// Company Status Types
export const CompanyStatusEnum = {
  ACTIVE: "active",
  INACTIVE: "inactive",
  PENDING: "pending"
} as const

export type CompanyStatus =
  (typeof CompanyStatusEnum)[keyof typeof CompanyStatusEnum]

// Export the base Company type from the schema
export type Company = SelectCompany
