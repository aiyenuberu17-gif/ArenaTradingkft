import { eq, sql } from "drizzle-orm";
import { Router, type IRouter, type Request, type Response } from "express";
import { db, companySettingsTable } from "@workspace/db";
import { requireAdmin } from "./admin-auth";

const router: IRouter = Router();
const SETTING_KEY = "whatsapp_number";

async function getSettingValue(key: string) {
  const [setting] = await db.select({ value: companySettingsTable.value }).from(companySettingsTable).where(eq(companySettingsTable.key, key));
  return setting?.value ?? null;
}

async function setSettingValue(key: string, value: string) {
  const normalized = value.trim();
  if (!normalized) {
    // delete the setting if empty
    await db.delete(companySettingsTable).where(eq(companySettingsTable.key, key));
    return null;
  }

  const [record] = await db.insert(companySettingsTable).values({ key, value: normalized }).onConflictDoUpdate({ target: companySettingsTable.key, set: { value: normalized, updatedAt: sql`now()` } }).returning();
  return record;
}

function normalizePhone(value: string) {
  return value.replace(/\D/g, "");
}

function isValidPhone(value: string) {
  const normalized = normalizePhone(value);
  return normalized.length >= 8; // basic validation, country code required
}

// Public endpoint to read the globally configured WhatsApp number from DB.
// This endpoint must remain cache-busting and side-effect free.
router.get("/settings/public", async (_req: Request, res: Response) => {
  const value = await getSettingValue(SETTING_KEY);
  const whatsappNumber = typeof value === "string" ? value.trim() : "";

  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");

  res.json({ whatsappNumber });
});

// Backwards-compatible public alias for existing consumers.
router.get("/settings/whatsapp", async (_req: Request, res: Response) => {
  const value = await getSettingValue(SETTING_KEY);
  const whatsappNumber = typeof value === "string" ? value.trim() : "";

  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");

  res.json({ whatsapp: whatsappNumber, whatsappNumber });
});

// Admin endpoints
router.get("/admin/whatsapp", requireAdmin, async (_req: Request, res: Response) => {
  const value = await getSettingValue(SETTING_KEY);
  res.json({ whatsapp: value ?? "" });
});

router.put("/admin/whatsapp", requireAdmin, async (req: Request, res: Response) => {
  const raw = typeof req.body?.whatsapp === "string" ? req.body.whatsapp : "";
  const normalized = normalizePhone(raw);

  if (!raw) {
    // explicit clear request: delete setting
    await setSettingValue(SETTING_KEY, "");
    res.json({ message: "WhatsApp number cleared.", whatsapp: "" });
    return;
  }

  if (!isValidPhone(raw)) {
    res.status(400).json({ error: "Please enter a valid WhatsApp number with country code, for example 4512345678." });
    return;
  }

  const record = await setSettingValue(SETTING_KEY, normalized);
  res.json({ message: "WhatsApp number updated.", whatsapp: record?.value ?? normalized });
});

export default router;
