"use server"

import CompanyAnalysis from "@/app/companies/[companyId]/_components/company-analysis"
import { DocumentAnalysis } from "@/components/document-analysis"

export default async function CompanyAnalysisPage({
  params
}: {
  params: Promise<{ companyId: string }>
}) {
  const { companyId } = await params

  return (
    <div className="flex flex-col gap-6">
      <CompanyAnalysis companyId={companyId} />
      <DocumentAnalysis documentId="document-analysis" />
    </div>
  )
}
