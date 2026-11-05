import { randomUUID } from "node:crypto";

const DEFAULT_BUCKET = "computrade";
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const PRIVATE_DOCUMENT_BUCKET = "documents";

type SupportedImage = {
  extension: "jpg" | "png" | "gif" | "webp";
  contentType: string;
};

function getSupabaseConfig() {
  const url = process.env.SUPABASE_URL?.replace(/\/+$/, "");
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    throw new Error("Supabase Storage is not configured");
  }

  const configuredBucket = process.env.SUPABASE_STORAGE_BUCKET?.trim();
  return {
    url,
    serviceRoleKey,
    bucket: configuredBucket && configuredBucket !== "computrade-images" ? configuredBucket : DEFAULT_BUCKET,
  };
}

function detectImage(body: Buffer): SupportedImage | undefined {
  if (body.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]))) {
    return { extension: "jpg", contentType: "image/jpeg" };
  }
  if (body.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) {
    return { extension: "png", contentType: "image/png" };
  }
  if (body.subarray(0, 4).toString("ascii") === "GIF8") {
    return { extension: "gif", contentType: "image/gif" };
  }
  if (
    body.subarray(0, 4).toString("ascii") === "RIFF" &&
    body.subarray(8, 12).toString("ascii") === "WEBP"
  ) {
    return { extension: "webp", contentType: "image/webp" };
  }
  return undefined;
}

function isDuplicateBucketResponse(status: number, detail: string): boolean {
  if (status === 409) {
    return true;
  }

  if (status !== 400) {
    return false;
  }

  try {
    const parsed = JSON.parse(detail) as { statusCode?: number | string; code?: string; message?: string };
    return parsed.statusCode === 409 || parsed.code === "BucketAlreadyExists" || /BucketAlreadyExists|Duplicate/i.test(parsed.message ?? "");
  } catch {
    return /BucketAlreadyExists|Duplicate/i.test(detail);
  }
}

function isMissingBucketResponse(status: number, detail: string): boolean {
  if (status === 404) {
    return true;
  }

  if (status !== 400) {
    return false;
  }

  try {
    const parsed = JSON.parse(detail) as { statusCode?: number | string; code?: string; message?: string };
    return parsed.statusCode === 404 || parsed.code === "NoSuchBucket" || /NoSuchBucket|Bucket not found/i.test(parsed.message ?? "");
  } catch {
    return /NoSuchBucket|Bucket not found/i.test(detail);
  }
}

async function ensureBucket(
  url: string,
  serviceRoleKey: string,
  bucket: string,
  options?: { public?: boolean; allowedMimeTypes?: string[]; fileSizeLimit?: number },
): Promise<void> {
  const bucketUrl = `${url}/storage/v1/bucket/${encodeURIComponent(bucket)}`;
  const existingResponse = await fetch(bucketUrl, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${serviceRoleKey}`,
      apikey: serviceRoleKey,
    },
  });

  if (existingResponse.ok) {
    return;
  }

  const detail = await existingResponse.text();
  if (!isMissingBucketResponse(existingResponse.status, detail)) {
    if (isDuplicateBucketResponse(existingResponse.status, detail)) {
      return;
    }
    throw new Error(`Unable to inspect Supabase Storage bucket (${existingResponse.status}): ${detail}`);
  }

  const createResponse = await fetch(`${url}/storage/v1/bucket`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${serviceRoleKey}`,
      apikey: serviceRoleKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      id: bucket,
      name: bucket,
      public: options?.public ?? true,
      file_size_limit: options?.fileSizeLimit ?? MAX_FILE_SIZE,
      allowed_mime_types: options?.allowedMimeTypes ?? ["image/jpeg", "image/png", "image/gif", "image/webp"],
    }),
  });

  if (createResponse.ok) {
    return;
  }

  const createDetail = await createResponse.text();
  if (isDuplicateBucketResponse(createResponse.status, createDetail)) {
    return;
  }

  throw new Error(`Unable to create Supabase Storage bucket (${createResponse.status}): ${createDetail}`);
}

export async function uploadImage(
  body: Buffer,
  folder: "products" | "about" | "documents/previews",
): Promise<string> {
  if (body.length === 0 || body.length > MAX_FILE_SIZE) {
    throw new Error("Image must be between 1 byte and 5 MB");
  }

  const image = detectImage(body);
  if (!image) {
    throw new Error("Choose a JPG, PNG, WEBP, or GIF image.");
  }

  const { url, serviceRoleKey, bucket } = getSupabaseConfig();
  await ensureBucket(url, serviceRoleKey, bucket, {
    public: true,
    allowedMimeTypes: ["image/jpeg", "image/png", "image/gif", "image/webp"],
    fileSizeLimit: MAX_FILE_SIZE,
  });

  const objectPath = `${folder}/${randomUUID()}.${image.extension}`;
  const response = await fetch(
    `${url}/storage/v1/object/${encodeURIComponent(bucket)}/${objectPath}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${serviceRoleKey}`,
        apikey: serviceRoleKey,
        "Content-Type": image.contentType,
        "x-upsert": "true",
      },
      body: new Uint8Array(body),
    },
  );

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Unable to upload image to Supabase Storage (${response.status}): ${detail}`);
  }

  return `${url}/storage/v1/object/public/${encodeURIComponent(bucket)}/${objectPath}`;
}

export async function uploadPrivateFile(
  body: Buffer,
  folder: "documents",
  contentType: string,
): Promise<string> {
  if (body.length === 0 || body.length > 20 * 1024 * 1024) {
    throw new Error("Document must be between 1 byte and 20 MB");
  }

  const { url, serviceRoleKey } = getSupabaseConfig();
  const bucket = PRIVATE_DOCUMENT_BUCKET;
  await ensureBucket(url, serviceRoleKey, bucket, {
    public: false,
    allowedMimeTypes: [contentType],
    fileSizeLimit: 20 * 1024 * 1024,
  });

  const objectPath = `${folder}/${randomUUID()}`;
  const response = await fetch(
    `${url}/storage/v1/object/${encodeURIComponent(bucket)}/${objectPath}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${serviceRoleKey}`,
        apikey: serviceRoleKey,
        "Content-Type": contentType,
        "x-upsert": "true",
      },
      body: new Uint8Array(body),
    },
  );

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Unable to upload private file to Supabase Storage (${response.status}): ${detail}`);
  }

  return objectPath;
}

export async function generateSignedUrl(storagePath: string, expiresInSeconds: number): Promise<string> {
  if (!storagePath) {
    throw new Error("Storage path is required");
  }

  const { url, serviceRoleKey } = getSupabaseConfig();
  const bucket = PRIVATE_DOCUMENT_BUCKET;
  const response = await fetch(
    `${url}/storage/v1/object/sign/${encodeURIComponent(bucket)}/${encodeURIComponent(storagePath)}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${serviceRoleKey}`,
        apikey: serviceRoleKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ expiresIn: expiresInSeconds }),
    },
  );

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Unable to generate signed URL (${response.status}): ${detail}`);
  }

  const bodyText = await response.text();
  let data: Record<string, unknown>;
  try {
    data = JSON.parse(bodyText) as Record<string, unknown>;
  } catch (err) {
    throw new Error(`Unable to parse signed URL response: ${bodyText}`);
  }

  const signedUrl =
    (typeof data.signedUrl === "string" && data.signedUrl) ||
    (typeof data.signedURL === "string" && data.signedURL) ||
    (typeof data.signed_url === "string" && data.signed_url) ||
    "";

  if (!signedUrl) {
    throw new Error(`Signed URL not returned by Supabase storage response: ${bodyText}`);
  }

  return signedUrl;
}

export async function downloadPrivateFile(storagePath: string): Promise<{ data: Buffer; contentType: string }> {
  if (!storagePath) {
    throw new Error("Storage path is required");
  }

  const { url, serviceRoleKey } = getSupabaseConfig();
  const bucket = PRIVATE_DOCUMENT_BUCKET;
  const response = await fetch(
    `${url}/storage/v1/object/${encodeURIComponent(bucket)}/${encodeURIComponent(storagePath)}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${serviceRoleKey}`,
        apikey: serviceRoleKey,
      },
    },
  );

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Unable to download private file (${response.status}): ${detail}`);
  }

  const contentType = response.headers.get("content-type") ?? "application/pdf";
  const arrayBuffer = await response.arrayBuffer();
  return { data: Buffer.from(arrayBuffer), contentType };
}

export async function deleteObject(storagePath: string, isPrivate: boolean): Promise<void> {
  if (!storagePath) {
    return;
  }

  const { url, serviceRoleKey } = getSupabaseConfig();
  const bucket = PRIVATE_DOCUMENT_BUCKET;
  const response = await fetch(
    `${url}/storage/v1/object/${encodeURIComponent(bucket)}/${encodeURIComponent(storagePath)}`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${serviceRoleKey}`,
        apikey: serviceRoleKey,
      },
    },
  );

  if (!response.ok && response.status !== 404) {
    const detail = await response.text();
    throw new Error(`Unable to delete object from Supabase Storage (${response.status}): ${detail}`);
  }

  if (!isPrivate) {
    const publicBucket = getSupabaseConfig().bucket;
    const publicResponse = await fetch(
      `${url}/storage/v1/object/${encodeURIComponent(publicBucket)}/${encodeURIComponent(storagePath)}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${serviceRoleKey}`,
          apikey: serviceRoleKey,
        },
      },
    );

    if (!publicResponse.ok && publicResponse.status !== 404) {
      const detail = await publicResponse.text();
      throw new Error(`Unable to delete public object from Supabase Storage (${publicResponse.status}): ${detail}`);
    }
  }
}