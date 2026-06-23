"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type Entry = { fr: string; en: string; of: number; objectiveId: string };

const EN_STOP = new Set(["the", "a", "an", "to", "at", "of", "in", "some", "with", "and", "or", "this", "that", "these"]);
const frBare = (fr: string) => fr.replace(/\s*\([^)]*\)\s*/g, " ").replace(/\s+/g, " ").trim();

function clean(entries: Entry[]): Entry[] {
  const seen = new Set<string>();
  const out: Entry[] = [];
  for (const e of entries) {
    const k = e.en.trim().toLowerCase();
    if (!e.fr || !e.en) continue;
    if (frBare(e.fr).length < 2) continue;
    if (EN_STOP.has(k)) continue;
    if (seen.has(k)) continue;
    if (frBare(e.fr).toLowerCase() === k) continue;
    seen.add(k);
    out.push({ ...e, fr: frBare(e.fr) });
  }
  return out;
}
function shuffle<T>(a: T[]): T[] { const r = [...a]; for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [r[i], r[j]] = [r[j], r[i]]; } return r; }

const QUESTION_TIME = 9; // seconds

type Question = { prompt: string; answer: string; options: string[]; promptOf: string };

export default function LexiconGame({ entries }: { entries: Entry[] }) {
  const [direction, setDirection] = useState<"fe" | "ef">("fe");
  const [scope, setScope] = useState<"all" | "A" | "B">("all");
  const [phase, setPhase] = useState<"start" | "play" | "over">("start");

  const [lives, setLives] = useState(3);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [best, setBest] = useState(0);
  const [answered, setAnswered] = useState(0);
  const [q, setQ] = useState<Question | null>(null);
  const [picked, setPicked] = useState<string | null>(null);
  const [locked, setLocked] = useState(false);
  const [timeLeft, setTimeLeft] = useState(QUESTION_TIME);

  const poolRef = useRef<Entry[]>([]);
  const advanceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const pool = useMemo(() => {
    const scoped = entries.filter((e) => (scope === "all" ? true : scope === "A" ? e.of <= 20 : e.of >= 21));
    return clean(scoped);
  }, [entries, scope]);

  const makeQuestion = useCallback((p: Entry[]): Question => {
    const correct = p[Math.floor(Math.random() * p.length)];
    const distractors = shuffle(p.filter((e) => e.en !== correct.en)).slice(0, 3);
    const opts = shuffle([correct, ...distractors]);
    if (direction === "fe") {
      return { prompt: correct.fr, answer: correct.en, options: opts.map((o) => o.en), promptOf: correct.objectiveId };
    }
    return { prompt: correct.en, answer: correct.fr, options: opts.map((o) => o.fr), promptOf: correct.objectiveId };
  }, [direction]);

  const nextQuestion = useCallback(() => {
    setPicked(null);
    setLocked(false);
    setTimeLeft(QUESTION_TIME);
    setQ(makeQuestion(poolRef.current));
  }, [makeQuestion]);

  const start = () => {
    poolRef.current = pool;
    setLives(3); setScore(0); setStreak(0); setBest(0); setAnswered(0);
    setPhase("play");
    setPicked(null); setLocked(false); setTimeLeft(QUESTION_TIME);
    setQ(makeQuestion(pool));
  };

  const resolve = useCallback((choice: string | null) => {
    if (locked || !q) return;
    setLocked(true);
    setPicked(choice);
    setAnswered((a) => a + 1);
    const correct = choice === q.answer;
    if (correct) {
      setScore((s) => s + 10 + Math.min(streak, 10) * 2);
      setStreak((st) => { const n = st + 1; setBest((b) => Math.max(b, n)); return n; });
    } else {
      setStreak(0);
      setLives((l) => l - 1);
    }
    advanceRef.current = setTimeout(() => {
      setLives((l) => {
        if (l <= 0) { setPhase("over"); return l; }
        nextQuestion();
        return l;
      });
    }, correct ? 650 : 1100);
  }, [locked, q, streak, nextQuestion]);

  // countdown
  useEffect(() => {
    if (phase !== "play" || locked) return;
    if (timeLeft <= 0) { resolve(null); return; }
    const t = setTimeout(() => setTimeLeft((x) => Math.max(0, +(x - 0.1).toFixed(1))), 100);
    return () => clearTimeout(t);
  }, [phase, locked, timeLeft, resolve]);

  // keyboard 1-4
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (phase !== "play" || locked || !q) return;
      if (/^[1-4]$/.test(e.key)) { const i = +e.key - 1; if (i < q.options.length) resolve(q.options[i]); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase, locked, q, resolve]);

  useEffect(() => () => { if (advanceRef.current) clearTimeout(advanceRef.current); }, []);

  if (phase === "start") {
    return (
      <div className="panel game-start">
        <h2 style={{ marginTop: 0 }}>Lexicon game 🎯</h2>
        <p className="muted">Pick the right translation before the timer runs out. 3 lives, build a streak for bonus points.</p>
        <div className="game-opt">
          <span className="game-label">Direction</span>
          <div className="filterbar" style={{ margin: 0 }}>
            <button className={`chip ${direction === "fe" ? "active" : ""}`} onClick={() => setDirection("fe")}>Français → English</button>
            <button className={`chip ${direction === "ef" ? "active" : ""}`} onClick={() => setDirection("ef")}>English → Français</button>
          </div>
        </div>
        <div className="game-opt">
          <span className="game-label">Vocabulary</span>
          <div className="filterbar" style={{ margin: 0 }}>
            <button className={`chip ${scope === "all" ? "active" : ""}`} onClick={() => setScope("all")}>All ({entries.length})</button>
            <button className={`chip ${scope === "A" ? "active" : ""}`} onClick={() => setScope("A")}>Level A (OF 1–20)</button>
            <button className={`chip ${scope === "B" ? "active" : ""}`} onClick={() => setScope("B")}>Level B (OF 21–40)</button>
          </div>
        </div>
        <div className="btn-row"><button className="btn" onClick={start} disabled={pool.length < 4}>Start game</button>
          <span className="kbd-hint">{pool.length} words · keys 1–4 to answer</span>
        </div>
      </div>
    );
  }

  if (phase === "over") {
    return (
      <div className="panel summary">
        <div className="score">{score}</div>
        <p className="lead">Game over · {answered} answered · best streak {best}</p>
        <div className="btn-row" style={{ justifyContent: "center" }}>
          <button className="btn" onClick={start}>Play again</button>
          <button className="btn secondary" onClick={() => setPhase("start")}>Change settings</button>
        </div>
      </div>
    );
  }

  return (
    <div className="panel">
      <div className="game-hud">
        <span className="lives">{"♥".repeat(lives)}<span className="lives-lost">{"♥".repeat(3 - lives)}</span></span>
        <span className="game-score">Score <strong>{score}</strong></span>
        <span className={`game-streak ${streak >= 3 ? "hot" : ""}`}>🔥 {streak}</span>
      </div>
      <div className="game-timer" aria-hidden="true"><span style={{ width: `${(timeLeft / QUESTION_TIME) * 100}%`, background: timeLeft < 3 ? "var(--incorrect)" : "var(--brand)" }} /></div>

      <p className="muted" style={{ marginTop: 14 }}>{direction === "fe" ? "What does this mean?" : "How do you say this in French?"}</p>
      <p className="game-prompt fr" lang={direction === "fe" ? "fr" : "en"}>{q?.prompt}</p>

      <div className="options">
        {q?.options.map((opt, i) => {
          let cls = "opt";
          if (locked) {
            if (opt === q.answer) cls += " correct";
            else if (opt === picked) cls += " wrong";
          }
          return (
            <button key={i} className={cls} lang={direction === "fe" ? "en" : "fr"} disabled={locked} onClick={() => resolve(opt)}>
              <span className="kbd-hint">{i + 1}.</span> {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}
