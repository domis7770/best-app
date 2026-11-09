import {
  handler,
  assertSameOrigin,
  parseJson,
  json,
  clientKey,
  ApiError,
} from "@/lib/http";
import { allow } from "@/lib/ratelimit";
import { totpSchema, firstIssue } from "@/lib/validation";
import { getActor, requireUser } from "@/lib/session";
import { db, audit } from "@/lib/db";
import { verifyTotp } from "@/lib/crypto";

export const dynamic = "force-dynamic";

export const POST = handler(async (req) => {
  assertSameOrigin(req);
  const { user } = requireUser(await getActor());
  if (user.is_admin !== 1) throw new ApiError(403, "admin_only", "Not available.");
  if (!allow("totp", clientKey(req, user.id))) {
    throw new ApiError(429, "rate_limited", "Too many attempts. Try again shortly.");
  }

  const parsed = totpSchema.safeParse(await parseJson(req));
  if (!parsed.success) {
    throw new ApiError(400, "invalid_input", firstIssue(parsed.error));
  }

  const stored = db()
    .prepare("SELECT totp_secret FROM users WHERE id = ?")
    .get(user.id) as { totp_secret: string | null } | null;

  if (!stored?.totp_secret) {
    throw new ApiError(400, "no_secret", "Start the setup again.");
  }
  if (!verifyTotp(stored.totp_secret, parsed.data.code)) {
    throw new ApiError(401, "bad_code", "That code is not right.");
  }

  db().prepare("UPDATE users SET totp_confirmed = 1 WHERE id = ?").run(user.id);
  audit(user.id, "admin.totp_confirmed");
  return json({ ok: true });
});
