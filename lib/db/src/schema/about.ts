import { integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";

export const aboutPagesTable = pgTable("about_pages", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  eyebrow: text("eyebrow").notNull(),
  title: text("title").notNull(),
  intro: text("intro").notNull(),
  imagePath: text("image_path"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const aboutSegmentsTable = pgTable("about_segments", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  eyebrow: text("eyebrow").notNull(),
  title: text("title").notNull(),
  body: text("body").notNull(),
  imagePath: text("image_path"),
  imagePosition: text("image_position").notNull().default("right"),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const insertAboutPageSchema = createInsertSchema(aboutPagesTable).omit({
  updatedAt: true,
});
export const insertAboutSegmentSchema = createInsertSchema(aboutSegmentsTable);

export type InsertAboutPage = typeof aboutPagesTable.$inferInsert;
export type AboutPageRecord = typeof aboutPagesTable.$inferSelect;
export type InsertAboutSegment = typeof aboutSegmentsTable.$inferInsert;
export type AboutSegmentRecord = typeof aboutSegmentsTable.$inferSelect;