"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog"
import { useCompanyContext } from "@/lib/company-provider"
import {
  getDocumentsByCompany,
  deleteDocumentsByCompany
} from "@/actions/document"
import { deleteCompany } from "@/actions/db/companies/mutations"
import { useToast } from "@/components/ui/use-toast"
import { type SelectDocument } from "@/db/schema"

interface DeleteCompanyDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  companyId: string
}

export const DeleteCompanyDialog: React.FC<DeleteCompanyDialogProps> = ({
  open,
  onOpenChange,
  companyId
}) => {
  const { companies, setSelectedCompanyId } = useCompanyContext()
  const [hasDocuments, setHasDocuments] = React.useState<boolean>(false)
  const { toast } = useToast()

  React.useEffect(() => {
    if (companyId) {
      getDocumentsByCompany(companyId).then(documents => {
        setHasDocuments(documents.length > 0)
      })
    }
  }, [companyId])

  const handleDelete = async () => {
    try {
      if (hasDocuments) {
        await deleteDocumentsByCompany(companyId)
      }
      await deleteCompany(companyId)
      toast({
        title: "Success",
        description: "Company deleted successfully",
        variant: "default"
      })

      // Update the state
      const updatedCompanies = companies.filter(
        company => company.id !== companyId
      )
      setSelectedCompanyId(
        updatedCompanies.length > 0 ? updatedCompanies[0].id : null
      )
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete company",
        variant: "destructive"
      })
    } finally {
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Company</DialogTitle>
          <DialogDescription>
            {hasDocuments ? (
              <>
                This company has associated documents. Deleting the company will
                also delete all associated documents. This action cannot be
                undone.
              </>
            ) : (
              <>
                Are you sure you want to delete this company? This action cannot
                be undone.
              </>
            )}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleDelete}>
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
