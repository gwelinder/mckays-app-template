"use client"
import * as React from "react"
import {
  Check,
  ChevronsUpDown,
  CircleDot,
  PlusCircle,
  Trash2
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from "@/components/ui/popover"
import { AddCompanyDialog } from "./add-company-dialog"
import { DeleteCompanyDialog } from "./delete-company-dialog"
import { useCompanyContext } from "@/lib/companyProvider"
import { Label } from "@/components/ui/label"
import type { Company } from "@/schema"

export function CompanySelector() {
  const [open, setOpen] = React.useState(false)
  const [addCompanyOpen, setAddCompanyOpen] = React.useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false)
  const { companies, selectedCompanyId, setSelectedCompanyId } =
    useCompanyContext()

  // Memoize the selected company to avoid unnecessary re-renders
  const selectedCompany = React.useMemo(
    () => companies.find(company => company.id === selectedCompanyId),
    [companies, selectedCompanyId]
  )

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="max-w-xs justify-between truncate"
          >
            <ChevronsUpDown className="mr-2 size-4 shrink-0 opacity-50" />
            {selectedCompany ? selectedCompany.name : "Select company..."}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="max-w-xs p-0">
          <Command>
            <CommandInput placeholder="Search company..." />
            <CommandList>
              <CommandEmpty>No company found.</CommandEmpty>
              <CommandGroup heading="Companies">
                {companies.map(company => (
                  <CommandItem
                    key={company.id}
                    onSelect={() => {
                      setSelectedCompanyId(company.id)
                      setOpen(false)
                    }}
                    className="gap-2"
                    value={company.name}
                  >
                    <Check
                      className={cn(
                        "size-4",
                        selectedCompanyId === company.id
                          ? "opacity-100"
                          : "opacity-0"
                      )}
                    />
                    <Label className="max-w-2/3 ml-2 truncate text-ellipsis text-wrap">
                      {company.name}
                    </Label>
                  </CommandItem>
                ))}
              </CommandGroup>
              <CommandGroup heading="Actions">
                <CommandItem
                  onSelect={() => {
                    setAddCompanyOpen(true)
                    setOpen(false)
                  }}
                >
                  <PlusCircle className="mr-2 size-4" />
                  Add new company
                </CommandItem>
                {selectedCompanyId && (
                  <CommandItem
                    onSelect={() => {
                      setDeleteDialogOpen(true)
                      setOpen(false)
                    }}
                  >
                    <Trash2 className="mr-2 size-4" />
                    Delete selected company
                  </CommandItem>
                )}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      <AddCompanyDialog
        open={addCompanyOpen}
        onOpenChange={setAddCompanyOpen}
      />
      {selectedCompanyId && (
        <DeleteCompanyDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          companyId={selectedCompanyId}
        />
      )}
    </>
  )
}
