"use server"

import CompanyAnalysis from "@/app/companies/[companyId]/_components/company-analysis"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default async function CompanyAnalysisPage({
  params
}: {
  params: Promise<{ companyId: string }>
}) {
  const { companyId } = await params

  return (
    <div className="flex flex-col gap-6">
      <Tabs defaultValue="dashboard" className="space-y-4">
        <TabsList>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="batch">Batch Processing</TabsTrigger>
          <TabsTrigger value="reports">Analysis Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard">
          <CompanyAnalysis companyId={companyId} />
        </TabsContent>

        <TabsContent value="batch">
          <div className="bg-card text-card-foreground rounded-lg border p-6 shadow-sm">
            <h3 className="mb-4 text-lg font-semibold">Batch Processing</h3>
            <p className="text-muted-foreground">
              Coming soon: Process multiple documents simultaneously.
            </p>
          </div>
        </TabsContent>

        <TabsContent value="reports">
          <div className="bg-card text-card-foreground rounded-lg border p-6 shadow-sm">
            <h3 className="mb-4 text-lg font-semibold">Analysis Reports</h3>
            <p className="text-muted-foreground">
              Coming soon: Generate and export comprehensive analysis reports.
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
