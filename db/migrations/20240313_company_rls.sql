-- Enable RLS on companies table
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

-- Create policy for viewing companies (only owner can view)
CREATE POLICY "Users can view their own companies"
ON companies FOR SELECT
USING (user_id = auth.uid()::text);

-- Create policy for inserting companies
CREATE POLICY "Users can create companies"
ON companies FOR INSERT
WITH CHECK (user_id = auth.uid()::text);

-- Create policy for updating companies
CREATE POLICY "Users can update their own companies"
ON companies FOR UPDATE
USING (user_id = auth.uid()::text);

-- Create policy for deleting companies
CREATE POLICY "Users can delete their own companies"
ON companies FOR DELETE
USING (user_id = auth.uid()::text);

-- Add index for user_id for better query performance
CREATE INDEX IF NOT EXISTS idx_companies_user_id ON companies(user_id);

-- Add composite index for user_id and cvr
CREATE INDEX IF NOT EXISTS idx_companies_user_id_cvr ON companies(user_id, cvr);

-- Update foreign key relationships for cascading deletes
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_company_id_companies_id_fk;
ALTER TABLE profiles ADD CONSTRAINT profiles_company_id_companies_id_fk 
  FOREIGN KEY (company_id) 
  REFERENCES companies(id) 
  ON DELETE SET NULL; 