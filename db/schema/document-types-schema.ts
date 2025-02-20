import { pgEnum } from "drizzle-orm/pg-core"

// Define the document type enum that will be used for both analysis types and document categories
export const documentTypeEnum = pgEnum("document_type", [
  "governance",
  "financial",
  "compliance",
  "risk",
  "strategy",
  "minutes",
  "report",
  "policy",
  "other"
])

// Export the enum values for use in TypeScript
export const documentTypeValues = documentTypeEnum.enumValues
export type DocumentType = (typeof documentTypeEnum.enumValues)[number]

export const documentStatusEnum = pgEnum("document_status", [
  "pending",
  "processing",
  "analyzed",
  "needs_review",
  "approved",
  "rejected",
  "archived"
])

export const documentConfidentialityEnum = pgEnum("document_confidentiality", [
  "public",
  "internal",
  "confidential",
  "strictly_confidential"
])
