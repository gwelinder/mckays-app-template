"use client"
import { useState, useRef, useEffect } from "react"
import useSWR from "swr"
import { fetcher } from "@/utils/functions"
import { Button } from "@/components/ui/button"
import { PlusIcon, TrashIcon, UploadIcon } from "lucide-react"
import Modal from "@/components/modal"
import { AddDocumentForm } from "@/components/add-document-form"
import { useCompanyContext } from "@/lib/companyProvider"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import { toast } from "@/hooks/use-toast"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table"

type Document = {
  id: string
  name: string
  category: string
  url: string
}

const LibraryManagement = () => {
  const { selectedCompanyId } = useCompanyContext()
  const {
    data: documents,
    mutate,
    isLoading
  } = useSWR(
    selectedCompanyId
      ? `/api/library/list?companyId=${selectedCompanyId}`
      : null,
    fetcher,
    { fallbackData: [] }
  )
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const inputFileRef = useRef<HTMLInputElement>(null)
  const [uploadQueue, setUploadQueue] = useState<Array<string>>([])
  const [deleteQueue, setDeleteQueue] = useState<Array<string>>([])

  const handleDelete = async (docId: string) => {
    await fetch(`/api/library/delete?id=${docId}`, { method: "DELETE" })
    mutate()
  }

  const handleFileUpload = async (file: File) => {
    if (file && selectedCompanyId) {
      setUploadQueue(currentQueue => [...currentQueue, file.name])
      await fetch(
        `/api/files/upload?filename=${file.name}&companyId=${selectedCompanyId}`,
        {
          method: "POST",
          body: file
        }
      )
      setUploadQueue(currentQueue =>
        currentQueue.filter(filename => filename !== file.name)
      )
      mutate()
    }
  }

  const filteredDocuments = selectedCategory
    ? documents.filter((doc: Document) => doc.category === selectedCategory)
    : documents

  if (!selectedCompanyId) {
    return <p>Please select a company to view documents.</p>
  }

  return (
    <div className="p-4">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Library</h2>
        <div className="flex items-center space-x-2">
          <Select onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filter by category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Financial">Financial</SelectItem>
              <SelectItem value="Legal">Legal</SelectItem>
              <SelectItem value="HR">HR</SelectItem>
              <SelectItem value="Technical">Technical</SelectItem>
              <SelectItem value="Meetings">Meetings</SelectItem>
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
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDocuments.map((document: Document) => (
                  <TableRow key={document.id}>
                    <TableCell>
                      <div className="max-w-xs truncate" title={document.name}>
                        {document.name.split(".").slice(0, -1).join(".")}
                      </div>
                      <div className="text-xs text-zinc-500">
                        {`.${document.name.split(".").pop()}`}
                      </div>
                    </TableCell>
                    <TableCell>{document.category}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        color="red"
                        onClick={() => handleDelete(document.id)}
                      >
                        <TrashIcon />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <AddDocumentForm
          selectedCompanyId={selectedCompanyId}
          onSuccess={() => {
            mutate()
            setIsModalOpen(false)
          }}
        />
      </Modal>
    </div>
  )
}

export default LibraryManagement
