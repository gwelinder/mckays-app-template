"use client"

import { useState, useCallback } from "react"
import { useDropzone } from "react-dropzone"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Upload, X } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { cn } from "@/lib/utils"

interface UploadFormProps {
  companyId: string
  onUploadComplete?: (documentIds: string[]) => void
  maxFiles?: number
  acceptedFileTypes?: string[]
}

interface FileWithProgress extends File {
  progress: number
  id?: string
  error?: string
}

export function UploadForm({
  companyId,
  onUploadComplete,
  maxFiles = 5,
  acceptedFileTypes = [
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/msword"
  ]
}: UploadFormProps) {
  const { toast } = useToast()
  const [files, setFiles] = useState<FileWithProgress[]>([])
  const [isUploading, setIsUploading] = useState(false)

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (files.length + acceptedFiles.length > maxFiles) {
        toast({
          title: "Too many files",
          description: `Maximum ${maxFiles} files allowed`,
          variant: "destructive"
        })
        return
      }

      const newFiles = acceptedFiles.map(file => ({
        ...file,
        progress: 0
      }))

      setFiles(prev => [...prev, ...newFiles])
    },
    [files.length, maxFiles, toast]
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: acceptedFileTypes.reduce(
      (acc, type) => ({ ...acc, [type]: [] }),
      {}
    ),
    maxFiles: maxFiles - files.length,
    disabled: isUploading
  })

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index))
  }

  const uploadFiles = async () => {
    if (files.length === 0) return

    setIsUploading(true)
    const documentIds: string[] = []

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const formData = new FormData()
        formData.append("file", file)
        formData.append("companyId", companyId)

        const response = await fetch("/api/documents/storage/upload", {
          method: "POST",
          body: formData
        })

        if (!response.ok) {
          throw new Error(`Failed to upload ${file.name}`)
        }

        const data = await response.json()
        documentIds.push(data.documentId)

        setFiles(prev =>
          prev.map((f, index) =>
            index === i ? { ...f, progress: 100, id: data.documentId } : f
          )
        )
      }

      toast({
        title: "Upload Complete",
        description: `Successfully uploaded ${files.length} file${
          files.length > 1 ? "s" : ""
        }`
      })

      onUploadComplete?.(documentIds)
      setFiles([])
    } catch (error) {
      console.error("Upload error:", error)
      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive"
      })
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={cn(
          "cursor-pointer rounded-lg border-2 border-dashed p-8 text-center transition-colors",
          isDragActive
            ? "border-primary bg-primary/10"
            : "border-muted-foreground/25 hover:border-primary/50",
          isUploading && "pointer-events-none opacity-50"
        )}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-2">
          <Upload className="text-muted-foreground size-8" />
          {isDragActive ? (
            <p>Drop the files here...</p>
          ) : (
            <>
              <p className="text-muted-foreground text-sm">
                Drag & drop files here, or click to select
              </p>
              <p className="text-muted-foreground text-xs">
                Supported formats: PDF, DOCX, DOC (Max {maxFiles} files)
              </p>
            </>
          )}
        </div>
      </div>

      {files.length > 0 && (
        <Card>
          <CardContent className="space-y-4 p-4">
            {files.map((file, index) => (
              <div
                key={`${file.name}-${index}`}
                className="flex items-center gap-4"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{file.name}</p>
                  <Progress value={file.progress} className="mt-2 h-1" />
                </div>
                {!isUploading && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeFile(index)}
                  >
                    <X className="size-4" />
                  </Button>
                )}
              </div>
            ))}

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setFiles([])}
                disabled={isUploading}
              >
                Clear All
              </Button>
              <Button onClick={uploadFiles} disabled={isUploading}>
                {isUploading ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  "Upload Files"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
