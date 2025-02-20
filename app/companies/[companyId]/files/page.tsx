"use server"

import FileManagement from "@/app/companies/[companyId]/_components/file-management"

export default async function FilesPage({
  params
}: {
  params: Promise<{ companyId: string }>
}) {
  const { companyId } = await params
  return <FileManagement companyId={companyId} />
}
