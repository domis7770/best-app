import Link from "next/link";
import { LESSONS, TRACKS, lessonsForTrack } from "@/content";
import { getActor, accessOf } from "@/lib/session";
import { progressMap } from "@/lib/progress";
import { canOpenLesson } from "@/lib/entitlements";
import { GuestButton } from "../components/Forms";

export default async function LearnPage() {
  const viewer = await getActor();
  const access = accessOf(viewer);
  const progress = progressMap(viewer);
  const lessonTracks = TRACKS.filter((track) => track.id === "foundations" || track.id === "work");
  const totalXp = LESSONS.reduce(
    (sum, lesson) => sum + (progress.has(lesson.id) ? lesson.xp : 0),
    0
  );
  const greetings: Record<string, string> = {
    user: `Hi${viewer.kind === "user" ? `, ${viewer.user.display_name.split(" ")[0]}` : ""}`,
    guest: "You're browsing as a guest",
    anon: "Start with a free account",
  };

  return (
    <div className="page">
      <div className="container stack" style={{ gap: 28 }}>
        <div className="spread">
          <div>
            <span className="eyebrow">Curriculum</span>
            <h1 style={{ margin: "8px 0 10px", fontSize: "clamp(1.9rem, 4vw, 2.8rem)" }}>
              {greetings[viewer.kind]}
            </h1>
            <p className="lede">
              {viewer.kind === "user"
                ? `${progress.size} of ${LESSONS.length} lessons done · ${totalXp} XP earned.`
                : "Guests can open the first two foundations lessons. An account unlocks the rest of the foundations track."}
            </p>
          </div>
          <div className="row">
            {viewer.kind === "anon" ? (
              <>
                <Link className="btn" href="/signup">
                  Create free account
                </Link>
                <GuestButton label="Or browse as a guest" />
              </>
            ) : viewer.kind === "guest" ? (
              <Link className="btn btn-accent" href="/signup">
                Keep my progress
              </Link>
            ) : (
              <Link className="btn btn-ghost" href="/sim">
                Open the simulator
              </Link>
            )}
          </div>
        </div>

        <div className="grid grid-2">
          {lessonTracks.map((track) => {
            const lessons = lessonsForTrack(track.id);
            const done = lessons.filter((lesson) => progress.has(lesson.id)).length;
            const pct = Math.round((done / lessons.length) * 100);
            return (
              <div className="track-card" data-accent={track.accent} key={track.id}>
                <div className="row" style={{ gap: 12 }}>
                  <div className="track-icon">{track.icon}</div>
                  <div>
                    <h3>{track.name}</h3>
                    <p className="small muted">{track.tagline}</p>
                  </div>
                </div>
                <div className="bar">
                  <span style={{ width: `${pct}%` }} />
                </div>
                <div className="spread">
                  <span className="small muted">
                    {done}/{lessons.length} complete
                  </span>
                  <Link className="btn btn-ghost btn-sm" href={`/learn/${track.id}`}>
                    Open
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

        <div className="stack" style={{ gap: 10 }}>
          <h2 style={{ marginBottom: 6 }}>All lessons</h2>
          {LESSONS.map((lesson, index) => {
            const entry = progress.get(lesson.id);
            const unlocked = canOpenLesson(access, lesson);
            const href = unlocked ? `/learn/${lesson.trackId}/${lesson.id}` : "/pricing";
            return (
              <Link
                className="lesson-row"
                href={href}
                key={lesson.id}
                data-done={Boolean(entry)}
                data-locked={!unlocked}
              >
                <span className="lesson-index">{entry ? "✓" : index + 1}</span>
                <div style={{ flex: 1 }}>
                  <h3>{lesson.title}</h3>
                  <p className="small muted">{lesson.blurb}</p>
                </div>
                <span className="pill">
                  {unlocked ? `${lesson.minutes} min` : "locked"}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
