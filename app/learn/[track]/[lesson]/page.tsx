import Link from "next/link";
import { notFound } from "next/navigation";
import { findLesson, findTrack, lessonsForTrack } from "@/content";
import { getActor, accessOf } from "@/lib/session";
import { progressMap } from "@/lib/progress";
import { canOpenLesson, lessonLockReason } from "@/lib/entitlements";
import { LessonPlayer } from "../../../components/LessonPlayer";
import { GuestButton } from "../../../components/Forms";

export default async function LessonPage({
  params,
}: {
  params: Promise<{ track: string; lesson: string }>;
}) {
  const { track: trackId, lesson: lessonId } = await params;
  const lesson = findLesson(lessonId);
  const track = findTrack(trackId);
  if (!lesson || !track || lesson.trackId !== track.id) notFound();

  const viewer = await getActor();
  const access = accessOf(viewer);
  const unlocked = canOpenLesson(access, lesson);
  const progress = progressMap(viewer);
  const entry = progress.get(lesson.id);

  if (!unlocked) {
    return (
      <div className="page">
        <div className="container">
          <div className="paywall">
            <span className="eyebrow">{track.name}</span>
            <h2 style={{ margin: "10px 0 12px" }}>{lesson.title}</h2>
            <p className="lede" style={{ margin: "0 auto 20px" }}>
              {lessonLockReason(access, lesson)}
            </p>
            {viewer.kind === "anon" ? (
              <div className="row" style={{ justifyContent: "center" }}>
                <Link className="btn" href="/signup">
                  Create a free account
                </Link>
                <GuestButton label="Try two lessons first" />
              </div>
            ) : viewer.kind === "guest" ? (
              <Link className="btn" href="/signup">
                Create a free account
              </Link>
            ) : (
              <Link className="btn" href="/pricing">
                See plans
              </Link>
            )}
          </div>
        </div>
      </div>
    );
  }

  const siblings = lessonsForTrack(lesson.trackId);
  const index = siblings.findIndex((item) => item.id === lesson.id);
  const next = siblings[index + 1];
  const nextHref = next && canOpenLesson(access, next) ? `/learn/${track.id}/${next.id}` : null;

  return (
    <div className="page">
      <div className="container lesson-wrap">
        <Link className="small muted" href={`/learn/${track.id}`}>
          ← {track.name}
        </Link>
        <div className="lesson-meta" style={{ marginTop: 12 }}>
          <span className="pill">
            {index + 1} of {siblings.length}
          </span>
          <span className="pill">{lesson.minutes} min</span>
          <span className="pill">{lesson.xp} XP</span>
          {entry ? <span className="pill pill-accent">best {entry.score}%</span> : null}
        </div>
        <h1 style={{ fontSize: "clamp(1.7rem, 3.4vw, 2.4rem)", marginBottom: 8 }}>
          {lesson.title}
        </h1>
        <p className="lede" style={{ marginBottom: 22 }}>
          {lesson.blurb}
        </p>
        <LessonPlayer lesson={lesson} nextHref={nextHref} alreadyDone={Boolean(entry)} />
      </div>
    </div>
  );
}
