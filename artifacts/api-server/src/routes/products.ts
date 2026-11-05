import { eq } from "drizzle-orm";
import express, { Router, type IRouter } from "express";
import { db, insertProductSchema, productsTable } from "@workspace/db";
import {
  CreateProductBody,
  DeleteProductParams,
  ListProductsResponse,
  CreateProductResponse,
} from "@workspace/api-zod";
import { requireAdmin } from "./admin-auth";
import { uploadImage } from "../lib/supabase-storage";

const router: IRouter = Router();
const productImageUpload = express.raw({
  // Mobile browsers and file pickers sometimes send image files as
  // application/octet-stream (or omit the MIME type entirely). Parse the
  // body here and validate the actual image signature below.
  type: "*/*",
  limit: "5mb",
});

const seedProducts = [
  { brand: "Lenovo", name: "ThinkPad X1 Carbon Gen 12", type: "Business notebook", category: "Laptops", detail: "Lightweight performance for distributed teams.", color: "#dce9f2", mark: "X1", availability: "Available to order" },
  { brand: "HPE", name: "ProLiant DL380 Gen11", type: "Rack server", category: "Servers", detail: "A dependable core for demanding workloads.", color: "#dce7e1", mark: "DL", availability: "Available to order" },
  { brand: "Cisco", name: "Catalyst 9300 Series", type: "Network switch", category: "Networking", detail: "Secure, intelligent connectivity at every edge.", color: "#e5e5e1", mark: "C9", availability: "Available to order" },
  { brand: "Dell Technologies", name: "PowerEdge R760", type: "Rack server", category: "Servers", detail: "Flexible compute for growing workloads and teams.", color: "#e9e4dc", mark: "R7", availability: "Request availability" },
  { brand: "Fortinet", name: "FortiGate 100F", type: "Security appliance", category: "Security", detail: "High-performance protection for distributed networks.", color: "#dce7ec", mark: "FG", availability: "Available to order" },
  { brand: "Microsoft", name: "Surface Laptop 6", type: "Business notebook", category: "Laptops", detail: "A considered workplace device for modern teams.", color: "#e5e9e4", mark: "SL", availability: "Available to order" },
] as const;

let catalogInitialized = false;

async function getProducts() {
  const current = await db.select().from(productsTable).orderBy(productsTable.id);
  if (current.length > 0 || catalogInitialized) return current;
  catalogInitialized = true;
  return db.insert(productsTable).values([...seedProducts]).returning();
}

router.get("/products", async (_req, res): Promise<void> => {
  const products = await getProducts();
  res.json(ListProductsResponse.parse(products));
});

router.post("/uploads/product-image", requireAdmin, productImageUpload, async (req, res): Promise<void> => {
  const body = Buffer.isBuffer(req.body) ? req.body : undefined;

  if (!body || body.length === 0) {
    res.status(400).json({ error: "Choose a JPG, PNG, WEBP, or GIF image." });
    return;
  }

  try {
    res.status(201).json({ imagePath: await uploadImage(body, "products") });
  } catch (error) {
    req.log.error({ err: error }, "Product image upload failed");
    res.status(502).json({ error: error instanceof Error ? error.message : "Image upload failed" });
  }
});

router.post("/products", requireAdmin, async (req, res): Promise<void> => {
  const parsed = CreateProductBody.safeParse(req.body);
  if (!parsed.success) {
    req.log.warn({ errors: parsed.error.message }, "Invalid product creation request");
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [product] = await db.insert(productsTable).values(insertProductSchema.parse(parsed.data)).returning();
  res.status(201).json(CreateProductResponse.parse(product));
});

router.delete("/products/:id", requireAdmin, async (req, res): Promise<void> => {
  const parsed = DeleteProductParams.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [product] = await db.delete(productsTable).where(eq(productsTable.id, parsed.data.id)).returning();
  if (!product) {
    res.status(404).json({ error: "Product not found" });
    return;
  }
  res.sendStatus(204);
});

export default router;