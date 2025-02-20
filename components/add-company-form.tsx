"use client"

import { useState, useEffect, useRef, useTransition } from "react"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from "@/components/ui/card"
import { BuildingIcon, SearchIcon, PlusIcon, Loader2 } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { useToast } from "@/components/ui/use-toast"
import { Badge } from "@/components/ui/badge"
import { useCompanyContext } from "@/lib/company-provider"
import {
  createCompany,
  fetchCompanyData,
  type CompanyDataResponse,
  type Company
} from "@/actions/companies/index"

interface AddCompanyFormProps {
  onSuccess?: (companyId: string) => void
}

export function AddCompanyForm({ onSuccess }: AddCompanyFormProps) {
  const [isPending, startTransition] = useTransition()
  const [isFetching, setIsFetching] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const { setCompanies, setSelectedCompanyId } = useCompanyContext()
  const [companyData, setCompanyData] = useState<CompanyDataResponse | null>(
    null
  )
  const formRef = useRef<HTMLFormElement>(null)
  const [isFetched, setIsFetched] = useState(false)
  const { toast } = useToast()
  const [generatedTags, setGeneratedTags] = useState<string[]>([])
  const [isGeneratingTags, setIsGeneratingTags] = useState(false)

  const handleFetchData = async () => {
    if (!formRef.current) return

    const formData = new FormData(formRef.current)
    const cvr = formData.get("cvr") as string
    const name = formData.get("name") as string

    if (!cvr && !name) {
      toast({
        title: "Error",
        description: "Please enter a CVR number or company name",
        variant: "destructive"
      })
      return
    }

    setIsFetching(true)
    startTransition(async () => {
      try {
        const result = await fetchCompanyData(cvr || name)
        if (result.isSuccess && result.data) {
          setCompanyData(result.data)
          setIsFetched(true)
          toast({
            title: "Success",
            description: "Company data fetched successfully"
          })
        } else {
          toast({
            title: "Error",
            description: result.message,
            variant: "destructive"
          })
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to fetch company data",
          variant: "destructive"
        })
      } finally {
        setIsFetching(false)
      }
    })
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!formRef.current) return

    const formData = new FormData(formRef.current)
    if (companyData) {
      formData.append("metadata", JSON.stringify(companyData))
    }

    setIsCreating(true)
    setIsGeneratingTags(true)
    startTransition(async () => {
      try {
        const result = await createCompany(formData)
        if (result.isSuccess && result.data) {
          setGeneratedTags(JSON.parse(result.data.tags || "[]"))
          toast({
            title: "Success",
            description: result.message
          })
          setCompanies(prevCompanies => [...prevCompanies, result.data!])
          setSelectedCompanyId(result.data.id)
          onSuccess?.(result.data.id)
        } else {
          toast({
            title: "Error",
            description: result.message,
            variant: "destructive"
          })
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to create company",
          variant: "destructive"
        })
      } finally {
        setIsCreating(false)
        setIsGeneratingTags(false)
      }
    })
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
                pattern="\d{8}"
                title="CVR must be 8 digits"
                className="grow"
                disabled={isFetching || isCreating}
              />
              <Button
                type="button"
                onClick={handleFetchData}
                variant="outline"
                className="shrink-0"
                disabled={isFetching || isCreating}
              >
                {isFetching ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Fetching...
                  </>
                ) : (
                  <>
                    <SearchIcon className="mr-2 size-4" />
                    Fetch
                  </>
                )}
              </Button>
            </div>

            <AnimatePresence>
              {companyData && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-2"
                >
                  <p className="text-sm font-medium">Fetched Data:</p>
                  <ScrollArea className="h-[150px] w-full rounded border p-4">
                    <pre className="text-sm">
                      {JSON.stringify(companyData, null, 2)}
                    </pre>
                  </ScrollArea>
                  <p className="text-sm text-gray-500">
                    Please confirm if this data is correct.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            <Input
              name="name"
              placeholder="Company Name"
              required
              value={companyData?.name || ""}
              readOnly={!!companyData}
              disabled={isFetching || isCreating}
            />

            <Textarea
              name="description"
              placeholder="Company Description (optional)"
              disabled={isFetching || isCreating}
            />

            {isGeneratingTags && (
              <div className="text-muted-foreground flex items-center gap-2 text-sm">
                <Loader2 className="size-4 animate-spin" />
                Analyzing company data and generating tags...
              </div>
            )}

            <AnimatePresence>
              {generatedTags.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-2"
                >
                  <p className="text-sm font-medium">Generated Tags:</p>
                  <div className="flex flex-wrap gap-2">
                    {generatedTags.map(tag => (
                      <Badge
                        key={tag}
                        variant="secondary"
                        className="bg-blue-100 text-xs text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                      >
                        #{tag.toLowerCase().replace(/\s+/g, "-")}
                      </Badge>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <Button
              type="submit"
              disabled={isCreating || !isFetched || isFetching}
              className="w-full"
            >
              {isCreating ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="size-4 animate-spin" />
                  {isGeneratingTags ? "Generating Tags..." : "Adding..."}
                </div>
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
