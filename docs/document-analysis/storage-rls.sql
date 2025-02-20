-- Enable RLS on the storage.objects table
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Create a policy for users to access their own company's documents
CREATE POLICY "Users can access their company's documents"
ON storage.objects FOR ALL
USING (
  -- Extract company ID from the storage path
  -- Path format: board-documents/{companyId}/{documentType}/{filename}
  (auth.uid()::text IN (
    SELECT p.user_id
    FROM profiles p
    JOIN companies_users cu ON p.user_id = cu.user_id
    WHERE cu.company_id = (
      SELECT split_part(name, '/', 2)
      FROM storage.objects
      WHERE id = storage.objects.id
    )
  ))
);

-- Create a policy for uploading documents
CREATE POLICY "Users can upload documents to their companies"
ON storage.objects FOR INSERT
WITH CHECK (
  -- Verify the user has access to the company
  (auth.uid()::text IN (
    SELECT p.user_id
    FROM profiles p
    JOIN companies_users cu ON p.user_id = cu.user_id
    WHERE cu.company_id = split_part(name, '/', 2)
  ))
  -- Enforce path format
  AND (
    name ~ '^board-documents/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/[a-z_]+/[^/]+$'
  )
);

-- Create a policy for updating documents
CREATE POLICY "Users can update their company's documents"
ON storage.objects FOR UPDATE
USING (
  -- User must have access to the company
  (auth.uid()::text IN (
    SELECT p.user_id
    FROM profiles p
    JOIN companies_users cu ON p.user_id = cu.user_id
    WHERE cu.company_id = (
      SELECT split_part(name, '/', 2)
      FROM storage.objects
      WHERE id = storage.objects.id
    )
  ))
)
WITH CHECK (
  -- Prevent changing the company ID or document type in the path
  (
    split_part(name, '/', 2) = split_part(OLD.name, '/', 2)
    AND
    split_part(name, '/', 3) = split_part(OLD.name, '/', 3)
  )
);

-- Create a policy for deleting documents
CREATE POLICY "Users can delete their company's documents"
ON storage.objects FOR DELETE
USING (
  -- User must have access to the company
  (auth.uid()::text IN (
    SELECT p.user_id
    FROM profiles p
    JOIN companies_users cu ON p.user_id = cu.user_id
    WHERE cu.company_id = (
      SELECT split_part(name, '/', 2)
      FROM storage.objects
      WHERE id = storage.objects.id
    )
  ))
);

-- Create a function to validate file paths
CREATE OR REPLACE FUNCTION storage.validate_board_document_path(path text)
RETURNS boolean
LANGUAGE plpgsql
AS $$
BEGIN
  -- Path format: board-documents/{companyId}/{documentType}/{filename}
  -- Validate path format
  IF NOT (path ~ '^board-documents/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/[a-z_]+/[^/]+$') THEN
    RETURN false;
  END IF;

  -- Extract company ID
  DECLARE
    company_id uuid := (SELECT split_part(path, '/', 2)::uuid);
  BEGIN
    -- Verify company exists
    IF NOT EXISTS (SELECT 1 FROM public.companies WHERE id = company_id) THEN
      RETURN false;
    END IF;
  EXCEPTION
    WHEN others THEN
      RETURN false;
  END;

  -- Extract document type
  DECLARE
    doc_type text := split_part(path, '/', 3);
  BEGIN
    -- Verify document type is valid
    IF NOT EXISTS (
      SELECT 1
      FROM pg_enum
      WHERE enumtypid = 'document_type'::regtype
      AND enumlabel = doc_type
    ) THEN
      RETURN false;
    END IF;
  END;

  RETURN true;
END;
$$;

-- Create a trigger to validate paths before insert/update
CREATE OR REPLACE FUNCTION storage.validate_board_document_path_trigger()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NOT storage.validate_board_document_path(NEW.name) THEN
    RAISE EXCEPTION 'Invalid board document path format';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER validate_board_document_path
  BEFORE INSERT OR UPDATE
  ON storage.objects
  FOR EACH ROW
  WHEN (NEW.bucket_id = 'board-documents')
  EXECUTE FUNCTION storage.validate_board_document_path_trigger(); 