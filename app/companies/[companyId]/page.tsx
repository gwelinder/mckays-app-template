"use server"

import CompanyOverview from "./_components/company-overview"

export default async function CompanyPage({
  params
}: {
  params: Promise<{ companyId: string }>
}) {
  const { companyId } = await params
  return <CompanyOverview companyId={companyId} />
}
