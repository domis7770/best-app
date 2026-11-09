import {
  handler,
  assertSameOrigin,
  parseJson,
  json,
  clientKey,
  appOrigin,
  ApiError,
} from "@/lib/http";
import { allow } from "@/lib/ratelimit";
import { checkoutSchema, firstIssue } from "@/lib/validation";
import { getActor, requireUser } from "@/lib/session";
import { db, nowIso, audit } from "@/lib/db";
import { stripeConfigured, createCheckoutSession } from "@/lib/stripe";

export const dynamic = "force-dynamic";

export const POST = handler(async (req) => {
  assertSameOrigin(req);
  const { user } = requireUser(await getActor());
  if (!allow("checkout", clientKey(req, user.id))) {
    throw new ApiError(429, "rate_limited", "Too many attempts. Try again in a few minutes.");
  }

  const parsed = checkoutSchema.safeParse(await parseJson(req));
  if (!parsed.success) {
    throw new ApiError(400, "invalid_input", firstIssue(parsed.error));
  }
  const plan = parsed.data.plan;

  if (stripeConfigured()) {
    const url = await createCheckoutSession({
      plan,
      userId: user.id,
      email: user.email,
      origin: appOrigin(),
    });
    return json({ url });
  }

  if (process.env.NODE_ENV === "production") {
    throw new ApiError(503, "billing_unavailable", "Billing is not configured yet.");
  }

  // Development only: no Stripe keys, so activate the plan directly.
  db()
    .prepare("UPDATE users SET plan = ?, plan_status = 'active' WHERE id = ?")
    .run(plan, user.id);
  audit(user.id, "billing.dev_activated", plan);
  return json({ url: "/account?upgraded=1", devActivated: true });
});
