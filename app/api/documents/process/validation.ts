import {
  SUPPORTED_FILE_TYPES,
  type SupportedFileType
} from "@/actions/analyze/process-document"

const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB

export interface ValidationResult {
  isValid: boolean
  error?: string
}

export interface FileValidationOptions {
  maxSize?: number
  allowedTypes?: SupportedFileType[]
}

export async function validateFile(
  file: File | Blob,
  options: FileValidationOptions = {}
): Promise<ValidationResult> {
  const maxSize = options.maxSize || MAX_FILE_SIZE
  const allowedTypes = options.allowedTypes || SUPPORTED_FILE_TYPES

  // Check file size
  if (file.size > maxSize) {
    return {
      isValid: false,
      error: `File size exceeds maximum allowed size of ${maxSize / (1024 * 1024)}MB`
    }
  }

  // Check file type
  if (file instanceof File) {
    const extension = file.name.split(".").pop()?.toLowerCase()
    if (!extension || !allowedTypes.includes(extension as SupportedFileType)) {
      return {
        isValid: false,
        error: `Unsupported file type: ${extension}. Supported types: ${allowedTypes.join(
          ", "
        )}`
      }
    }
  }

  return { isValid: true }
}

export function validateMimeType(mimeType: string): ValidationResult {
  const allowedMimeTypes = [
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation"
  ]

  if (!allowedMimeTypes.includes(mimeType)) {
    return {
      isValid: false,
      error: `Unsupported MIME type: ${mimeType}`
    }
  }

  return { isValid: true }
}

export function getFileType(fileName: string): SupportedFileType {
  const extension = fileName.split(".").pop()?.toLowerCase()
  if (
    !extension ||
    !SUPPORTED_FILE_TYPES.includes(extension as SupportedFileType)
  ) {
    throw new Error(`Unsupported file type: ${extension}`)
  }
  return extension as SupportedFileType
}
