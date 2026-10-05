"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import LocalScoreboard from "./LocalScoreboard";
import { gameScoreKey, scoreArcadeAnswer } from "@/lib/gameScores";
import type { ArcadeItem, ArcadeMode, GameScope } from "@/lib/gameTypes";
import { useGameScores } from "@/lib/useGameScores";

type SharedMode = Extract<ArcadeMode, "survival" | "sprint" | "typed" | "match" | "verb-prepositions" | "y-en">;
type Feedback = { isCorrect: boolean; correctAnswer: string; explanation?: { correct_why?: string; grammar_rule?: string } };

export const ARCADE_MODE_INFO: Record<SharedMode, { label: string; description: string }> = {
  survival: { label: "Survival", description: "Mixed questions, three lives, and increasing streak bonuses." },
  sprint: { label: "Speed Sprint", description: "Answer as many multiple-choice questions as possible in 60 seconds." },
  typed: { label: "Typed Challenge", description: "Produce exact French answers with three lives." },
  match: { label: "Match-Up", description: "Complete matching boards for large point bonuses." },
  "verb-prepositions": { label: "Verb Prepositions", description: "Choose and produce the construction required by each verb." },
  "y-en": { label: "Y or En", description: "Replace complements and place y or en correctly." },
};

function stem(value?: string) {
  if (!value) return null;
  const parts = value.split("___");
  return parts.length === 1 ? value : <>{parts[0]}<span className="blank">_____</span>{parts.slice(1).join("___")}</>;
}

export default function ArcadeGame({ items, mode, scope }: { items: ArcadeItem[]; mode: SharedMode; scope: GameScope }) {
  const { store, record } = useGameScores();
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState("");
  const [text, setText] = useState("");
  const [matches, setMatches] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [lives, setLives] = useState(3);
  const [remaining, setRemaining] = useState(mode === "sprint" ? 60 : 0);
  const [done, setDone] = useState(false);
  const [newPersonalBest, setNewPersonalBest] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const recorded = useRef(false);
  const item = items[index];
  const isMcq = item && ["mcq_single", "listening_mcq", "dialogue_complete"].includes(item.type);
  const isMatch = item?.type === "matching";
  const response = isMatch ? matches : isMcq ? selected : text;
  const hasAnswer = isMatch ? !!item.left?.length && matches.filter(Boolean).length === item.left.length : String(response).trim().length > 0;
  const previousBest = store.scores[gameScoreKey(scope, mode)]?.highScore ?? 0;
  const rulesMode = mode === "verb-prepositions" || mode === "y-en" ? "survival" : mode;

  const finish = useCallback((finalScore = score, finalBestStreak = bestStreak) => {
    if (!recorded.current) {
      setNewPersonalBest(finalScore > previousBest);
      record({ scope, mode, modeLabel: ARCADE_MODE_INFO[mode].label, score: finalScore, bestStreak: finalBestStreak });
      recorded.current = true;
    }
    setDone(true);
  }, [bestStreak, mode, previousBest, record, scope, score]);

  useEffect(() => {
    if (mode !== "sprint" || done) return;
    if (remaining <= 0) { finish(); return; }
    const timer = window.setTimeout(() => setRemaining((value) => value - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [done, finish, mode, remaining]);

  const next = useCallback(() => {
    const outOfLives = (rulesMode === "survival" || rulesMode === "typed") && lives <= 0;
    if (outOfLives || index + 1 >= items.length) { finish(); return; }
    setIndex((value) => value + 1);
    setSelected(""); setText(""); setMatches([]); setFeedback(null); setError("");
  }, [finish, index, items.length, lives, rulesMode]);

  const submit = useCallback(async () => {
    if (!hasAnswer || submitting || feedback || done) return;
    setSubmitting(true); setError("");
    try {
      const result = await fetch("/api/check", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ itemId: item.id, response }) });
      if (!result.ok) throw new Error("This answer could not be checked.");
      const nextFeedback = await result.json() as Feedback;
      const nextStreak = nextFeedback.isCorrect ? streak + 1 : 0;
      const nextBest = Math.max(bestStreak, nextStreak);
      const delta = scoreArcadeAnswer(rulesMode, nextFeedback.isCorrect, streak, remaining);
      const nextScore = Math.max(0, score + delta);
      const nextLives = nextFeedback.isCorrect || (rulesMode !== "survival" && rulesMode !== "typed") ? lives : Math.max(0, lives - 1);
      setFeedback(nextFeedback); setStreak(nextStreak); setBestStreak(nextBest); setScore(nextScore); setLives(nextLives);
      if (mode === "sprint") window.setTimeout(() => {
        if (index + 1 >= items.length) finish(nextScore, nextBest);
        else { setIndex((value) => value + 1); setSelected(""); setFeedback(null); }
      }, 450);
    } catch (caught) { setError(caught instanceof Error ? caught.message : "This answer could not be checked."); }
    finally { setSubmitting(false); }
  }, [bestStreak, done, feedback, finish, hasAnswer, index, item, items.length, lives, mode, remaining, response, rulesMode, score, streak, submitting]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (done || submitting) return;
      if (isMcq && !feedback && /^[1-9]$/.test(event.key)) setSelected(item.options?.[Number(event.key) - 1] ?? "");
      if (event.key === "Enter") { event.preventDefault(); feedback ? next() : submit(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [done, feedback, isMcq, item, next, submit, submitting]);

  if (done) return (
    <>
      <section className="panel summary">
        <span className="game-label">{ARCADE_MODE_INFO[mode].label} complete</span>
        <div className="score">{score.toLocaleString()}</div>
        <p className="lead">Best streak: {bestStreak} · {newPersonalBest ? "New personal best!" : `Personal best: ${Math.max(previousBest, score).toLocaleString()}`}</p>
        <div className="btn-row" style={{ justifyContent: "center" }}>
          <Link className="btn" href={`/games/play?scope=${scope.type}&key=${encodeURIComponent(scope.id)}&mode=${mode}`}>Play again</Link>
          <Link className="btn secondary" href={`/games?scope=${scope.type}&key=${encodeURIComponent(scope.id)}`}>Choose a game</Link>
        </div>
      </section>
      <LocalScoreboard scope={scope} compact />
    </>
  );

  return (
    <section className="panel arcade-board">
      <div className="game-hud">
        {(rulesMode === "survival" || rulesMode === "typed") && <span className="lives" aria-label={`${lives} lives left`}>{"♥".repeat(lives)}<span className="lives-lost">{"♥".repeat(3 - lives)}</span></span>}
        {mode === "sprint" && <span className={`timer ${remaining <= 10 ? "low" : ""}`}>⏱ {remaining}s</span>}
        <span className="game-score">Score <strong>{score.toLocaleString()}</strong></span>
        <span className={`game-streak ${streak >= 3 ? "hot" : ""}`}>Streak {streak}</span>
      </div>
      {mode === "sprint" && <div className="game-timer"><span style={{ width: `${remaining / 60 * 100}%` }} /></div>}
      <div className="runner-head"><span>{item.prompt.instructions_en ?? "Choose or type the best answer."}</span><span className="muted">{index + 1}/{items.length}</span></div>
      <p className="game-prompt fr" lang="fr">{stem(item.prompt.fr)}</p>
      {isMcq && <div className="options" role="radiogroup">{item.options?.map((option, optionIndex) => {
        const state = feedback ? (option.trim().toLocaleLowerCase("fr-CA") === feedback.correctAnswer.trim().toLocaleLowerCase("fr-CA") ? "correct" : option === selected ? "wrong" : "") : selected === option ? "selected" : "";
        return <button key={optionIndex} className={`opt ${state}`} onClick={() => setSelected(option)} disabled={!!feedback}><span className="kbd-hint">{optionIndex + 1}.</span> {option}</button>;
      })}</div>}
      {isMatch && item.left && <div className="match-grid">{item.left.map((left, row) => <div className="match-row" key={left}><span className="match-left fr">{left}</span><span className="match-arrow">→</span><select className="match-select" value={matches[row] ?? ""} disabled={!!feedback} onChange={(event) => { const nextMatches = [...matches]; nextMatches[row] = event.target.value; setMatches(nextMatches); }}><option value="">— choisir —</option>{item.options?.map((option) => <option key={option}>{option}</option>)}</select></div>)}</div>}
      {!isMcq && !isMatch && <input className="text-input" lang="fr" value={text} onChange={(event) => setText(event.target.value)} disabled={!!feedback} autoFocus autoComplete="off" placeholder="Type your answer…" />}
      {error && <div className="note" role="alert">{error}</div>}
      {feedback && mode !== "sprint" && <div className={`feedback ${feedback.isCorrect ? "correct" : "wrong"}`} aria-live="polite"><h3 className={`verdict ${feedback.isCorrect ? "correct" : "wrong"}`}>{feedback.isCorrect ? "✓ Correct" : "✗ Not quite"}</h3>{!feedback.isCorrect && <p>Correct answer: <strong lang="fr">{feedback.correctAnswer}</strong></p>}<p>{feedback.explanation?.correct_why || feedback.explanation?.grammar_rule}</p></div>}
      <div className="btn-row">
        {!feedback ? <button className="btn" onClick={submit} disabled={!hasAnswer || submitting}>{submitting ? "Checking…" : "Check answer"}</button> : mode !== "sprint" && <button className="btn" onClick={next}>{lives <= 0 || index + 1 >= items.length ? "See results" : "Next"}</button>}
        <span className="kbd-hint">Enter to continue{isMcq ? " · number keys to choose" : ""}</span>
      </div>
    </section>
  );
}
