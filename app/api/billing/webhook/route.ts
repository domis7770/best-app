import { handler, json, fail } from "@/lib/http";
import { db, nowIso, audit } from "@/lib/db";
import { verifyStripeSignature, planFromMetadata } from "@/lib/stripe";

export const dynamic = "force-dynamic";

interface StripeEvent {
  id?: string;
  type?: string;
  data?: {
    object?: {
      customer?: string;
      subscription?: string;
      metadata?: Record<string, string | undefined>;
      client_reference_id?: string;
      status?: string;
    };
  };
}

export const POST = handler(async (req) => {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    return fail(503, "billing_unavailable", "Billing is not configured yet.");
  }

  const raw = await req.text();
  if (raw.length > 512 * 1024) {
    return fail(413, "payload_too_large", "That request is too large.");
  }

  // Signature is checked against the exact bytes before anything is parsed.
  if (!verifyStripeSignature(raw, req.headers.get("stripe-signature"), secret)) {
    return fail(400, "invalid_signature", "Invalid signature.");
  }

  let event: StripeEvent;
  try {
    event = JSON.parse(raw) as StripeEvent;
  } catch {
    return fail(400, "invalid_json", "Could not read that event.");
  }

  if (!event.id || !event.type) {
    return fail(400, "invalid_event", "Event is missing fields.");
  }

  const inserted = db()
    .prepare("INSERT OR IGNORE INTO webhook_events (id, type, received_at) VALUES (?, ?, ?)")
    .run(event.id, event.type, nowIso());
  if (inserted.changes === 0) {
    return json({ received: true, duplicate: true });
  }

  const object = event.data?.object ?? {};
  const userId = object.metadata?.user_id ?? object.client_reference_id ?? null;
  const customer = object.customer ?? null;

  switch (event.type) {
    case "checkout.session.completed": {
      const plan = planFromMetadata(object.metadata?.plan);
      if (userId && plan) {
        db()
          .prepare(
            "UPDATE users SET plan = ?, plan_status = 'active', stripe_customer_id = COALESCE(?, stripe_customer_id) WHERE id = ?"
          )
          .run(plan, customer, userId);
        audit(userId, "billing.activated", plan);
      }
      break;
    }
    case "customer.subscription.deleted": {
      if (userId) {
        db()
          .prepare("UPDATE users SET plan = 'free', plan_status = 'canceled' WHERE id = ?")
          .run(userId);
        audit(userId, "billing.canceled");
      } else if (customer) {
        db()
          .prepare("UPDATE users SET plan = 'free', plan_status = 'canceled' WHERE stripe_customer_id = ?")
          .run(customer);
      }
      break;
    }
    case "invoice.payment_failed": {
      if (userId) {
        db().prepare("UPDATE users SET plan_status = 'past_due' WHERE id = ?").run(userId);
        audit(userId, "billing.past_due");
      } else if (customer) {
        db()
          .prepare("UPDATE users SET plan_status = 'past_due' WHERE stripe_customer_id = ?")
          .run(customer);
      }
      break;
    }
    default:
      break;
  }

  return json({ received: true });
});
