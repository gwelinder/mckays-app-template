"use client"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { X } from "lucide-react"

interface FileValidatorProps {
  file: File
  maxSize?: number // in bytes
  acceptedTypes?: string[]
  onInvalid?: (error: string) => void
}

interface ValidationResult {
  isValid: boolean
  error?: string
}

export function validateFile(
  file: File,
  maxSize: number = 10 * 1024 * 1024, // 10MB default
  acceptedTypes: string[] = [
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/msword"
  ]
): ValidationResult {
  // Check file size
  if (file.size > maxSize) {
    return {
      isValid: false,
      error: `File size exceeds ${(maxSize / 1024 / 1024).toFixed(0)}MB limit`
    }
  }

  // Check file type
  if (!acceptedTypes.includes(file.type)) {
    return {
      isValid: false,
      error: `File type ${file.type || "unknown"} is not supported`
    }
  }

  return { isValid: true }
}

export function FileValidator({
  file,
  maxSize,
  acceptedTypes,
  onInvalid
}: FileValidatorProps) {
  const validation = validateFile(file, maxSize, acceptedTypes)

  if (!validation.isValid) {
    onInvalid?.(validation.error || "Invalid file")
    return (
      <Alert variant="destructive" className="mt-2">
        <AlertDescription className="flex items-center gap-2">
          <X className="size-4" />
          {validation.error}
        </AlertDescription>
      </Alert>
    )
  }

  return null
}
