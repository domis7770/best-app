import Link from "next/link";
import { getActor } from "@/lib/session";
import { db } from "@/lib/db";
import { TotpSetup } from "../components/Forms";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const viewer = await getActor();

  if (viewer.kind !== "user") {
    return (
      <div className="page">
        <div className="container">
          <div className="paywall">
            <h2>Operations</h2>
            <p className="lede" style={{ margin: "10px auto 16px" }}>
              Sign in with an admin account to see this page.
            </p>
            <Link className="btn" href="/login">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (viewer.user.is_admin !== 1) {
    return (
      <div className="page">
        <div className="container">
          <div className="paywall">
            <h2>Nothing here</h2>
            <p className="lede" style={{ margin: "10px auto 16px" }}>
              This area is for staff accounts.
            </p>
            <Link className="btn" href="/learn">
              Back to learning
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (viewer.user.totp_confirmed !== 1) {
    return (
      <div className="page">
        <div className="container lesson-wrap">
          <h1 style={{ marginBottom: 12, fontSize: "clamp(1.7rem, 3.2vw, 2.2rem)" }}>
            One step before operations
          </h1>
          <p className="lede" style={{ marginBottom: 20 }}>
            Admin accounts need an authenticator. Confirm a code to unlock this page and to sign in
            from any new device.
          </p>
          <TotpSetup />
        </div>
      </div>
    );
  }

  const counts = {
    users: (db().prepare("SELECT COUNT(*) AS n FROM users").get() as { n: number }).n,
    plus: (db().prepare("SELECT COUNT(*) AS n FROM users WHERE plan = 'plus'").get() as { n: number }).n,
    pro: (db().prepare("SELECT COUNT(*) AS n FROM users WHERE plan = 'pro'").get() as { n: number }).n,
    lessons: (db().prepare("SELECT COUNT(*) AS n FROM progress").get() as { n: number }).n,
    sims: (db().prepare("SELECT COUNT(*) AS n FROM sim_runs WHERE finished_at IS NOT NULL").get() as { n: number }).n,
    uploads: (db().prepare("SELECT COUNT(*) AS n FROM uploads").get() as { n: number }).n,
  };

  const recent = db()
    .prepare<{ action: string; detail: string | null; created_at: string }>(
      "SELECT action, detail, created_at FROM audit_log ORDER BY created_at DESC LIMIT 12"
    )
    .all();

  return (
    <div className="page">
      <div className="container stack" style={{ gap: 22 }}>
        <div>
          <span className="eyebrow">Operations</span>
          <h1 style={{ margin: "8px 0 6px", fontSize: "clamp(1.7rem, 3.4vw, 2.3rem)" }}>
            Admin overview
          </h1>
          <p className="small muted">
            Two-factor is confirmed for {viewer.user.email}. Every new device also needs the
            authenticator code.
          </p>
        </div>

        <div className="grid grid-4">
          {[
            { label: "Accounts", value: counts.users },
            { label: "Plus", value: counts.plus },
            { label: "Pro", value: counts.pro },
            { label: "Lessons done", value: counts.lessons },
            { label: "Runs finished", value: counts.sims },
            { label: "Uploads", value: counts.uploads },
          ].map((item) => (
            <div className="metric" key={item.label}>
              <span>{item.label}</span>
              <strong>{item.value}</strong>
            </div>
          ))}
        </div>

        <div className="card">
          <h3 style={{ marginBottom: 12 }}>Recent activity</h3>
          {recent.length === 0 ? (
            <p className="small muted">No events yet.</p>
          ) : (
            recent.map((row, index) => (
              <div className="audit-row" key={`${row.created_at}-${index}`}>
                <span>
                  {row.action}
                  {row.detail ? ` · ${row.detail}` : ""}
                </span>
                <span className="muted">{new Date(row.created_at).toLocaleTimeString()}</span>
              </div>
            ))
          )}
        </div>

        <p className="small muted">
          Admin actions are audited server-side. Account changes and plan transitions are only made
          through verified webhooks or the allowlist, never from client input.
        </p>
      </div>
    </div>
  );
}
