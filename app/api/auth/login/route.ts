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
import { loginSchema, normalizeEmail, firstIssue } from "@/lib/validation";
import { checkPassword, DEVICE_COOKIE, cookieFromRequest } from "@/lib/session";

export const dynamic = "force-dynamic";

export const POST = handler(async (req) => {
  assertSameOrigin(req);
  if (!allow("loginNetwork", clientKey(req))) {
    throw new ApiError(429, "rate_limited", "Too many attempts. Try again in a few minutes.");
  }

  const parsed = loginSchema.safeParse(await parseJson(req));
  if (!parsed.success) {
    throw new ApiError(401, "bad_credentials", "Email or password is incorrect.");
  }

  const emailNorm = normalizeEmail(parsed.data.email);
  if (!allow("loginEmail", emailNorm)) {
    throw new ApiError(429, "rate_limited", "Too many attempts. Try again in a few minutes.");
  }

  const result = checkPassword(
    emailNorm,
    parsed.data.password,
    cookieFromRequest(req, DEVICE_COOKIE),
    req.headers.get("user-agent")
  );

  const body: Record<string, unknown> = { status: result.status };
  if (result.devCode) body.devCode = result.devCode;
  return withCookies(json(body), ...result.cookies);
});
