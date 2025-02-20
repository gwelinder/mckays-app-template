System Specification for Board Review Application (Next.js 15)

1. Project Structure:

   ```
   /board-review
   ```

├── README.md
├── ai
│ ├── index.ts
│ └── rag-middleware.ts
├── app
│ ├── (auth)
│ │ ├── actions.ts
│ │ ├── api
│ │ │ └── auth
│ │ │ └── [...nextauth]
│ │ │ └── route.ts
│ │ ├── auth.config.ts
│ │ ├── auth.ts
│ │ ├── login
│ │ │ └── page.tsx
│ │ └── register
│ │ └── page.tsx
│ ├── (chat)
│ │ ├── [id]
│ │ │ └── page.tsx
│ │ ├── api
│ │ │ ├── chat
│ │ │ │ └── route.ts
│ │ │ ├── company
│ │ │ │ └── route.ts
│ │ │ ├── files
│ │ │ │ ├── delete
│ │ │ │ │ └── route.ts
│ │ │ │ ├── list
│ │ │ │ │ └── route.ts
│ │ │ │ └── upload
│ │ │ │ └── route.ts
│ │ │ ├── history
│ │ │ │ └── route.ts
│ │ │ └── library
│ │ │ ├── delete
│ │ │ │ └── route.ts
│ │ │ ├── list
│ │ │ │ └── route.ts
│ │ │ └── upload
│ │ │ └── route.ts
│ │ ├── opengraph-image.png
│ │ ├── page.tsx
│ │ └── twitter-image.png
│ ├── actions
│ │ ├── company.ts
│ │ └── document.ts
│ ├── db.ts
│ ├── favicon.ico
│ ├── globals.css
│ ├── layout.tsx
│ └── uncut-sans.woff2
├── bun.lockb
├── components
│ ├── add-company-dialog.tsx
│ ├── add-company-form.tsx
│ ├── add-document-form.tsx
│ ├── chat.tsx
│ ├── company-data-view.tsx
│ ├── company-selector.tsx
│ ├── data.ts
│ ├── error-boundary.tsx
│ ├── files.tsx
│ ├── form.tsx
│ ├── history.tsx
│ ├── icons.tsx
│ ├── library-management.tsx
│ ├── markdown.tsx
│ ├── message.tsx
│ ├── modal.tsx
│ ├── navbar-client.tsx
│ ├── navbar.tsx
│ ├── pre-actions.tsx
│ ├── predefined-actions.ts
│ ├── sidebar.tsx
│ ├── submit-button.tsx
│ ├── ui
│ │ ├── button.tsx
│ │ ├── card.tsx
│ │ ├── command.tsx
│ │ ├── dialog.tsx
│ │ ├── form.tsx
│ │ ├── input.tsx
│ │ ├── label.tsx
│ │ ├── popover.tsx
│ │ ├── scroll-area.tsx
│ │ ├── select.tsx
│ │ ├── sheet.tsx
│ │ ├── textarea.tsx
│ │ ├── toast.tsx
│ │ └── toaster.tsx
│ └── use-scroll-to-bottom.ts
├── components.json
├── drizzle
│ ├── 0000_wet_marvex.sql
│ ├── 0001_superb_chimera.sql
│ ├── 0002_smart_omega_red.sql
│ └── meta
│ ├── 0000_snapshot.json
│ ├── 0001_snapshot.json
│ ├── 0002_snapshot.json
│ └── \_journal.json
├── drizzle.config.ts
├── hooks
│ └── use-toast.ts
├── lib
│ ├── actions
│ │ └── getFiles.ts
│ ├── companyProvider.tsx
│ └── utils.ts
├── middleware.ts
├── migrate.ts
├── next-env.d.ts
├── next.config.mjs
├── package-lock.json
├── package.json
├── pnpm-lock.yaml
├── postcss.config.mjs
├── public
│ ├── iphone.png
│ ├── tv.png
│ └── watch.png
├── schema.ts
├── system-spec.md
├── tailwind.config.ts
├── tsconfig.json
└── utils
├── functions.ts
└── pdf.ts

33 directories, 97 files

````

2. Next.js 15 and App Router:

- Uses the latest Next.js 15 features and App Router
- Server Components are the default, with Client Components marked explicitly
- Leverages server-side rendering and static site generation where appropriate

3. Authentication (NextAuth v5 beta):

- Implemented in `app/(auth)/auth.ts`
- Custom login and registration pages in `app/(auth)/login/` and `app/(auth)/register/`
- Auth configuration in `app/(auth)/auth.config.ts`

4. Database and ORM:

- PostgreSQL database
- Drizzle ORM for type-safe database operations
- Schema defined in `schema.ts`
- Migrations in `drizzle/` directory

5. Server Actions:

- Implemented for form submissions and data mutations
- Located in `app/(auth)/actions.ts` and `app/actions/` directory
- Example action:
  ```typescript
  export const createCompany = async (
    prevState: any,
    formData: FormData
  ): Promise<CompanyActionResult> => {
    const session = await auth();
    if (!session || !session.user) {
      return { status: "error", message: "Not authenticated" };
    }
    // ... implementation
  };
  ```

6. API Routes:

- Located in `app/(chat)/api/` directory
- Handle chat, file management, and company operations
- Example route: `app/(chat)/api/chat/route.ts`

7. SWR for Data Fetching:

- Used for client-side data fetching with stale-while-revalidate strategy
- Example usage:
  ```typescript
  const {
    data: files,
    mutate,
    isLoading,
  } = useSWR<Array<{ pathname: string; url: string }>>(
    selectedCompanyId
      ? `api/files/list?companyId=${selectedCompanyId}`
      : null,
    fetcher,
    { fallbackData: [] }
  );
  ```

8. Key Components:
a. CompanySelector (`components/company-selector.tsx`):

- Client component for selecting companies
- Uses `useCompanyContext` for state management

b. Chat (`components/chat.tsx`):

- Main chat interface component
- Integrates with AI for message generation

c. Files (`components/files.tsx`):

- Handles file upload and management
- Uses SWR for data fetching and mutation

d. Sidebar (`components/sidebar.tsx`):

- Contains navigation and action items
- Integrates PredefinedActions, LibraryManagement, and CompanyDataView

9. Context and State Management:

- CompanyProvider (`lib/companyProvider.tsx`) for managing company state
- Uses React Context API and custom hooks

10. AI Integration:

 - Custom AI model defined in `ai/index.ts`
 - RAG middleware in `ai/rag-middleware.ts`

11. Styling:

 - Tailwind CSS for styling (config in `tailwind.config.ts`)
 - Custom UI components (likely using shadcn/ui)
 - Global styles in `app/globals.css`

12. Environment Variables:

 - Stored in `.env.local`
 - Include API keys, database connection strings, and other sensitive data

13. File Storage:
 - Vercel Blob for file storage
 - File operations in `app/(chat)/api/files/` routes

Key Code Examples:

1. Server Action (Company Creation):

```typescript
// app/actions/company.ts
export async function createCompany(
prevState: any,
formData: FormData
): Promise<CompanyActionResult> {
const session = await auth();
if (!session || !session.user) {
 return { status: "error", message: "Not authenticated" };
}

const cvr = formData.get("cvr") as string;
const description = formData.get("description") as string;
const metadata = formData.get("metadata") as string;
const parsedMetadata = JSON.parse(metadata);
const name = parsedMetadata.name;

try {
 const newCompany: Company = await createCompanyForUser({
   name,
   cvr,
   description,
   email: session.user.email as string,
   metadata: JSON.parse(metadata),
 });

 return {
   status: "success",
   message: "Company created successfully",
   company: newCompany,
 };
} catch (error) {
 return {
   status: "error",
   message: "Failed to create company",
 };
}
}
````

2. API Route (Chat):

```typescript
// app/(chat)/api/chat/route.ts
export async function POST(request: Request) {
  const { id, messages, selectedFilePathnames, companyId } =
    await request.json();
  const session = await auth();

  if (!session) {
    return new Response('Unauthorized', { status: 401 });
  }

  const result = await streamText({
    model: customModel,
    system: 'You are a friendly board member assistant!...',
    messages: convertToCoreMessages(messages),
    experimental_providerMetadata: {
      files: { selection: selectedFilePathnames },
      companyId
    },
    onFinish: async ({ text }) => {
      await createMessage({
        id,
        messages: [...messages, { role: 'assistant', content: text }],
        author: session.user?.email!
      });
    }
  });

  return result.toDataStreamResponse({});
}
```

3. Client Component with SWR:

```typescript
// components/files.tsx
export const Files = ({ selectedCompanyId /* ... */ }) => {
  const {
    data: files,
    mutate,
    isLoading
  } = useSWR<Array<{ pathname: string; url: string }>>(
    selectedCompanyId ? `api/files/list?companyId=${selectedCompanyId}` : null,
    fetcher,
    { fallbackData: [] }
  );

  // Component logic and JSX
};
```

14. Middleware:

    - Custom middleware implemented in `middleware.ts`
    - Handles authentication checks and redirects
    - Applies to specific routes: "/", "/:id", "/api/:path\*", "/login", "/register"

15. RAG (Retrieval Augmented Generation) Implementation:

    - Custom middleware in `ai/rag-middleware.ts`
    - Enhances AI responses with relevant document chunks
    - Uses cosine similarity for document retrieval

16. PDF Processing:

    - Utility function in `utils/pdf.ts` for extracting content from PDF files
    - Used in file upload process to create searchable chunks

17. Database Operations:

    - Centralized in `app/db.ts`
    - Includes functions for CRUD operations on users, companies, documents, and chat history

18. Error Handling:

    - Custom ErrorBoundary component in `components/error-boundary.tsx`
    - Provides fallback UI for runtime errors

19. Predefined Actions:

    - Located in `components/pre-actions.tsx`
    - Offers a set of predefined queries for board members
    - Integrates with the chat interface for quick actions

20. Company Data View:

    - Component in `components/company-data-view.tsx`
    - Displays detailed information about the selected company
    - Potentially includes visualizations or data summaries

21. Library Management:

    - Component in `components/library-management.tsx`
    - Handles document listing, adding, and deletion
    - Integrates with the Files component for document operations

22. Markdown Rendering:

    - Custom Markdown component in `components/markdown.tsx`
    - Uses `react-markdown` with custom styling and component overrides

23. Toast Notifications:

    - Custom hook `use-toast.ts` in the `hooks/` directory
    - Provides a system for displaying toast notifications across the app

24. Company Context:

    - Implemented in `lib/companyProvider.tsx`
    - Manages global state for selected company and company list
    - Integrates with URL parameters for persistent company selection

25. Tailwind Configuration:

    - Extended theme in `tailwind.config.ts`
    - Custom color scheme and component styles

26. Next.js Configuration:
    - Custom configuration in `next.config.mjs`
    - Includes experimental features and external package configurations
