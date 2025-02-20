"use client"

import { useParams, usePathname, useRouter } from "next/navigation"
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroup,
  SidebarSeparator
} from "@/components/ui/sidebar"
import {
  LayoutDashboard,
  FileText,
  LineChart,
  TrendingUp,
  Building2,
  ChevronsUpDown,
  PlusCircle,
  Trash2
} from "lucide-react"
import Link from "next/link"
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
import { AddCompanyDialog } from "@/components/add-company-dialog"
import { DeleteCompanyDialog } from "@/components/delete-company-dialog"
import { useCompanyContext } from "@/lib/company-provider"
import { cn } from "@/lib/utils"
import * as React from "react"

export default function CompanySidebar() {
  const params = useParams()
  const pathname = usePathname()
  const router = useRouter()
  const companyId = params.companyId as string
  const [open, setOpen] = React.useState(false)
  const [addCompanyOpen, setAddCompanyOpen] = React.useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false)
  const { companies, selectedCompanyId, setSelectedCompanyId } =
    useCompanyContext()

  // Memoize the selected company to avoid unnecessary re-renders
  const selectedCompany = React.useMemo(
    () => companies.find(company => company.id === companyId),
    [companies, companyId]
  )

  const handleCompanySelect = (newCompanyId: string) => {
    setSelectedCompanyId(newCompanyId)
    setOpen(false)
    // Get the relative path after /companies/[companyId]
    const subPath = pathname.split(`/companies/${companyId}`)[1] || ""
    // Navigate to the same page but for the new company
    router.push(`/companies/${newCompanyId}${subPath}`)
  }

  const links = [
    {
      label: "Overview",
      href: `/companies/${companyId}`,
      icon: <LayoutDashboard className="size-4" />
    },
    {
      label: "Files",
      href: `/companies/${companyId}/files`,
      icon: <FileText className="size-4" />
    },
    {
      label: "Analysis",
      href: `/companies/${companyId}/analysis`,
      icon: <LineChart className="size-4" />
    },
    {
      label: "Trends",
      href: `/companies/${companyId}/trends`,
      icon: <TrendingUp className="size-4" />
    }
  ]

  return (
    <Sidebar variant="inset" collapsible="icon">
      <SidebarHeader className="space-y-4 py-4">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              role="combobox"
              aria-expanded={open}
              className="w-full justify-between font-normal"
            >
              <div className="flex items-center gap-2 truncate">
                <Building2 className="size-4" />
                <span className="truncate">
                  {selectedCompany ? selectedCompany.name : "Select company..."}
                </span>
              </div>
              <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent
            className="w-[--sidebar-width] p-0"
            align="start"
            sideOffset={8}
          >
            <Command>
              <CommandInput placeholder="Search company..." />
              <CommandList>
                <CommandEmpty>No company found.</CommandEmpty>
                <CommandGroup heading="Companies">
                  {companies.map(company => (
                    <CommandItem
                      key={company.id}
                      onSelect={() => handleCompanySelect(company.id)}
                      className="gap-2"
                    >
                      <Building2
                        className={cn(
                          "size-4",
                          selectedCompanyId === company.id
                            ? "text-primary"
                            : "opacity-50"
                        )}
                      />
                      <span className="truncate">{company.name}</span>
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
                      className="text-destructive"
                    >
                      <Trash2 className="mr-2 size-4" />
                      Delete company
                    </CommandItem>
                  )}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </SidebarHeader>

      <SidebarSeparator />

      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            {links.map(link => (
              <SidebarMenuItem key={link.href}>
                <SidebarMenuButton
                  asChild
                  tooltip={link.label}
                  isActive={pathname === link.href}
                >
                  <Link href={link.href}>
                    {link.icon}
                    <span>{link.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

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
    </Sidebar>
  )
}
