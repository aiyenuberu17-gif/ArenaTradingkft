import { logger } from "./logger";

export const DEFAULT_QUOTE_REQUEST_RECIPIENT = "sales@computradehq.eu";

export function normalizeQuoteRequestRecipientEmail(value: string | null | undefined): string {
  const normalized = value?.trim();
  return normalized && normalized.length > 0 ? normalized : DEFAULT_QUOTE_REQUEST_RECIPIENT;
}

function buildQuoteRequestEmailBody(request: {
  id: number;
  customerName: string;
  customerEmail: string;
  customerPhone?: string | null;
  companyName?: string | null;
  productService?: string | null;
  quantity: number;
  message: string;
  submittedAt: Date | string | null;
}) {
  const submittedAt = request.submittedAt instanceof Date ? request.submittedAt.toISOString() : request.submittedAt ?? "Unknown";
  const lines = [
    "New quote request received.",
    "",
    `Request ID: ${request.id}`,
    `Customer name: ${request.customerName}`,
    `Customer email: ${request.customerEmail}`,
    `Customer phone: ${request.customerPhone ?? "Not provided"}`,
    `Company: ${request.companyName ?? "Not provided"}`,
    `Product/service: ${request.productService ?? "Not provided"}`,
    `Quantity: ${request.quantity}`,
    `Submission date/time: ${submittedAt}`,
    "",
    "Message/details:",
    request.message,
    "",
    "Reply to the customer directly using the sender address above.",
  ];

  return lines.join("\n");
}

export async function sendQuoteRequestNotification(input: {
  recipientEmail: string;
  request: {
    id: number;
    customerName: string;
    customerEmail: string;
    customerPhone?: string | null;
    companyName?: string | null;
    productService?: string | null;
    quantity: number;
    message: string;
    submittedAt: Date | string | null;
  };
}) {
  const { recipientEmail, request } = input;

  if (!recipientEmail) {
    throw new Error("No quote request recipient email configured.");
  }

  const accessKey = process.env.WEB3FORMS_ACCESS_KEY?.trim();
  if (!accessKey) {
    logger.warn({ requestId: request.id }, "Web3Forms access key is not configured; skipping email delivery");
    throw new Error("Email service is not configured");
  }

  const subject = `New Quote Request — ${request.productService ?? "General inquiry"}`;
  const body = buildQuoteRequestEmailBody(request);

  const response = await fetch("https://api.web3forms.com/submit", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      access_key: accessKey,
      subject,
      from_name: "CompuTrade Quote Requests",
      reply_to: request.customerEmail,
      name: request.customerName,
      email: request.customerEmail,
      message: body,
      cc: recipientEmail,
      customerName: request.customerName,
      customerEmail: request.customerEmail,
      customerPhone: request.customerPhone ?? "",
      companyName: request.companyName ?? "",
      productService: request.productService ?? "",
      quantity: String(request.quantity),
      submittedAt: request.submittedAt instanceof Date ? request.submittedAt.toISOString() : request.submittedAt ?? "Unknown",
    }),
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`Web3Forms request failed (${response.status}): ${details}`);
  }

  const payload = await response.json().catch(() => null);
  if (payload && typeof payload === "object" && "success" in payload && payload.success === false) {
    throw new Error("Web3Forms rejected the request");
  }

  return {
    success: true,
    subject,
    body,
    recipientEmail,
    replyTo: request.customerEmail,
  };
}
