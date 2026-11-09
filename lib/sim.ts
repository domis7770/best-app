import { db, nowIso } from "@/lib/db";
import { ROUNDS } from "@/content/simulator";
import { SCORES, MAX_ROUND } from "@/content/simulator-scores";

export interface SimState {
  round: number;
  cash: number;
  reach: number;
  trust: number;
  history: { round: number; optionId: string; title: string; feedback: string }[];
  finishedAt: string | null;
}

export interface SimResult {
  outcome: { cash: number; reach: number; trust: number; feedback: string };
  state: SimState;
  finished: boolean;
  report: SimReport | null;
}

export interface SimReport {
  score: number;
  verdict: string;
  summary: string;
}

const START: SimState = { round: 0, cash: 0, reach: 0, trust: 0, history: [], finishedAt: null };

interface Row {
  round: number;
  cash: number;
  reach: number;
  trust: number;
  history: string;
  finished_at: string | null;
}

export function loadState(userId: string): SimState {
  const row = db()
    .prepare(
      "SELECT round, cash, reach, trust, history, finished_at FROM sim_runs WHERE user_id = ?"
    )
    .get(userId) as Row | null;
  if (!row) return { ...START };
  let history: SimState["history"] = [];
  try {
    history = JSON.parse(row.history) as SimState["history"];
  } catch {
    history = [];
  }
  return {
    round: row.round,
    cash: row.cash,
    reach: row.reach,
    trust: row.trust,
    history,
    finishedAt: row.finished_at,
  };
}

export function resetState(userId: string): SimState {
  db()
    .prepare(
      `INSERT INTO sim_runs (user_id, round, cash, reach, trust, history, finished_at, updated_at)
       VALUES (?, 0, 0, 0, 0, '[]', NULL, ?)
       ON CONFLICT(user_id) DO UPDATE SET round = 0, cash = 0, reach = 0, trust = 0,
         history = '[]', finished_at = NULL, updated_at = excluded.updated_at`
    )
    .run(userId, nowIso());
  return { ...START };
}

export function currentRound(state: SimState) {
  return state.round < MAX_ROUND ? ROUNDS[state.round] : null;
}

export function applyChoice(userId: string, optionId: "a" | "b" | "c"): SimResult {
  const state = loadState(userId);
  const round = currentRound(state);
  if (!round) {
    return {
      outcome: { cash: 0, reach: 0, trust: 0, feedback: "The run is already finished." },
      state,
      finished: true,
      report: finalReport(state),
    };
  }

  const scores = SCORES[round.id];
  const outcome = scores?.[optionId];
  if (!outcome) {
    throw new Error("unknown option");
  }
  const option = round.options.find((entry) => entry.id === optionId);
  if (!option) throw new Error("unknown option");

  const next: SimState = {
    round: state.round + 1,
    cash: state.cash + outcome.cash,
    reach: state.reach + outcome.reach,
    trust: state.trust + outcome.trust,
    history: [
      ...state.history,
      {
        round: round.round,
        optionId,
        title: option.title,
        feedback: outcome.feedback,
      },
    ],
    finishedAt: state.round + 1 >= MAX_ROUND ? nowIso() : null,
  };

  // Upsert first: a run may not exist yet on the very first choice.
  db()
    .prepare(
      `INSERT INTO sim_runs (user_id, round, cash, reach, trust, history, finished_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(user_id) DO UPDATE SET round = excluded.round, cash = excluded.cash,
         reach = excluded.reach, trust = excluded.trust, history = excluded.history,
         finished_at = excluded.finished_at, updated_at = excluded.updated_at`
    )
    .run(
      userId,
      next.round,
      next.cash,
      next.reach,
      next.trust,
      JSON.stringify(next.history),
      next.finishedAt,
      nowIso()
    );

  return {
    outcome,
    state: next,
    finished: next.round >= MAX_ROUND,
    report: next.round >= MAX_ROUND ? finalReport(next) : null,
  };
}

export function finalReport(state: SimState): SimReport | null {
  if (!state.finishedAt) return null;
  const score = Math.max(0, state.cash * 6 + state.reach * 4 + state.trust * 8 + 40);
  const verdict =
    score >= 95 ? "Compounding" : score >= 70 ? "Sustainable" : score >= 45 ? "Fragile" : "Burning";
  const summary =
    state.trust <= 0
      ? "Growth without trust — you can rebuild, but the next incident decides whether anyone stays."
      : state.cash <= 2
        ? "You earned attention before revenue. The product is real; the business is not yet."
        : state.reach <= 3
          ? "A tight, profitable operation with a small audience. Depth is a legitimate strategy — widen only once retention is boring."
          : "Revenue, reach and trust moved together. That is what compounding looks like.";
  return { score: Math.min(100, score), verdict, summary };
}
