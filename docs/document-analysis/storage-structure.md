# Board Document Storage Structure

## Overview

This document outlines the storage organization for board documents in the Supabase storage system.

## Bucket Structure

All board documents are stored in the `board-documents` bucket with the following path structure:

```
board-documents/
├── {companyId}/
│   ├── board_minutes/
│   │   ├── YYYY-MM-DD-board-meeting.pdf
│   │   └── YYYY-MM-DD-committee-meeting.pdf
│   ├── financial_report/
│   │   ├── YYYY-MM-quarterly-report.pdf
│   │   └── YYYY-annual-report.pdf
│   ├── policy_document/
│   │   ├── governance-policy-v1.0.0.pdf
│   │   └── compliance-policy-v2.1.0.pdf
│   ├── strategic_plan/
│   │   └── YYYY-strategic-plan.pdf
│   ├── audit_report/
│   │   └── YYYY-MM-audit-findings.pdf
│   ├── risk_assessment/
│   │   └── YYYY-MM-risk-report.pdf
│   └── compliance_report/
│       └── YYYY-MM-compliance-status.pdf
```

## Path Format

The path format follows this pattern:
`board-documents/{companyId}/{documentType}/{filename}`

- `{companyId}`: UUID of the company
- `{documentType}`: One of the predefined document types from the enum
- `{filename}`: Formatted filename including version and date information

## Filename Conventions

### Board Minutes

- Format: `YYYY-MM-DD-{meeting-type}.pdf`
- Example: `2024-03-15-board-meeting.pdf`

### Financial Reports

- Quarterly: `YYYY-QN-quarterly-report.pdf`
- Annual: `YYYY-annual-report.pdf`
- Example: `2024-Q1-quarterly-report.pdf`

### Policy Documents

- Format: `{policy-name}-v{major}.{minor}.{patch}.pdf`
- Example: `governance-policy-v1.0.0.pdf`

### Strategic Plans

- Format: `YYYY-strategic-plan.pdf`
- Example: `2024-strategic-plan.pdf`

### Audit Reports

- Format: `YYYY-MM-audit-findings.pdf`
- Example: `2024-03-audit-findings.pdf`

### Risk Assessments

- Format: `YYYY-MM-risk-report.pdf`
- Example: `2024-03-risk-report.pdf`

### Compliance Reports

- Format: `YYYY-MM-compliance-status.pdf`
- Example: `2024-03-compliance-status.pdf`

## Security

### Access Control

- RLS policies ensure users can only access documents for their companies
- All operations (read/write) are restricted by company membership
- Path validation ensures proper structure and prevents unauthorized access

### File Validation

- File types are restricted to approved formats (PDF, DOCX, XLSX)
- Maximum file size: 50MB
- Path format is validated before upload
- Document type must match the enum values

## Version Control

- Policy documents use semantic versioning (major.minor.patch)
- Other documents use date-based versioning
- Previous versions are retained in the database but marked as non-current
- File paths include version information where applicable

## Retention

- Documents are retained according to company policy
- Retention periods are tracked in the database
- Automatic archival process runs periodically
- Archived documents are moved to cold storage

## Usage Guidelines

1. Always use the provided upload functions to ensure proper path formatting
2. Include all required metadata when uploading documents
3. Follow the naming conventions strictly
4. Use the version control system for policy documents
5. Set appropriate retention periods based on document type

## Implementation Notes

1. The storage system is backed by Supabase Storage
2. RLS policies enforce access control at the storage level
3. Additional validation occurs in the application layer
4. Metadata is stored in both the database and file paths
5. Path validation ensures consistency and security
