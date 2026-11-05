-- Additive migration for admin-generated invoices, receipts, and shipping records.
CREATE TABLE IF NOT EXISTS public.business_documents (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  number text NOT NULL,
  document_type text NOT NULL CHECK (document_type IN ('invoice', 'receipt', 'shipping')),
  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'issued', 'paid', 'shipped', 'delivered', 'void')),
  issue_date date NOT NULL,
  due_date date,
  customer_name text NOT NULL,
  customer_company text,
  customer_email text,
  customer_phone text,
  customer_tax_id text,
  customer_address text NOT NULL DEFAULT '',
  ship_to_name text,
  ship_to_address text,
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  currency text NOT NULL DEFAULT 'HUF' CHECK (currency ~ '^[A-Z]{3}$'),
  subtotal numeric(14, 2) NOT NULL DEFAULT 0 CHECK (subtotal >= 0),
  tax_amount numeric(14, 2) NOT NULL DEFAULT 0 CHECK (tax_amount >= 0),
  shipping_amount numeric(14, 2) NOT NULL DEFAULT 0 CHECK (shipping_amount >= 0),
  total numeric(14, 2) NOT NULL DEFAULT 0 CHECK (total >= 0),
  notes text NOT NULL DEFAULT '',
  terms text NOT NULL DEFAULT '',
  carrier text NOT NULL DEFAULT '',
  service text NOT NULL DEFAULT '',
  tracking_number text NOT NULL DEFAULT '',
  shipping_date date,
  package_weight numeric(10, 3) CHECK (package_weight IS NULL OR package_weight >= 0),
  package_length numeric(10, 2) CHECK (package_length IS NULL OR package_length >= 0),
  package_width numeric(10, 2) CHECK (package_width IS NULL OR package_width >= 0),
  package_height numeric(10, 2) CHECK (package_height IS NULL OR package_height >= 0),
  payment_method text NOT NULL DEFAULT '',
  include_stamp boolean NOT NULL DEFAULT false,
  company_snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS business_documents_number_idx
  ON public.business_documents (number);
CREATE INDEX IF NOT EXISTS business_documents_type_status_created_idx
  ON public.business_documents (document_type, status, created_at DESC);
