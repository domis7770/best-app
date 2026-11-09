import Link from "next/link";
import { TRACKS, LESSONS, LAB } from "@/content";
import { getActor } from "@/lib/session";
import { progressMap } from "@/lib/progress";
import { GuestButton } from "./components/Forms";

export default async function HomePage() {
  const viewer = await getActor();
  const progress = progressMap(viewer);
  const done = progress.size;
  const signedIn = viewer.kind === "user";

  return (
    <>
      <section className="hero">
        <div className="container hero-inner">
          <div>
            <span className="eyebrow">Ten minutes a day</span>
            <h1>Get actually good at AI.</h1>
            <p className="lede" style={{ marginBottom: 24 }}>
              Short lessons on how models really work, playbooks for the job you already have, and a
              simulator where your decisions get scored. No hype, no hand-waving.
            </p>
            <div className="row">
              {signedIn ? (
                <Link className="btn btn-accent" href="/learn">
                  Continue learning
                </Link>
              ) : (
                <>
                  <Link className="btn btn-accent" href="/signup">
                    Start free
                  </Link>
                  <GuestButton />
                </>
              )}
            </div>
            <div className="row" style={{ marginTop: 26, gap: 28 }}>
              <div className="stat">
                <strong>{LESSONS.length}</strong>
                <span>lessons</span>
              </div>
              <div className="stat">
                <strong>{LAB.length}</strong>
                <span>lab templates</span>
              </div>
              <div className="stat">
                <strong>5</strong>
                <span>simulator rounds</span>
              </div>
              {done > 0 ? (
                <div className="stat">
                  <strong>{done}</strong>
                  <span>done by you</span>
                </div>
              ) : null}
            </div>
          </div>

          <div className="hero-card">
            <div className="mini-lesson">
              <span className="eyebrow">Lesson preview</span>
              <h3>Why does it invent a citation?</h3>
              <p className="small muted">
                Because it predicts plausible text. Pick the best fix:
              </p>
              <div className="mini-option">Ask it to be more careful</div>
              <div className="mini-option" data-state="right">
                Paste the source and say “answer only from this”
              </div>
              <div className="mini-option">Switch models</div>
              <p className="small muted">Grounded prompts beat hopeful ones.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="page" style={{ paddingTop: 0 }}>
        <div className="container stack" style={{ gap: 26 }}>
          <div className="grid grid-3">
            {[
              {
                title: "Built on how models work",
                body: "Tokens, context, grounding, hallucination — the mechanics that make everything else make sense.",
              },
              {
                title: "Applied to your actual job",
                body: "Each work lesson ends with a prompt you can paste on Monday, with role examples for sales, support, ops and engineering.",
              },
              {
                title: "Scored, not just read",
                body: "Quizzes and a five-round business simulator, scored on the server, so you find the gaps before a customer does.",
              },
            ].map((item) => (
              <div className="card" key={item.title}>
                <h3 style={{ marginBottom: 8 }}>{item.title}</h3>
                <p className="small muted">{item.body}</p>
              </div>
            ))}
          </div>

          <div>
            <div className="spread" style={{ marginBottom: 14 }}>
              <h2>Four tracks</h2>
              <Link className="btn btn-ghost btn-sm" href="/learn">
                Open the curriculum
              </Link>
            </div>
            <div className="grid grid-4">
              {TRACKS.map((track) => (
                <Link
                  className="track-card"
                  data-accent={track.accent}
                  href={track.id === "lab" ? "/lab" : track.id === "sim" ? "/sim" : `/learn/${track.id}`}
                  key={track.id}
                >
                  <div className="track-icon">{track.icon}</div>
                  <h3>{track.name}</h3>
                  <p className="small muted">{track.tagline}</p>
                </Link>
              ))}
            </div>
          </div>

          <div className="card" style={{ background: "#17150f", color: "#f6f2e9" }}>
            <div className="spread">
              <div>
                <h2 style={{ marginBottom: 8 }}>Free covers the basics. Plus covers the job.</h2>
                <p style={{ opacity: 0.75, maxWidth: "52ch" }}>
                  Start with seven foundations lessons and two simulator rounds for nothing. Upgrade
                  when you want the work playbooks and all five rounds.
                </p>
              </div>
              <div className="row">
                <Link className="btn btn-accent" href="/pricing">
                  See plans
                </Link>
                <Link
                  className="btn btn-ghost"
                  style={{ color: "#f6f2e9", borderColor: "rgba(255,255,255,0.25)" }}
                  href="/signup"
                >
                  Create account
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
