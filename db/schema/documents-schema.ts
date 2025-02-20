import {
  pgTable,
  text,
  timestamp,
  uuid,
  jsonb,
  type AnyPgColumn
} from "drizzle-orm/pg-core"
import type { PgTable } from "drizzle-orm/pg-core"
import { companiesTable } from "./companies-schema"
import { profilesTable } from "./profiles-schema"
import {
  documentTypeEnum,
  documentStatusEnum,
  documentConfidentialityEnum
} from "./document-types-schema"

export const documentsTable = pgTable("documents", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  type: documentTypeEnum("type").notNull(),
  confidentiality: documentConfidentialityEnum("confidentiality")
    .notNull()
    .default("internal"),
  status: documentStatusEnum("status").notNull().default("pending"),
  userId: text("user_id")
    .references(() => profilesTable.userId, { onDelete: "cascade" })
    .notNull(),
  companyId: uuid("company_id")
    .references(() => companiesTable.id, { onDelete: "cascade" })
    .notNull(),
  description: text("description"),
  url: text("url").notNull(), // Supabase Storage URL
  version: text("version").notNull().default("1.0.0"),
  metadata: jsonb("metadata"), // Document metadata (file size, type, etc)
  contentMetadata: jsonb("content_metadata"), // Extracted content metadata
  vectorId: text("vector_id"), // For AI document analysis
  retentionDate: timestamp("retention_date"), // When document should be archived/deleted
  lastAccessedAt: timestamp("last_accessed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date())
})

// Document versions table for handling versioning
export const documentVersionsTable = pgTable("document_versions", {
  id: uuid("id").defaultRandom().primaryKey(),
  documentId: uuid("document_id")
    .references(() => documentsTable.id, { onDelete: "cascade" })
    .notNull(),
  version: text("version").notNull(),
  url: text("url").notNull(),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  createdBy: text("created_by")
    .references(() => profilesTable.userId)
    .notNull()
})

export type InsertDocument = typeof documentsTable.$inferInsert
export type SelectDocument = typeof documentsTable.$inferSelect
export type InsertDocumentVersion = typeof documentVersionsTable.$inferInsert
export type SelectDocumentVersion = typeof documentVersionsTable.$inferSelect
