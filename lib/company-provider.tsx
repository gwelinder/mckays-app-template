"use client"
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  Dispatch,
  SetStateAction,
  useMemo,
  type ReactNode,
  useCallback
} from "react"
import { type SelectCompany as Company } from "@/db/schema"

interface CompanyContextType {
  companies: Company[]
  setCompanies: Dispatch<SetStateAction<Company[]>>
  selectedCompanyId: string | null
  selectedCompany: Company | null
  setSelectedCompanyId: (id: string | null) => void
  setSelectedCompany: Dispatch<SetStateAction<Company | null>>
}

const CompanyContext = createContext<CompanyContextType | undefined>(undefined)

export function CompanyProvider({
  children,
  initialCompanies,
  initialSelectedCompanyId
}: {
  children: ReactNode
  initialCompanies: Company[]
  initialSelectedCompanyId: string | null
}) {
  const [companies, setCompanies] = useState<Company[]>(initialCompanies || [])
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(
    initialSelectedCompanyId
  )
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null)

  useEffect(() => {
    if (initialCompanies) {
      setCompanies(initialCompanies)
    }
  }, [initialCompanies])

  useEffect(() => {
    // Update cookie whenever the selected company ID changes
    if (typeof document !== "undefined") {
      if (selectedCompanyId) {
        document.cookie = `selectedCompanyId=${selectedCompanyId}; path=/; max-age=31536000` // 1 year
      } else {
        document.cookie = "selectedCompanyId=; path=/; max-age=0" // Delete cookie
      }
    }
  }, [selectedCompanyId])

  useEffect(() => {
    // Update selected company when ID changes
    if (selectedCompanyId) {
      const company = companies.find(c => c.id === selectedCompanyId)
      setSelectedCompany(company || null)
    } else {
      setSelectedCompany(null)
    }
  }, [selectedCompanyId, companies])

  const handleSetSelectedCompanyId = useCallback((id: string | null) => {
    setSelectedCompanyId(id)
  }, [])

  const contextValue = useMemo(
    () => ({
      companies,
      selectedCompanyId,
      selectedCompany,
      setCompanies,
      setSelectedCompanyId: handleSetSelectedCompanyId,
      setSelectedCompany
    }),
    [
      companies,
      selectedCompanyId,
      selectedCompany,
      setCompanies,
      handleSetSelectedCompanyId,
      setSelectedCompany
    ]
  )

  return (
    <CompanyContext.Provider value={contextValue}>
      {children}
    </CompanyContext.Provider>
  )
}

export function useCompanyContext() {
  const context = useContext(CompanyContext)
  if (context === undefined) {
    throw new Error("useCompanyContext must be used within a CompanyProvider")
  }
  return context
}
