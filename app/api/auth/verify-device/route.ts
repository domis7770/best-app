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
import { deviceCodeSchema, firstIssue } from "@/lib/validation";
import { verifyDeviceCode, PENDING_COOKIE, cookieFromRequest } from "@/lib/session";

export const dynamic = "force-dynamic";

export const POST = handler(async (req) => {
  assertSameOrigin(req);
  const pending = cookieFromRequest(req, PENDING_COOKIE) ?? "";
  if (!allow("deviceCode", clientKey(req, pending))) {
    throw new ApiError(429, "rate_limited", "Too many attempts. Start signing in again.");
  }

  const parsed = deviceCodeSchema.safeParse(await parseJson(req));
  if (!parsed.success) {
    throw new ApiError(400, "invalid_input", firstIssue(parsed.error));
  }

  const result = verifyDeviceCode(pending, parsed.data.code);
  const body: Record<string, unknown> = { status: result.status };
  if (result.devCode) body.devCode = result.devCode;
  return withCookies(json(body), ...result.cookies);
});
