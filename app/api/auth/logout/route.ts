import { handler, assertSameOrigin, json, withCookies } from "@/lib/http";
import { signOut, SESSION_COOKIE, cookieFromRequest } from "@/lib/session";

export const dynamic = "force-dynamic";

export const POST = handler(async (req) => {
  assertSameOrigin(req);
  const cookies = signOut(cookieFromRequest(req, SESSION_COOKIE));
  return withCookies(json({ ok: true }), ...cookies);
});
