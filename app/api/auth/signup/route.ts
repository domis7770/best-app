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
import { signupSchema, normalizeEmail, firstIssue } from "@/lib/validation";
import { createAccount, getActor, mergeGuestProgress } from "@/lib/session";
import { publicUser } from "@/lib/present";

export const dynamic = "force-dynamic";

export const POST = handler(async (req) => {
  assertSameOrigin(req);
  if (!allow("signup", clientKey(req))) {
    throw new ApiError(429, "rate_limited", "Too many sign-ups. Try again later.");
  }

  const parsed = signupSchema.safeParse(await parseJson(req));
  if (!parsed.success) {
    throw new ApiError(400, "invalid_input", firstIssue(parsed.error));
  }

  const viewer = await getActor();
  const emailNorm = normalizeEmail(parsed.data.email);
  const { user, cookies } = createAccount({
    email: parsed.data.email.trim(),
    emailNorm,
    password: parsed.data.password,
    displayName: parsed.data.displayName,
    userAgent: req.headers.get("user-agent"),
  });

  mergeGuestProgress(user.id, viewer.kind === "guest" ? viewer.guestId : undefined);

  return withCookies(
    json({ status: "signed_in", user: publicUser(user) }, { status: 201 }),
    ...cookies
  );
});
