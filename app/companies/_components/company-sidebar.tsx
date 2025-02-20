"use client"

import { useParams, usePathname, useRouter } from "next/navigation"
import Link from "next/link"
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
  Building2,
  ChevronsUpDown,
  PlusCircle,
  LayoutDashboard,
  FileText,
  LineChart,
  TrendingUp
} from "lucide-react"
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
  const { companies, selectedCompanyId, setSelectedCompanyId } =
    useCompanyContext()

  const selectedCompany = React.useMemo(
    () => companies.find(company => company.id === selectedCompanyId),
    [companies, selectedCompanyId]
  )

  const handleCompanySelect = (newCompanyId: string) => {
    setSelectedCompanyId(newCompanyId)
    setOpen(false)
    router.push(`/companies/${newCompanyId}`)
  }

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
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </SidebarHeader>

      <SidebarSeparator />

      <SidebarContent>
        {selectedCompany && (
          <SidebarGroup>
            <SidebarMenu>
              {companyId && (
                <>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      asChild
                      tooltip="Overview"
                      isActive={pathname === `/companies/${companyId}`}
                    >
                      <Link href={`/companies/${companyId}`}>
                        <LayoutDashboard className="size-4" />
                        <span>Overview</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      asChild
                      tooltip="Files"
                      isActive={pathname === `/companies/${companyId}/files`}
                    >
                      <Link href={`/companies/${companyId}/files`}>
                        <FileText className="size-4" />
                        <span>Files</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      asChild
                      tooltip="Analysis"
                      isActive={pathname === `/companies/${companyId}/analysis`}
                    >
                      <Link href={`/companies/${companyId}/analysis`}>
                        <LineChart className="size-4" />
                        <span>Analysis</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      asChild
                      tooltip="Trends"
                      isActive={pathname === `/companies/${companyId}/trends`}
                    >
                      <Link href={`/companies/${companyId}/trends`}>
                        <TrendingUp className="size-4" />
                        <span>Trends</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </>
              )}
            </SidebarMenu>
          </SidebarGroup>
        )}
      </SidebarContent>

      <AddCompanyDialog
        open={addCompanyOpen}
        onOpenChange={setAddCompanyOpen}
      />
    </Sidebar>
  )
}
