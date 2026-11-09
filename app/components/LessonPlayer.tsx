"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Lesson } from "@/content/types";
import { post } from "@/lib/client";

export function LessonPlayer({
  lesson,
  nextHref,
  alreadyDone,
}: {
  lesson: Lesson;
  nextHref: string | null;
  alreadyDone: boolean;
}) {
  const router = useRouter();
  const [picked, setPicked] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [xp, setXp] = useState<number | null>(null);

  const answered = Object.keys(picked).length === lesson.quiz.length;
  const correct = lesson.quiz.filter((question, index) => picked[index] === question.answer).length;
  const score = Math.round((correct / lesson.quiz.length) * 100);

  async function finish() {
    setSaving(true);
    setError(null);
    try {
      const result = await post<{ xp: number }>("/api/progress", {
        lessonId: lesson.id,
        score,
      });
      setXp(result.xp);
      setSubmitted(true);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save that.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="stack">
      {lesson.blocks.map((block, index) => {
        if (block.kind === "prompt") {
          return (
            <div className="prompt-block" key={index}>
              {block.label ? <span className="block-label">{block.label}</span> : null}
              {block.body}
            </div>
          );
        }
        if (block.kind === "callout") {
          return (
            <div className="callout" key={index}>
              {block.label ? <span className="block-label">{block.label}</span> : null}
              {block.body}
            </div>
          );
        }
        if (block.kind === "compare") {
          return (
            <div key={index}>
              {block.label ? <span className="block-label">{block.label}</span> : null}
              <div className="compare">
                <div>{block.body}</div>
                <div>{block.body2}</div>
              </div>
            </div>
          );
        }
        return (
          <p className="block" key={index}>
            {block.label ? <span className="block-label">{block.label}</span> : null}
            {block.body}
          </p>
        );
      })}

      <div className="quiz">
        {lesson.quiz.map((question, qIndex) => (
          <div className="q-card" key={qIndex}>
            <div className="q-text">
              {qIndex + 1}. {question.question}
            </div>
            {question.options.map((option, oIndex) => {
              const isPicked = picked[qIndex] === oIndex;
              const result = submitted
                ? oIndex === question.answer
                  ? "correct"
                  : isPicked
                    ? "wrong"
                    : undefined
                : undefined;
              return (
                <button
                  type="button"
                  className="option"
                  key={oIndex}
                  data-picked={!submitted && isPicked}
                  data-result={result}
                  disabled={submitted}
                  onClick={() => setPicked((prev) => ({ ...prev, [qIndex]: oIndex }))}
                >
                  {option}
                </button>
              );
            })}
            {submitted ? <p className="explain">{question.explain}</p> : null}
          </div>
        ))}
      </div>

      {error ? <div className="form-error">{error}</div> : null}

      {submitted ? (
        <>
          <div className="takeaways">
            <h3 style={{ marginBottom: 8 }}>Take these with you</h3>
            <ul>
              {lesson.takeaways.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
          <div className="card">
            <div className="spread">
              <div>
                <h3>
                  {correct}/{lesson.quiz.length} correct · {score}%
                </h3>
                <p className="small muted">
                  +{xp ?? lesson.xp} XP{score === 100 ? " · perfect" : ""}
                  {alreadyDone ? " · best score kept" : ""}
                </p>
              </div>
              {nextHref ? (
                <Link className="btn" href={nextHref}>
                  Next lesson →
                </Link>
              ) : (
                <Link className="btn" href="/learn">
                  Back to tracks
                </Link>
              )}
            </div>
          </div>
        </>
      ) : (
        <button className="btn btn-block" disabled={!answered || saving} onClick={finish}>
          {saving ? "Saving…" : answered ? "Finish lesson" : "Answer both questions to finish"}
        </button>
      )}
    </div>
  );
}
