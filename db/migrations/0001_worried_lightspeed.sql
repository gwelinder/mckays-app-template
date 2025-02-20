-- First, convert existing enum columns to text
ALTER TABLE "documents" ALTER COLUMN "category" TYPE text;
--> statement-breakpoint

-- Drop existing enum if it exists
DROP TYPE IF EXISTS "public"."document_category";
DROP TYPE IF EXISTS "public"."document_type";
--> statement-breakpoint

-- Create all enums
DO $$ BEGIN
 CREATE TYPE "public"."finding_severity" AS ENUM('info', 'low', 'medium', 'high', 'critical');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."finding_status" AS ENUM('open', 'in_review', 'accepted', 'rejected', 'resolved');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."finding_type" AS ENUM('inconsistency', 'missing_information', 'compliance_issue', 'financial_discrepancy', 'risk_flag', 'action_required', 'policy_violation');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."document_confidentiality" AS ENUM('public', 'internal', 'confidential', 'strictly_confidential');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."document_type" AS ENUM('governance', 'financial', 'compliance', 'risk', 'strategy', 'minutes', 'report', 'policy', 'other');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."document_status" AS ENUM('pending', 'processing', 'analyzed', 'needs_review', 'approved', 'rejected', 'archived');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."analysis_status" AS ENUM('pending', 'in_progress', 'completed', 'needs_review', 'rejected', 'error');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

-- Create document_analysis table
CREATE TABLE IF NOT EXISTS "document_analysis" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "company_id" uuid NOT NULL,
    "document_id" uuid,
    "type" text,
    "title" text NOT NULL,
    "status" analysis_status NOT NULL DEFAULT 'pending',
    "summary" text,
    "findings" jsonb DEFAULT '{}',
    "recommendations" jsonb DEFAULT '[]',
    "document_url" text,
    "document_ids" jsonb DEFAULT '[]',
    "document_urls" jsonb DEFAULT '[]',
    "metadata" jsonb,
    "analyzer_id" text NOT NULL,
    "started_at" timestamp DEFAULT now() NOT NULL,
    "completed_at" timestamp,
    "created_at" timestamp DEFAULT now() NOT NULL,
    "updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint

-- Create tables after enums
CREATE TABLE IF NOT EXISTS "document_versions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"document_id" uuid NOT NULL,
	"version" text NOT NULL,
	"url" text NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"created_by" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "analysis_findings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"analysis_id" uuid NOT NULL,
	"type" "finding_type" NOT NULL,
	"severity" "finding_severity" NOT NULL,
	"status" "finding_status" DEFAULT 'open' NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"location" text,
	"context" text,
	"suggested_action" text,
	"metadata" jsonb,
	"reviewer_id" text,
	"review_note" text,
	"reviewed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint

-- Convert metadata to jsonb
ALTER TABLE "documents" ALTER COLUMN "metadata" TYPE jsonb USING COALESCE(metadata::jsonb, '{}');
--> statement-breakpoint
ALTER TABLE "document_analysis" ALTER COLUMN "document_url" DROP NOT NULL;
--> statement-breakpoint

-- Handle document type conversion
-- Update the values
UPDATE "documents" 
SET "category" = CASE "category"
    WHEN 'board_meeting' THEN 'minutes'
    WHEN 'financial_report' THEN 'financial'
    WHEN 'policy_document' THEN 'policy'
    WHEN 'strategic_plan' THEN 'strategy'
    WHEN 'audit_report' THEN 'compliance'
    WHEN 'risk_assessment' THEN 'risk'
    WHEN 'compliance_report' THEN 'compliance'
    ELSE 'other'
END;
--> statement-breakpoint

-- Convert to enum type
ALTER TABLE "documents" 
    ALTER COLUMN "category" TYPE document_type USING category::document_type;
--> statement-breakpoint

-- Rename the column
ALTER TABLE "documents" RENAME COLUMN "category" TO "type";
--> statement-breakpoint

-- Handle document analysis type conversion
-- Update the values
UPDATE "document_analysis" 
SET "type" = CASE "type"
    WHEN 'board_meeting' THEN 'minutes'
    WHEN 'financial_report' THEN 'financial'
    WHEN 'policy_document' THEN 'policy'
    WHEN 'strategic_plan' THEN 'strategy'
    WHEN 'audit_report' THEN 'compliance'
    WHEN 'risk_assessment' THEN 'risk'
    WHEN 'compliance_report' THEN 'compliance'
    ELSE 'other'
END;
--> statement-breakpoint

-- Convert to enum type
ALTER TABLE "document_analysis" 
    ALTER COLUMN "type" TYPE document_type USING type::document_type;
--> statement-breakpoint

-- Convert JSON columns
ALTER TABLE "document_analysis" ALTER COLUMN "findings" TYPE jsonb USING COALESCE(findings::jsonb, '{}');
ALTER TABLE "document_analysis" ALTER COLUMN "findings" SET DEFAULT '{}';
--> statement-breakpoint
ALTER TABLE "document_analysis" ALTER COLUMN "recommendations" TYPE jsonb USING COALESCE(recommendations::jsonb, '[]');
ALTER TABLE "document_analysis" ALTER COLUMN "recommendations" SET DEFAULT '[]';
--> statement-breakpoint
ALTER TABLE "document_analysis" ALTER COLUMN "metadata" TYPE jsonb USING CASE WHEN metadata IS NULL THEN NULL ELSE metadata::jsonb END;
--> statement-breakpoint

-- Add new columns
ALTER TABLE "documents" ADD COLUMN IF NOT EXISTS "confidentiality" "document_confidentiality" DEFAULT 'internal' NOT NULL;
ALTER TABLE "documents" ADD COLUMN IF NOT EXISTS "version" text DEFAULT '1.0.0' NOT NULL;
ALTER TABLE "documents" ADD COLUMN IF NOT EXISTS "content_metadata" jsonb;
ALTER TABLE "documents" ADD COLUMN IF NOT EXISTS "retention_date" timestamp;
ALTER TABLE "documents" ADD COLUMN IF NOT EXISTS "last_accessed_at" timestamp;
--> statement-breakpoint

-- Add foreign key constraints
DO $$ BEGIN
 ALTER TABLE "document_versions" ADD CONSTRAINT "document_versions_document_id_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "document_versions" ADD CONSTRAINT "document_versions_created_by_profiles_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("user_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "analysis_findings" ADD CONSTRAINT "analysis_findings_analysis_id_document_analysis_id_fk" FOREIGN KEY ("analysis_id") REFERENCES "public"."document_analysis"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "analysis_findings" ADD CONSTRAINT "analysis_findings_reviewer_id_profiles_user_id_fk" FOREIGN KEY ("reviewer_id") REFERENCES "public"."profiles"("user_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "document_analysis" ADD CONSTRAINT "document_analysis_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "document_analysis" ADD CONSTRAINT "document_analysis_document_id_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "document_analysis" ADD CONSTRAINT "document_analysis_analyzer_id_profiles_user_id_fk" FOREIGN KEY ("analyzer_id") REFERENCES "public"."profiles"("user_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
