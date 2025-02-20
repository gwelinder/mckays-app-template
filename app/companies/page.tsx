"use server"

import CompanyDataView from "@/components/company-data-view"
import { getCompanies } from "@/actions/companies/index"
import WelcomeFlow from "./_components/welcome-flow"

export default async function CompaniesPage() {
  const result = await getCompanies()
  const companies = result.isSuccess ? result.data.companies : []

  if (companies && companies.length > 0) {
    return <CompanyDataView />
  }

  return <WelcomeFlow />
}
