import { and, eq } from "drizzle-orm";
import express, { Router, type IRouter, type Request, type Response } from "express";
import { db, pool, companyDocumentsTable, insertCompanyDocumentSchema } from "@workspace/db";
import crypto from "crypto";
import { requireAdmin } from "./admin-auth";
import { deleteObject, downloadPrivateFile, generateSignedUrl, uploadImage, uploadPrivateFile } from "../lib/supabase-storage";

const router: IRouter = Router();
const documentUpload = express.raw({ type: "*/*", limit: "25mb" });

const MAX_DOCUMENT_SIZE = 20 * 1024 * 1024;
const ALLOWED_DOCUMENT_TYPES = new Set(["application/pdf"]);

function isPdf(buffer: Buffer | undefined): boolean {
  return Boolean(buffer && buffer.length > 4 && buffer.subarray(0, 4).equals(Buffer.from("%PDF")));
}

function formatValidationError(message: string) {
  return { error: message };
}

function parseInteger(value: unknown, fallback: number) {
  if (typeof value === "number" && Number.isInteger(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    if (Number.isInteger(parsed)) return parsed;
  }
  return fallback;
}

function normalizePreviewPath(value: unknown): string {
  if (typeof value !== "string") {
    return "";
  }

  const trimmed = value.trim();
  if (!trimmed || trimmed.toLowerCase() === "null") {
    return "";
  }

  return trimmed;
}

router.get("/documents", async (_req, res): Promise<void> => {
  const documents = await db
    .select()
    .from(companyDocumentsTable)
    .where(eq(companyDocumentsTable.isActive, true))
    .orderBy(companyDocumentsTable.displayOrder, companyDocumentsTable.createdAt);

  res.json(documents.map((document) => ({
    id: document.id,
    title: document.title,
    description: document.description,
    category: document.category,
    previewPath: normalizePreviewPath(document.previewPath),
    displayOrder: document.displayOrder,
    isActive: document.isActive,
  })));
});

router.get("/documents/:id/access", async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  if (Number.isNaN(id) || id <= 0) {
    res.status(400).json(formatValidationError("Invalid document ID."));
    return;
  }

  const [document] = await db.select().from(companyDocumentsTable).where(and(eq(companyDocumentsTable.id, id), eq(companyDocumentsTable.isActive, true)));
  if (!document) {
    res.status(404).json(formatValidationError("Document not found."));
    return;
  }

  const downloadMode = req.query.download === "1" || req.query.dl === "1" || req.headers.accept?.includes("application/pdf");
  if (downloadMode) {
    try {
      const file = await downloadPrivateFile(document.storagePath);
      res.setHeader("Content-Type", document.mimeType || file.contentType);
      res.setHeader("Content-Disposition", "inline; filename=protected-document.pdf");
      res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
      res.send(file.data);
    } catch (error) {
      req.log.error({ err: error, documentId: id }, "Failed to proxy private document");
      res.status(502).json(formatValidationError("Unable to stream this document at the moment."));
    }
    return;
  }

  try {
    const signedUrl = `/api/documents/${id}/access?download=1`;
    res.json({ signedUrl, mimeType: document.mimeType });
  } catch (error) {
    req.log.error({ err: error, documentId: id }, "Failed to generate preview access path");
    res.status(502).json(formatValidationError("Unable to generate a preview link for this document."));
  }
});

router.get("/admin/documents", requireAdmin, async (_req, res): Promise<void> => {
  const documents = await db
    .select()
    .from(companyDocumentsTable)
    .orderBy(companyDocumentsTable.displayOrder, companyDocumentsTable.createdAt);
  res.json(documents.map((document) => ({
    ...document,
    previewPath: normalizePreviewPath(document.previewPath),
  })));
});

router.get("/admin/documents/:id/access", requireAdmin, async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  if (Number.isNaN(id) || id <= 0) {
    res.status(400).json(formatValidationError("Invalid document ID."));
    return;
  }

  const [document] = await db.select().from(companyDocumentsTable).where(eq(companyDocumentsTable.id, id));
  if (!document) {
    res.status(404).json(formatValidationError("Document not found."));
    return;
  }

  try {
    const signedUrl = await generateSignedUrl(document.storagePath, 120);
    res.json({ signedUrl, mimeType: document.mimeType });
  } catch (error) {
    req.log.error({ err: error, documentId: id }, "Failed to generate signed document URL");
    res.status(502).json(formatValidationError("Unable to generate a preview link for this document."));
  }
});

router.post("/admin/documents/upload", requireAdmin, documentUpload, async (req, res): Promise<void> => {
  const body = Buffer.isBuffer(req.body) ? req.body : undefined;
  if (!body || body.length === 0) {
    res.status(400).json(formatValidationError("Choose a PDF file to upload."));
    return;
  }

  if (body.length > MAX_DOCUMENT_SIZE) {
    res.status(400).json(formatValidationError("Choose a PDF smaller than 20 MB."));
    return;
  }

  if (!isPdf(body)) {
    res.status(400).json(formatValidationError("Choose a valid PDF document."));
    return;
  }

  try {
    const storagePath = await uploadPrivateFile(body, "documents", "application/pdf");
    const fileName = typeof req.headers["x-file-name"] === "string" ? req.headers["x-file-name"] : `document-${Date.now()}.pdf`;

    // Track the uploaded file so we can clean it up if DB insert fails later.
    const storageToken = crypto.randomUUID();
    try {
      await pool.query('INSERT INTO uploaded_files_temp(token, path, is_private, used, created_at) VALUES($1,$2,$3,false,now())', [storageToken, storagePath, true]);
    } catch (err) {
      req.log.warn({ err }, 'Failed to record uploaded file token');
    }

    res.status(201).json({ storagePath, fileName, mimeType: "application/pdf", fileSize: body.length, storageToken });
  } catch (error) {
    req.log.error({ err: error }, "Document upload failed");
    res.status(502).json({ error: error instanceof Error ? error.message : "Document upload failed" });
  }
});

router.post("/admin/documents/upload-preview", requireAdmin, documentUpload, async (req, res): Promise<void> => {
  const body = Buffer.isBuffer(req.body) ? req.body : undefined;
  if (!body || body.length === 0) {
    res.status(400).json(formatValidationError("Choose a preview image to upload."));
    return;
  }

  try {
    const previewPath = await uploadImage(body, "documents/previews");

    const previewToken = crypto.randomUUID();
    try {
      await pool.query('INSERT INTO uploaded_files_temp(token, path, is_private, used, created_at) VALUES($1,$2,$3,false,now())', [previewToken, previewPath, false]);
    } catch (err) {
      req.log.warn({ err }, 'Failed to record uploaded preview token');
    }

    res.status(201).json({ previewPath, previewToken });
  } catch (error) {
    req.log.error({ err: error }, "Document preview upload failed");
    res.status(502).json({ error: error instanceof Error ? error.message : "Document preview upload failed" });
  }
});

router.post("/admin/documents", requireAdmin, async (req, res): Promise<void> => {
  const { title, description, category, storagePath, storageToken, previewPath, previewToken, fileName, mimeType, fileSize, displayOrder, isActive } = req.body ?? {};
  if (typeof title !== "string" || title.trim() === "") {
    res.status(400).json(formatValidationError("Title is required."));
    return;
  }
  if (typeof category !== "string" || category.trim() === "") {
    res.status(400).json(formatValidationError("Category is required."));
    return;
  }
  if (typeof storagePath !== "string" || storagePath.trim() === "") {
    res.status(400).json(formatValidationError("Storage path is required."));
    return;
  }
  const normalizedPreviewPath = normalizePreviewPath(previewPath);
  if (!normalizedPreviewPath) {
    res.status(400).json(formatValidationError("Preview path is required."));
    return;
  }
  if (typeof fileName !== "string" || fileName.trim() === "") {
    res.status(400).json(formatValidationError("File name is required."));
    return;
  }
  if (typeof mimeType !== "string" || mimeType.trim() === "") {
    res.status(400).json(formatValidationError("Mime type is required."));
    return;
  }
  if (typeof fileSize !== "number" || fileSize <= 0) {
    res.status(400).json(formatValidationError("File size is required."));
    return;
  }

  const documentData = {
    title: title.trim(),
    description: typeof description === "string" ? description.trim() : null,
    category: category.trim(),
    storagePath: storagePath.trim(),
    fileName: fileName.trim(),
    mimeType: mimeType.trim(),
    fileSize: fileSize,
    previewPath: normalizedPreviewPath,
    displayOrder: parseInteger(displayOrder, 0),
    isActive: Boolean(isActive),
    createdBy: "admin",
    updatedBy: "admin",
  };

  try {
    const [document] = await db.insert(companyDocumentsTable).values(insertCompanyDocumentSchema.parse(documentData)).returning();

    // Mark uploaded temp files as used so cleanup won't remove them
    try {
      if (storageToken) await pool.query('UPDATE uploaded_files_temp SET used=true WHERE token=$1', [storageToken]);
      if (previewToken) await pool.query('UPDATE uploaded_files_temp SET used=true WHERE token=$1', [previewToken]);
    } catch (markErr) {
      req.log.warn({ err: markErr }, 'Failed to mark uploaded_files_temp as used');
    }

    res.status(201).json(document);
  } catch (err) {
    req.log.error({ err }, 'DB insert failed, attempting cleanup of uploaded files');
    // Attempt to clean up only the files we recorded as part of this request.
    try {
      if (storageToken) {
        const { rows } = await pool.query('SELECT path, is_private FROM uploaded_files_temp WHERE token=$1', [storageToken]);
        if (rows && rows[0]) {
          try { await deleteObject(rows[0].path, Boolean(rows[0].is_private)); } catch (delErr) { req.log.warn({ err: delErr }, 'Failed to delete uploaded pdf after failed insert'); }
          await pool.query('DELETE FROM uploaded_files_temp WHERE token=$1', [storageToken]);
        }
      }
      if (previewToken) {
        const { rows } = await pool.query('SELECT path, is_private FROM uploaded_files_temp WHERE token=$1', [previewToken]);
        if (rows && rows[0]) {
          try { await deleteObject(rows[0].path, Boolean(rows[0].is_private)); } catch (delErr) { req.log.warn({ err: delErr }, 'Failed to delete uploaded preview after failed insert'); }
          await pool.query('DELETE FROM uploaded_files_temp WHERE token=$1', [previewToken]);
        }
      }
    } catch (cleanupErr) {
      req.log.warn({ err: cleanupErr }, 'Cleanup attempt failed');
    }

    throw err;
  }
});

router.post('/admin/documents/cleanup', requireAdmin, async (req, res) => {
  const { storageToken, previewToken } = req.body ?? {};
  try {
    if (storageToken) {
      const { rows } = await pool.query('SELECT path, is_private FROM uploaded_files_temp WHERE token=$1', [storageToken]);
      if (rows && rows[0]) {
        try { await deleteObject(rows[0].path, Boolean(rows[0].is_private)); } catch (err) { req.log.warn({ err }, 'Cleanup delete failed'); }
        await pool.query('DELETE FROM uploaded_files_temp WHERE token=$1', [storageToken]);
      }
    }
    if (previewToken) {
      const { rows } = await pool.query('SELECT path, is_private FROM uploaded_files_temp WHERE token=$1', [previewToken]);
      if (rows && rows[0]) {
        try { await deleteObject(rows[0].path, Boolean(rows[0].is_private)); } catch (err) { req.log.warn({ err }, 'Cleanup delete failed'); }
        await pool.query('DELETE FROM uploaded_files_temp WHERE token=$1', [previewToken]);
      }
    }
    res.sendStatus(204);
  } catch (err) {
    req.log.error({ err }, 'Cleanup endpoint failed');
    res.status(500).json({ error: 'Cleanup failed' });
  }
});

router.patch("/admin/documents/:id", requireAdmin, async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  if (Number.isNaN(id) || id <= 0) {
    res.status(400).json(formatValidationError("Invalid document ID."));
    return;
  }

  const { title, description, category, previewPath, displayOrder, isActive } = req.body ?? {};
  const updateData: Record<string, unknown> = { updatedAt: new Date(), updatedBy: "admin" };
  if (typeof title === "string") updateData.title = title.trim();
  if (typeof description === "string") updateData.description = description.trim();
  if (typeof category === "string") updateData.category = category.trim();
  if (typeof previewPath === "string") updateData.previewPath = normalizePreviewPath(previewPath);
  if (typeof displayOrder !== "undefined") updateData.displayOrder = parseInteger(displayOrder, 0);
  if (typeof isActive !== "undefined") updateData.isActive = Boolean(isActive);

  const [document] = await db.update(companyDocumentsTable).set(updateData).where(eq(companyDocumentsTable.id, id)).returning();
  if (!document) {
    res.status(404).json(formatValidationError("Document not found."));
    return;
  }

  res.json(document);
});

router.post("/admin/documents/:id/replace", requireAdmin, documentUpload, async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  if (Number.isNaN(id) || id <= 0) {
    res.status(400).json(formatValidationError("Invalid document ID."));
    return;
  }

  const body = Buffer.isBuffer(req.body) ? req.body : undefined;
  if (!body || body.length === 0) {
    res.status(400).json(formatValidationError("Choose a PDF file to upload."));
    return;
  }

  if (body.length > MAX_DOCUMENT_SIZE) {
    res.status(400).json(formatValidationError("Choose a PDF smaller than 20 MB."));
    return;
  }

  if (!isPdf(body)) {
    res.status(400).json(formatValidationError("Choose a valid PDF document."));
    return;
  }

  const [existingDocument] = await db.select().from(companyDocumentsTable).where(eq(companyDocumentsTable.id, id));
  if (!existingDocument) {
    res.status(404).json(formatValidationError("Document not found."));
    return;
  }

  const newStoragePath = await uploadPrivateFile(body, "documents", "application/pdf");
  const newStorageToken = crypto.randomUUID();
  try {
    await pool.query('INSERT INTO uploaded_files_temp(token, path, is_private, used, created_at) VALUES($1,$2,$3,false,now())', [newStorageToken, newStoragePath, true]);
  } catch (err) {
    req.log.warn({ err }, 'Failed to record uploaded file token for replacement');
  }

  try {
    const [document] = await db
      .update(companyDocumentsTable)
      .set({
        storagePath: newStoragePath,
        fileName: typeof req.headers["x-file-name"] === "string" ? req.headers["x-file-name"] : existingDocument.fileName,
        mimeType: "application/pdf",
        fileSize: body.length,
        updatedAt: new Date(),
        updatedBy: "admin",
      })
      .where(eq(companyDocumentsTable.id, id))
      .returning();

    // mark new file token as used
    try { await pool.query('UPDATE uploaded_files_temp SET used=true WHERE token=$1', [newStorageToken]); } catch (err) { req.log.warn({ err }, 'Failed to mark replacement token used'); }

    try {
      await deleteObject(existingDocument.storagePath, true);
    } catch (error) {
      req.log.warn({ err: error, path: existingDocument.storagePath }, "Failed to delete old document after replacement");
    }

    res.json(document);
  } catch (err) {
    // cleanup new uploaded file
    try {
      const { rows } = await pool.query('SELECT path, is_private FROM uploaded_files_temp WHERE token=$1', [newStorageToken]);
      if (rows && rows[0]) {
        try { await deleteObject(rows[0].path, Boolean(rows[0].is_private)); } catch (delErr) { req.log.warn({ err: delErr }, 'Failed to delete uploaded replacement after failed update'); }
        await pool.query('DELETE FROM uploaded_files_temp WHERE token=$1', [newStorageToken]);
      }
    } catch (cleanupErr) { req.log.warn({ err: cleanupErr }, 'Cleanup failed for replacement'); }

    throw err;
  }
});

router.delete("/admin/documents/:id", requireAdmin, async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  if (Number.isNaN(id) || id <= 0) {
    res.status(400).json(formatValidationError("Invalid document ID."));
    return;
  }

  const [document] = await db.delete(companyDocumentsTable).where(eq(companyDocumentsTable.id, id)).returning();
  if (!document) {
    res.status(404).json(formatValidationError("Document not found."));
    return;
  }

  try {
    await deleteObject(document.storagePath, true);
  } catch (error) {
    req.log.warn({ err: error, path: document.storagePath }, "Failed to delete private document after remove");
  }

  try {
    const previewUrl = new URL(document.previewPath);
    const bucketPath = previewUrl.pathname.split("/").slice(4).join("/");
    await deleteObject(bucketPath, false);
  } catch (error) {
    req.log.warn({ err: error, previewPath: document.previewPath }, "Failed to delete preview after document remove");
  }

  res.sendStatus(204);
});

export default router;
