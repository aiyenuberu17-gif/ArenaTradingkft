import { integer, pgTable, text } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";

export const productsTable = pgTable("marketplace_products", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  brand: text("brand").notNull(),
  name: text("name").notNull(),
  type: text("type").notNull(),
  category: text("category").notNull(),
  detail: text("detail").notNull(),
  color: text("color").notNull(),
  mark: text("mark").notNull(),
  availability: text("availability").notNull(),
  imagePath: text("image_path"),
});

export const insertProductSchema = createInsertSchema(productsTable);
export type InsertProduct = typeof productsTable.$inferInsert;
export type Product = typeof productsTable.$inferSelect;