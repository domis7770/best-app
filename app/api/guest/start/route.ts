import { handler, assertSameOrigin, json, withCookies, clientKey, ApiError } from "@/lib/http";
import { allow } from "@/lib/ratelimit";
import { createGuest } from "@/lib/session";

export const dynamic = "force-dynamic";

export const POST = handler(async (req) => {
  assertSameOrigin(req);
  if (!allow("guest", clientKey(req))) {
    throw new ApiError(429, "rate_limited", "Too many guest sessions. Try again later.");
  }
  const { cookie } = createGuest();
  return withCookies(json({ status: "guest" }, { status: 201 }), cookie);
});
