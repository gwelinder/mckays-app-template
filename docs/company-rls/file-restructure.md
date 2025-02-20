# Company Files Restructure

## Current Structure

- `actions/companies.ts` - Server actions for company listing
- `actions/company.ts` - Server actions for individual company operations
- `actions/db/company-actions.ts` - Database operations for companies

## Proposed Structure

```
actions/
  companies/
    mutations.ts        # All company mutation actions (create, update, delete)
    queries.ts         # All company query actions (get, list)
    types.ts          # Shared types for company actions
    utils.ts          # Utility functions (e.g., CVR validation, trend analysis)
    index.ts          # Exports all company actions
  db/
    companies/
      queries.ts      # Raw database queries
      mutations.ts    # Raw database mutations
      types.ts       # Database types and schemas
      index.ts       # Exports all database operations
```

## Benefits

1. Better separation of concerns
2. Easier to find related functionality
3. Clearer distinction between high-level actions and database operations
4. More maintainable as the application grows
5. Easier to test individual components
6. Reduced code duplication

## Migration Steps

1. Create new directory structure
2. Move database operations to appropriate files
3. Move server actions to appropriate files
4. Update imports in all affected files
5. Add index files for convenient exports
6. Remove old files

## Implementation Details

### types.ts

- Define shared types for company operations
- Include response types and action states
- Define validation schemas

### queries.ts

- List companies
- Get company by ID
- Get companies by CVR
- Search companies

### mutations.ts

- Create company
- Update company
- Delete company
- Manage company metadata

### utils.ts

- CVR validation
- Company trend analysis
- Data transformation helpers
- Error handling utilities

## Usage Example

```typescript
import {
  createCompany,
  updateCompany,
  deleteCompany
} from "@/actions/companies/mutations"

import {
  getCompany,
  listCompanies,
  searchCompanies
} from "@/actions/companies/queries"

import { validateCVR, analyzeCompanyTrends } from "@/actions/companies/utils"

import type {
  Company,
  CompanyResponse,
  CompanyActionState
} from "@/actions/companies/types"
```
