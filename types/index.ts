/*
<ai_context>
Exports the types for the app.
</ai_context>
*/

export * from "./server-action-types"

export * from "./company-types"

export interface Company {
  id: string
  userId: string
  name: string
  cvr: string | null
  description?: string | null
  metadata?: string | null
  tags?: string[] | null
  vectorStoreId?: string | null
  createdAt: Date
  updatedAt: Date
}
