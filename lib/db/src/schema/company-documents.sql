CREATE TABLE IF NOT EXISTS company_documents (
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

CREATE INDEX IF NOT EXISTS company_documents_display_order_idx ON company_documents (display_order, created_at);
CREATE INDEX IF NOT EXISTS company_documents_is_active_idx ON company_documents (is_active);
