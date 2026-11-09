import Link from "next/link";
import { redirect } from "next/navigation";
import { getActor } from "@/lib/session";
import { AuthForm } from "../components/Forms";

export default async function SignupPage() {
  const viewer = await getActor();
  if (viewer.kind === "user") redirect("/learn");

  return (
    <div className="page">
      <div className="container">
        <div className="auth-wrap">
          <div className="card">
            <span className="eyebrow">{viewer.kind === "guest" ? "Keep your progress" : "Free account"}</span>
            <h2 style={{ margin: "8px 0 18px" }}>Start learning</h2>
            {viewer.kind === "guest" ? (
              <div className="form-ok">Anything you finished as a guest moves into this account.</div>
            ) : null}
            <AuthForm mode="signup" />
          </div>
          <p className="small muted" style={{ textAlign: "center", marginTop: 14 }}>
            Already have one? <Link href="/login">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
