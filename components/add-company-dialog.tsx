"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area" // Add this import
import { useActionState } from "react"
import { createCompany, getCompanyData } from "@/app/actions/company"
import { useToast } from "@/hooks/use-toast"
import { useCompanyContext } from "@/lib/companyProvider"
import { Company } from "@/schema"
import { AddCompanyForm } from "@/components/add-company-form"

type CompanyActionState = {
  status: "idle" | "success" | "error"
  message?: string
  company?: Company
}

const initialState: CompanyActionState = {
  status: "idle"
}

interface AddCompanyDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AddCompanyDialog({
  open,
  onOpenChange
}: AddCompanyDialogProps) {
  const { toast } = useToast()
  const { setCompanies } = useCompanyContext()
  const [state, formAction] = useActionState<CompanyActionState, FormData>(
    createCompany,
    initialState
  )
  const [companyData, setCompanyData] = useState<any>(null)
  const [fetchState, fetchAction] = useActionState(getCompanyData, {
    status: "idle",
    data: null
  })
  const formRef = useRef<HTMLFormElement>(null)
  const [isFetched, setIsFetched] = useState(false)

  const handleFetchData = async () => {
    if (formRef.current) {
      const formData = new FormData(formRef.current)
      console.log("Fetching data with formData:", Object.fromEntries(formData))
      const result = await fetchAction(formData)
      console.log("Fetch result:", result)
      setIsFetched(true)
    } else {
      console.error("Form reference is null")
    }
  }

  useEffect(() => {
    if (state.status === "success" && state.company) {
      toast({
        title: "Company added successfully",
        description: `${state.company.name} has been added to your companies.`,
        duration: 5000
      })
      setCompanies(prevCompanies => [
        ...prevCompanies,
        state.company as Company
      ])
      onOpenChange(false)
    } else if (state.status === "error") {
      toast({
        title: "Error",
        description: state.message || "Failed to add company",
        variant: "destructive",
        duration: 5000
      })
    }
  }, [state, onOpenChange, setCompanies, toast])

  useEffect(() => {
    if (fetchState.status === "success" && fetchState.data) {
      setCompanyData(fetchState.data)
    } else if (fetchState.status === "error") {
      toast({
        title: "Error",
        description: "Failed to fetch company data. Please try again.",
        variant: "destructive",
        duration: 5000
      })
    }
  }, [fetchState, toast])

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    formData.append("metadata", JSON.stringify(companyData))
    formAction(formData)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[550px]">
        <DialogTitle>Add Company</DialogTitle>
        <AddCompanyForm />
      </DialogContent>
    </Dialog>
  )
}
