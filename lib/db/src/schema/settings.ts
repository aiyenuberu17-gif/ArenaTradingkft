import { integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const companySettingsTable = pgTable("company_settings", {
  key: text("key").primaryKey(),
  value: text("value"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const quoteRequestsTable = pgTable("quote_requests", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  customerName: text("customer_name").notNull(),
  customerEmail: text("customer_email").notNull(),
  customerPhone: text("customer_phone"),
  companyName: text("company_name"),
  productService: text("product_service"),
  quantity: integer("quantity").notNull().default(1),
  message: text("message").notNull(),
  notificationStatus: text("notification_status").notNull().default("pending"),
  notificationError: text("notification_error"),
  submittedAt: timestamp("submitted_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertCompanySettingSchema = z.object({
  key: z.string().min(1),
  value: z.string().optional().nullable(),
});

export const insertQuoteRequestSchema = z.object({
  customerName: z.string().min(1),
  customerEmail: z.string().email(),
  customerPhone: z.string().optional().nullable(),
  companyName: z.string().optional().nullable(),
  productService: z.string().optional().nullable(),
  quantity: z.number().int().positive().optional().default(1),
  message: z.string().min(1),
});

export type InsertCompanySetting = typeof companySettingsTable.$inferInsert;
export type CompanySettingRecord = typeof companySettingsTable.$inferSelect;
export type InsertQuoteRequest = typeof quoteRequestsTable.$inferInsert;
export type QuoteRequestRecord = typeof quoteRequestsTable.$inferSelect;
