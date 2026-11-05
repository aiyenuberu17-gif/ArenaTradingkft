import { sql } from "drizzle-orm";
import {
  boolean,
  date,
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export type StoredBusinessDocumentItem = {
  description: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  lineTotal: number;
};

export type BusinessDocumentSettingsSnapshot = {
  companyName: string;
  legalName: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
  phone: string;
  email: string;
  website: string;
  taxId: string;
  registrationNumber: string;
  currency: string;
  logoUrl: string;
  stampUrl: string;
  includeStampByDefault: boolean;
  brandColor: string;
  invoicePrefix: string;
  receiptPrefix: string;
  shippingPrefix: string;
  paymentInstructions: string;
  footerNote: string;
};

export const businessDocumentsTable = pgTable(
  "business_documents",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    number: text("number").notNull(),
    documentType: text("document_type").notNull(),
    status: text("status").notNull().default("draft"),
    issueDate: date("issue_date", { mode: "string" }).notNull(),
    dueDate: date("due_date", { mode: "string" }),
    customerName: text("customer_name").notNull(),
    customerCompany: text("customer_company"),
    customerEmail: text("customer_email"),
    customerPhone: text("customer_phone"),
    customerTaxId: text("customer_tax_id"),
    customerAddress: text("customer_address").notNull().default(""),
    shipToName: text("ship_to_name"),
    shipToAddress: text("ship_to_address"),
    items: jsonb("items")
      .$type<StoredBusinessDocumentItem[]>()
      .notNull()
      .default(sql`'[]'::jsonb`),
    currency: text("currency").notNull().default("HUF"),
    subtotal: numeric("subtotal", { precision: 14, scale: 2 }).notNull().default("0"),
    taxAmount: numeric("tax_amount", { precision: 14, scale: 2 }).notNull().default("0"),
    shippingAmount: numeric("shipping_amount", { precision: 14, scale: 2 }).notNull().default("0"),
    total: numeric("total", { precision: 14, scale: 2 }).notNull().default("0"),
    notes: text("notes").notNull().default(""),
    terms: text("terms").notNull().default(""),
    carrier: text("carrier").notNull().default(""),
    service: text("service").notNull().default(""),
    trackingNumber: text("tracking_number").notNull().default(""),
    shippingDate: date("shipping_date", { mode: "string" }),
    packageWeight: numeric("package_weight", { precision: 10, scale: 3 }),
    packageLength: numeric("package_length", { precision: 10, scale: 2 }),
    packageWidth: numeric("package_width", { precision: 10, scale: 2 }),
    packageHeight: numeric("package_height", { precision: 10, scale: 2 }),
    paymentMethod: text("payment_method").notNull().default(""),
    includeStamp: boolean("include_stamp").notNull().default(false),
    companySnapshot: jsonb("company_snapshot")
      .$type<BusinessDocumentSettingsSnapshot>()
      .notNull()
      .default(sql`'{}'::jsonb`),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    uniqueIndex("business_documents_number_idx").on(table.number),
    index("business_documents_type_status_created_idx").on(
      table.documentType,
      table.status,
      table.createdAt,
    ),
  ],
);

export type BusinessDocumentRecord = typeof businessDocumentsTable.$inferSelect;
