import Link from "next/link";
import { notFound } from "next/navigation";
import { findTrack, lessonsForTrack } from "@/content";
import { getActor, accessOf } from "@/lib/session";
import { progressMap } from "@/lib/progress";
import { canOpenLesson, lessonLockReason } from "@/lib/entitlements";

export default async function TrackPage({ params }: { params: Promise<{ track: string }> }) {
  const { track: trackId } = await params;
  const track = findTrack(trackId);
  if (!track) notFound();
  if (track.id === "lab") {
    return (
      <div className="page">
        <div className="container">
          <div className="paywall">
            <h2>The lab lives on its own page</h2>
            <Link className="btn" href="/lab" style={{ marginTop: 16 }}>
              Open the lab
            </Link>
          </div>
        </div>
      </div>
    );
  }
  if (track.id === "sim") {
    return (
      <div className="page">
        <div className="container">
          <div className="paywall">
            <h2>The simulator has its own page</h2>
            <Link className="btn" href="/sim" style={{ marginTop: 16 }}>
              Open the simulator
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const viewer = await getActor();
  const access = accessOf(viewer);
  const progress = progressMap(viewer);
  const lessons = lessonsForTrack(track.id);

  return (
    <div className="page">
      <div className="container stack" style={{ gap: 22 }}>
        <div>
          <Link className="small muted" href="/learn">
            ← Curriculum
          </Link>
          <h1 style={{ margin: "10px 0 8px", fontSize: "clamp(1.8rem, 3.6vw, 2.6rem)" }}>
            {track.name}
          </h1>
          <p className="lede">{track.tagline}</p>
        </div>

        <div className="stack" style={{ gap: 10 }}>
          {lessons.map((lesson, index) => {
            const entry = progress.get(lesson.id);
            const unlocked = canOpenLesson(access, lesson);
            return (
              <Link
                className="lesson-row"
                key={lesson.id}
                href={unlocked ? `/learn/${track.id}/${lesson.id}` : "/pricing"}
                data-done={Boolean(entry)}
                data-locked={!unlocked}
              >
                <span className="lesson-index">{entry ? "✓" : index + 1}</span>
                <div style={{ flex: 1 }}>
                  <h3>{lesson.title}</h3>
                  <p className="small muted">
                    {unlocked ? lesson.blurb : lessonLockReason(access, lesson)}
                  </p>
                </div>
                <span className="pill">{entry ? `${entry.score}%` : `${lesson.minutes} min`}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
