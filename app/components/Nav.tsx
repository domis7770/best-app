import Link from "next/link";
import { NavLinks } from "./NavLinks";
import { getActor } from "@/lib/session";

export async function Nav() {
  const viewer = await getActor();

  return (
    <header className="site-header">
      <div className="container nav">
        <Link href="/" className="brand">
          <span className="brand-dot" aria-hidden />
          promptly
        </Link>
        <NavLinks />
        <div className="nav-actions">
          {viewer.kind === "user" ? (
            <>
              <span className="pill pill-accent">{viewer.user.plan}</span>
              <Link href="/account" className="btn btn-ghost btn-sm">
                {viewer.user.display_name.split(" ")[0]}
              </Link>
            </>
          ) : viewer.kind === "guest" ? (
            <>
              <span className="pill">guest</span>
              <Link href="/signup" className="btn btn-sm">
                Save my progress
              </Link>
            </>
          ) : (
            <>
              <Link href="/login" className="btn btn-ghost btn-sm">
                Sign in
              </Link>
              <Link href="/signup" className="btn btn-sm">
                Start free
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
