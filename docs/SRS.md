# Software Requirements Specification (SRS)

## BoardAIssistant.com – Agentic LLM Observability and Prompt Evolution Framework for Scandinavian Boards

**Version:** 1.2  
**Date:** February 2, 2025

---

## 1. Introduction

BoardAIssistant.com is an AI‑powered board assistant designed specifically for Scandinavian board members. It streamlines the review of extensive board materials while reducing liability risks by detecting data inconsistencies, missing information, and illogical conclusions. The system is optimized for local legislative requirements, financial reporting standards, and governance best practices in Scandinavia.

This SRS defines our ideal technology stack and integration strategy using a modular, agentic LLM system. Our architecture distinguishes between the heavyweight analysis and document processing (handled by Python FastAPI) and the real‑time, user‑facing interactions (managed by Next.js 15 with the Vercel AI SDK). We integrate advanced observability via Langfuse (and optionally OpenLLMetry) while leveraging Supabase products for storage, database, authentication, and real‑time capabilities.

---

## 2. Purpose and Scope

### 2.1 Purpose

This document specifies the technical requirements for a board review assistant that:

- Processes board documents to extract and analyze critical data.
- Provides regionally optimized insights for Scandinavian boards.
- Supports iterative prompt evolution (moved downstream in our pipeline) based on observability feedback.
- Integrates robust observability, secure storage, and real‑time monitoring using open‑source tools and Supabase products.

### 2.2 Scope

- **Frontend (Next.js 15 with Vercel AI SDK):**  
  Provides a clean, responsive Scandinavian‑styled UI for document uploads, real‑time feedback, and interactive agent sessions.

- **Backend (Python FastAPI):**  
  Handles heavy document processing (using the unstructured library), long‑running LLM analysis, and advanced LLM observability via Langfuse/OpenLLMetry.  
  Integrates with Supabase for persistent storage, database management, authentication, and real‑time notifications.

- **Observability & Prompt Evolution:**  
  Employs Langfuse (primary) for tracing, metrics collection, and prompt versioning. Prompt optimization is performed as a downstream module—iteratively refining prompt templates based on observability data and performance feedback.

---

## 3. Definitions, Acronyms, and Abbreviations

- **LLM:** Large Language Model
- **AI SDK:** Application Programming Interface Software Development Kit
- **OTel:** OpenTelemetry
- **RAG:** Retrieval-Augmented Generation
- **Unstructured:** Open-source library for document text extraction
- **Langfuse:** Open-source LLM observability and prompt management platform
- **OpenLLMetry:** An OpenTelemetry‑based observability extension for LLMs
- **Supabase:** Open‑source backend platform for database, storage, authentication, and real‑time capabilities
- **Vercel AI SDK:** Toolkit for integrating AI functionalities into Next.js and other frontend frameworks
- **Localization:** Adaptation for Scandinavian languages and regulatory requirements

---

## 4. Overall Description

### 4.1 System Perspective

BoardAIssistant.com is a distributed system composed of:

- **Frontend Layer (Next.js 15 + Vercel AI SDK):**
  Renders an interactive dashboard with a Scandinavian design, handling user sessions **(using Clerk Auth)**, prompt submission, and real‑time updates. **Handles document uploads directly to Supabase Storage or via Server Actions.**

- **Backend Layer (Server Actions for Phase 1):**
  Performs document processing, LLM-based analysis, and heavy computation. Integrates Supabase services for storage, database management, and authentication **(Clerk Auth is primary authentication)**. Also implements advanced observability using Langfuse/OpenLLMetry.

- **Observability & Prompt Evolution Pipeline:**
  Observability data (including chain‑of‑thought traces, latency, and token usage) are collected via Langfuse and are used downstream to drive prompt evolution algorithms. Prompt optimization is executed as a later step in the processing pipeline to iteratively refine the prompt templates based on performance feedback.


### 4.2 System Functions

- **Document Processing:**
  Extract and annotate text from board documents with the unstructured library. Annotate content with regional context (e.g., local financial standards, seasonal trends). 

- **LLM Analysis:**
  Execute localized LLM prompts to detect inconsistencies, identify missing information, and generate chain‑of‑thought reasoning.

- **Prompt Management & Evolution:**
  Maintain version-controlled prompt templates with localized variations. Use automated optimization (e.g., MAPO‑inspired techniques) driven by Langfuse observability data.

- **Observability & Monitoring:**
  Integrate Langfuse's JS/TS SDK (and optionally OpenLLMetry) to capture detailed traces of every LLM call, including tool interactions and reasoning steps.

- **User Communication:**
  Generate structured reports and draft communications (emails) that adhere to Scandinavian board norms.

- **Supabase Integration:**
  Use Supabase for:
  - **Database:** Store user profiles, document metadata, and prompt versions.
  - **Storage:** Save raw board documents securely. **Using Supabase Storage.**
  - **Authentication:** Handle user auth and session management. **Using Clerk Auth with SSR.**
  - **Realtime:** Provide live notifications (e.g., upload status, analysis progress).

---

## 5. Specific Requirements

### 5.1 Functional Requirements

#### 5.1.1 Document Upload and Processing

- **FR1:** The system shall allow board members to upload board documents (PDFs, XLSX, DOCX, etc.) via the UI.
- **FR2:** The backend shall process documents using the unstructured library to extract text and regional metadata.
- **FR3:** Extracted data shall be tagged with LLM context and local context (e.g., local financial metrics, seasonality, etc.) and stored in Supabase Storage and Database.

#### 5.1.2 LLM-Based Analysis

- **FR4:** The system shall analyze documents using localized LLM prompts to detect inconsistencies and missing data.
- **FR5:** The system shall generate chain‑of‑thought reasoning for each analysis request and read the documents as well as the DB's full context (extracted text and metadata for that document).
- **FR6:** All LLM responses, along with metadata (prompt version, regional context, execution metrics), must be logged via Langfuse.

#### 5.1.3 Prompt Management and Evolution

- **FR7:** The system shall maintain a version-controlled repository of prompt templates (including localized variants) stored in Supabase Database.
- **FR8:** Automated prompt optimization (e.g., MAPO-inspired methods) will be applied downstream in the pipeline, using observability data to iteratively refine prompt templates.
- **FR9:** The system shall support A/B testing of prompt variants and store performance metrics in Supabase for further analysis.

#### 5.1.4 Observability and Monitoring

- **FR10:** The backend shall integrate Langfuse's Python SDK to capture detailed traces (chain‑of‑thought, tool invocations, token usage, latency).
- **FR11:** All LLM calls and interactions must be logged and retrievable for debugging and auditing purposes.

#### 5.1.5 User Interface and Agent Interaction

- **FR12:** The frontend shall display a dashboard for company profile, document upload, analysis, and observability metrics.
- **FR13:** Users shall be able to review analysis results and select observations to generate draft emails and reports tailored to local governance norms.
- **FR14:** The frontend shall use the Vercel AI SDK for rapid, low‑latency agent interactions and dynamic prompt submissions.

#### 5.1.6 Supabase Integration

- **FR15:** The system shall use **Clerk Authentication for secure user login and session management with SSR.**
- **FR16:** Supabase Database shall store profile data, document metadata, prompt versions, analysis results, reports, knowledge base, and performance logs.
- **FR17:** **Supabase Storage shall securely host uploaded board documents.**

---

## 6. Technical Architecture and Integration

### 6.1 Ideal Tech Stack

**Full stack: Next.js 15 with Vercel AI SDK and server actions**
- **Frontend (app/ and components/):**
  - **Responsibilities:**
    - Render an interactive Scandinavian‑styled user interface.
    - Handle lightweight agent interactions, prompt submissions, and real‑time updates using the Vercel AI SDK. 
    - Display observability dashboards and localized feedback.
  - **Key Integrations:**
    - Vercel AI SDK for dynamic AI prompt execution. For example, the board assistant agent will be implemented as a Vercel AI SDK useChat hook with tool calling, and document processing will be done using the generateObject hook. Please always refer to the Vercel AI SDK documentation for the most accurate and up‑to‑date information. https://sdk.vercel.ai/llms.txt
    - Optional integration of Langfuse's JS/TS libraries for frontend prompt management.
    - Communication with Supabase (via Supabase JS SDK) for auth, realtime notifications, and data retrieval.

- **Backend (/app/api + /actions (server actions)):**
  - **Responsibilities:**
    - Process and analyze board documents using the unstructured library.
    - Execute long‑running LLM calls and computationally intensive analysis tasks.
    - Manage secure file uploads and persistent storage.
    - Integrate Langfuse's JS/TS SDK for detailed observability and trace logging.
    - Interface with Supabase (via Supabase JS SDK) for database operations, storage, and authentication.

- **Document Processing: Unstructured.io + Multimodal LLM (Gemini Flash 2, GPT-4o, Claude 3.5 Sonnet)**
  - **Unstructured.io role:**
    - Extract text and metadata from board documents.
  - **Multimodal LLM role:**
    - Double check the data extracted by Unstructured.io and generateObject (Vercel AI SDK) to generate document metadata.


### 6.2 Full application flow

1. **Document Upload (Frontend):**  
   Users upload documents via the Next.js UI. These files are sent to FastAPI and stored in Supabase Storage.

2. **Document Processing (Backend):**  
   @/actions/process-document.ts uses the unstructured library to extract text before passing that and the original document (if PDF, otherwise just the text) to the multimodal LLM. Processed metadata is saved in Supabase Database.

3. **Chunking and embedding (Backend):**  
   @/actions/chunk-and-embed.ts uses the multimodal LLM to chunk the document and embed the chunks. We store the embeddings in Supabase Vector DB and the chunks in Supabase Database as well as the metadata in a separate table.

4. **User Interaction (Frontend):**  
   The Next.js UI shows the results of the document processing and the user can edit or add more information to the metadata before proceeding to the next step.

5. **Analysis (Frontend):**  
   The user is asked to upload more documents or proceed to the analysis. 
  On the analysis page, the user can choose which documents to include in the analysis as well as which type of analysis to perform.

6. **Analysis (Backend):**  
   When a user submits the analysis, @/actions/analyze/board-analysis.ts uses the multimodal LLM to analyze the document. The LLM response is saved in Supabase Database.

7. **Analysis results (Frontend):**  
   The Next.js UI shows the results of the analysis formatted as a action item list, from which the user can select items to be added to a report. After going through the action items, the user can generate new analyses or proceed to the report generation step.

8. **Report generation (Backend):**  
   @/actions/generate-report.ts (TO-DO) uses the multimodal LLM to generate a report. The report is saved in Supabase Database.

9. **Report (Frontend):**  
   The Next.js UI shows the report.


---

## 7. Appendix

### 7.1 References

- Vercel AI SDK: [https://sdk.vercel.ai/llms.txt](https://sdk.vercel.ai/llms.txt)

- Langfuse GitHub repository: [https://github.com/langfuse/langfuse](https://github.com/langfuse/langfuse) [oai_citation_attribution:0‡github.com](https://github.com/langfuse/langfuse)
- Traceloop/OpenLLMetry: [https://github.com/traceloop/openllmetry](https://github.com/traceloop/openllmetry) [oai_citation_attribution:1‡github.com](https://github.com/traceloop/openllmetry)
- Supabase Documentation: [https://supabase.com/docs](https://supabase.com/docs)
