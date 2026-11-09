"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { SimRound } from "@/content/simulator";
import type { SimReport, SimState } from "@/lib/sim";
import { post } from "@/lib/client";

interface StepResponse {
  state: SimState;
  round: SimRound | null;
  allowedRounds: number;
  finished: boolean;
  report: SimReport | null;
  outcome: { cash: number; reach: number; trust: number; feedback: string };
}

export function SimClient({
  initial,
  round,
  allowedRounds,
  totalRounds,
  report,
}: {
  initial: SimState;
  round: SimRound | null;
  allowedRounds: number;
  totalRounds: number;
  report: SimReport | null;
}) {
  const router = useRouter();
  const [state, setState] = useState(initial);
  const [current, setCurrent] = useState<SimRound | null>(round);
  const [finished, setFinished] = useState(Boolean(report));
  const [summary, setSummary] = useState<SimReport | null>(report);
  const [feedback, setFeedback] = useState<string | null>(
    initial.history.length ? initial.history[initial.history.length - 1].feedback : null
  );
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [gated, setGated] = useState(Boolean(round) && initial.round >= allowedRounds);

  async function choose(optionId: "a" | "b" | "c") {
    setPending(true);
    setError(null);
    try {
      const result = await post<StepResponse>("/api/sim/step", { optionId });
      setState(result.state);
      setCurrent(result.round);
      setFinished(result.finished);
      setSummary(result.report);
      setFeedback(result.outcome.feedback);
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong.";
      const code = (err as Error & { code?: string }).code;
      if (code === "upgrade_required") {
        setGated(true);
        setError(null);
      } else {
        setError(message);
      }
    } finally {
      setPending(false);
    }
  }

  async function restart() {
    setPending(true);
    try {
      await post("/api/sim/reset");
      window.location.reload();
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="stack">
      <div className="metric-grid">
        <div className="metric">
          <span>Cash</span>
          <strong>{state.cash}</strong>
        </div>
        <div className="metric">
          <span>Reach</span>
          <strong>{state.reach}</strong>
        </div>
        <div className="metric">
          <span>Trust</span>
          <strong>{state.trust}</strong>
        </div>
      </div>

      <p className="small muted">
        Round {Math.min(state.round + (finished ? 0 : 1), totalRounds)} of {totalRounds} · your plan
        covers {allowedRounds}
      </p>

      {error ? <div className="form-error">{error}</div> : null}

      {gated && !finished ? (
        <div className="paywall">
          <h3>The next round is on Plus</h3>
          <p className="lede" style={{ margin: "10px auto 18px" }}>
            You played the first {allowedRounds} rounds. Plus unlocks all five, plus every work
            lesson.
          </p>
          <Link className="btn" href="/pricing">
            See plans
          </Link>
        </div>
      ) : null}

      {!finished && !gated && current ? (
        <div className="card">
          <span className="eyebrow">Round {current.round}</span>
          <h2 style={{ margin: "8px 0 10px" }}>{current.title}</h2>
          <p className="lede" style={{ marginBottom: 8 }}>
            {current.situation}
          </p>
          <p className="small muted" style={{ marginBottom: 16 }}>
            {current.metricHint}
          </p>
          <div className="stack">
            {current.options.map((option) => (
              <button
                key={option.id}
                className="choice"
                disabled={pending}
                onClick={() => choose(option.id)}
              >
                <strong>{option.title}</strong>
                <span>{option.detail}</span>
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {feedback ? <div className="feedback">{feedback}</div> : null}

      {finished && summary ? (
        <div className="report">
          <span className="eyebrow">Final report</span>
          <div className="report-score">
            {summary.score}
            <span className="muted" style={{ fontSize: "1rem" }}>
              /100
            </span>
          </div>
          <h3 style={{ margin: "6px 0 8px" }}>{summary.verdict}</h3>
          <p className="lede">{summary.summary}</p>
          <div className="row" style={{ marginTop: 18 }}>
            <button className="btn btn-ghost" disabled={pending} onClick={restart}>
              Run it again
            </button>
            <Link className="btn" href="/learn">
              Back to lessons
            </Link>
          </div>
        </div>
      ) : null}

      {state.history.length > 0 ? (
        <div className="card card-flat">
          <h3 style={{ marginBottom: 10 }}>Your decisions</h3>
          {state.history.map((entry) => (
            <div className="audit-row" key={entry.round}>
              <span>
                R{entry.round} · {entry.title}
              </span>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
