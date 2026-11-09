import {
  handler,
  assertSameOrigin,
  parseJson,
  json,
  withCookies,
  clientKey,
  ApiError,
} from "@/lib/http";
import { allow } from "@/lib/ratelimit";
import { totpSchema, firstIssue } from "@/lib/validation";
import { verifySecondFactor, PENDING_COOKIE, cookieFromRequest } from "@/lib/session";

export const dynamic = "force-dynamic";

export const POST = handler(async (req) => {
  assertSameOrigin(req);
  const pending = cookieFromRequest(req, PENDING_COOKIE) ?? "";
  if (!allow("totp", clientKey(req, pending))) {
    throw new ApiError(429, "rate_limited", "Too many attempts. Start signing in again.");
  }

  const parsed = totpSchema.safeParse(await parseJson(req));
  if (!parsed.success) {
    throw new ApiError(400, "invalid_input", firstIssue(parsed.error));
  }

  const result = verifySecondFactor(pending, parsed.data.code);
  return withCookies(json({ status: result.status }), ...result.cookies);
});
