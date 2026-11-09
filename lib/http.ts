import { NextResponse } from "next/server";
import { createHash } from "node:crypto";

export const MAX_BODY = 16 * 1024;

export class ApiError extends Error {
  status: number;
  code: string;
  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export function json(data: unknown, init?: ResponseInit): NextResponse {
  const res = NextResponse.json(data, init);
  res.headers.set("Cache-Control", "private, no-store");
  return res;
}

export function fail(status: number, code: string, message: string): NextResponse {
  return json({ error: { code, message } }, { status });
}

/** Wraps a handler so no stack trace or internal detail ever reaches the client. */
export function handler<T extends unknown[]>(
  fn: (req: Request, ...rest: T) => Promise<NextResponse>
) {
  return async (req: Request, ...rest: T): Promise<NextResponse> => {
    try {
      return await fn(req, ...rest);
    } catch (err) {
      if (err instanceof ApiError) {
        return fail(err.status, err.code, err.message);
      }
      console.error("[promptly] unhandled error:", err instanceof Error ? err.message : err);
      return fail(500, "internal_error", "Something went wrong.");
    }
  };
}

export async function parseJson(req: Request, maxBytes = MAX_BODY): Promise<unknown> {
  const type = req.headers.get("content-type") ?? "";
  if (!type.toLowerCase().includes("application/json")) {
    throw new ApiError(415, "unsupported_media_type", "Expected a JSON body.");
  }
  const length = Number(req.headers.get("content-length") ?? "0");
  if (Number.isFinite(length) && length > maxBytes) {
    throw new ApiError(413, "payload_too_large", "That request is too large.");
  }
  const text = await req.text();
  if (text.length > maxBytes) {
    throw new ApiError(413, "payload_too_large", "That request is too large.");
  }
  try {
    return JSON.parse(text);
  } catch {
    throw new ApiError(400, "invalid_json", "That request could not be read.");
  }
}

export function appOrigin(): string {
  return (process.env.APP_ORIGIN ?? "http://localhost:3111").replace(/\/$/, "");
}

/**
 * State-changing requests must come from our own origin and carry the CSRF
 * header that a cross-origin page cannot set without a preflight we never
 * approve.
 */
export function assertSameOrigin(req: Request): void {
  if (req.method === "GET" || req.method === "HEAD" || req.method === "OPTIONS") return;
  if (req.headers.get("x-promptly-csrf") !== "1") {
    throw new ApiError(403, "csrf_check_failed", "Request rejected.");
  }
  const origin = req.headers.get("origin");
  if (origin) {
    if (origin.replace(/\/$/, "") !== appOrigin()) {
      throw new ApiError(403, "bad_origin", "Request rejected.");
    }
    return;
  }
  const site = req.headers.get("sec-fetch-site");
  if (site && site !== "same-origin") {
    throw new ApiError(403, "bad_origin", "Request rejected.");
  }
}

/** Stable, non-reversible key for rate limiting and logs. */
export function clientKey(req: Request, salt = ""): string {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "local";
  return createHash("sha256").update(`${salt}:${ip}`).digest("hex").slice(0, 32);
}

export interface CookieSpec {
  name: string;
  value: string;
  maxAge?: number;
  httpOnly?: boolean;
  sameSite?: "Lax" | "Strict" | "None";
  path?: string;
}

export function serializeCookie(spec: CookieSpec): string {
  const parts = [`${spec.name}=${spec.value}`, `Path=${spec.path ?? "/"}`];
  if (spec.maxAge !== undefined) parts.push(`Max-Age=${spec.maxAge}`);
  if (spec.httpOnly !== false) parts.push("HttpOnly");
  parts.push(`SameSite=${spec.sameSite ?? "Lax"}`);
  if (process.env.NODE_ENV === "production") parts.push("Secure");
  return parts.join("; ");
}

export function withCookies(res: NextResponse, ...cookies: CookieSpec[]): NextResponse {
  for (const cookie of cookies) {
    res.headers.append("Set-Cookie", serializeCookie(cookie));
  }
  return res;
}

export function requireString(value: unknown): string {
  return typeof value === "string" ? value : "";
}
