import { db, newId, nowIso } from "@/lib/db";
import type { Viewer } from "@/lib/session";

export interface ProgressEntry {
  lessonId: string;
  score: number;
  completedAt: string;
}

export function loadProgress(viewer: Viewer): ProgressEntry[] {
  if (viewer.kind === "user") {
    return (
      db()
        .prepare<ProgressEntry>(
          "SELECT lesson_id AS lessonId, score, completed_at AS completedAt FROM progress WHERE user_id = ?"
        )
        .all(viewer.user.id)
    );
  }
  if (viewer.kind === "guest") {
    return db()
      .prepare<ProgressEntry>(
        "SELECT lesson_id AS lessonId, score, completed_at AS completedAt FROM guest_progress WHERE guest_id = ?"
      )
      .all(viewer.guestId);
  }
  return [];
}

export function progressMap(viewer: Viewer): Map<string, ProgressEntry> {
  return new Map(loadProgress(viewer).map((entry) => [entry.lessonId, entry]));
}

export function saveProgress(viewer: Viewer, lessonId: string, score: number): ProgressEntry {
  const clamped = Math.max(0, Math.min(100, Math.round(score)));
  const completedAt = nowIso();
  if (viewer.kind === "user") {
    db()
      .prepare(
        `INSERT INTO progress (id, user_id, lesson_id, score, completed_at) VALUES (?, ?, ?, ?, ?)
         ON CONFLICT(user_id, lesson_id) DO UPDATE SET score = MAX(score, excluded.score), completed_at = excluded.completed_at`
      )
      .run(newId(), viewer.user.id, lessonId, clamped, completedAt);
  } else if (viewer.kind === "guest") {
    db()
      .prepare(
        `INSERT INTO guest_progress (guest_id, lesson_id, score, completed_at) VALUES (?, ?, ?, ?)
         ON CONFLICT(guest_id, lesson_id) DO UPDATE SET score = MAX(score, excluded.score), completed_at = excluded.completed_at`
      )
      .run(viewer.guestId, lessonId, clamped, completedAt);
  } else {
    throw new Error("unauthenticated progress write");
  }
  return { lessonId, score: clamped, completedAt };
}

export function totalXp(entries: ProgressEntry[], xpFor: (lessonId: string) => number): number {
  return entries.reduce((sum, entry) => sum + xpFor(entry.lessonId), 0);
}
