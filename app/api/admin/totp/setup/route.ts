import { handler, assertSameOrigin, json, ApiError } from "@/lib/http";
import { getActor, requireUser } from "@/lib/session";
import { db, audit } from "@/lib/db";
import { generateTotpSecret, otpAuthUri } from "@/lib/crypto";

export const dynamic = "force-dynamic";

export const POST = handler(async (req) => {
  assertSameOrigin(req);
  const { user } = requireUser(await getActor());
  if (user.is_admin !== 1) {
    throw new ApiError(403, "admin_only", "Not available.");
  }

  const secret = generateTotpSecret();
  db()
    .prepare("UPDATE users SET totp_secret = ?, totp_confirmed = 0 WHERE id = ?")
    .run(secret, user.id);
  audit(user.id, "admin.totp_setup_started");

  return json({
    secret,
    uri: otpAuthUri(secret, user.email, "Promptly"),
    digits: 6,
    period: 30,
  });
});
