import { boolean, integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";

export const companyDocumentsTable = pgTable("company_documents", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  title: text("title").notNull(),
  description: text("description"),
  category: text("category").notNull(),
  storagePath: text("storage_path").notNull(),
  fileName: text("file_name").notNull(),
  mimeType: text("mime_type").notNull(),
  fileSize: integer("file_size").notNull(),
  previewPath: text("preview_path").notNull(),
  displayOrder: integer("display_order").notNull().default(0),
  isActive: boolean("is_active").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  createdBy: text("created_by"),
  updatedBy: text("updated_by"),
});

export const insertCompanyDocumentSchema = createInsertSchema(companyDocumentsTable).omit({
  createdAt: true,
  updatedAt: true,
});

export type InsertCompanyDocument = typeof companyDocumentsTable.$inferInsert;
export type CompanyDocument = typeof companyDocumentsTable.$inferSelect;
