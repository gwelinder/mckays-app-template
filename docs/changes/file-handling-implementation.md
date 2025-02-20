# File Handling Implementation

## Overview

Added file handling capabilities to the application using Supabase Storage. This implementation allows companies to manage their documents through a clean API interface.

## API Routes Added

### 1. List Files (`/api/files/list`)

```typescript
GET /api/files/list?companyId={companyId}
```

- Lists all files for a specific company
- Returns file metadata including:
  - pathname
  - url (public URL)
  - size
  - createdAt timestamp
- Implements pagination (100 files per request)
- Sorted by filename ascending

### 2. Upload Files (`/api/files/upload`)

```typescript
POST /api/files/upload?filename={filename}&companyId={companyId}
```

- Handles PDF file uploads
- Implements file validation:
  - Max size: 10MB
  - Allowed types: application/pdf
- Generates unique filenames using timestamps
- Sanitizes filenames for storage
- Stores files in company-specific folders

### 3. Delete Files (`/api/files/delete`)

```typescript
DELETE /api/files/delete?fileurl={fileurl}&companyId={companyId}
```

- Removes files from storage
- Extracts file path from public URL
- Returns 204 on successful deletion

## Storage Structure

Files are organized in the Supabase "documents" bucket using the following structure:

```
documents/
  ├── {companyId}/
  │   ├── {timestamp}-{sanitized_filename}
  │   └── ...
  └── ...
```

## Security Measures

- Authentication using Clerk
- Company-specific folder isolation
- File type validation
- Size limits
- Filename sanitization

## Required Supabase Setup

1. Create "documents" bucket
2. Enable Row Level Security (RLS)
3. Apply RLS policy:

```sql
-- Enable RLS
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Create policy for company file access
CREATE POLICY "Users can manage company files"
ON storage.objects
FOR ALL
USING (
  (storage.foldername(name))[1] IN (
    SELECT c.id::text
    FROM companies c
    WHERE c.id::text = (storage.foldername(name))[1]
  )
);
```

## Error Handling

- Proper error messages for common scenarios:
  - Unauthorized access
  - Missing parameters
  - Invalid file types
  - Size limit exceeded
  - Upload/delete failures
- Consistent error response format
- Error logging for debugging

## Future Improvements

1. Implement file type detection beyond extension
2. Add virus scanning
3. Support bulk operations
4. Add file versioning
5. Implement soft delete
6. Add file metadata indexing for search
