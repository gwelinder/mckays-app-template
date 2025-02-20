"use server"

import { CompanyProvider } from "@/lib/company-provider"
import { getCompanies } from "@/actions/companies/index"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import CompanySidebar from "./[companyId]/_components/company-sidebar"

export default async function CompanyLayout({
  children
}: {
  children: React.ReactNode
}) {
  const result = await getCompanies()
  const companies = result.isSuccess ? result.data.companies : []
  const initialSelectedCompanyId = result.isSuccess
    ? result.data.initialSelectedCompanyId
    : null

  return (
    <CompanyProvider
      initialCompanies={companies}
      initialSelectedCompanyId={initialSelectedCompanyId}
    >
      <SidebarProvider>
        <div className="flex min-h-screen">
          <CompanySidebar />
          <SidebarInset>
            <div className="container mx-auto py-6">{children}</div>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </CompanyProvider>
  )
}
