import { eq, sql } from "drizzle-orm";
import { Router, type IRouter } from "express";
import { db, companySettingsTable, insertQuoteRequestSchema, quoteRequestsTable } from "@workspace/db";
import { DEFAULT_QUOTE_REQUEST_RECIPIENT, normalizeQuoteRequestRecipientEmail, sendQuoteRequestNotification } from "../lib/email";
import { requireAdmin } from "./admin-auth";

const router: IRouter = Router();
const SETTING_KEY = "quote_request_email";

async function getSettingValue(key: string, fallback?: string) {
  const [setting] = await db.select({ value: companySettingsTable.value }).from(companySettingsTable).where(eq(companySettingsTable.key, key));
  return setting?.value ?? fallback ?? null;
}

async function setSettingValue(key: string, value: string) {
  const normalized = value.trim();
  const [record] = await db.insert(companySettingsTable).values({ key, value: normalized }).onConflictDoUpdate({ target: companySettingsTable.key, set: { value: normalized, updatedAt: sql`now()` } }).returning();
  return record;
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

router.get("/admin/quote-request-email", requireAdmin, async (_req, res): Promise<void> => {
  const value = await getSettingValue(SETTING_KEY, DEFAULT_QUOTE_REQUEST_RECIPIENT);
  res.json({ email: normalizeQuoteRequestRecipientEmail(value) });
});

router.put("/admin/quote-request-email", requireAdmin, async (req, res): Promise<void> => {
  const rawEmail = typeof req.body?.email === "string" ? req.body.email : "";
  const email = rawEmail.trim();

  if (!email) {
    res.status(400).json({ error: "Please enter a valid email address." });
    return;
  }

  if (!isValidEmail(email)) {
    res.status(400).json({ error: "Please enter a valid email address." });
    return;
  }

  await setSettingValue(SETTING_KEY, email);
  res.json({ message: "Quote request email updated successfully.", email });
});

router.get("/admin/quote-requests", requireAdmin, async (_req, res): Promise<void> => {
  const requests = await db.select().from(quoteRequestsTable).orderBy(quoteRequestsTable.submittedAt); 
  res.json(requests);
});

router.get("/web3forms/access-key", async (_req, res): Promise<void> => {
  const accessKey = process.env.WEB3FORMS_ACCESS_KEY?.trim();
  if (!accessKey) {
    res.status(404).json({ error: "Web3Forms access key not configured" });
    return;
  }

  res.json({ accessKey });
});

router.post("/quote-requests", async (req, res): Promise<void> => {
  const parsed = insertQuoteRequestSchema.safeParse({
    customerName: typeof req.body?.customerName === "string" ? req.body.customerName : "",
    customerEmail: typeof req.body?.customerEmail === "string" ? req.body.customerEmail : "",
    customerPhone: typeof req.body?.customerPhone === "string" ? req.body.customerPhone : null,
    companyName: typeof req.body?.companyName === "string" ? req.body.companyName : null,
    productService: typeof req.body?.productService === "string" ? req.body.productService : null,
    quantity: typeof req.body?.quantity === "number" ? req.body.quantity : 1,
    message: typeof req.body?.message === "string" ? req.body.message : "",
  });

  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  if (!parsed.data.customerName || !parsed.data.customerEmail || !parsed.data.message) {
    res.status(400).json({ error: "Customer name, email, and message are required." });
    return;
  }

  try {
    const [request] = await db.insert(quoteRequestsTable).values(parsed.data).returning();
    const recipientEmail = normalizeQuoteRequestRecipientEmail(await getSettingValue(SETTING_KEY, DEFAULT_QUOTE_REQUEST_RECIPIENT));

    try {
      await sendQuoteRequestNotification({
        recipientEmail,
        request: {
          ...request,
          submittedAt: request.submittedAt ?? new Date(),
        },
      });
      await db.update(quoteRequestsTable)
        .set({ notificationStatus: "sent", notificationError: null })
        .where(eq(quoteRequestsTable.id, request.id));
    } catch (error) {
      await db.update(quoteRequestsTable)
        .set({ notificationStatus: "failed", notificationError: error instanceof Error ? error.message : String(error) })
        .where(eq(quoteRequestsTable.id, request.id));
      req.log.error({ err: error, requestId: request.id }, "Quote request notification failed");
    }

    req.log.info({ requestId: request.id, recipientEmail }, "Quote request saved successfully");
    res.status(201).json({ id: request.id, status: "stored" });
  } catch (error) {
    req.log.error({ err: error }, "Quote request persistence failed");
    res.status(500).json({ error: "Unable to save quote request" });
  }
});

export default router;