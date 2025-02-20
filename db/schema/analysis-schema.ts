import {
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  integer,
  jsonb
} from "drizzle-orm/pg-core"
import { documentsTable } from "./documents-schema"
import { profilesTable } from "./profiles-schema"
import { companiesTable } from "./companies-schema"
import { documentTypeEnum } from "./document-types-schema"

export const findingTypeEnum = pgEnum("finding_type", [
  "inconsistency",
  "missing_information",
  "compliance_issue",
  "financial_discrepancy",
  "risk_flag",
  "action_required",
  "policy_violation"
])

export const findingSeverityEnum = pgEnum("finding_severity", [
  "info",
  "low",
  "medium",
  "high",
  "critical"
])

export const findingStatusEnum = pgEnum("finding_status", [
  "open",
  "in_review",
  "accepted",
  "rejected",
  "resolved"
])

export const analysisStatusEnum = pgEnum("analysis_status", [
  "pending",
  "in_progress",
  "completed",
  "needs_review",
  "rejected",
  "failed"
])

export const analysisTable = pgTable("document_analysis", {
  id: uuid("id").defaultRandom().primaryKey(),
  companyId: uuid("company_id")
    .references(() => companiesTable.id, { onDelete: "cascade" })
    .notNull(),
  documentId: uuid("document_id").references(() => documentsTable.id),
  documentIds: jsonb("document_ids").default("[]"),
  analyzerId: text("analyzer_id")
    .references(() => profilesTable.userId)
    .notNull(),
  type: documentTypeEnum("type").notNull(),
  title: text("title").notNull(),
  status: analysisStatusEnum("status").notNull().default("pending"),
  summary: text("summary"),
  findings: jsonb("findings").default("{}"),
  recommendations: jsonb("recommendations").default("[]"),
  documentUrl: text("document_url"),
  documentUrls: jsonb("document_urls").default("[]"),
  metadata: jsonb("metadata"),
  startedAt: timestamp("started_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date())
})

export const findingsTable = pgTable("analysis_findings", {
  id: uuid("id").defaultRandom().primaryKey(),
  analysisId: uuid("analysis_id")
    .references(() => analysisTable.id, { onDelete: "cascade" })
    .notNull(),
  type: findingTypeEnum("type").notNull(),
  severity: findingSeverityEnum("severity").notNull(),
  status: findingStatusEnum("status").notNull().default("open"),
  title: text("title").notNull(),
  description: text("description").notNull(),
  location: text("location"), // Reference to document section/page
  context: text("context"), // Relevant excerpt from document
  suggestedAction: text("suggested_action"),
  metadata: jsonb("metadata"), // Additional finding-specific data
  reviewerId: text("reviewer_id").references(() => profilesTable.userId),
  reviewNote: text("review_note"),
  reviewedAt: timestamp("reviewed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date())
})

export type InsertAnalysis = typeof analysisTable.$inferInsert
export type SelectAnalysis = typeof analysisTable.$inferSelect
export type InsertFinding = typeof findingsTable.$inferInsert
export type SelectFinding = typeof findingsTable.$inferSelect
