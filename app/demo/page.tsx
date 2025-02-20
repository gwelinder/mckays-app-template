"use server"

import { getCompanies } from "@/actions/companies/index"
import { CompanyProvider } from "@/lib/company-provider"
import CompanyDataView from "@/components/company-data-view"

export default async function DemoPage() {
  const result = await getCompanies()
  const companies = result.isSuccess ? result.data.companies : []
  const initialSelectedCompanyId = result.isSuccess
    ? result.data.initialSelectedCompanyId
    : null

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold">Company Management Demo</h1>
        <p className="text-muted-foreground mt-2">
          This demo showcases the company management system with document
          handling capabilities.
        </p>
      </div>

      <div className="grid gap-8">
        <div className="bg-card rounded-lg border p-6">
          <h2 className="mb-4 text-2xl font-semibold">Features</h2>
          <ul className="list-inside list-disc space-y-2">
            <li>Add and manage companies with CVR lookup</li>
            <li>Upload and organize documents by category</li>
            <li>View company details and production units</li>
            <li>Analyze documents with AI capabilities</li>
            <li>Track document status and metadata</li>
          </ul>
        </div>

        <div className="bg-card rounded-lg border">
          <div className="border-b p-6">
            <h2 className="text-2xl font-semibold">Live Demo</h2>
            <p className="text-muted-foreground mt-2">
              Try out the features by interacting with the interface below.
            </p>
          </div>

          <div className="p-6">
            <CompanyProvider
              initialCompanies={companies}
              initialSelectedCompanyId={initialSelectedCompanyId}
            >
              <CompanyDataView />
            </CompanyProvider>
          </div>
        </div>
      </div>
    </div>
  )
}
