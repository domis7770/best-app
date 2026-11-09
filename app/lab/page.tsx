import Link from "next/link";
import { LAB } from "@/content";
import { getActor, accessOf } from "@/lib/session";
import { canUseLab } from "@/lib/entitlements";

export default async function LabPage() {
  const viewer = await getActor();
  const unlocked = canUseLab(accessOf(viewer));

  return (
    <div className="page">
      <div className="container stack" style={{ gap: 24 }}>
        <div>
          <span className="eyebrow">Prompt &amp; code lab</span>
          <h1 style={{ margin: "10px 0 10px", fontSize: "clamp(1.9rem, 4vw, 2.8rem)" }}>
            Templates you can ship with.
          </h1>
          <p className="lede">
            Six prompts, each with reference code and a checklist. Built for the tasks that come back
            every week, not one-off demos.
          </p>
        </div>

        {!unlocked ? (
          <div className="paywall">
            <h3>The lab is part of Pro</h3>
            <p className="lede" style={{ margin: "10px auto 18px" }}>
              {viewer.kind === "anon"
                ? "Create an account and upgrade to unlock all six templates."
                : "Upgrade to Pro to open the prompts, reference code and ship checklists."}
            </p>
            <div className="row" style={{ justifyContent: "center" }}>
              <Link className="btn" href={viewer.kind === "anon" ? "/signup" : "/pricing"}>
                {viewer.kind === "anon" ? "Create account" : "Upgrade to Pro"}
              </Link>
              <Link className="btn btn-ghost" href="/learn">
                Keep learning
              </Link>
            </div>
          </div>
        ) : null}

        <div className="grid grid-2">
          {LAB.map((template) => {
            const body = (
              <div className="track-card" data-accent="amber" style={{ opacity: unlocked ? 1 : 0.7 }}>
                <div className="row" style={{ gap: 10 }}>
                  <span className="pill">{template.level}</span>
                  <span className="pill">{template.minutes} min</span>
                  {!unlocked ? <span className="pill">Pro</span> : null}
                </div>
                <h3>{template.title}</h3>
                <p className="small muted">{template.blurb}</p>
              </div>
            );
            return unlocked ? (
              <Link href={`/lab/${template.id}`} key={template.id}>
                {body}
              </Link>
            ) : (
              <div key={template.id}>{body}</div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
