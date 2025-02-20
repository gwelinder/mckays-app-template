"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2 } from "lucide-react"
import {
  SUPPORTED_FILE_TYPES,
  type SupportedFileType
} from "@/actions/analyze/process-document"

interface DocumentUploaderProps {
  companyId: string
  onUploadComplete: (urls: string[]) => void
  maxFiles?: number
}

export function DocumentUploader({
  companyId,
  onUploadComplete,
  maxFiles = 5
}: DocumentUploaderProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return

    setIsUploading(true)
    setError(null)

    try {
      const files = Array.from(e.target.files)
      if (files.length > maxFiles) {
        throw new Error(`Maximum ${maxFiles} files allowed`)
      }

      // Validate file types
      files.forEach(file => {
        const extension = file.name.split(".").pop()?.toLowerCase()
        if (
          !extension ||
          !SUPPORTED_FILE_TYPES.includes(extension as SupportedFileType)
        ) {
          throw new Error(
            `Unsupported file type: ${extension}. Supported types: ${SUPPORTED_FILE_TYPES.join(
              ", "
            )}`
          )
        }
      })

      // Upload files in parallel
      const uploadPromises = files.map(async file => {
        const formData = new FormData()
        formData.append("file", file)

        const response = await fetch(
          `/api/files/upload?filename=${encodeURIComponent(
            file.name
          )}&companyId=${companyId}`,
          {
            method: "POST",
            body: file
          }
        )

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || "Upload failed")
        }

        const data = await response.json()
        return data.data.url
      })

      const urls = await Promise.all(uploadPromises)
      onUploadComplete(urls)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed")
    } finally {
      setIsUploading(false)
      if (e.target) {
        e.target.value = "" // Reset input
      }
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Input
          type="file"
          multiple
          accept=".pdf,.xlsx,.docx,.pptx"
          onChange={handleUpload}
          disabled={isUploading}
          className="flex-1"
        />
        {isUploading && <Loader2 className="size-4 animate-spin" />}
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  )
}
