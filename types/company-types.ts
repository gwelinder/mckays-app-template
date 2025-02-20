export interface CompanyMetadata {
  industrydesc?: string
  startdate?: string
  employees?: number
  vat?: string
  phone?: string
  address?: string
  productionunits?: Array<Record<string, any>>
  [key: string]: any
}

export interface CompanyData {
  id: string
  name: string
  cvr: string
  tags: string
  metadata: CompanyMetadata
  createdAt: string
  updatedAt: string
}

export interface TrendAnalysis {
  id: string
  prompt: string
  response: string
  status: "completed" | "pending" | "in_progress" | "failed"
  createdAt: string
}

export interface CompanyAnalysis {
  id: string
  title: string
  summary: string
  findings: string
  recommendations: string
  status: "completed" | "pending" | "in_progress" | "failed"
  createdAt: string
  updatedAt: string
}
