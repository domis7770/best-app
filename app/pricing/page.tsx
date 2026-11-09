import Link from "next/link";
import { getActor } from "@/lib/session";
import { PLANS, PLAN_FEATURES, formatPrice, type Plan } from "@/lib/entitlements";
import { UpgradeButton } from "../components/Forms";

export default async function PricingPage() {
  const viewer = await getActor();
  const current: Plan | null = viewer.kind === "user" ? viewer.user.plan : null;

  const plans: Plan[] = ["free", "plus", "pro"];

  return (
    <div className="page">
      <div className="container stack" style={{ gap: 30 }}>
        <div>
          <span className="eyebrow">Plans</span>
          <h1 style={{ margin: "10px 0 12px" }}>Pay for the part that earns.</h1>
          <p className="lede">
            The foundations are free forever. Plus adds the work playbooks and the full simulator.
            Pro adds the prompt and code lab.
          </p>
        </div>

        <div className="grid grid-3">
          {plans.map((plan) => {
            const info = PLANS[plan];
            const isCurrent = current === plan;
            const featured = plan === "plus";
            return (
              <div className="plan-card" data-featured={featured} key={plan}>
                {featured ? <span className="pill pill-accent">Most popular</span> : null}
                <h3>{info.name}</h3>
                <div className="plan-price">
                  {info.price === 0 ? "Free" : formatPrice(info.price)}
                  {info.cadence ? <span>{info.cadence}</span> : null}
                </div>
                <p className="small muted">{info.tagline}</p>
                <ul className="feature-list">
                  {PLAN_FEATURES.map((feature) => {
                    const value = feature[plan];
                    const included = value === true;
                    return (
                      <li key={feature.label}>
                        <span className={included ? "tick" : "no"}>{included ? "✓" : "—"}</span>
                        <span>
                          {feature.label}
                          {typeof value === "string" ? ` · ${value}` : ""}
                        </span>
                      </li>
                    );
                  })}
                </ul>
                {plan === "free" ? (
                  isCurrent ? (
                    <span className="pill">Your plan</span>
                  ) : (
                    <Link className="btn btn-ghost btn-block" href="/signup">
                      Start free
                    </Link>
                  )
                ) : isCurrent ? (
                  <span className="pill pill-accent">Your plan</span>
                ) : viewer.kind === "user" ? (
                  <UpgradeButton
                    plan={plan}
                    label={`Switch to ${info.name}`}
                    ghost={!featured}
                  />
                ) : (
                  <Link className={`btn btn-block ${featured ? "" : "btn-ghost"}`} href="/signup">
                    Create an account first
                  </Link>
                )}
              </div>
            );
          })}
        </div>

        <div className="card card-flat">
          <h3 style={{ marginBottom: 12 }}>Questions people actually ask</h3>
          <div className="stack" style={{ gap: 12 }}>
            <div>
              <strong>Is the free tier a trial?</strong>
              <p className="small muted">No. Seven foundations lessons stay free, plus two simulator rounds.</p>
            </div>
            <div>
              <strong>What happens if I cancel?</strong>
              <p className="small muted">
                You keep Pro or Plus until the period ends, then drop back to Free. Progress is never
                deleted.
              </p>
            </div>
            <div>
              <strong>Why is the lab Pro only?</strong>
              <p className="small muted">
                Lab templates ship with reference code and a ship checklist — they are built for
                people already using these tools daily.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
