"use server"

import { getCompanyById } from "@/actions/db/companies/queries"
import CompanyTrends from "../_components/company-trends"

export default async function CompanyTrendsPage({
  params
}: {
  params: Promise<{ companyId: string }>
}) {
  const { companyId } = await params
  const company = await getCompanyById(companyId)

  if (!company) {
    throw new Error("Company not found")
  }

  return (
    <CompanyTrends
      companyId={companyId}
      companyData={JSON.stringify(company)}
    />
  )
}
