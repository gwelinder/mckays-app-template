import { pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core"

export const trendAnalysisStatusEnum = pgEnum("trend_analysis_status", [
  "pending",
  "in_progress",
  "completed",
  "failed"
])

export const trendAnalysesTable = pgTable("trend_analyses", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").notNull(),
  companyId: text("company_id").notNull(),
  prompt: text("prompt").notNull(),
  response: text("response"),
  status: trendAnalysisStatusEnum("status").notNull().default("pending"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date())
})

export type InsertTrendAnalysis = typeof trendAnalysesTable.$inferInsert
export type SelectTrendAnalysis = typeof trendAnalysesTable.$inferSelect
