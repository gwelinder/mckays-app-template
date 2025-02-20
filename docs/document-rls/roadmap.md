# Document Processing & Analysis System Restructure Roadmap

## Phase 1: Requirements & Architecture Review

### Current State Analysis

- [x] Review existing document processing implementation
- [x] Review existing analysis implementation
- [x] Identify technical debt and duplication
- [x] Document current workflow and pain points

### Architecture Planning

- [x] Define clear separation between:
  - Document upload & processing
  - Document analysis
  - Document management
  - UI components
- [x] Design data flow and state management
- [x] Plan database schema updates
- [x] Define API contracts between layers

## Phase 2: Document Processing Implementation

### 1. Document Upload & Processing

- [x] Create new document processing pipeline:
  ```
  app/
    api/
      documents/
        analysis/
            route.ts          # Process documents
        process/
          route.ts          # Process documents ✓
          extraction.ts     # Text extraction with unstructured.io ✓
          validation.ts     # File validation and security ✓
        storage/
          upload/
            route.ts     # File upload ✓
          list/
            route.ts     # List documents ✓
          delete/
            route.ts     # Delete documents ✓
  ```

### 2. Document Storage & Management

- [x] Implement storage layer:
  ```
  actions/
    db/
      documents/
        mutations.ts      # Document record mutations ✓
        queries.ts        # Document record queries ✓
  ```

### 3. Document Processing Components

- [x] Create UI components:
  ```
  components/
    documents/
      upload/
        upload-form.tsx         # Implemented with drag & drop ✓
        file-validator.tsx      # Implemented with validation rules ✓
        progress-tracker.tsx    # Implemented with real-time updates ✓
      processing/
        processing-status.tsx   # Implemented with SSE support ✓
        metadata-viewer.tsx     # Implemented with comprehensive display ✓
        error-handler.tsx      # Implemented with retry functionality ✓
  ```

## Phase 3: Analysis System Implementation

### 1. Analysis Engine

- [x] Implement analysis actions:
  ```
  actions/
    documents/
      analysis/
        tools.ts         # Analysis tools and utilities ✓
        processor.ts     # Main analysis logic
        prompts.ts       # Analysis prompts
        chunking.ts      # Text chunking strategies ✓
        types.ts         # Analysis types
  ```

### 2. Analysis Storage

- [ ] Create analysis storage:
  ```
  actions/
    analysis/
      storage/
        mutations.ts     # Analysis record mutations
        queries.ts      # Analysis record queries
        types.ts        # Analysis types
        index.ts        # Export storage actions
  ```

### 3. Analysis Components

- [x] Build analysis UI:
  ```
  components/
    analysis/
      dashboard/
        analysis-grid.tsx ✓
        analysis-filters.tsx ✓
      results/
        findings-view.tsx ✓
        recommendations.tsx ✓
      controls/
        analysis-controls.tsx ✓
        batch-processor.tsx ✓
  ```

## Phase 4: Integration & Cleanup

### 1. Database Updates

- [x] Update schemas:
  - Document processing status tracking ✓
  - Analysis results storage ✓
  - Metadata storage ✓
  - Version tracking ✓

#### Migration Steps

1. Document Processing Consolidation

   - [x] Merge `process-pdf/route.ts` and `processdoc/route.ts` into `documents/process/route.ts` ✓
   - [x] Move text extraction logic to `documents/process/extraction.ts` ✓
   - [x] Move validation logic to `documents/process/validation.ts` ✓
   - [x] Double check that all logic has been moved ✓
   - [x] Add deprecation notices to old routes ✓
   - [x] Delete old processing routes (after testing) ✓

2. Storage Operations Consolidation

   - [x] Implement file upload with Supabase ✓
   - [x] Implement proper error handling ✓
   - [x] Implement file validation ✓

3. Analysis Consolidation

   - [x] Move tools to `documents/analysis/tools.ts` ✓
   - [x] Merge `analyze/route.ts` and `document-analysis/route.ts` ✓
   - [x] Move progress tracking to `documents/analysis/progress.ts` ✓
   - [x] Delete old analysis routes ✓

4. Clean Up
   - [x] Remove duplicate code ✓
   - [x] Standardize error handling ✓
   - [x] Implement proper validation ✓
   - [x] Add comprehensive logging ✓

## Phase 5: Testing & Documentation

### 1. Testing

- [ ] Unit tests for:
  - Document processing
  - Analysis engine
  - Storage operations
  - UI components

### 2. Documentation

- [x] Create documentation:
  - API documentation ✓
  - Component documentation ✓
  - Usage guides ✓
  - Architecture overview ✓

## Next Steps

1. Analysis System Implementation

   - [x] Start implementing analysis engine ✓
   - [x] Create analysis storage layer ✓
   - [x] Build analysis UI components ✓

2. Testing & Documentation

   - [ ] Write unit tests
   - [ ] Add integration tests
   - [ ] Complete API documentation

3. Final Integration
   - [x] Test complete workflow ✓
   - [x] Performance optimization ✓
   - [x] Production deployment ✓

## Implementation Plan

### Week 1: Setup & Document Processing ✓

1. [x] Set up new directory structure ✓
2. [x] Implement document processing pipeline ✓
3. [x] Create basic UI components ✓

### Week 2: Analysis System ✓

1. [x] Implement analysis engine ✓
2. [x] Create analysis storage ✓
3. [x] Build analysis UI components ✓

### Week 3: Integration ✓

1. [x] Update database schemas ✓
2. [x] Create API endpoints ✓
3. [x] Integrate components ✓

### Week 4: Testing & Cleanup

1. [ ] Write tests
2. [ ] Create documentation
3. [ ] Remove old code
4. [ ] Final testing

## Migration Strategy

1. Parallel Implementation

   - [x] Build new system alongside existing one ✓
   - [x] Gradually migrate features ✓
   - [x] Keep backward compatibility ✓

2. Feature Flags

   - [x] Use feature flags for new functionality ✓
   - [x] Allow gradual rollout ✓
   - [x] Easy rollback if needed ✓

3. Data Migration
   - [x] Create migration scripts ✓
   - [x] Validate data integrity ✓
   - [x] Maintain audit trail ✓

## Success Criteria

1. Technical

   - [x] Clear separation of concerns ✓
   - [x] Reduced code duplication ✓
   - [x] Improved error handling ✓
   - [x] Better type safety ✓

2. Functional

   - [x] Faster document processing ✓
   - [x] More accurate analysis ✓
   - [x] Better user experience ✓
   - [x] Improved reliability ✓

3. Maintenance
   - [x] Easier to test ✓
   - [x] Better documented ✓
   - [x] More maintainable ✓
   - [x] Easier to extend ✓

## Clean-up & Migration Plan

### 1. Action Files Migration

#### Document Processing Actions

- [x] Migrate from:
  - `actions/document.ts` → `actions/documents/processing/index.ts` ✓
  - `actions/get-user-documents.ts` → `actions/documents/storage/queries.ts` ✓
  - `actions/db/board-document-actions.ts` → Split into:
    ```
    actions/documents/storage/mutations.ts ✓
    actions/documents/storage/queries.ts ✓
    ```
  - `actions/db/document-actions.ts` → Merge with storage actions ✓
  - `actions/analyze/process-document.ts` → Split into:
    ```
    actions/documents/processing/extraction.ts ✓
    actions/documents/processing/validation.ts ✓
    actions/documents/processing/metadata.ts ✓
    ```
  - `actions/analyze/process-pdf.ts` → `actions/documents/processing/pdf-handler.ts` ✓
  - `actions/analyze/board-analysis.ts` → Split into:
    ```
    actions/analysis/engine/processor.ts ✓
    actions/analysis/engine/prompts.ts ✓
    ```

#### Shared Logic Extraction

- [x] Extract common utilities:
  - File validation logic → `actions/documents/processing/validation.ts` ✓
  - Storage operations → `actions/documents/storage/supabase.ts` ✓
  - Analysis helpers → `actions/analysis/engine/utils.ts` ✓

### 2. Component Migration

#### Document Management Components

- [x] Migrate from:
  - `components/files.tsx` → Split into:
    ```
    components/documents/_parts/file-list.tsx ✓
    components/documents/_parts/file-card.tsx ✓
    components/documents/upload/upload-zone.tsx ✓
    ```
  - `components/library-management.tsx` → Split into:
    ```
    components/documents/library/library-grid.tsx ✓
    components/documents/library/library-filters.tsx ✓
    components/documents/library/document-actions.tsx ✓
    ```
  - `components/document-uploader.tsx` → Split into:
    ```
    components/documents/upload/upload-form.tsx ✓
    components/documents/upload/progress-tracker.tsx ✓
    components/documents/upload/file-validator.tsx ✓
    ```

#### Analysis Components

- [x] Migrate from:
  - `components/document-analysis.tsx` → Split into:
    ```
    components/analysis/results/analysis-viewer.tsx ✓
    components/analysis/results/findings-view.tsx ✓
    components/analysis/results/recommendations.tsx ✓
    ```
  - `app/companies/[companyId]/_components/company-analysis.tsx` → Split into:
    ```
    components/analysis/dashboard/analysis-dashboard.tsx ✓
    components/analysis/controls/analysis-controls.tsx ✓
    components/analysis/results/analysis-grid.tsx ✓
    ```
  - `app/companies/[companyId]/_components/new-company-analysis.tsx` →
    ```
    components/analysis/controls/new-analysis.tsx ✓
    components/analysis/controls/analysis-form.tsx ✓
    ```

### 3. Page Components Migration

- [x] Migrate from:
  - `app/companies/[companyId]/analysis/page.tsx` →
    ```
    app/companies/[companyId]/documents/analysis/page.tsx ✓
    ```
  - `app/companies/[companyId]/files/page.tsx` →
    ```
    app/companies/[companyId]/documents/page.tsx ✓
    ```

### 4. Database Schema Updates

- [x] Consolidate and update schemas:
  ```
  db/schema/
    documents.ts           # Document metadata and storage ✓
    document-versions.ts   # Version tracking ✓
    document-processing.ts # Processing status and results ✓
    analysis.ts           # Analysis results and metadata ✓
    findings.ts           # Analysis findings ✓
    recommendations.ts    # Analysis recommendations ✓
  ```

### 5. API Routes Migration

- [x] Migrate from:
  - `app/api/processdoc/route.ts` → Split into:
    ```
    app/api/documents/process/route.ts ✓
    app/api/documents/analyze/route.ts ✓
    ```
  - `app/api/processdoc/agentchains.ts` →
    ```
    actions/analysis/engine/chains.ts ✓
    ```
  - `app/api/processdoc/textspliter.ts` →
    ```
    actions/analysis/engine/chunking.ts ✓
    ```

### 6. Clean-up Steps

- [x] Phase 1: Deprecate old routes (add warnings) ✓
- [x] Phase 2: Duplicate functionality to new structure ✓
- [x] Phase 3: Migrate active users/data ✓
- [x] Phase 4: Remove old code ✓
