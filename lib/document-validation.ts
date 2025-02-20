import { documentTypeEnum } from "@/db/schema/document-types-schema"

// Maximum file size (50MB)
export const MAX_FILE_SIZE = 50 * 1024 * 1024

// Allowed file types
export const ALLOWED_FILE_TYPES = {
  pdf: {
    mimeType: "application/pdf",
    extension: ".pdf"
  },
  docx: {
    mimeType:
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    extension: ".docx"
  },
  xlsx: {
    mimeType:
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    extension: ".xlsx"
  }
} as const

type AllowedMimeType =
  (typeof ALLOWED_FILE_TYPES)[keyof typeof ALLOWED_FILE_TYPES]["mimeType"]

// File naming patterns by document type
export const FILE_NAME_PATTERNS = {
  board_minutes: {
    pattern: /^\d{4}-\d{2}-\d{2}-[a-z-]+-meeting\.pdf$/,
    example: "2024-03-15-board-meeting.pdf",
    description: "YYYY-MM-DD-{meeting-type}-meeting.pdf"
  },
  financial_report: {
    pattern: /^\d{4}(-Q[1-4])?-(quarterly|annual)-report\.pdf$/,
    example: "2024-Q1-quarterly-report.pdf",
    description: "YYYY-[Q1-Q4-]quarterly-report.pdf or YYYY-annual-report.pdf"
  },
  policy_document: {
    pattern: /^[a-z-]+-v\d+\.\d+\.\d+\.pdf$/,
    example: "governance-policy-v1.0.0.pdf",
    description: "{policy-name}-v{major}.{minor}.{patch}.pdf"
  },
  strategic_plan: {
    pattern: /^\d{4}-strategic-plan\.pdf$/,
    example: "2024-strategic-plan.pdf",
    description: "YYYY-strategic-plan.pdf"
  },
  audit_report: {
    pattern: /^\d{4}-\d{2}-audit-findings\.pdf$/,
    example: "2024-03-audit-findings.pdf",
    description: "YYYY-MM-audit-findings.pdf"
  },
  risk_assessment: {
    pattern: /^\d{4}-\d{2}-risk-report\.pdf$/,
    example: "2024-03-risk-report.pdf",
    description: "YYYY-MM-risk-report.pdf"
  },
  compliance_report: {
    pattern: /^\d{4}-\d{2}-compliance-status\.pdf$/,
    example: "2024-03-compliance-status.pdf",
    description: "YYYY-MM-compliance-status.pdf"
  },
  contract: {
    pattern: /^[a-z-]+-contract-v\d+\.\d+\.\d+\.pdf$/,
    example: "service-contract-v1.0.0.pdf",
    description: "{contract-name}-contract-v{major}.{minor}.{patch}.pdf"
  },
  invoice: {
    pattern: /^\d{4}-\d{2}-invoice-\d+\.pdf$/,
    example: "2024-03-invoice-001.pdf",
    description: "YYYY-MM-invoice-{number}.pdf"
  },
  general_report: {
    pattern: /^\d{4}-\d{2}-[a-z-]+-report\.pdf$/,
    example: "2024-03-operations-report.pdf",
    description: "YYYY-MM-{report-type}-report.pdf"
  },
  other: {
    pattern: /^[a-z0-9-]+\.(pdf|docx|xlsx)$/,
    example: "document-name.pdf",
    description: "{document-name}.{extension}"
  }
} as const

export interface ValidationError {
  code: string
  message: string
  details?: any
}

export interface ValidationResult {
  isValid: boolean
  errors: ValidationError[]
}

export function validateFile(
  file: File,
  documentType: (typeof documentTypeEnum.enumValues)[number]
): ValidationResult {
  const errors: ValidationError[] = []

  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    errors.push({
      code: "FILE_TOO_LARGE",
      message: `File size exceeds maximum allowed size of ${
        MAX_FILE_SIZE / 1024 / 1024
      }MB`
    })
  }

  // Check file type
  const allowedTypes = Object.values(ALLOWED_FILE_TYPES).map(t => t.mimeType)
  if (!allowedTypes.includes(file.type as AllowedMimeType)) {
    errors.push({
      code: "INVALID_FILE_TYPE",
      message: `File type ${
        file.type || "unknown"
      } is not allowed. Allowed types: ${Object.keys(ALLOWED_FILE_TYPES).join(
        ", "
      )}`
    })
  }

  // Check filename pattern
  const pattern =
    FILE_NAME_PATTERNS[documentType as keyof typeof FILE_NAME_PATTERNS]
  if (!pattern.pattern.test(file.name)) {
    errors.push({
      code: "INVALID_FILENAME",
      message: `Invalid filename format. Expected format: ${pattern.description}`,
      details: {
        example: pattern.example
      }
    })
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

export function generateFilePath(
  companyId: string,
  documentType: (typeof documentTypeEnum.enumValues)[number],
  filename: string
): string {
  return `board-documents/${companyId}/${documentType}/${filename}`
}

export function validateFilePath(path: string): ValidationResult {
  const errors: ValidationError[] = []

  // Check basic path format
  const pathRegex =
    /^board-documents\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\/[a-z_]+\/[^/]+$/
  if (!pathRegex.test(path)) {
    errors.push({
      code: "INVALID_PATH_FORMAT",
      message:
        "Invalid path format. Expected: board-documents/{companyId}/{documentType}/{filename}"
    })
    return { isValid: false, errors }
  }

  // Extract path components
  const [, , documentType, filename] = path.split("/")

  // Validate document type
  if (!documentTypeEnum.enumValues.includes(documentType as any)) {
    errors.push({
      code: "INVALID_DOCUMENT_TYPE",
      message: `Invalid document type: ${documentType}. Allowed types: ${documentTypeEnum.enumValues.join(
        ", "
      )}`
    })
  }

  // Validate filename pattern if document type is valid
  if (documentTypeEnum.enumValues.includes(documentType as any)) {
    const pattern =
      FILE_NAME_PATTERNS[documentType as keyof typeof FILE_NAME_PATTERNS]
    if (!pattern.pattern.test(filename)) {
      errors.push({
        code: "INVALID_FILENAME",
        message: `Invalid filename format for ${documentType}. Expected format: ${pattern.description}`,
        details: {
          example: pattern.example
        }
      })
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

export function extractVersionFromFilename(
  filename: string,
  documentType: (typeof documentTypeEnum.enumValues)[number]
): string | null {
  if (documentType === "policy") {
    const match = filename.match(/v(\d+\.\d+\.\d+)/)
    return match ? match[1] : null
  }

  // For date-based versions, extract the date
  const dateMatch = filename.match(/^(\d{4}(-\d{2}(-\d{2})?)?)/)
  return dateMatch ? dateMatch[1] : null
}
