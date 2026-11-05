-- Safe migration: create company_documents if it does not exist
-- This will not drop or alter existing data.
SET search_path = public;

CREATE TABLE IF NOT EXISTS public.company_documents (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  title text NOT NULL,
  description text,
  category text NOT NULL,
  storage_path text NOT NULL,
  file_name text NOT NULL,
  mime_type text NOT NULL,
  file_size integer NOT NULL,
  preview_path text NOT NULL,
  display_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  created_by text,
  updated_by text
);

CREATE INDEX IF NOT EXISTS company_documents_display_order_idx ON public.company_documents (display_order, created_at);
CREATE INDEX IF NOT EXISTS company_documents_is_active_idx ON public.company_documents (is_active);

-- Temporary uploaded files tracking to support orphaned-upload cleanup
CREATE TABLE IF NOT EXISTS public.uploaded_files_temp (
  token text PRIMARY KEY,
  path text NOT NULL,
  is_private boolean NOT NULL,
  used boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS uploaded_files_temp_created_idx ON public.uploaded_files_temp (created_at);
