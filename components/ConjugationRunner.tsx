"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import LocalScoreboard from "@/components/LocalScoreboard";
import type { GameScope } from "@/lib/gameTypes";
import { useGameScores } from "@/lib/useGameScores";

type Prompt = { inf: string; en: string; tense: string; tenseFr: string; person: string; personDisplay: string; constructionSummary?: string };
type Result = { correct: boolean; expected: string; raw: string };
const CONJUGATION_SCOPE: GameScope = { type: "conjugation", id: "all", label: "Conjugation" };

export default function ConjugationRunner({ prompts }: { prompts: Prompt[] }) {
  const { record } = useGameScores();
  const [index, setIndex] = useState(0);
  const [text, setText] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [busy, setBusy] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [done, setDone] = useState(false);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const recorded = useRef(false);

  const p = prompts[index];

  const next = useCallback(() => {
    if (index + 1 >= prompts.length) { setDone(true); return; }
    setIndex((i) => i + 1); setText(""); setResult(null);
  }, [index, prompts.length]);

  const submit = useCallback(async () => {
    if (!text.trim() || busy || result) return;
    setBusy(true);
    try {
      const res = await fetch("/api/conjugate", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inf: p.inf, tense: p.tense, person: p.person, answer: text }),
      });
      const data: Result = await res.json();
      setResult(data);
      if (data.correct) {
        setCorrectCount((c) => c + 1);
        setStreak((value) => { const nextValue = value + 1; setBestStreak((best) => Math.max(best, nextValue)); return nextValue; });
      } else setStreak(0);
    } finally { setBusy(false); }
  }, [text, busy, result, p]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (done) return;
      if (e.key === "Enter") { e.preventDefault(); result ? next() : submit(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [result, submit, next, done]);

  useEffect(() => {
    if (!done || recorded.current) return;
    const normalizedScore = prompts.length ? Math.round(correctCount / prompts.length * 1000) : 0;
    record({ scope: CONJUGATION_SCOPE, mode: "conjugation", modeLabel: "Conjugation challenge", score: normalizedScore, bestStreak });
    recorded.current = true;
  }, [bestStreak, correctCount, done, prompts.length, record]);

  if (done) {
    const pct = Math.round((correctCount / prompts.length) * 100);
    return (
      <>
      <div className="panel summary">
        <div className="score">{pct}%</div>
        <p className="lead">{correctCount} / {prompts.length} correct · best streak {bestStreak}</p>
        <div className="btn-row" style={{ justifyContent: "center" }}>
          <button className="btn" onClick={() => { recorded.current = false; setIndex(0); setText(""); setResult(null); setCorrectCount(0); setStreak(0); setBestStreak(0); setDone(false); }}>New set</button>
        </div>
      </div>
      <LocalScoreboard scope={CONJUGATION_SCOPE} compact />
      </>
    );
  }

  return (
    <div className="panel">
      <div className="runner-head">
        <span className="muted">{index + 1} of {prompts.length}</span>
        <span className="tag">{p.tenseFr} · streak {streak}</span>
      </div>
      <div className="progress" aria-hidden="true"><span style={{ width: `${(index / prompts.length) * 100}%` }} /></div>

      <p className="muted">Conjugate <strong className="fr">{p.inf}</strong> ({p.en}) — {p.tenseFr}</p>
      {p.constructionSummary && <p className="verb-game-construction"><strong>Common construction:</strong> <span className="fr" lang="fr">{p.constructionSummary}</span></p>}
      <p className="stem">
        {p.tense === "imperatif" ? (
          <span className="fr" lang="fr">(impératif · {p.personDisplay}) </span>
        ) : (
          <span className="fr" lang="fr">{p.tense.startsWith("subjonctif") ? "que " : ""}{p.personDisplay} </span>
        )}
        <span className="blank">_____</span>
      </p>

      <input className="text-input" lang="fr" value={text} disabled={!!result} autoFocus placeholder="Type the verb form…" onChange={(e) => setText(e.target.value)} aria-label="Conjugated form" />

      {result && (
        <div className={`feedback ${result.correct ? "correct" : "wrong"}`}>
          <h3><span className={`verdict ${result.correct ? "correct" : "wrong"}`}>{result.correct ? "✓ Correct" : "✗ Not quite"}</span></h3>
          <p>Answer: <strong className="fr" lang="fr">{result.expected}</strong></p>
        </div>
      )}

      <div className="btn-row">
        {!result ? (
          <button className="btn" onClick={submit} disabled={!text.trim() || busy}>{busy ? "Checking…" : "Check"}</button>
        ) : (
          <button className="btn" onClick={next} autoFocus>{index + 1 >= prompts.length ? "See score" : "Next"}</button>
        )}
        <span className="kbd-hint">Enter to {result ? "continue" : "check"}</span>
      </div>
    </div>
  );
}
