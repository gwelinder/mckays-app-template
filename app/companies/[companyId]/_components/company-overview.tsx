"use client"

import { useEffect, useState } from "react"
import { getCompany } from "@/actions/companies/index"
import { Button } from "@/components/ui/button"
import { DeleteCompanyDialog } from "@/components/delete-company-dialog"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from "@/components/ui/collapsible"
import { ChevronDown, ChevronUp, InfoIcon } from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { type Company } from "@/actions/companies/index"

interface CompanyMetadata {
  industrydesc?: string
  startdate?: string
  employees?: string
  vat?: string
  phone?: string
  address?: string
  productionunits?: string | any[]
  [key: string]: any
}

interface CompanyOverviewProps {
  companyId: string
}

const CompanyOverview = ({ companyId }: CompanyOverviewProps) => {
  const [companyData, setCompanyData] = useState<Company | null>(null)
  const [loading, setLoading] = useState(true)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchCompanyData() {
      if (!companyId) {
        setError("No company ID provided")
        setLoading(false)
        return
      }

      setLoading(true)
      setError(null)

      try {
        const result = await getCompany(companyId)

        if (!result.isSuccess) {
          setError(result.message)
          setLoading(false)
          return
        }

        if (!result.data) {
          setError("No company data found")
          setLoading(false)
          return
        }

        // Parse metadata if it's a string
        let parsedMetadata: CompanyMetadata = {}
        try {
          if (result.data.metadata) {
            parsedMetadata =
              typeof result.data.metadata === "string"
                ? JSON.parse(result.data.metadata)
                : result.data.metadata
          }
        } catch (error) {
          console.error("Error parsing metadata:", error)
          parsedMetadata = {}
        }

        const processedData = {
          ...result.data,
          metadata: parsedMetadata
        }

        setCompanyData(processedData)
      } catch (error) {
        console.error("Error fetching company data:", error)
        setError("Failed to fetch company data")
      } finally {
        setLoading(false)
      }
    }

    fetchCompanyData()
  }, [companyId])

  const formatValue = (value: any) => {
    if (value === null || value === undefined || value === "") {
      return "N/A"
    }
    if (typeof value === "object") {
      try {
        return JSON.stringify(value, null, 2)
      } catch (error) {
        return "Invalid Data"
      }
    }
    return String(value)
  }

  const renderMainInfo = (company: Company) => {
    const metadata = company.metadata as CompanyMetadata

    const mainFields = [
      { key: "industrydesc", label: "Industry" },
      { key: "startdate", label: "Started" },
      { key: "employees", label: "Employees" },
      { key: "vat", label: "VAT" },
      { key: "phone", label: "Phone" },
      { key: "address", label: "Address" }
    ]

    return (
      <div className="mb-6 grid grid-cols-3 gap-4">
        {mainFields.map(({ key, label }) => (
          <div key={key} className="flex flex-col">
            <span className="text-sm font-medium text-gray-500">{label}</span>
            <span className="font-semibold">{formatValue(metadata[key])}</span>
          </div>
        ))}
      </div>
    )
  }

  const renderAdditionalInfo = (company: Company) => {
    const metadata = company.metadata as CompanyMetadata
    console.log(
      "Rendering additional info with metadata:",
      JSON.stringify(metadata, null, 2)
    )

    const excludeFields = [
      "industrydesc",
      "startdate",
      "employees",
      "vat",
      "phone",
      "address",
      "productionunits"
    ]

    const additionalFields = Object.entries(metadata).filter(
      ([key]) => !excludeFields.includes(key)
    )

    return (
      <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
        {additionalFields.map(([key, value]) => (
          <TooltipProvider key={key}>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center space-x-2">
                  <span className="capitalize text-gray-500">{key}:</span>
                  <span className="font-medium">{formatValue(value)}</span>
                  <InfoIcon size={16} className="text-gray-400" />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Additional information about {key}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ))}
      </div>
    )
  }

  const renderProductionUnits = (company: Company) => {
    const metadata = company.metadata as CompanyMetadata

    if (!metadata.productionunits) {
      return null
    }

    let productionUnits = []
    try {
      productionUnits =
        typeof metadata.productionunits === "string"
          ? JSON.parse(metadata.productionunits)
          : metadata.productionunits
    } catch (error) {
      console.error("Error parsing production units:", error)
      return null
    }

    if (!Array.isArray(productionUnits) || productionUnits.length === 0) {
      return null
    }

    return (
      <div className="mt-6">
        <h3 className="mb-2 text-lg font-semibold">Production Units</h3>
        {productionUnits.map((unit: any, index: number) => (
          <div
            key={index}
            className="mb-4 rounded-lg bg-gray-100 p-4 dark:bg-zinc-800"
          >
            {Object.entries(unit).map(([key, value]) => (
              <div key={key} className="mb-1">
                <span className="font-medium capitalize">{key}:</span>{" "}
                {formatValue(value)}
              </div>
            ))}
          </div>
        ))}
      </div>
    )
  }

  if (loading) {
    return <div>Loading company data...</div>
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
        <h3 className="text-lg font-semibold">Error</h3>
        <p>{error}</p>
      </div>
    )
  }

  if (!companyData) {
    return <div>No company data available</div>
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="mb-6 flex items-center justify-between">
          <div className="space-y-2">
            <h2 className="text-2xl font-bold">{companyData.name}</h2>
            {companyData.tags && (
              <div className="flex flex-wrap gap-2">
                {JSON.parse(companyData.tags).map((tag: string) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="bg-blue-100 text-xs text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                  >
                    #{tag.toLowerCase().replace(/\s+/g, "-")}
                  </Badge>
                ))}
              </div>
            )}
          </div>
          <Badge variant="secondary" className="text-lg">
            {companyData.cvr}
          </Badge>
        </div>

        <div className="flex flex-col">
          <div className="flex flex-1">{renderMainInfo(companyData)}</div>
          <Collapsible
            open={isOpen}
            onOpenChange={setIsOpen}
            className="space-y-2"
          >
            <CollapsibleTrigger className="flex items-center text-sm font-medium text-gray-500">
              {isOpen ? (
                <ChevronUp className="mr-1 size-4" />
              ) : (
                <ChevronDown className="mr-1 size-4" />
              )}
              {isOpen ? "Hide" : "Show"} additional information
            </CollapsibleTrigger>
            <CollapsibleContent>
              {renderAdditionalInfo(companyData)}
              {renderProductionUnits(companyData)}
            </CollapsibleContent>
          </Collapsible>

          <div className="mt-6 flex justify-end">
            <Button
              variant="destructive"
              onClick={() => setDeleteDialogOpen(true)}
            >
              Delete Company
            </Button>
          </div>
        </div>
      </CardContent>

      <DeleteCompanyDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        companyId={companyId}
      />
    </Card>
  )
}

export default CompanyOverview
