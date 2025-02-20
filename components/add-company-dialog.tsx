"use client"

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { AddCompanyForm } from "@/components/add-company-form"

interface AddCompanyDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: (companyId: string) => void
}

export function AddCompanyDialog({
  open,
  onOpenChange,
  onSuccess
}: AddCompanyDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[550px]">
        <DialogTitle>Add Company</DialogTitle>
        <AddCompanyForm onSuccess={onSuccess} />
      </DialogContent>
    </Dialog>
  )
}
