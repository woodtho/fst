"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";

type SanitizedItem = {
  id: string;
  type: string;
  difficulty: string;
  skill: string;
  estTimeSec: number;
  prompt: { fr?: string; en?: string; instructions_en?: string; media?: any };
  options?: string[];
  tokens?: string[];
  left?: string[];
};

type Feedback = {
  isCorrect: boolean;
  partialScore: number;
  correctAnswer: string;
  explanation: {
    correct_why: string;
    distractor_why?: Record<string, string>;
    grammar_rule: string;
    vocab_notes: string;
    common_mistakes: string[];
  };
  tip: { memory_aid: string; pattern: string; similar: string[] };
};

type LogEntry = { item: SanitizedItem; responseText: string; feedback: Feedback };

const MCQ = new Set(["mcq_single", "mcq_multi", "listening_mcq", "dialogue_complete"]);

function renderStem(fr?: string) {
  if (!fr) return null;
  const parts = fr.split("___");
  if (parts.length === 1) return <span>{fr}</span>;
  return (<span>{parts[0]}<span className="blank">_____</span>{parts.slice(1).join("___")}</span>);
}

function Explain({ fb }: { fb: Feedback }) {
  return (
    <>
      <div className="explain">
        <dl>
          <dt>Why this is correct</dt>
          <dd>{fb.explanation.correct_why}</dd>
          {fb.explanation.distractor_why && Object.keys(fb.explanation.distractor_why).length > 0 && (
            <>
              <dt>Why the alternatives are wrong</dt>
              <dd><ul>{Object.entries(fb.explanation.distractor_why).map(([t, w]) => <li key={t}>{w}</li>)}</ul></dd>
            </>
          )}
          <dt>Grammar rule</dt><dd>{fb.explanation.grammar_rule}</dd>
          <dt>Vocabulary notes</dt><dd>{fb.explanation.vocab_notes}</dd>
          <dt>Common mistakes</dt><dd><ul>{fb.explanation.common_mistakes.map((m, i) => <li key={i}>{m}</li>)}</ul></dd>
        </dl>
      </div>
      <div className="tip">
        <h4>💡 Learning tip</h4>
        <p><strong>Memory aid:</strong> {fb.tip.memory_aid}</p>
        <p><strong>Pattern:</strong> {fb.tip.pattern}</p>
        <p><strong>Similar:</strong> <span className="fr" lang="fr">{fb.tip.similar.join(" · ")}</span></p>
      </div>
    </>
  );
}

export default function ExerciseRunner({
  items,
  objectiveId,
  backHref,
  backLabel,
  examMode = false,
  timeLimitSec,
}: {
  items: SanitizedItem[];
  objectiveId?: string;
  backHref?: string;
  backLabel?: string;
  examMode?: boolean;
  timeLimitSec?: number;
}) {
  const homeHref = backHref ?? (objectiveId ? `/learn/${objectiveId}` : "/");
  const homeLabel = backLabel ?? (objectiveId ? "Back to module" : "Done");

  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [built, setBuilt] = useState<string[]>([]);
  const [matches, setMatches] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [startedAt] = useState(() => Date.now());
  const [done, setDone] = useState(false);
  const [log, setLog] = useState<LogEntry[]>([]);
  const [remaining, setRemaining] = useState<number | null>(timeLimitSec ?? null);

  const item = items[index];
  const isMcq = item && MCQ.has(item.type);
  const isBuild = item && item.type === "sentence_build";
  const isMatch = item && item.type === "matching";

  const response = useMemo(() => {
    if (isMcq) return selected;
    if (isBuild) return built;
    if (isMatch) return matches;
    return text;
  }, [isMcq, isBuild, isMatch, selected, built, matches, text]);

  const responseText = useMemo(() => {
    if (Array.isArray(response)) return response.join(" ");
    return response ?? "";
  }, [response]);

  const hasAnswer =
    (isMcq && selected !== null) ||
    (isBuild && built.length > 0) ||
    (isMatch && item?.left != null && matches.filter(Boolean).length === item.left.length) ||
    (!isMcq && !isBuild && !isMatch && text.trim().length > 0);

  const reset = () => { setSelected(null); setText(""); setBuilt([]); setMatches([]); setFeedback(null); setError(null); };

  const finish = useCallback(() => setDone(true), []);

  const next = useCallback(() => {
    if (index + 1 >= items.length) { finish(); return; }
    setIndex((i) => i + 1); reset();
  }, [index, items.length, finish]);

  const submit = useCallback(async () => {
    if (!hasAnswer || submitting || (feedback && !examMode)) return;
    setSubmitting(true); setError(null);
    try {
      const res = await fetch("/api/check", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId: item.id, response }),
      });
      if (!res.ok) throw new Error(`Server returned ${res.status}`);
      const data: Feedback = await res.json();
      if (data.isCorrect) setCorrectCount((c) => c + 1);
      setLog((l) => [...l, { item, responseText, feedback: data }]);
      if (examMode) { next(); } else { setFeedback(data); }
    } catch (e: any) {
      setError(e.message ?? "Could not grade this answer.");
    } finally { setSubmitting(false); }
  }, [hasAnswer, submitting, feedback, examMode, item, response, responseText, next]);

  // Countdown (exam mode with a time limit)
  useEffect(() => {
    if (remaining == null || done) return;
    if (remaining <= 0) { finish(); return; }
    const t = setTimeout(() => setRemaining((r) => (r == null ? r : r - 1)), 1000);
    return () => clearTimeout(t);
  }, [remaining, done, finish]);

  // Keyboard
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (done) return;
      if (e.key === "Enter") { e.preventDefault(); if (feedback && !examMode) next(); else submit(); }
      else if (isMcq && !feedback && /^[1-9]$/.test(e.key)) {
        const i = parseInt(e.key, 10) - 1;
        if (item?.options && i < item.options.length) setSelected(item.options[i]);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [feedback, isMcq, item, submit, next, done, examMode]);

  if (done) {
    const pct = items.length ? Math.round((correctCount / items.length) * 100) : 0;
    const secs = Math.round((Date.now() - startedAt) / 1000);
    return (
      <>
        <div className="panel summary">
          <div className="score">{pct}%</div>
          <p className="lead">{correctCount} / {items.length} correct · {secs}s</p>
          <p className="muted">
            {pct >= 80 ? "Strong — this looks like mastery." : pct >= 60 ? "Almost there — review the misses below." : "Keep practising — focus on the weak items below."}
          </p>
          <div className="btn-row" style={{ justifyContent: "center" }}>
            <button className="btn" onClick={() => { setIndex(0); setCorrectCount(0); setDone(false); setLog([]); setRemaining(timeLimitSec ?? null); reset(); }}>Retry</button>
            <Link className="btn secondary" href={homeHref}>{homeLabel}</Link>
          </div>
        </div>
        {examMode && (
          <div className="panel">
            <h2 style={{ marginTop: 0 }}>Review</h2>
            {log.map((e, i) => (
              <details key={i} className={`review-item ${e.feedback.isCorrect ? "ok" : "bad"}`}>
                <summary>
                  <span className={`verdict ${e.feedback.isCorrect ? "correct" : "wrong"}`}>{e.feedback.isCorrect ? "✓" : "✗"}</span>{" "}
                  <span className="fr" lang="fr">{e.item.prompt.fr}</span>
                </summary>
                <p className="muted">Your answer: <strong className="fr">{e.responseText || "—"}</strong>{!e.feedback.isCorrect && <> · Correct: <strong className="fr" lang="fr">{e.feedback.correctAnswer}</strong></>}</p>
                <Explain fb={e.feedback} />
              </details>
            ))}
          </div>
        )}
      </>
    );
  }

  return (
    <div className="panel">
      <div className="runner-head">
        <span className="muted">Question {index + 1} of {items.length}</span>
        <span style={{ display: "flex", gap: 12, alignItems: "center" }}>
          {remaining != null && <span className={`timer ${remaining < 20 ? "low" : ""}`}>⏱ {Math.floor(remaining / 60)}:{String(remaining % 60).padStart(2, "0")}</span>}
          <span className={`diff ${item.difficulty}`}>{item.difficulty}</span>
        </span>
      </div>
      <div className="progress" aria-hidden="true"><span style={{ width: `${((index + (feedback ? 1 : 0)) / items.length) * 100}%` }} /></div>

      {item.prompt.instructions_en && <p className="muted">{item.prompt.instructions_en}</p>}
      {item.prompt.media?.audioUrl && (
        <div className="note">🔊 Listening item. Audio (<code>{item.prompt.media.audioUrl}</code>) is a placeholder in this build — answer from the written options.</div>
      )}

      <p className="stem fr" lang="fr">{renderStem(item.prompt.fr)}</p>

      {isMcq && (
        <div className="options" role="radiogroup" aria-label="Answer options">
          {item.options?.map((opt, i) => {
            let cls = "opt";
            if (feedback) {
              const isCorrectOpt = opt.trim().toLowerCase() === feedback.correctAnswer.trim().toLowerCase();
              if (isCorrectOpt) cls += " correct"; else if (opt === selected) cls += " wrong";
            } else if (opt === selected) cls += " selected";
            return (
              <button key={i} className={cls} lang="fr" disabled={!!feedback} onClick={() => setSelected(opt)} role="radio" aria-checked={opt === selected}>
                <span className="kbd-hint">{i + 1}.</span> {opt}
              </button>
            );
          })}
        </div>
      )}

      {isBuild && (
        <>
          <div className="build-area" aria-label="Your sentence">
            {built.map((tok, i) => (<button key={i} className="token" disabled={!!feedback} onClick={() => setBuilt((b) => b.filter((_, j) => j !== i))}>{tok}</button>))}
            {built.length === 0 && <span className="muted">Tap tokens below to build the sentence…</span>}
          </div>
          <div className="tokens">
            {item.tokens?.map((tok, i) => {
              const used = built.filter((b) => b === tok).length >= item.tokens!.filter((t) => t === tok).length;
              return (<button key={i} className={`token ${used ? "used" : ""}`} lang="fr" disabled={!!feedback || used} onClick={() => setBuilt((b) => [...b, tok])}>{tok}</button>);
            })}
          </div>
        </>
      )}

      {isMatch && item.left && (
        <div className="match-grid">
          {item.left.map((leftLabel, i) => (
            <div className="match-row" key={i}>
              <span className="match-left fr" lang="fr">{leftLabel}</span>
              <span className="match-arrow">→</span>
              <select className="match-select" lang="fr" disabled={!!feedback} value={matches[i] ?? ""} onChange={(e) => { const n = [...matches]; n[i] = e.target.value; setMatches(n); }} aria-label={`Match for ${leftLabel}`}>
                <option value="">— choisir —</option>
                {item.options?.map((opt, j) => <option key={j} value={opt}>{opt}</option>)}
              </select>
            </div>
          ))}
        </div>
      )}

      {!isMcq && !isBuild && !isMatch && (
        <input className="text-input" lang="fr" value={text} disabled={!!feedback} placeholder="Type your answer…" onChange={(e) => setText(e.target.value)} aria-label="Your answer" autoFocus />
      )}

      {error && <div className="note" style={{ borderColor: "var(--incorrect)" }}>{error}</div>}

      {feedback && !examMode && (
        <div className={`feedback ${feedback.isCorrect ? "correct" : "wrong"}`}>
          <h3><span className={`verdict ${feedback.isCorrect ? "correct" : "wrong"}`}>{feedback.isCorrect ? "✓ Correct" : "✗ Not quite"}</span></h3>
          {!feedback.isCorrect && <p>Correct answer: <strong className="fr" lang="fr">{feedback.correctAnswer}</strong></p>}
          <Explain fb={feedback} />
        </div>
      )}

      <div className="btn-row">
        {!feedback || examMode ? (
          <button className="btn" onClick={submit} disabled={!hasAnswer || submitting}>
            {submitting ? "Checking…" : examMode ? (index + 1 >= items.length ? "Submit & finish" : "Submit & next") : "Submit"}
          </button>
        ) : (
          <button className="btn" onClick={next} autoFocus>{index + 1 >= items.length ? "See results" : "Next"}</button>
        )}
        <span className="kbd-hint">Press Enter{isMcq && !feedback ? " · number keys to choose" : ""}{examMode ? " · feedback at the end" : ""}</span>
      </div>
    </div>
  );
}
