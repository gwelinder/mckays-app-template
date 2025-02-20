import { pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core"
import { companiesTable } from "./companies-schema"
import { documentsTable } from "./documents-schema"

export const auditActionEnum = pgEnum("audit_action", [
  "document_upload",
  "document_delete",
  "analysis_request",
  "analysis_complete",
  "board_decision",
  "policy_update",
  "compliance_check",
  "other"
])

export const auditTable = pgTable("audit", {
  id: uuid("id").defaultRandom().primaryKey(),
  companyId: text("company_id").notNull(),
  documentId: uuid("document_id").references(() => documentsTable.id), // Make optional
  documentUrl: text("document_url"), // Optional
  action: auditActionEnum("action").notNull(),
  description: text("description").notNull(),
  metadata: text("metadata"), // JSON string for additional context
  performedBy: text("performed_by").notNull(), // User ID
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date())
})

export type InsertAudit = typeof auditTable.$inferInsert
export type SelectAudit = typeof auditTable.$inferSelect
