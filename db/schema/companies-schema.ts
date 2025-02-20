import { jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core"

export const companiesTable = pgTable("companies", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").notNull(),
  name: text("name").notNull(),
  cvr: text("cvr").notNull(),
  description: text("description"),
  metadata: jsonb("metadata"), // JSON string for storing company metadata
  tags: text("tags"), // JSON string array for storing trend/category tags
  vectorStoreId: text("vector_store_id"), // For AI document analysis
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date())
})

export type InsertCompany = typeof companiesTable.$inferInsert
export type SelectCompany = typeof companiesTable.$inferSelect
