"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import {
  documentTypeEnum,
  documentTypeValues,
  type DocumentType
} from "@/db/schema"

interface AddDocumentFormProps {
  selectedCompanyId: string
  onSuccess: () => void
}

export function AddDocumentForm({
  selectedCompanyId,
  onSuccess
}: AddDocumentFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [category, setCategory] = useState<DocumentType>("other")
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !category) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      })
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch("/api/library/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name,
          description,
          category,
          companyId: selectedCompanyId
        })
      })

      if (!response.ok) {
        throw new Error("Failed to create document")
      }

      toast({
        title: "Success",
        description: "Document created successfully"
      })
      onSuccess()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create document",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Add Document</DialogTitle>
        <DialogDescription>
          Create a new document in the library.
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Input
            id="name"
            placeholder="Document name"
            value={name}
            onChange={e => setName(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Textarea
            id="description"
            placeholder="Document description (optional)"
            value={description}
            onChange={e => setDescription(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Select
            value={category}
            onValueChange={(value: DocumentType) => setCategory(value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {documentTypeValues.map((cat: DocumentType) => (
                <SelectItem key={cat} value={cat}>
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <DialogFooter>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Creating..." : "Create"}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  )
}
