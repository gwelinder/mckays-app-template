# Project Scratchpad

## Current Task: API Route Cleanup and Migration

### Progress Analysis

[X] Review current implementation
[X] Analyze component requirements
[X] Plan component structure

### Current Focus: API Route Consolidation

1. Document Processing Routes
   [X] Create new processing utilities:

   ```
   actions/documents/processing/
     chains.ts         # LLM chains for document processing
     chunking.ts      # Text chunking utilities
   ```

   [X] Update main processing route:

   ```
   /api/documents/
     process/
       route.ts          # Updated with new utilities
       extraction.ts     # Text extraction (exists)
       validation.ts     # File validation (exists)
     storage/
       upload/
         route.ts       # File upload (exists)
   ```

   [X] Add deprecation notices and remove old routes:

   ```
   Removed deprecated routes:
   - /api/processdoc/route.ts ✓
   - /api/process-pdf/route.ts ✓
   - /api/upload-pdf/route.ts ✓
   - /api/files/upload/route.ts ✓
   - /api/files/delete/route.ts ✓
   - /api/files/list/route.ts ✓
   - /api/library/upload/route.ts ✓
   - /api/library/create/route.ts ✓
   ```

2. Analysis Routes
   [X] Consolidate analysis tools:

   ```
   /actions/documents/analysis/
     tools.ts         # Analysis tools ✓
   ```

   [X] Consolidate analysis routes:

   ```
   Current:
   - /api/analyze/route.ts ✓
   - /api/document-analysis/route.ts ✓
   - /api/documents/analysis/route.ts ✓

   Target:
   /api/documents/
     analysis/
       route.ts         # Main analysis endpoint ✓
       progress.ts      # Progress tracking ✓
   ```

### Dependencies Moved

1. Processing Dependencies
   [X] Move from processdoc/:

   - agentchains.ts -> /actions/documents/processing/chains.ts ✓
   - textspliter.ts -> /actions/documents/processing/chunking.ts ✓

2. Analysis Dependencies
   [X] Move from document-analysis/:
   - tools.ts -> /actions/documents/analysis/tools.ts ✓

### Next Steps

1. [x] Analysis Route Consolidation:

   - Create new analysis route structure ✓
   - Implement progress tracking ✓
   - Add deprecation notices to old routes ✓
   - Test new endpoints thoroughly ✓

2. [ ] Testing & Validation:

   - Write tests for document processing
   - Write tests for analysis endpoints
   - Validate error handling
   - Check performance metrics

3. [ ] Documentation & Cleanup:
   - Update API documentation
   - Remove old routes after testing
   - Update frontend components
   - Final integration testing

### Technical Notes

- Using Clerk Auth for authentication
- Supabase Storage for file management
- Unstructured.io for document processing
- Enhanced document processing with:
  - Text extraction using Unstructured.io
  - Metadata generation using LLM
  - Text chunking for analysis
  - Preliminary analysis of chunks
  - Comprehensive metadata storage
- Improved analysis system with:
  - Real-time progress tracking via SSE
  - Detailed tool execution status
  - Structured findings submission
  - Human review workflow
  - Enhanced error handling

### Testing Plan

1. Document Processing Tests:

   ```typescript
   // Test file upload and processing
   const formData = new FormData()
   formData.append("file", testFile)
   formData.append("companyId", "test-company")
   const response = await fetch("/api/documents/process", {
     method: "POST",
     body: formData
   })

   // Verify response format
   expect(response.data).toHaveProperty("document")
   expect(response.data).toHaveProperty("extraction")
   expect(response.data).toHaveProperty("analysis")
   ```

2. Analysis Tests (To be implemented):

   ```typescript
   // Test analysis endpoint
   const response = await fetch("/api/documents/analysis", {
     method: "POST",
     body: JSON.stringify({
       documentId: "test-doc-id",
       messages: [
         {
           role: "user",
           content: "Analyze this document for financial risks"
         }
       ]
     })
   })

   // Test progress tracking
   const eventSource = new EventSource(
     `/api/documents/analysis/progress?analysisId=${analysisId}`
   )
   eventSource.onmessage = event => {
     const data = JSON.parse(event.data)
     expect(data).toHaveProperty("type", "analysis_progress")
     expect(data).toHaveProperty("status")
     expect(data).toHaveProperty("progress")
   }

   // Test findings submission
   const findings = await db
     .select()
     .from(findingsTable)
     .where(eq(findingsTable.analysisId, analysisId))
   expect(findings).toHaveLength(1)
   expect(findings[0]).toHaveProperty("type")
   expect(findings[0]).toHaveProperty("severity")
   expect(findings[0]).toHaveProperty("title")
   expect(findings[0]).toHaveProperty("description")
   ```
