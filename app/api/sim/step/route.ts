import {
  handler,
  assertSameOrigin,
  parseJson,
  json,
  clientKey,
  ApiError,
} from "@/lib/http";
import { allow } from "@/lib/ratelimit";
import { simStepSchema, firstIssue } from "@/lib/validation";
import { getActor, accessOf, requireUser } from "@/lib/session";
import { simRoundsAllowed } from "@/lib/entitlements";
import { ROUNDS } from "@/content/simulator";
import { applyChoice, currentRound, loadState } from "@/lib/sim";

export const dynamic = "force-dynamic";

export const POST = handler(async (req) => {
  assertSameOrigin(req);
  const viewer = await getActor();
  const { user } = requireUser(viewer);
  if (!allow("progress", clientKey(req, user.id))) {
    throw new ApiError(429, "rate_limited", "Slow down a little.");
  }

  const parsed = simStepSchema.safeParse(await parseJson(req));
  if (!parsed.success) {
    throw new ApiError(400, "invalid_input", firstIssue(parsed.error));
  }

  const allowed = simRoundsAllowed(accessOf(viewer));
  const before = loadState(user.id);
  if (before.round >= ROUNDS.length) {
    throw new ApiError(409, "run_finished", "This run is finished. Start a new one.");
  }
  if (before.round >= allowed) {
    throw new ApiError(402, "upgrade_required", "The next round is part of Plus.");
  }

  const result = applyChoice(user.id, parsed.data.optionId);
  return json({
    state: result.state,
    round: currentRound(result.state),
    allowedRounds: allowed,
    totalRounds: ROUNDS.length,
    finished: result.finished,
    report: result.report,
    outcome: result.outcome,
  });
});
