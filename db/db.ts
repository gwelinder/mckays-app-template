/*
<ai_context>
Initializes the database connection and schema for the app.
</ai_context>
*/

import {
  profilesTable,
  todosTable,
  trendAnalysesTable,
  companiesTable,
  documentsTable,
  analysisTable,
  auditTable
} from "@/db/schema"
import { config } from "dotenv"
import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"

config({ path: ".env.local" })

const schema = {
  profiles: profilesTable,
  todos: todosTable,
  trendAnalyses: trendAnalysesTable,
  companies: companiesTable,
  documents: documentsTable,
  analysis: analysisTable,
  audit: auditTable
}

const client = postgres(process.env.DATABASE_URL!)

export const db = drizzle(client, { schema })
