import { createHmac, timingSafeEqual } from "node:crypto";

const API = "https://api.stripe.com/v1";

export function stripeConfigured(): boolean {
  return Boolean(
    process.env.STRIPE_SECRET_KEY &&
      process.env.STRIPE_PRICE_PLUS &&
      process.env.STRIPE_PRICE_PRO &&
      process.env.STRIPE_WEBHOOK_SECRET
  );
}

function priceFor(plan: "plus" | "pro"): string {
  const price = plan === "plus" ? process.env.STRIPE_PRICE_PLUS : process.env.STRIPE_PRICE_PRO;
  if (!price) throw new Error(`missing price for ${plan}`);
  return price;
}

export async function createCheckoutSession(input: {
  plan: "plus" | "pro";
  userId: string;
  email: string;
  origin: string;
}): Promise<string> {
  const body = new URLSearchParams({
    mode: "subscription",
    "line_items[0][price]": priceFor(input.plan),
    "line_items[0][quantity]": "1",
    customer_email: input.email,
    client_reference_id: input.userId,
    "metadata[user_id]": input.userId,
    "metadata[plan]": input.plan,
    success_url: `${input.origin}/account?upgraded=1`,
    cancel_url: `${input.origin}/pricing?canceled=1`,
    allow_promotion_codes: "false",
  });

  const res = await fetch(`${API}/checkout/sessions`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`,
      "content-type": "application/x-www-form-urlencoded",
      "idempotency-key": `${input.userId}:${input.plan}:${Math.floor(Date.now() / 60000)}`,
    },
    body,
  });

  if (!res.ok) {
    console.error("[promptly] stripe checkout failed:", res.status);
    throw new Error("checkout_unavailable");
  }
  const data = (await res.json()) as { url?: string };
  if (!data.url) throw new Error("checkout_unavailable");
  return data.url;
}

/**
 * Verifies a Stripe `Stripe-Signature` header (t=<ts>,v1=<hmac>) over the raw
 * body. Returns false on anything suspicious, including stale timestamps.
 */
export function verifyStripeSignature(
  payload: string,
  header: string | null,
  secret: string,
  toleranceSeconds = 300
): boolean {
  if (!header) return false;
  const parts = header.split(",").map((part) => part.trim());
  let timestamp = "";
  const signatures: string[] = [];
  for (const part of parts) {
    const [key, value] = part.split("=");
    if (key === "t") timestamp = value ?? "";
    if (key === "v1" && value) signatures.push(value);
  }
  if (!timestamp || signatures.length === 0) return false;

  const ts = Number(timestamp);
  if (!Number.isFinite(ts)) return false;
  if (Math.abs(Date.now() / 1000 - ts) > toleranceSeconds) return false;

  const expected = createHmac("sha256", secret).update(`${timestamp}.${payload}`).digest("hex");
  const expectedBuf = Buffer.from(expected, "hex");
  return signatures.some((candidate) => {
    const buf = Buffer.from(candidate, "hex");
    return buf.length === expectedBuf.length && timingSafeEqual(buf, expectedBuf);
  });
}

export function planFromMetadata(value: unknown): "plus" | "pro" | null {
  return value === "plus" || value === "pro" ? value : null;
}
