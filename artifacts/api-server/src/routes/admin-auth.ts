import { randomBytes, timingSafeEqual } from "node:crypto";
import { Router, type IRouter, type Request, type Response } from "express";

const router: IRouter = Router();
const SESSION_COOKIE = "computrade_admin_session";
const SESSION_TTL_MS = 8 * 60 * 60 * 1000;
const sessions = new Map<string, number>();

function getCookie(req: Request, name: string) {
  const cookies = req.headers.cookie?.split(";") ?? [];
  const entry = cookies.find((cookie) => cookie.trim().startsWith(`${name}=`));
  return entry ? decodeURIComponent(entry.trim().slice(name.length + 1)) : undefined;
}

function setSessionCookie(res: Response, token: string) {
  res.setHeader(
    "Set-Cookie",
    `${SESSION_COOKIE}=${encodeURIComponent(token)}; Max-Age=${SESSION_TTL_MS / 1000}; Path=/; HttpOnly; SameSite=Lax${process.env.NODE_ENV === "production" ? "; Secure" : ""}`,
  );
}

function clearSessionCookie(res: Response) {
  res.setHeader(
    "Set-Cookie",
    `${SESSION_COOKIE}=; Max-Age=0; Path=/; HttpOnly; SameSite=Lax${process.env.NODE_ENV === "production" ? "; Secure" : ""}`,
  );
}

function isAuthenticated(req: Request) {
  const token = getCookie(req, SESSION_COOKIE);
  if (!token) return false;
  const expiresAt = sessions.get(token);
  if (!expiresAt) return false;
  if (expiresAt <= Date.now()) {
    sessions.delete(token);
    return false;
  }
  return true;
}

function passwordsMatch(input: string, configured: string) {
  const inputBuffer = Buffer.from(input);
  const configuredBuffer = Buffer.from(configured);
  return inputBuffer.length === configuredBuffer.length && timingSafeEqual(inputBuffer, configuredBuffer);
}

export function requireAdmin(req: Request, res: Response, next: () => void) {
  if (!isAuthenticated(req)) {
    res.status(401).json({ error: "Admin authentication required" });
    return;
  }
  next();
}

router.get("/admin/session", (req, res): void => {
  res.json({ authenticated: isAuthenticated(req) });
});

router.post("/admin/login", (req, res): void => {
  const configuredPassword = process.env.ADMIN_PASSWORD;
  const password = typeof req.body?.password === "string" ? req.body.password : "";

  if (!configuredPassword) {
    req.log.error("ADMIN_PASSWORD is not configured");
    res.status(503).json({ error: "Admin authentication is not configured" });
    return;
  }

  if (!password || !passwordsMatch(password, configuredPassword)) {
    req.log.warn("Rejected admin login attempt");
    res.status(401).json({ error: "Invalid password" });
    return;
  }

  const token = randomBytes(32).toString("hex");
  sessions.set(token, Date.now() + SESSION_TTL_MS);
  setSessionCookie(res, token);
  res.json({ authenticated: true });
});

router.post("/admin/logout", (req, res): void => {
  const token = getCookie(req, SESSION_COOKIE);
  if (token) sessions.delete(token);
  clearSessionCookie(res);
  res.json({ authenticated: false });
});

export default router;