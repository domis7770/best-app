import Link from "next/link";
import { redirect } from "next/navigation";
import { getActor, listDevices } from "@/lib/session";
import { db } from "@/lib/db";
import { PLANS, formatPrice, atLeast } from "@/lib/entitlements";
import { SignOutButton, UpgradeButton, RevokeButton, UploadForm } from "../components/Forms";

export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<{ upgraded?: string }>;
}) {
  const viewer = await getActor();
  if (viewer.kind !== "user") redirect("/login");

  const { user, deviceId } = viewer;
  const devices = listDevices(user.id);
  const uploads = db()
    .prepare<{ id: string; name: string; size: number; created_at: string }>(
      "SELECT id, name, size, created_at FROM uploads WHERE user_id = ? ORDER BY created_at DESC LIMIT 6"
    )
    .all(user.id);
  const params = await searchParams;
  const plan = PLANS[user.plan];

  return (
    <div className="page">
      <div className="container stack" style={{ gap: 22 }}>
        <div className="spread">
          <div>
            <span className="eyebrow">Account</span>
            <h1 style={{ margin: "8px 0 6px", fontSize: "clamp(1.7rem, 3.4vw, 2.3rem)" }}>
              {user.display_name}
            </h1>
            <p className="small muted">
              {user.email} · joined {new Date(user.created_at).toLocaleDateString()}
            </p>
          </div>
          <SignOutButton />
        </div>

        {params.upgraded ? (
          <div className="form-ok">Plan updated. Everything in it is unlocked now.</div>
        ) : null}

        <div className="grid grid-2">
          <div className="card">
            <span className="eyebrow">Plan</span>
            <h3 style={{ margin: "8px 0 4px" }}>
              {plan.name}
              {user.plan_status !== "active" && user.plan !== "free" ? (
                <span className="pill" style={{ marginLeft: 8 }}>{user.plan_status}</span>
              ) : null}
            </h3>
            <p className="small muted" style={{ marginBottom: 16 }}>
              {plan.price === 0
                ? "Foundations plus two simulator rounds."
                : `${formatPrice(plan.price)}${plan.cadence} · ${plan.tagline}`}
            </p>
            {user.plan !== "pro" ? (
              <div className="stack" style={{ gap: 10 }}>
                {!atLeast(user.plan, "plus") ? (
                  <UpgradeButton plan="plus" label="Upgrade to Plus — $6.99/mo" />
                ) : null}
                <UpgradeButton
                  plan="pro"
                  label="Upgrade to Pro — $15.99/mo"
                  ghost={!atLeast(user.plan, "plus")}
                />
              </div>
            ) : (
              <span className="pill pill-accent">Everything unlocked</span>
            )}
            <p className="small muted" style={{ marginTop: 14 }}>
              Billing is managed through Stripe. Cancelling keeps access until the period ends.
            </p>
          </div>

          <div className="card">
            <span className="eyebrow">What you have access to</span>
            <ul className="feature-list" style={{ marginTop: 12 }}>
              <li>
                <span className="tick">✓</span> All seven foundations lessons
              </li>
              <li>
                <span className={atLeast(user.plan, "plus") ? "tick" : "no"}>
                  {atLeast(user.plan, "plus") ? "✓" : "—"}
                </span>{" "}
                The five work playbooks
              </li>
              <li>
                <span className="tick">✓</span>{" "}
                {user.plan === "free" ? "Simulator rounds 1–2" : "All five simulator rounds"}
              </li>
              <li>
                <span className={user.plan === "pro" ? "tick" : "no"}>
                  {user.plan === "pro" ? "✓" : "—"}
                </span>{" "}
                Prompt &amp; code lab
              </li>
            </ul>
            <div className="row" style={{ marginTop: 14 }}>
              <Link className="btn btn-ghost btn-sm" href="/learn">
                Keep learning
              </Link>
              <Link className="btn btn-ghost btn-sm" href="/pricing">
                Compare plans
              </Link>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="spread" style={{ marginBottom: 12 }}>
            <h3>Devices</h3>
            <span className="pill">{devices.length} trusted</span>
          </div>
          <p className="small muted" style={{ marginBottom: 14 }}>
            Each device gets its own session. Revoking one signs it out immediately and it will need a
            4-digit code to return.
          </p>
          <div className="stack" style={{ gap: 8 }}>
            {devices.map((device) => (
              <div className="lesson-row" key={device.id} style={{ padding: "12px 14px" }}>
                <div style={{ flex: 1 }}>
                  <strong style={{ fontSize: "0.94rem" }}>{device.label}</strong>
                  <p className="small muted">
                    last seen {new Date(device.last_seen_at).toLocaleString()}
                    {device.id === deviceId ? " · this device" : ""}
                  </p>
                </div>
                {device.id === deviceId ? (
                  <span className="pill">current</span>
                ) : (
                  <RevokeButton deviceId={device.id} />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <h3 style={{ marginBottom: 6 }}>Private uploads</h3>
          <p className="small muted" style={{ marginBottom: 16 }}>
            Files are stored outside the public folder and served only to you, through an ownership
            check. PNG, JPEG or WebP up to 2 MB.
          </p>
          <UploadForm />
          {uploads.length > 0 ? (
            <div className="stack" style={{ gap: 8, marginTop: 16 }}>
              {uploads.map((file) => (
                <div className="audit-row" key={file.id}>
                  <a href={`/api/uploads/${file.id}`} target="_blank" rel="noreferrer">
                    {file.name}
                  </a>
                  <span className="muted">{Math.round(file.size / 1024)} KB</span>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
