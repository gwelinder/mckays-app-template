# Document Files Restructure

## Current Structure Analysis

Current document-related code is spread across:

- `actions/document.ts` - Mixed document operations
- `actions/get-user-documents.ts` - Document retrieval
- `components/document-analysis.tsx` - Analysis UI
- `components/document-uploader.tsx` - Upload UI
- `components/files.tsx` - File management UI
- `components/library-management.tsx` - Document library UI

## Proposed Structure

```
actions/
  documents/
    mutations.ts        # Document mutations (create, update, delete)
    queries.ts         # Document queries (get, list, search)
    analysis.ts        # Document analysis operations
    upload.ts          # Upload handling and processing
    types.ts          # Shared document action types
    utils.ts          # Document utilities (validation, processing)
    index.ts          # Exports all document actions
  db/
    documents/
      queries.ts       # Raw database queries
      mutations.ts     # Raw database mutations
      types.ts        # Database types and schemas
      index.ts        # Exports all database operations

components/
  documents/
    _parts/           # Smaller, reusable document components
      document-card.tsx
      document-status-badge.tsx
      document-type-icon.tsx
      upload-progress.tsx

    analysis/         # Analysis-related components
      analysis-progress.tsx
      analysis-results.tsx
      findings-review.tsx

    library/          # Library management components
      document-grid.tsx
      document-list.tsx
      library-filters.tsx

    upload/           # Upload-related components
      upload-form.tsx
      file-validator.tsx
      progress-tracker.tsx

    document-analysis.tsx    # Main analysis component
    document-uploader.tsx    # Main uploader component
    document-library.tsx     # Main library component
    index.ts                # Export all document components
```

## Benefits

1. Clear separation of concerns:

   - Document operations (mutations/queries)
   - Analysis functionality
   - Upload handling
   - UI components

2. Better component organization:

   - Reusable parts in \_parts/
   - Feature-specific components in dedicated folders
   - Clear main component entry points

3. Improved maintainability:
   - Easier to locate specific functionality
   - Reduced code duplication
   - Better testing isolation

## Implementation Steps

1. Create New Directory Structure

   - Set up actions/documents/ hierarchy
   - Set up components/documents/ hierarchy
   - Create necessary index files

2. Refactor Actions

   - Split document operations into mutations/queries
   - Isolate analysis logic
   - Separate upload handling
   - Create shared types and utilities

3. Refactor Components

   - Extract reusable parts to \_parts/
   - Organize feature-specific components
   - Update imports and dependencies
   - Ensure proper type usage

4. Update Database Layer

   - Organize document database operations
   - Update schema organization
   - Ensure proper error handling

5. Clean Up
   - Remove old files
   - Update import paths
   - Add/update documentation
   - Add/update tests

## Implementation Details

### types.ts

```typescript
export interface DocumentMetadata {
  fileSize: number
  pageCount?: number
  lastModified: Date
  mimeType: string
}

export interface DocumentAnalysisResult {
  findings: Finding[]
  confidence: number
  processedAt: Date
}

export interface DocumentActionState<T> {
  isSuccess: boolean
  message: string
  data?: T
}
```

### mutations.ts

```typescript
export async function createDocument(
  data: CreateDocumentInput
): Promise<DocumentActionState<Document>>
export async function updateDocument(
  id: string,
  data: UpdateDocumentInput
): Promise<DocumentActionState<Document>>
export async function deleteDocument(
  id: string
): Promise<DocumentActionState<void>>
export async function processDocument(
  id: string
): Promise<DocumentActionState<DocumentAnalysisResult>>
```

### queries.ts

```typescript
export async function getDocument(
  id: string
): Promise<DocumentActionState<Document>>
export async function listDocuments(
  filters: DocumentFilters
): Promise<DocumentActionState<Document[]>>
export async function searchDocuments(
  query: string
): Promise<DocumentActionState<Document[]>>
```

### utils.ts

```typescript
export function validateDocument(file: File): ValidationResult
export function processDocumentMetadata(doc: Document): ProcessedMetadata
export function analyzeDocumentContent(content: string): AnalysisResult
```

## Usage Example

```typescript
import {
  createDocument,
  updateDocument,
  deleteDocument
} from "@/actions/documents/mutations"

import {
  getDocument,
  listDocuments,
  searchDocuments
} from "@/actions/documents/queries"

import {
  validateDocument,
  processDocumentMetadata
} from "@/actions/documents/utils"

import type {
  Document,
  DocumentMetadata,
  DocumentActionState
} from "@/actions/documents/types"

// Components
import {
  DocumentAnalysis,
  DocumentUploader,
  DocumentLibrary
} from "@/components/documents"

import {
  DocumentCard,
  DocumentStatusBadge
} from "@/components/documents/_parts"
```

## Next Steps

1. Create new directory structure
2. Move and refactor document actions
3. Reorganize components
4. Update database operations
5. Add tests for new structure
6. Update documentation
