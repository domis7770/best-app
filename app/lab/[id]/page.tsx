import Link from "next/link";
import { notFound } from "next/navigation";
import { findLab } from "@/content";
import { getActor, accessOf } from "@/lib/session";
import { canUseLab } from "@/lib/entitlements";

export default async function LabDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const template = findLab(id);
  if (!template) notFound();

  const viewer = await getActor();
  if (!canUseLab(accessOf(viewer))) {
    return (
      <div className="page">
        <div className="container">
          <div className="paywall">
            <span className="eyebrow">Prompt &amp; code lab</span>
            <h2 style={{ margin: "10px 0 12px" }}>{template.title}</h2>
            <p className="lede" style={{ margin: "0 auto 18px" }}>
              This template is part of Pro, along with the rest of the lab.
            </p>
            <Link className="btn" href={viewer.kind === "anon" ? "/signup" : "/pricing"}>
              {viewer.kind === "anon" ? "Create account" : "See plans"}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="container lesson-wrap">
        <Link className="small muted" href="/lab">
          ← Lab
        </Link>
        <div className="lesson-meta" style={{ marginTop: 12 }}>
          <span className="pill">{template.level}</span>
          <span className="pill">{template.minutes} min</span>
        </div>
        <h1 style={{ fontSize: "clamp(1.7rem, 3.4vw, 2.4rem)", marginBottom: 8 }}>
          {template.title}
        </h1>
        <p className="lede" style={{ marginBottom: 22 }}>
          {template.blurb}
        </p>

        <div className="stack">
          {template.system ? (
            <div>
              <span className="block-label">System prompt</span>
              <div className="prompt-block">{template.system}</div>
            </div>
          ) : null}

          <div>
            <span className="block-label">Prompt</span>
            <div className="prompt-block">{template.prompt}</div>
          </div>

          {template.code ? (
            <div>
              <span className="block-label">Reference code</span>
              <pre className="code-block">{template.code}</pre>
            </div>
          ) : null}

          <div className="takeaways">
            <h3 style={{ marginBottom: 8 }}>Ship checklist</h3>
            <ul>
              {template.checklist.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>

          <div className="row">
            <Link className="btn btn-ghost" href="/lab">
              All templates
            </Link>
            <Link className="btn" href="/sim">
              Try the simulator
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
