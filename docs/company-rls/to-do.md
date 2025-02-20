# Company RLS Implementation Plan

## Overview

Implementing Row Level Security (RLS) for companies to ensure users can only access their own companies. Multiple board members can create profiles for the same company using the same CVR.

## Current State

- Companies table has a `userId` field but no RLS policies
- Users can potentially see all companies
- No sharing mechanism between users
- Profiles table has a company relationship
- Each board member can create their own company profile with the same CVR

## Implementation Tasks

### Database Schema Changes

- [ ] Add indexes for performance optimization
- [ ] Update foreign key relationships for cascading deletes
- [ ] Add composite index on (user_id, cvr) for better query performance

### RLS Policy Implementation

- [ ] Create RLS policy for companies table
- [ ] Add policy for SELECT operations
- [ ] Add policy for INSERT operations
- [ ] Add policy for UPDATE operations
- [ ] Add policy for DELETE operations

### Code Refactoring

- [x] Update company actions to include user checks
- [x] Remove CVR uniqueness constraint
- [x] Modify company queries to respect RLS
- [x] Update company creation flow
- [x] Update company deletion flow
- [x] Update company listing endpoints
- [x] Restructure company-related files for better organization
- [x] Implement proper error handling and ActionState responses
- [x] Add utility functions for common operations

### UI Updates

- [ ] Update company listing to show only accessible companies
- [ ] Add error handling for unauthorized access
- [ ] Update company forms to handle permissions
- [ ] Add UI indication that same company can be added by multiple board members
- [ ] Add loading states for async operations
- [ ] Improve error message display
- [ ] Add success notifications for actions

### Testing

- [ ] Test RLS policies with multiple users
- [ ] Test company creation with RLS
- [ ] Test company deletion with RLS
- [ ] Test company listing with RLS
- [ ] Test error handling
- [ ] Test multiple board members creating same company
- [ ] Test that board members can't see each other's company profiles

## SQL Scripts Needed

### RLS Policies

```sql
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
```

### Indexes

```sql
-- Add index for user_id for better query performance
CREATE INDEX IF NOT EXISTS idx_companies_user_id ON companies(user_id);

-- Add composite index for user_id and cvr
CREATE INDEX IF NOT EXISTS idx_companies_user_id_cvr ON companies(user_id, cvr);
```

### Notes

- Each board member can create their own company profile with the same CVR
- Company profiles are private to each user
- No unique constraint on CVR numbers since multiple board members can create profiles for the same company
- Consider future feature to link/merge company profiles of the same company across different board members if needed

## Next Steps

1. Implement database schema changes (indexes and foreign keys)
2. Apply RLS policies to the database
3. Update UI components to handle new ActionState responses
4. Add loading states and error handling to UI
5. Implement comprehensive testing
6. Document the new company management system
