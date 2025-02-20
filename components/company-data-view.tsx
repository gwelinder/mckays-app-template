"use client"

import { useCompanyContext } from "@/lib/company-provider"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { AddCompanyDialog } from "./add-company-dialog"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useRouter } from "next/navigation"
import { Plus, Building2, Users, Calendar } from "lucide-react"
import { SelectCompany } from "@/db/schema"

const CompanyDataView = () => {
  const router = useRouter()
  const { companies } = useCompanyContext()
  const [addCompanyOpen, setAddCompanyOpen] = useState(false)

  const handleCompanySelect = (companyId: string) => {
    router.push(`/companies/${companyId}`)
  }

  const formatMetadata = (company: SelectCompany) => {
    try {
      const metadata =
        typeof company.metadata === "string"
          ? JSON.parse(company.metadata)
          : company.metadata || {}

      return {
        employees: metadata.employees || "N/A",
        startdate: metadata.startdate || "N/A",
        industry: metadata.industrydesc || "N/A"
      }
    } catch (error) {
      console.error("Error parsing metadata:", error)
      return {
        employees: "N/A",
        startdate: "N/A",
        industry: "N/A"
      }
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Companies</h1>
          <p className="text-muted-foreground">
            Manage and analyze your portfolio of companies
          </p>
        </div>
        <Button onClick={() => setAddCompanyOpen(true)}>
          <Plus className="mr-2 size-4" />
          Add Company
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {companies.map((company: SelectCompany) => {
          const metadata = formatMetadata(company)
          return (
            <Card
              key={company.id}
              className="cursor-pointer transition-all duration-300 hover:shadow-lg"
              onClick={() => handleCompanySelect(company.id)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-xl">{company.name}</CardTitle>
                    <CardDescription>
                      <Badge variant="secondary" className="text-xs">
                        CVR: {company.cvr}
                      </Badge>
                    </CardDescription>
                  </div>
                  <Building2 className="text-muted-foreground size-5" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Users className="text-muted-foreground size-4" />
                      <span className="text-muted-foreground">Employees:</span>
                      <span>{metadata.employees}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="text-muted-foreground size-4" />
                      <span className="text-muted-foreground">Founded:</span>
                      <span>{metadata.startdate}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="text-muted-foreground text-sm">
                      {metadata.industry}
                    </div>
                    {company.tags && (
                      <div className="flex flex-wrap gap-2">
                        {JSON.parse(company.tags).map((tag: string) => (
                          <Badge
                            key={tag}
                            variant="secondary"
                            className="bg-primary/10 text-xs"
                          >
                            #{tag.toLowerCase().replace(/\s+/g, "-")}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <AddCompanyDialog
        open={addCompanyOpen}
        onOpenChange={setAddCompanyOpen}
      />
    </div>
  )
}

export default CompanyDataView
