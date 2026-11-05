import { asc, eq } from "drizzle-orm";
import express, { Router, type IRouter } from "express";
import { db, aboutPagesTable, aboutSegmentsTable, insertAboutPageSchema, insertAboutSegmentSchema } from "@workspace/db";
import {
  AboutPage,
  CreateAboutSegmentBody,
  CreateAboutSegmentResponse,
  GetAboutResponse,
  UpdateAboutBody,
  UpdateAboutResponse,
  UpdateAboutSegmentBody,
  UpdateAboutSegmentResponse,
  DeleteAboutSegmentParams,
} from "@workspace/api-zod";
import { requireAdmin } from "./admin-auth";
import { uploadImage } from "../lib/supabase-storage";

const router: IRouter = Router();
const aboutImageUpload = express.raw({ type: "*/*", limit: "5mb" });

const defaultPage = {
  eyebrow: "About CompuTrade",
  title: "Technology with perspective.",
  intro: "We help ambitious organisations make technology dependable — with specialist knowledge, reliable sourcing and a practical understanding of how work really happens.",
  imagePath: null,
};

const defaultSegments = [
  { eyebrow: "Our approach", title: "Clarity before complexity.", body: "We take the time to understand the environment before recommending a direction. The best technology decision is the one that fits the people, priorities and pace of the organisation behind it.", imagePath: null, imagePosition: "right", sortOrder: 0 },
  { eyebrow: "How we work", title: "A partner who sees the whole picture.", body: "From infrastructure and cloud to workplace devices and security, we connect the detail to the outcome. That means fewer handoffs, clearer decisions and a calmer path forward.", imagePath: null, imagePosition: "left", sortOrder: 1 },
  { eyebrow: "Our promise", title: "Useful advice, accountable delivery.", body: "We are Danish-led, globally connected and deliberately human. Every engagement is shaped around a clear next step, honest communication and technology that earns its place.", imagePath: null, imagePosition: "right", sortOrder: 2 },
] as const;

function formatZodError(error: { issues: Array<{ path: (string | number)[]; message: string }> }) {
  return error.issues
    .map((issue) => {
      const field = issue.path.length > 0 ? issue.path.join(".") : "request";
      return `${field}: ${issue.message}`;
    })
    .join("; ");
}

async function getAboutData() {
  let [page] = await db.select().from(aboutPagesTable).orderBy(aboutPagesTable.id).limit(1);
  if (!page) {
    [page] = await db.insert(aboutPagesTable).values(defaultPage).returning();
    await db.insert(aboutSegmentsTable).values([...defaultSegments]);
  }
  const segments = await db.select().from(aboutSegmentsTable).orderBy(asc(aboutSegmentsTable.sortOrder), asc(aboutSegmentsTable.id));
  return GetAboutResponse.parse({ ...page, segments });
}

router.get("/about", async (_req, res): Promise<void> => {
  res.json(await getAboutData());
});

router.put("/about", requireAdmin, async (req, res): Promise<void> => {
  const parsed = UpdateAboutBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: formatZodError(parsed.error) });
    return;
  }
  const [existing] = await db.select().from(aboutPagesTable).orderBy(aboutPagesTable.id).limit(1);
  const [page] = existing
    ? await db.update(aboutPagesTable).set({ ...insertAboutPageSchema.parse(parsed.data), updatedAt: new Date() }).where(eq(aboutPagesTable.id, existing.id)).returning()
    : await db.insert(aboutPagesTable).values(insertAboutPageSchema.parse(parsed.data)).returning();
  const segments = await db.select().from(aboutSegmentsTable).orderBy(asc(aboutSegmentsTable.sortOrder), asc(aboutSegmentsTable.id));
  res.json(UpdateAboutResponse.parse({ ...page, segments }));
});

router.post("/about/segments", requireAdmin, async (req, res): Promise<void> => {
  const parsed = CreateAboutSegmentBody.safeParse(req.body);
  if (!parsed.success) {
    req.log.warn(
      {
        body: req.body,
        validationError: parsed.error.issues.map((issue) => ({
          path: issue.path,
          message: issue.message,
        })),
      },
      "Create About segment validation failed",
    );
    res.status(400).json({
      error: "Validation failed",
      details: {
        field: parsed.error.issues[0]?.path?.join(".") ?? "request",
        message: parsed.error.issues[0]?.message ?? "Invalid About segment payload",
      },
    });
    return;
  }
  const [segment] = await db.insert(aboutSegmentsTable).values(insertAboutSegmentSchema.parse(parsed.data)).returning();
  res.status(201).json(CreateAboutSegmentResponse.parse(segment));
});

router.patch("/about/segments/:id", requireAdmin, async (req, res): Promise<void> => {
  const params = DeleteAboutSegmentParams.safeParse(req.params);
  const parsed = UpdateAboutSegmentBody.safeParse(req.body);
  if (!params.success) {
    res.status(400).json({ error: formatZodError(params.error) });
    return;
  }
  if (!parsed.success) {
    res.status(400).json({ error: formatZodError(parsed.error) });
    return;
  }
  const [segment] = await db.update(aboutSegmentsTable).set(insertAboutSegmentSchema.parse(parsed.data)).where(eq(aboutSegmentsTable.id, params.data.id)).returning();
  if (!segment) {
    res.status(404).json({ error: "About segment not found" });
    return;
  }
  res.json(UpdateAboutSegmentResponse.parse(segment));
});

router.delete("/about/segments/:id", requireAdmin, async (req, res): Promise<void> => {
  const parsed = DeleteAboutSegmentParams.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ error: formatZodError(parsed.error) });
    return;
  }
  const [segment] = await db.delete(aboutSegmentsTable).where(eq(aboutSegmentsTable.id, parsed.data.id)).returning();
  if (!segment) {
    res.status(404).json({ error: "About segment not found" });
    return;
  }
  res.sendStatus(204);
});

router.post("/uploads/about-image", requireAdmin, aboutImageUpload, async (req, res): Promise<void> => {
  const body = Buffer.isBuffer(req.body) ? req.body : undefined;
  if (!body || body.length === 0) {
    res.status(400).json({ error: "Choose a JPG, PNG, WEBP, or GIF image." });
    return;
  }
  try {
    res.status(201).json({ imagePath: await uploadImage(body, "about") });
  } catch (error) {
    req.log.error({ err: error }, "About image upload failed");
    res.status(502).json({ error: error instanceof Error ? error.message : "Image upload failed" });
  }
});

export default router;