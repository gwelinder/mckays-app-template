# Supabase Database Schema for BoardAIssistant.com

This document details the complete database schema for BoardAIssistant.com as implemented on Supabase (PostgreSQL). The schema supports user management, document processing, analysis and reporting, prompt management, observability logging, and notification services. All data models are created using Supabase's schema builder and are accessed via the Supabase SDK for data fetching and querying. Wherever applicable, the `auth.uid()` function is used as the default value for user-related columns—this ensures that the authenticated user's ID is automatically populated without requiring the client to send it explicitly.

---

## Table of Contents

1. [Users](#users)
2. [Documents](#documents)
3. [Analysis](#analysis)
4. [Observations](#observations)
5. [Reports](#reports)
6. [Prompt Templates](#prompt-templates)
7. [Observability Traces](#observability-traces)
8. [Notifications](#notifications)
9. [Prompt Optimization Logs](#prompt-optimization-logs)
10. [Database and Data Model Guidelines](#database-and-data-model-guidelines)
11. [Code Style Guide](#code-style-guide)

---

## 1. Users

**Table Name:** `users`

| Column Name  | Data Type | Constraints                               | Description                                                                                                                                 |
| ------------ | --------- | ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| id           | UUID      | PRIMARY KEY, UNIQUE, DEFAULT `auth.uid()` | Unique identifier for the user (auto-populated via Supabase Auth). **This ID should ideally reference `auth.users.id` from Supabase Auth.** |
| email        | TEXT      | NOT NULL, UNIQUE                          | User's email address. **Managed by Supabase Auth.**                                                                                         |
| display_name | TEXT      | NOT NULL                                  | Full name of the user.                                                                                                                      |
| locale       | TEXT      | NOT NULL                                  | User locale (e.g., "no", "sv", "da", "fi").                                                                                                 |
| role         | TEXT      | DEFAULT 'board_member'                    | User role (e.g., board_member, admin).                                                                                                      |
| created_at   | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP                 | Timestamp of user account creation.                                                                                                         |
| updated_at   | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP                 | Timestamp of the last profile update.                                                                                                       |

**Notes:**

- **The `id` and `email` are now primarily managed by Supabase Auth's `auth.users` table. Our `users` table should ideally be linked to `auth.users` using foreign key relationship or ensure data consistency.**
- Consider if all fields are still necessary in our `users` table, as some might be redundant with Supabase Auth's user data.

---

## 2. Documents

**Table Name:** `documents`

| Column Name    | Data Type | Constraints                                              | Description                                                                                                                  |
| -------------- | --------- | -------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| document_id    | UUID      | PRIMARY KEY, UNIQUE                                      | Unique identifier for the document.                                                                                          |
| user_id        | UUID      | NOT NULL, FOREIGN KEY (`users.id`), DEFAULT `auth.uid()` | Reference to the uploading user (auto-populated). **Should reference our `users.id` which is linked to Supabase Auth user.** |
| company_id     | UUID      | NOT NULL, FOREIGN KEY (`companies.id`)                   | Reference to the company the document belongs to.                                                                            |
| file_name      | TEXT      | NOT NULL                                                 | Original file name of the uploaded document.                                                                                 |
| storage_url    | TEXT      | NOT NULL                                                 | URL from Supabase Storage where the file is hosted. **This will be a Supabase Storage URL.**                                 |
| processed_text | TEXT      | NOT NULL                                                 | Extracted text from the document using the Unstructured API.                                                                 |
| metadata       | JSONB     | NOT NULL                                                 | JSON object containing: size, type, uploadedAt, and other metadata.                                                          |
| created_at     | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP                                | Timestamp of document upload.                                                                                                |
| updated_at     | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP                                | Timestamp of last document update.                                                                                           |

**Notes:**

- Document text is extracted using the Unstructured API (https://api.unstructured.io/general/v0/general)
- Files are stored in **Supabase Storage** under the path pattern: `{user_id}/{file_name}` **or a more appropriate structure.**
- Metadata includes file size, type, upload timestamp, and any additional metadata from processing

---

## 3. Analysis

**Table Name:** `analysis`

| Column Name   | Data Type | Constraints                                     | Description                                                                  |
| ------------- | --------- | ----------------------------------------------- | ---------------------------------------------------------------------------- |
| analysis_id   | UUID      | PRIMARY KEY, UNIQUE                             | Unique identifier for the analysis job.                                      |
| document_id   | UUID      | NOT NULL, FOREIGN KEY (`documents.document_id`) | The document being analyzed.                                                 |
| analysis_type | TEXT      | NOT NULL                                        | Type of analysis (e.g., "data_inconsistency", "fact_check", "missing_info"). |
| local_context | JSONB     |                                                 | Regional parameters (e.g., local regulations, financial standards).          |
| status        | TEXT      | NOT NULL, DEFAULT 'processing'                  | Current status: processing, completed, or failed.                            |
| submitted_at  | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP                       | Timestamp when analysis was submitted.                                       |
| completed_at  | TIMESTAMP |                                                 | Timestamp when analysis was completed.                                       |
| results       | JSONB     |                                                 | JSON object containing raw analysis results and aggregated insights.         |

---

## 4. Observations

**Table Name:** `observations`

| Column Name    | Data Type | Constraints                                    | Description                                                      |
| -------------- | --------- | ---------------------------------------------- | ---------------------------------------------------------------- |
| observation_id | UUID      | PRIMARY KEY, UNIQUE                            | Unique identifier for the observation.                           |
| analysis_id    | UUID      | NOT NULL, FOREIGN KEY (`analysis.analysis_id`) | Reference to the parent analysis job.                            |
| description    | TEXT      | NOT NULL                                       | Description of the observation (e.g., data inconsistency found). |
| page_reference | TEXT      |                                                | Reference to the page or section in the document.                |
| suggestions    | TEXT      |                                                | Suggested corrective action.                                     |
| created_at     | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP                      | Timestamp when the observation was recorded.                     |

---

## 5. Reports

**Table Name:** `reports`

| Column Name  | Data Type | Constraints                                    | Description                                       |
| ------------ | --------- | ---------------------------------------------- | ------------------------------------------------- |
| report_id    | UUID      | PRIMARY KEY, UNIQUE                            | Unique identifier for the report.                 |
| analysis_id  | UUID      | NOT NULL, FOREIGN KEY (`analysis.analysis_id`) | The analysis from which the report was generated. |
| draft_email  | TEXT      | NOT NULL                                       | Generated draft email or report text.             |
| generated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP                      | Timestamp when the report was generated.          |

---

## 6. Prompt Templates

**Table Name:** `prompt_templates`

| Column Name  | Data Type | Constraints               | Description                                                                                               |
| ------------ | --------- | ------------------------- | --------------------------------------------------------------------------------------------------------- |
| prompt_id    | UUID      | PRIMARY KEY, UNIQUE       | Unique identifier for the prompt template.                                                                |
| version      | TEXT      | NOT NULL                  | Version of the prompt template (e.g., "1.3", "1.4").                                                      |
| description  | TEXT      |                           | Brief description of the template's purpose (e.g., "Data inconsistency analysis – Scandinavian context"). |
| content      | TEXT      | NOT NULL                  | The actual prompt text/template.                                                                          |
| last_updated | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Timestamp when the template was last modified.                                                            |

---

## 7. Observability Traces

**Table Name:** `observability_traces`

| Column Name      | Data Type | Constraints                          | Description                                                 |
| ---------------- | --------- | ------------------------------------ | ----------------------------------------------------------- |
| trace_id         | UUID      | PRIMARY KEY, UNIQUE                  | Unique identifier for the trace log.                        |
| analysis_id      | UUID      | FOREIGN KEY (`analysis.analysis_id`) | Associated analysis job identifier.                         |
| timestamp        | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP            | Time when the trace was recorded.                           |
| chain_of_thought | TEXT      |                                      | Full chain-of-thought text or intermediate reasoning steps. |
| metrics          | JSONB     |                                      | JSON object capturing metrics (e.g., latency, token usage). |

---

## 8. Notifications

**Table Name:** `notifications`

| Column Name     | Data Type | Constraints                                              | Description                                            |
| --------------- | --------- | -------------------------------------------------------- | ------------------------------------------------------ |
| notification_id | UUID      | PRIMARY KEY, UNIQUE                                      | Unique identifier for the notification.                |
| user_id         | UUID      | NOT NULL, FOREIGN KEY (`users.id`), DEFAULT `auth.uid()` | The target user for the notification (auto-populated). |
| message         | TEXT      | NOT NULL                                                 | Notification message text.                             |
| type            | TEXT      | NOT NULL                                                 | Notification type (e.g., "info", "alert", "success").  |
| timestamp       | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP                                | Time when the notification was generated.              |
| read            | BOOLEAN   | DEFAULT FALSE                                            | Indicates whether the notification has been read.      |

---

## 9. Prompt Optimization Logs

**Table Name:** `prompt_optimization_logs`

| Column Name        | Data Type | Constraints                                          | Description                                                              |
| ------------------ | --------- | ---------------------------------------------------- | ------------------------------------------------------------------------ |
| log_id             | UUID      | PRIMARY KEY, UNIQUE                                  | Unique identifier for the optimization log entry.                        |
| prompt_id          | UUID      | NOT NULL, FOREIGN KEY (`prompt_templates.prompt_id`) | Reference to the prompt template being optimized.                        |
| previous_version   | TEXT      | NOT NULL                                             | Version before optimization.                                             |
| new_version        | TEXT      | NOT NULL                                             | New version after optimization.                                          |
| observability_data | JSONB     |                                                      | Aggregated metrics and trace logs used for optimization.                 |
| status             | TEXT      | NOT NULL, DEFAULT 'started'                          | Status of the optimization run (e.g., "started", "completed", "failed"). |
| initiated_at       | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP                            | Timestamp when the optimization was initiated.                           |
| completed_at       | TIMESTAMP |                                                      | Timestamp when the optimization was completed.                           |

---

## 10. Database and Data Model Guidelines

- **Supabase Schema Builder:**  
  Use Supabase's schema builder for creating and maintaining the data model. This ensures consistency across all tables and leverages Supabase's best practices.

- **Supabase SDK for Data Operations:**  
  All data fetching and querying should be performed using the Supabase SDK (available for both JavaScript and Python). This provides seamless integration with Supabase services.

- **Automatic User ID Population:**  
  Set `auth.uid()` as the default value for user-related columns (e.g., `user_id` in `documents`, `notifications`). This way, the authenticated user's ID is automatically assigned without needing explicit client input.

---

_This SCHEMA.md provides a comprehensive overview of the Supabase database structure for BoardAIssistant.com, as well as guidelines for building and maintaining the codebase using modern technologies and best practices. The document ensures that user IDs are auto-populated via Supabase Auth, and it incorporates a strict Code Style Guide to support a clean, maintainable, and scalable project structure tailored for our Scandinavian board assistant application._
