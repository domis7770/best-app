import {
  handler,
  assertSameOrigin,
  parseJson,
  json,
  clientKey,
  ApiError,
} from "@/lib/http";
import { allow } from "@/lib/ratelimit";
import { progressSchema, firstIssue } from "@/lib/validation";
import { getActor, accessOf } from "@/lib/session";
import { findLesson } from "@/content";
import { canOpenLesson } from "@/lib/entitlements";
import { saveProgress } from "@/lib/progress";

export const dynamic = "force-dynamic";

export const POST = handler(async (req) => {
  assertSameOrigin(req);
  const viewer = await getActor();
  if (viewer.kind === "anon") {
    throw new ApiError(401, "sign_in_required", "Sign in to save progress.");
  }
  if (!allow("progress", clientKey(req, viewer.kind === "user" ? viewer.user.id : viewer.guestId))) {
    throw new ApiError(429, "rate_limited", "Too many saves. Slow down a little.");
  }

  const parsed = progressSchema.safeParse(await parseJson(req));
  if (!parsed.success) {
    throw new ApiError(400, "invalid_input", firstIssue(parsed.error));
  }

  const lesson = findLesson(parsed.data.lessonId);
  if (!lesson) throw new ApiError(404, "not_found", "That lesson does not exist.");
  if (!canOpenLesson(accessOf(viewer), lesson)) {
    throw new ApiError(403, "not_in_plan", "That lesson is not available on your plan.");
  }

  const entry = saveProgress(viewer, lesson.id, parsed.data.score);
  return json({ lessonId: entry.lessonId, score: entry.score, xp: lesson.xp });
});
