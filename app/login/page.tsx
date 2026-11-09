import Link from "next/link";
import { redirect } from "next/navigation";
import { getActor } from "@/lib/session";
import { AuthForm } from "../components/Forms";

export default async function LoginPage() {
  const viewer = await getActor();
  if (viewer.kind === "user") redirect("/learn");

  return (
    <div className="page">
      <div className="container">
        <div className="auth-wrap">
          <div className="card">
            <span className="eyebrow">Welcome back</span>
            <h2 style={{ margin: "8px 0 18px" }}>Sign in</h2>
            <AuthForm mode="login" />
          </div>
          <p className="small muted" style={{ textAlign: "center", marginTop: 14 }}>
            No account? <Link href="/signup">Create one free</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
