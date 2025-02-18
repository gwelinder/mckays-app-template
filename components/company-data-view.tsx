"use client"

import { useCompanyContext } from "@/lib/companyProvider"
import { useEffect, useState } from "react"
import { fetchCompanyFromDB } from "@/app/actions/company"
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
import { AddCompanyDialog } from "@/components/add-company-dialog"
import OpenaiLibrary from "@/components/openai-library"
import { Document } from "@/schema"
import PredefinedActions from "@/components/assistant/pre-actions"

const CompanyDataView = () => {
  const { companies, selectedCompanyId, setSelectedCompanyId } =
    useCompanyContext()
  const [addCompanyOpen, setAddCompanyOpen] = useState(false)
  const [companyData, setCompanyData] = useState<any>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false)
  const [isOpen, setIsOpen] = useState(false)
  const [selectedDocuments, setSelectedDocuments] = useState<Document[]>([])

  const handleSelectDocuments = (documents: Document[]) => {
    setSelectedDocuments(documents)
  }
  useEffect(() => {
    if (selectedCompanyId) {
      setLoading(true)
      fetchCompanyFromDB(selectedCompanyId).then(data => {
        setCompanyData(data)
        setLoading(false)
      })
    }
  }, [selectedCompanyId])

  const formatValue = (value: any) =>
    value === null || value === "" ? "N/A" : value.toString()

  const renderMainInfo = (company: any) => {
    const mainFields = [
      { key: "industrydesc", label: "Industry" },
      { key: "startdate", label: "Startdate" },
      { key: "employees", label: "Employees" },
      { key: "vat", label: "Vat" },
      { key: "phone", label: "Phone" },
      { key: "address", label: "Address" }
    ]

    return (
      <div className="mb-6 grid grid-cols-3 gap-4">
        {mainFields.map(({ key, label }) => (
          <div key={key} className="flex flex-col">
            <span className="text-sm font-medium text-gray-500">{label}</span>
            <span className="font-semibold">
              {formatValue(company.metadata[key])}
            </span>
          </div>
        ))}
      </div>
    )
  }

  const renderAdditionalInfo = (company: any) => {
    const excludeFields = [
      "industrydesc",
      "startdate",
      "employees",
      "vat",
      "phone",
      "address",
      "productionunits"
    ]
    const additionalFields = Object.entries(company.metadata).filter(
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

  const renderProductionUnits = (company: any) => {
    if (
      !company.metadata?.productionunits ||
      company.metadata.productionunits.length === 0
    )
      return null

    return (
      <div className="mt-6">
        <h3 className="mb-2 text-lg font-semibold">Production Units</h3>
        {company.metadata.productionunits.map((unit: any, index: number) => (
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

  return (
    <div className="space-y-4">
      <AddCompanyDialog
        open={addCompanyOpen}
        onOpenChange={setAddCompanyOpen}
      />
      {companies.map((company: any) => (
        <Card
          key={company.id}
          className={cn(
            "cursor-pointer transition-all duration-300",
            selectedCompanyId === company.id
              ? "shadow-lg"
              : "opacity-50 hover:opacity-75"
          )}
          onClick={() => setSelectedCompanyId(company.id)}
        >
          <CardContent className="pt-6">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold">{company.name}</h2>
              <Badge variant="secondary" className="text-lg">
                {company.cvr}
              </Badge>
            </div>
            {selectedCompanyId === company.id && !loading && companyData && (
              <div className="flex flex-col ">
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
                <div className="mt-6">
                  <PredefinedActions
                    vectorStoreId={company.vectorStoreId}
                    selectedDocuments={selectedDocuments}
                  />
                </div>
                <div className="flex-1">
                  <OpenaiLibrary
                    vectorStoreId={company.vectorStoreId}
                    onSelectDocuments={handleSelectDocuments}
                  />
                </div>

                <div className="mt-6 flex justify-end">
                  <Button
                    variant="destructive"
                    onClick={() => setDeleteDialogOpen(true)}
                  >
                    Delete Company
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
      {selectedCompanyId && (
        <DeleteCompanyDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          companyId={selectedCompanyId}
        />
      )}
      <Button
        variant="secondary"
        onClick={() => {
          setAddCompanyOpen(true)
        }}
      >
        Add new company
      </Button>
    </div>
  )
}

export default CompanyDataView
