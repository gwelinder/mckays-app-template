"use client"

import { useState, useRef } from "react"
import useSWR from "swr"
import { fetcher } from "@/utils/functions"
import { Button } from "@/components/ui/button"
import { PlusIcon, TrashIcon, UploadIcon } from "lucide-react"
import { Dialog } from "@/components/ui/dialog"
import { AddDocumentForm } from "./add-document-form"
import { useCompanyContext } from "@/lib/company-provider"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table"
import { type SelectDocument } from "@/db/schema"
import { documentTypeEnum } from "@/db/schema/document-types-schema"

const LibraryManagement = () => {
  const { selectedCompanyId } = useCompanyContext()
  const {
    data: documents,
    mutate,
    isLoading
  } = useSWR<SelectDocument[]>(
    selectedCompanyId
      ? `/api/documents/storage/list?companyId=${selectedCompanyId}`
      : null,
    fetcher,
    { fallbackData: [] }
  )
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const inputFileRef = useRef<HTMLInputElement>(null)
  const [uploadQueue, setUploadQueue] = useState<Array<string>>([])
  const [deleteQueue, setDeleteQueue] = useState<Array<string>>([])
  const { toast } = useToast()

  const handleDelete = async (docId: string) => {
    try {
      setDeleteQueue(currentQueue => [...currentQueue, docId])
      await fetch(`/api/documents/storage/delete?id=${docId}`, {
        method: "DELETE"
      })
      mutate()
      toast({
        title: "Success",
        description: "Document deleted successfully"
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete document",
        variant: "destructive"
      })
    } finally {
      setDeleteQueue(currentQueue => currentQueue.filter(id => id !== docId))
    }
  }

  const handleFileUpload = async (file: File) => {
    if (file && selectedCompanyId) {
      try {
        setUploadQueue(currentQueue => [...currentQueue, file.name])
        const formData = new FormData()
        formData.append("file", file)
        formData.append("companyId", selectedCompanyId)

        await fetch("/api/documents/storage/upload", {
          method: "POST",
          body: formData
        })

        mutate()
        toast({
          title: "Success",
          description: "File uploaded successfully"
        })
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to upload file",
          variant: "destructive"
        })
      } finally {
        setUploadQueue(currentQueue =>
          currentQueue.filter(filename => filename !== file.name)
        )
      }
    }
  }

  const filteredDocuments = selectedCategory
    ? (documents?.filter(doc => doc.type === selectedCategory) ?? [])
    : (documents ?? [])

  if (!selectedCompanyId) {
    return <p>Please select a company to view documents.</p>
  }

  return (
    <div className="p-4">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Library</h2>
        <div className="flex items-center space-x-2">
          <Select
            value={selectedCategory ?? undefined}
            onValueChange={setSelectedCategory}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filter by category" />
            </SelectTrigger>
            <SelectContent>
              {documentTypeEnum.enumValues.map(type => (
                <SelectItem key={type} value={type}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={() => setIsModalOpen(true)}>
            <PlusIcon className="mr-2" />
            Add Document
          </Button>
          <Button onClick={() => inputFileRef.current?.click()}>
            <UploadIcon className="mr-2" />
            Upload File
          </Button>
          <input
            name="file"
            ref={inputFileRef}
            type="file"
            required
            className="hidden"
            accept="application/pdf"
            multiple={false}
            onChange={event => {
              const file = event.target.files?.[0]
              if (file) {
                handleFileUpload(file)
              }
            }}
          />
        </div>
      </div>
      <div className="space-y-2">
        {isLoading ? (
          <p>Loading documents...</p>
        ) : filteredDocuments.length === 0 ? (
          <p>No documents found. Add some to get started!</p>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDocuments.map(document => (
                  <TableRow key={document.id}>
                    <TableCell>
                      <div className="max-w-xs truncate" title={document.name}>
                        {document.name}
                      </div>
                      {document.description && (
                        <div className="text-xs text-zinc-500">
                          {document.description}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {document.type.charAt(0).toUpperCase() +
                        document.type.slice(1)}
                    </TableCell>
                    <TableCell>{document.status}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        onClick={() => handleDelete(document.id)}
                        disabled={deleteQueue.includes(document.id)}
                      >
                        {deleteQueue.includes(document.id) ? (
                          "Deleting..."
                        ) : (
                          <TrashIcon className="size-4" />
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <AddDocumentForm
          selectedCompanyId={selectedCompanyId}
          onSuccess={() => {
            mutate()
            setIsModalOpen(false)
          }}
        />
      </Dialog>
    </div>
  )
}

export default LibraryManagement
