import { and, desc, eq, sql } from "drizzle-orm";
import express, { Router, type IRouter } from "express";
import {
  CreateBusinessDocumentBody,
  CreateBusinessDocumentResponse,
  DeleteBusinessDocumentParams,
  GetBusinessDocumentSettingsResponse,
  ListBusinessDocumentsResponse,
  UpdateBusinessDocumentBody,
  UpdateBusinessDocumentParams,
  UpdateBusinessDocumentResponse,
  UpdateBusinessDocumentSettingsBody,
  UpdateBusinessDocumentSettingsResponse,
  UpdateBusinessDocumentStatusBody,
  UpdateBusinessDocumentStatusParams,
  UpdateBusinessDocumentStatusResponse,
} from "@workspace/api-zod";
import {
  businessDocumentsTable,
  companySettingsTable,
  db,
  type BusinessDocumentRecord,
  type BusinessDocumentSettingsSnapshot,
  type StoredBusinessDocumentItem,
} from "@workspace/db";
import { uploadImage } from "../lib/supabase-storage";
import { requireAdmin } from "./admin-auth";

const router: IRouter = Router();
const brandingUpload = express.raw({ type: "*/*", limit: "5mb" });
const SETTINGS_KEY = "business_document_settings";

const DEFAULT_SETTINGS: BusinessDocumentSettingsSnapshot = {
  companyName: "Arena Trading Kft",
  legalName: "Arena Trading Kft",
  address: "",
  city: "",
  postalCode: "",
  country: "Hungary",
  phone: "",
  email: "",
  website: "",
  taxId: "",
  registrationNumber: "",
  currency: "HUF",
  logoUrl: "/brand/arena-trading-dark.svg",
  stampUrl: "",
  includeStampByDefault: false,
  brandColor: "#087653",
  invoicePrefix: "INV",
  receiptPrefix: "REC",
  shippingPrefix: "SHP",
  paymentInstructions: "",
  footerNote: "Thank you for your business.",
};

type DocumentInput = ReturnType<typeof CreateBusinessDocumentBody.parse>;
type DocumentSettingsInput = ReturnType<typeof UpdateBusinessDocumentSettingsBody.parse>;
type DocumentType = "invoice" | "receipt" | "shipping";
type DocumentStatus = "draft" | "issued" | "paid" | "shipped" | "delivered" | "void";

class DraftConflictError extends Error {}

function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function nullableText(value: string | null | undefined): string | null {
  const trimmed = value?.trim() ?? "";
  return trimmed || null;
}

function isValidCalendarDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

function isSafeAssetUrl(value: string): boolean {
  if (!value.trim()) return true;
  if (value.startsWith("/") && !value.startsWith("//") && !value.includes("..")) return true;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function parseSettings(value: string | null | undefined): BusinessDocumentSettingsSnapshot {
  if (!value) return DEFAULT_SETTINGS;
  const decoded: unknown = JSON.parse(value);
  return GetBusinessDocumentSettingsResponse.parse({
    ...DEFAULT_SETTINGS,
    ...(typeof decoded === "object" && decoded !== null ? decoded : {}),
  });
}

async function readSettings(): Promise<BusinessDocumentSettingsSnapshot> {
  const [record] = await db
    .select({ value: companySettingsTable.value })
    .from(companySettingsTable)
    .where(eq(companySettingsTable.key, SETTINGS_KEY));
  return parseSettings(record?.value);
}

function normalizeSettings(input: DocumentSettingsInput): BusinessDocumentSettingsSnapshot {
  const normalized = {
    ...input,
    companyName: input.companyName.trim(),
    legalName: input.legalName.trim(),
    address: input.address.trim(),
    city: input.city.trim(),
    postalCode: input.postalCode.trim(),
    country: input.country.trim(),
    phone: input.phone.trim(),
    email: input.email.trim(),
    website: input.website.trim(),
    taxId: input.taxId.trim(),
    registrationNumber: input.registrationNumber.trim(),
    currency: input.currency.trim().toUpperCase(),
    logoUrl: input.logoUrl.trim(),
    stampUrl: input.stampUrl.trim(),
    invoicePrefix: input.invoicePrefix.trim().toUpperCase(),
    receiptPrefix: input.receiptPrefix.trim().toUpperCase(),
    shippingPrefix: input.shippingPrefix.trim().toUpperCase(),
    paymentInstructions: input.paymentInstructions.trim(),
    footerNote: input.footerNote.trim(),
  };
  if (!normalized.companyName) throw new Error("Enter the company name.");
  if (!/^[A-Z0-9][A-Z0-9_-]{0,11}$/.test(normalized.invoicePrefix)
    || !/^[A-Z0-9][A-Z0-9_-]{0,11}$/.test(normalized.receiptPrefix)
    || !/^[A-Z0-9][A-Z0-9_-]{0,11}$/.test(normalized.shippingPrefix)) {
    throw new Error("Number prefixes can use letters, numbers, underscores, and hyphens.");
  }
  if (!isSafeAssetUrl(normalized.logoUrl) || !isSafeAssetUrl(normalized.stampUrl)) {
    throw new Error("Logo and stamp must use a valid HTTP or HTTPS image URL.");
  }
  return normalized;
}

function buildLineItems(items: DocumentInput["items"]): {
  items: StoredBusinessDocumentItem[];
  subtotal: number;
  taxAmount: number;
} {
  let subtotal = 0;
  let taxAmount = 0;
  const normalizedItems = items.map((item) => {
    const quantity = Number(item.quantity);
    const unitPrice = roundMoney(Number(item.unitPrice));
    const base = roundMoney(quantity * unitPrice);
    const tax = roundMoney(base * Number(item.taxRate) / 100);
    subtotal = roundMoney(subtotal + base);
    taxAmount = roundMoney(taxAmount + tax);
    return {
      description: item.description.trim(),
      sku: item.sku?.trim() ?? "",
      quantity,
      unitPrice,
      taxRate: Number(item.taxRate),
      lineTotal: roundMoney(base + tax),
    };
  });
  return { items: normalizedItems, subtotal, taxAmount };
}

function numericString(value: number | null | undefined, precision = 2): string | null {
  return value == null ? null : Number(value).toFixed(precision);
}

function toResponse(row: BusinessDocumentRecord) {
  return {
    ...row,
    subtotal: Number(row.subtotal),
    taxAmount: Number(row.taxAmount),
    shippingAmount: Number(row.shippingAmount),
    total: Number(row.total),
    packageWeight: row.packageWeight == null ? null : Number(row.packageWeight),
    packageLength: row.packageLength == null ? null : Number(row.packageLength),
    packageWidth: row.packageWidth == null ? null : Number(row.packageWidth),
    packageHeight: row.packageHeight == null ? null : Number(row.packageHeight),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function validateDocumentInput(input: DocumentInput): string | null {
  if (!isValidCalendarDate(input.issueDate)) return "Enter a valid issue date.";
  if (input.dueDate && !isValidCalendarDate(input.dueDate)) return "Enter a valid due date.";
  if (input.shippingDate && !isValidCalendarDate(input.shippingDate)) return "Enter a valid shipping date.";
  if (input.documentType === "shipping" && !input.shipToAddress?.trim()) {
    return "Add a delivery address to create a shipping document.";
  }
  return null;
}

async function allocateDocumentNumber(
  transaction: Parameters<Parameters<typeof db.transaction>[0]>[0],
  type: DocumentType,
  issueDate: string,
  settings: BusinessDocumentSettingsSnapshot,
): Promise<string> {
  const year = issueDate.slice(0, 4);
  const counterKey = `business_document_counter_${type}_${year}`;
  const [counter] = await transaction
    .insert(companySettingsTable)
    .values({ key: counterKey, value: "1" })
    .onConflictDoUpdate({
      target: companySettingsTable.key,
      set: {
        value: sql`(COALESCE(${companySettingsTable.value}, '0')::integer + 1)::text`,
        updatedAt: sql`now()`,
      },
    })
    .returning({ value: companySettingsTable.value });
  const sequence = Number(counter?.value);
  if (!Number.isSafeInteger(sequence) || sequence < 1) {
    throw new Error("Unable to allocate a document number.");
  }
  const prefix = type === "invoice"
    ? settings.invoicePrefix
    : type === "receipt"
      ? settings.receiptPrefix
      : settings.shippingPrefix;
  return `${prefix}-${year}-${String(sequence).padStart(4, "0")}`;
}

function prepareDocumentValues(
  input: DocumentInput,
  settingsSnapshot: BusinessDocumentSettingsSnapshot,
  number: string,
) {
  const { items, subtotal, taxAmount } = buildLineItems(input.items);
  const shippingAmount = roundMoney(Number(input.shippingAmount));
  return {
    number,
    documentType: input.documentType,
    status: "draft",
    issueDate: input.issueDate,
    dueDate: input.dueDate || null,
    customerName: input.customerName.trim(),
    customerCompany: nullableText(input.customerCompany),
    customerEmail: nullableText(input.customerEmail),
    customerPhone: nullableText(input.customerPhone),
    customerTaxId: nullableText(input.customerTaxId),
    customerAddress: input.customerAddress.trim(),
    shipToName: nullableText(input.shipToName),
    shipToAddress: nullableText(input.shipToAddress),
    items,
    currency: input.currency.trim().toUpperCase(),
    subtotal: numericString(subtotal)!,
    taxAmount: numericString(taxAmount)!,
    shippingAmount: numericString(shippingAmount)!,
    total: numericString(roundMoney(subtotal + taxAmount + shippingAmount))!,
    notes: input.notes.trim(),
    terms: input.terms.trim(),
    carrier: input.carrier.trim(),
    service: input.service.trim(),
    trackingNumber: input.trackingNumber.trim(),
    shippingDate: input.shippingDate || null,
    packageWeight: numericString(input.packageWeight, 3),
    packageLength: numericString(input.packageLength),
    packageWidth: numericString(input.packageWidth),
    packageHeight: numericString(input.packageHeight),
    paymentMethod: input.paymentMethod.trim(),
    includeStamp: input.includeStamp,
    companySnapshot: settingsSnapshot,
  };
}

const allowedTransitions: Record<DocumentType, Record<DocumentStatus, DocumentStatus[]>> = {
  invoice: {
    draft: ["issued", "void"],
    issued: ["paid", "void"],
    paid: ["void"],
    shipped: [],
    delivered: [],
    void: [],
  },
  receipt: {
    draft: ["issued", "paid", "void"],
    issued: ["paid", "void"],
    paid: ["void"],
    shipped: [],
    delivered: [],
    void: [],
  },
  shipping: {
    draft: ["issued", "shipped", "void"],
    issued: ["shipped", "void"],
    paid: [],
    shipped: ["delivered", "void"],
    delivered: ["void"],
    void: [],
  },
};

router.post(
  "/uploads/document-branding-image",
  requireAdmin,
  brandingUpload,
  async (req, res): Promise<void> => {
    const body = Buffer.isBuffer(req.body) ? req.body : undefined;
    if (!body || body.length === 0) {
      res.status(400).json({ error: "Choose a JPG, PNG, WEBP, or GIF image." });
      return;
    }
    try {
      const imagePath = await uploadImage(body, "documents/branding");
      res.status(201).json({ imagePath });
    } catch (error) {
      req.log.error({ err: error }, "Business document branding upload failed");
      res.status(400).json({ error: error instanceof Error ? error.message : "Image upload failed." });
    }
  },
);

router.get("/admin/document-settings", requireAdmin, async (_req, res): Promise<void> => {
  const settings = await readSettings();
  res.json(GetBusinessDocumentSettingsResponse.parse(settings));
});

router.put("/admin/document-settings", requireAdmin, async (req, res): Promise<void> => {
  const parsed = UpdateBusinessDocumentSettingsBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  let settings: BusinessDocumentSettingsSnapshot;
  try {
    settings = normalizeSettings(parsed.data);
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : "Invalid document settings." });
    return;
  }

  await db
    .insert(companySettingsTable)
    .values({ key: SETTINGS_KEY, value: JSON.stringify(settings) })
    .onConflictDoUpdate({
      target: companySettingsTable.key,
      set: { value: JSON.stringify(settings), updatedAt: sql`now()` },
    });

  res.json(UpdateBusinessDocumentSettingsResponse.parse(settings));
});

router.get("/admin/business-documents", requireAdmin, async (_req, res): Promise<void> => {
  const rows = await db
    .select()
    .from(businessDocumentsTable)
    .orderBy(desc(businessDocumentsTable.createdAt))
    .limit(500);
  res.json(ListBusinessDocumentsResponse.parse(rows.map(toResponse)));
});

router.post("/admin/business-documents", requireAdmin, async (req, res): Promise<void> => {
  const parsed = CreateBusinessDocumentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const validationError = validateDocumentInput(parsed.data);
  if (validationError) {
    res.status(400).json({ error: validationError });
    return;
  }

  const [document] = await db.transaction(async (transaction) => {
    const [setting] = await transaction
      .select({ value: companySettingsTable.value })
      .from(companySettingsTable)
      .where(eq(companySettingsTable.key, SETTINGS_KEY));
    const settings = parseSettings(setting?.value);
    const number = await allocateDocumentNumber(
      transaction,
      parsed.data.documentType,
      parsed.data.issueDate,
      settings,
    );
    return transaction
      .insert(businessDocumentsTable)
      .values(prepareDocumentValues(parsed.data, settings, number))
      .returning();
  });

  res.status(201).json(CreateBusinessDocumentResponse.parse(toResponse(document)));
});

router.patch("/admin/business-documents/:id", requireAdmin, async (req, res): Promise<void> => {
  const params = UpdateBusinessDocumentParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateBusinessDocumentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const validationError = validateDocumentInput(parsed.data);
  if (validationError) {
    res.status(400).json({ error: validationError });
    return;
  }

  const [existing] = await db
    .select()
    .from(businessDocumentsTable)
    .where(eq(businessDocumentsTable.id, params.data.id));
  if (!existing) {
    res.status(404).json({ error: "Business document not found." });
    return;
  }
  if (existing.status !== "draft") {
    res.status(409).json({ error: "Only draft documents can be edited." });
    return;
  }
  if (parsed.data.documentType !== existing.documentType) {
    res.status(409).json({ error: "A draft's document type cannot be changed after it is created." });
    return;
  }

  let updated: BusinessDocumentRecord;
  try {
    updated = await db.transaction(async (transaction) => {
      const number = parsed.data.issueDate.slice(0, 4) !== existing.issueDate.slice(0, 4)
        ? await allocateDocumentNumber(transaction, existing.documentType as DocumentType, parsed.data.issueDate, existing.companySnapshot)
        : existing.number;
      const values = prepareDocumentValues(parsed.data, existing.companySnapshot, number);
      const [row] = await transaction
        .update(businessDocumentsTable)
        .set({ ...values, status: "draft", updatedAt: new Date() })
        .where(and(eq(businessDocumentsTable.id, params.data.id), eq(businessDocumentsTable.status, "draft")))
        .returning();
      if (!row) throw new DraftConflictError("Draft changed while editing.");
      return row;
    });
  } catch (error) {
    if (error instanceof DraftConflictError) {
      res.status(409).json({ error: "This document has changed. Reload it before editing." });
      return;
    }
    throw error;
  }
  res.json(UpdateBusinessDocumentResponse.parse(toResponse(updated)));
});

router.patch("/admin/business-documents/:id/status", requireAdmin, async (req, res): Promise<void> => {
  const params = UpdateBusinessDocumentStatusParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateBusinessDocumentStatusBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [existing] = await db
    .select()
    .from(businessDocumentsTable)
    .where(eq(businessDocumentsTable.id, params.data.id));
  if (!existing) {
    res.status(404).json({ error: "Business document not found." });
    return;
  }

  const currentStatus = existing.status as DocumentStatus;
  const documentType = existing.documentType as DocumentType;
  if (parsed.data.status !== currentStatus
    && !allowedTransitions[documentType]?.[currentStatus]?.includes(parsed.data.status)) {
    res.status(400).json({ error: `Cannot change ${currentStatus} ${documentType} to ${parsed.data.status}.` });
    return;
  }

  const [updated] = await db
    .update(businessDocumentsTable)
    .set({ status: parsed.data.status, updatedAt: new Date() })
    .where(and(
      eq(businessDocumentsTable.id, params.data.id),
      eq(businessDocumentsTable.status, existing.status),
    ))
    .returning();
  if (!updated) {
    res.status(409).json({ error: "This document has changed. Reload it before updating its status." });
    return;
  }
  res.json(UpdateBusinessDocumentStatusResponse.parse(toResponse(updated)));
});

router.delete("/admin/business-documents/:id", requireAdmin, async (req, res): Promise<void> => {
  const params = DeleteBusinessDocumentParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [document] = await db
    .select({ id: businessDocumentsTable.id, status: businessDocumentsTable.status })
    .from(businessDocumentsTable)
    .where(eq(businessDocumentsTable.id, params.data.id));
  if (!document) {
    res.status(404).json({ error: "Business document not found." });
    return;
  }
  if (document.status !== "draft") {
    res.status(409).json({ error: "Only draft documents can be deleted." });
    return;
  }
  const [deleted] = await db
    .delete(businessDocumentsTable)
    .where(and(eq(businessDocumentsTable.id, params.data.id), eq(businessDocumentsTable.status, "draft")))
    .returning({ id: businessDocumentsTable.id });
  if (!deleted) {
    res.status(409).json({ error: "This document has changed. Reload it before deleting." });
    return;
  }
  res.sendStatus(204);
});

export default router;
