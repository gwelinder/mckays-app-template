"use client"

import { useState, useEffect, useRef, useActionState } from "react"

import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { createCompany, getCompanyData } from "@/app/actions/company"

import { useCompanyContext } from "@/lib/companyProvider"
import { Company } from "@/schema"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from "@/components/ui/card"
import { BuildingIcon, SearchIcon, PlusIcon } from "lucide-react"
import { motion } from "framer-motion"
import { toast } from "@/components/ui/use-toast"

const companySchema = z.object({
  name: z.string().min(1, "Company name is required"),
  cvr: z.string().length(8, "CVR must be 8 characters"),
  description: z.string().optional()
})

type CompanyActionState = {
  status: "idle" | "success" | "error"
  message?: string
  company?: Company
}

const initialState: CompanyActionState = {
  status: "idle"
}

export const AddCompanyForm = () => {
  const [state, formAction] = useActionState(createCompany, initialState)
  const [isLoading, setIsLoading] = useState(false)
  const { setCompanies, setSelectedCompanyId } = useCompanyContext()
  const [companyData, setCompanyData] = useState<any>(null)
  const [fetchState, fetchAction] = useActionState(getCompanyData, {
    status: "idle",
    data: null
  })
  const formRef = useRef<HTMLFormElement>(null)
  const [isFetched, setIsFetched] = useState(false)

  useEffect(() => {
    if (state.status === "error") {
      toast({
        title: "Error",
        description: state.message || "Failed to create company"
      })
      setIsLoading(false)
    } else if (state.status === "success") {
      toast({
        title: "Success",
        description: "Company created successfully"
      })
      setIsLoading(false)

      if (state.company) {
        setCompanies(prevCompanies => [
          ...prevCompanies,
          state.company as Company
        ])
        setSelectedCompanyId(state.company.id)
      }
    }
  }, [state, setCompanies, setSelectedCompanyId])

  useEffect(() => {
    if (fetchState.status === "success" && fetchState.data) {
      setCompanyData(fetchState.data)
      setIsFetched(true)
    } else if (fetchState.status === "error") {
      toast({
        title: "Error",
        description: "Failed to fetch company data. Please try again."
      })
    }
  }, [fetchState])

  const handleFetchData = async () => {
    if (formRef.current) {
      const formData = new FormData(formRef.current)
      await fetchAction(formData)
    }
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    formData.append("metadata", JSON.stringify(companyData))
    formAction(formData)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="max-w-[500px] transition-shadow hover:shadow-lg">
        <CardHeader className="flex items-center space-x-2">
          <div className="rounded-full bg-blue-500 p-2 text-white">
            <BuildingIcon size={24} />
          </div>
          <div>
            <CardTitle className="text-lg">Add New Company</CardTitle>
            <CardDescription className="text-sm text-gray-500">
              Enter CVR to fetch company details or input manually
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-center gap-2">
              <Input
                id="cvr"
                name="cvr"
                placeholder="CVR Number"
                required
                pattern="\d{8}"
                title="CVR must be 8 digits"
                className="grow"
              />
              <Button
                type="button"
                onClick={handleFetchData}
                variant="outline"
                className="shrink-0"
              >
                <SearchIcon className="mr-2 size-4" />
                Fetch
              </Button>
            </div>
            {companyData && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Fetched Data:</p>
                <ScrollArea className="h-[150px] w-full rounded border p-4">
                  <pre className="text-sm">
                    {JSON.stringify(companyData, null, 2)}
                  </pre>
                </ScrollArea>
                <p className="text-sm text-gray-500">
                  Please confirm if this data is correct.
                </p>
              </div>
            )}
            <Input
              name="name"
              placeholder="Company Name"
              required
              value={companyData?.name || ""}
              readOnly={!!companyData}
            />
            <Textarea
              name="description"
              placeholder="Company Description (optional)"
            />
            <Button
              type="submit"
              disabled={isLoading || !isFetched}
              className="w-full"
            >
              {isLoading ? (
                "Adding..."
              ) : (
                <>
                  <PlusIcon className="mr-2 size-4" />
                  Add Company
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  )
}
