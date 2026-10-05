"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  buildSpecialCaseQuestion,
  formatFrenchValue,
  generateNumberQuestions,
  isNumberAnswerCorrect,
  type FrenchCurrency,
  type FrenchFormatMode,
  type FrenchGender,
  type NumberCategory,
  type NumberDifficulty,
  type NumberQuestion,
} from "@/lib/frenchNumbers";

export type NumbersView = "learn" | "converter" | "games" | "tests";

const FORMAT_OPTIONS: { value: FrenchFormatMode; label: string; example: string }[] = [
  { value: "cardinal", label: "Number", example: "-12 345,07" },
  { value: "percent", label: "Percentage", example: "15,5 %" },
  { value: "currency", label: "Money", example: "1 250,50 $" },
  { value: "ordinal", label: "Ordinal", example: "21" },
  { value: "date", label: "Date", example: "2026-10-05" },
  { value: "time", label: "Time", example: "14:30" },
  { value: "digits", label: "Phone / code", example: "+1 613-555-0123" },
];

const CATEGORY_LABELS: Record<NumberCategory, string> = {
  cardinals: "Number spelling",
  formats: "Everyday formats",
  ordinals: "Ordinals",
  math: "French math",
};

const DIFFICULTY_LABELS: Record<NumberDifficulty, string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
  mixed: "Mixed",
};

function LearnView() {
  return (
    <div className="numbers-learn">
      <section className="panel number-hero">
        <div>
          <span className="card-code">THE PATTERN</span>
          <h2>Build French numbers in groups</h2>
          <p>Read large numbers from left to right in groups of three: billions, milliards, millions, mille, then the final hundreds.</p>
        </div>
        <div className="number-example" lang="fr">
          <strong>12 345 678</strong>
          <span>douze millions trois cent quarante-cinq mille six cent soixante-dix-huit</span>
        </div>
      </section>

      <div className="number-rule-grid">
        <article className="card">
          <h3>1. The essential building blocks</h3>
          <p lang="fr"><strong>0–16:</strong> zéro, un, deux… seize</p>
          <p lang="fr"><strong>17–19:</strong> dix-sept, dix-huit, dix-neuf</p>
          <p lang="fr"><strong>Tens:</strong> vingt, trente, quarante, cinquante, soixante</p>
        </article>
        <article className="card">
          <h3>2. <span lang="fr">Et un</span> and <span lang="fr">et onze</span></h3>
          <p lang="fr">21 = vingt et un · 31 = trente et un · 61 = soixante et un</p>
          <p lang="fr">71 = soixante et onze</p>
          <p lang="fr"><strong>But:</strong> 81 = quatre-vingt-un · 91 = quatre-vingt-onze</p>
        </article>
        <article className="card">
          <h3>3. Traditional hyphens</h3>
          <p>Hyphenate joined values below one hundred.</p>
          <p lang="fr">dix-sept · vingt-quatre · quatre-vingt-dix-neuf</p>
          <p>Keep spaces around <span lang="fr">et</span>, and between <span lang="fr">cent</span>, <span lang="fr">mille</span>, and the other groups.</p>
        </article>
        <article className="card">
          <h3>4. The plural traps</h3>
          <p lang="fr">200 = deux cent<strong>s</strong> · 201 = deux cent un</p>
          <p lang="fr">80 = quatre-vingt<strong>s</strong> · 81 = quatre-vingt-un</p>
          <p lang="fr">80 000 = quatre-vingt mille · 80 000 000 = quatre-vingts millions</p>
        </article>
        <article className="card">
          <h3>5. Large-number scale</h3>
          <p lang="fr">1 000 = mille · 1 000 000 = un million</p>
          <p lang="fr">1 000 000 000 = un milliard</p>
          <p lang="fr">1 000 000 000 000 = un billion</p>
          <p className="muted">French <em>billion</em> is the English trillion. <em>Mille</em> never takes an s; the noun scales do.</p>
        </article>
        <article className="card">
          <h3>6. Decimals and percentages</h3>
          <p lang="fr">−2,05 = moins deux virgule zéro cinq</p>
          <p lang="fr">15,5 % = quinze virgule cinq pour cent</p>
          <p>French writes the decimal marker as a comma. Read the decimal part as a number, retaining any leading zeros.</p>
        </article>
        <article className="card">
          <h3>7. Money and ordinals</h3>
          <p lang="fr">12,50 $ CA = douze dollars canadiens et cinquante cents</p>
          <p lang="fr">1<sup>er</sup> = premier · 1<sup>re</sup> = première · 5<sup>e</sup> = cinquième</p>
          <p lang="fr">80<sup>e</sup> = quatre-vingtième</p>
        </article>
        <article className="card">
          <h3>8. Dates, time, and codes</h3>
          <p lang="fr">2026-10-05 = le cinq octobre deux mille vingt-six</p>
          <p lang="fr">00:00 = minuit · 12:00 = midi · 21:05 = vingt et une heures cinq</p>
          <p>Canadian phone numbers and codes are read digit by digit, including every zero.</p>
        </article>
      </div>

      <section className="panel">
        <h2 style={{ marginTop: 0 }}>Math words</h2>
        <div className="math-vocab" lang="fr">
          <span><strong>plus</strong><small>+</small></span>
          <span><strong>moins</strong><small>−</small></span>
          <span><strong>multiplié par</strong><small>×</small></span>
          <span><strong>divisé par</strong><small>÷</small></span>
          <span><strong>égale</strong><small>=</small></span>
        </div>
        <p className="number-equation" lang="fr">vingt-quatre divisé par six égale quatre</p>
      </section>
    </div>
  );
}

function ConverterView() {
  const [mode, setMode] = useState<FrenchFormatMode>("cardinal");
  const [input, setInput] = useState("200");
  const [currency, setCurrency] = useState<FrenchCurrency>("CAD");
  const [gender, setGender] = useState<FrenchGender>("masculine");
  const [copied, setCopied] = useState(false);
  const selected = FORMAT_OPTIONS.find((item) => item.value === mode)!;
  const result = useMemo(() => formatFrenchValue(input, { mode, currency, gender }), [input, mode, currency, gender]);

  const chooseMode = (nextMode: FrenchFormatMode) => {
    setMode(nextMode);
    setInput(FORMAT_OPTIONS.find((item) => item.value === nextMode)!.example);
    setCopied(false);
  };

  const copy = async () => {
    if (!result.ok) return;
    await navigator.clipboard.writeText(result.text);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  return (
    <section className="panel converter-panel">
      <div className="converter-heading">
        <div>
          <h2 style={{ marginTop: 0 }}>Number converter</h2>
          <p className="muted">Choose what the value represents, then enter it exactly as you see it.</p>
        </div>
        <span className="pill available">Canadian French</span>
      </div>

      <div className="filterbar" role="group" aria-label="Conversion type">
        {FORMAT_OPTIONS.map((option) => (
          <button key={option.value} type="button" className={`chip ${mode === option.value ? "active" : ""}`} onClick={() => chooseMode(option.value)}>
            {option.label}
          </button>
        ))}
      </div>

      <div className="number-form-grid">
        <label className="control-block">
          <span className="control-label">Value</span>
          <input className="text-input" value={input} onChange={(event) => setInput(event.target.value)} placeholder={selected.example} autoComplete="off" />
        </label>
        {mode === "currency" && (
          <label className="control-block">
            <span className="control-label">Currency</span>
            <select className="match-select" value={currency} onChange={(event) => setCurrency(event.target.value as FrenchCurrency)}>
              <option value="CAD">Canadian dollar (CAD)</option>
              <option value="USD">US dollar (USD)</option>
              <option value="EUR">Euro (EUR)</option>
            </select>
          </label>
        )}
        {mode === "ordinal" && (
          <label className="control-block">
            <span className="control-label">Gender</span>
            <select className="match-select" value={gender} onChange={(event) => setGender(event.target.value as FrenchGender)}>
              <option value="masculine">Masculine</option>
              <option value="feminine">Feminine</option>
            </select>
          </label>
        )}
      </div>

      {result.ok ? (
        <div className="converter-output" aria-live="polite">
          <span className="control-label">In French</span>
          <p lang="fr">{result.text}</p>
          <div className="btn-row">
            <button className="btn small secondary" type="button" onClick={copy}>{copied ? "Copied" : "Copy result"}</button>
            <span className="muted">Normalized: {result.normalizedInput}</span>
          </div>
        </div>
      ) : (
        <div className="converter-error" role="alert">
          <strong>Check the value</strong>
          <span>{result.error}</span>
          <small>{result.example}</small>
        </div>
      )}
    </section>
  );
}

type GameMode = "write" | "read" | "special" | "math";

const GAME_INFO: Record<GameMode, { label: string; description: string }> = {
  write: { label: "Write it", description: "Turn digits into exact French spelling." },
  read: { label: "Read it", description: "Turn French number words back into digits." },
  special: { label: "Rule picker", description: "Choose the form with the right et, hyphens, and plurals." },
  math: { label: "Math sprint", description: "Solve French arithmetic before the timer expires." },
};

function createGameQuestions(mode: GameMode, difficulty: NumberDifficulty, seed: number): NumberQuestion[] {
  if (mode === "special") return Array.from({ length: 8 }, (_, index) => buildSpecialCaseQuestion(index + seed));
  const category: NumberCategory = mode === "math" ? "math" : "cardinals";
  const pool = generateNumberQuestions({ count: 100, difficulty, categories: [category], seed });
  if (mode === "write") return pool.filter((question) => question.answerKind === "words").slice(0, 16);
  if (mode === "read") return pool.filter((question) => question.answerKind === "number").slice(0, 16);
  return pool.slice(0, 16);
}

function QuestionInput({ question, response, setResponse, locked }: { question: NumberQuestion; response: string; setResponse: (value: string) => void; locked: boolean }) {
  if (question.options) {
    return (
      <div className="options">
        {question.options.map((option, index) => (
          <button
            key={option}
            type="button"
            className={`opt ${response === option ? "selected" : ""}`}
            onClick={() => setResponse(option)}
            disabled={locked}
            lang="fr"
          >
            <span className="kbd-hint">{index + 1}.</span> {option}
          </button>
        ))}
      </div>
    );
  }
  return (
    <input
      className="text-input"
      value={response}
      onChange={(event) => setResponse(event.target.value)}
      disabled={locked}
      autoFocus
      autoComplete="off"
      lang={question.answerKind === "words" ? "fr" : undefined}
      inputMode={question.answerKind === "number" ? "decimal" : "text"}
      placeholder={question.answerKind === "words" ? "Réponse en lettres" : "Réponse en chiffres"}
    />
  );
}

function GamesView() {
  const [mode, setMode] = useState<GameMode>("write");
  const [difficulty, setDifficulty] = useState<NumberDifficulty>("beginner");
  const [questions, setQuestions] = useState<NumberQuestion[]>([]);
  const [index, setIndex] = useState(0);
  const [response, setResponse] = useState("");
  const [feedback, setFeedback] = useState<boolean | null>(null);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [lives, setLives] = useState(3);
  const [phase, setPhase] = useState<"setup" | "play" | "over">("setup");
  const [timeLeft, setTimeLeft] = useState(12);

  const question = questions[index];
  const start = () => {
    const seed = Date.now() % 1_000_000;
    setQuestions(createGameQuestions(mode, difficulty, seed));
    setIndex(0); setResponse(""); setFeedback(null); setScore(0); setStreak(0); setLives(3); setTimeLeft(12); setPhase("play");
  };

  const resolve = useCallback((answer = response) => {
    if (!question || feedback !== null) return;
    const correct = isNumberAnswerCorrect(question, answer);
    setFeedback(correct);
    if (correct) {
      setScore((value) => value + 10 + Math.min(streak, 5) * 2);
      setStreak((value) => value + 1);
    } else {
      setStreak(0);
      setLives((value) => Math.max(0, value - 1));
    }
  }, [feedback, question, response, streak]);

  const next = () => {
    if (lives <= 0 || index + 1 >= questions.length) { setPhase("over"); return; }
    setIndex((value) => value + 1); setResponse(""); setFeedback(null); setTimeLeft(12);
  };

  useEffect(() => {
    if (phase !== "play" || mode !== "math" || feedback !== null) return;
    if (timeLeft <= 0) { resolve(""); return; }
    const timer = window.setTimeout(() => setTimeLeft((value) => value - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [phase, mode, feedback, timeLeft, resolve]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (phase !== "play" || !question) return;
      if (question.options && feedback === null && /^[1-4]$/.test(event.key)) {
        const option = question.options[Number(event.key) - 1];
        if (option) setResponse(option);
      }
      if (event.key === "Enter") {
        event.preventDefault();
        if (feedback === null && response.trim()) resolve();
        else if (feedback !== null) next();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  if (phase === "setup") {
    return (
      <div>
        <div className="number-game-grid">
          {(Object.keys(GAME_INFO) as GameMode[]).map((key) => (
            <button key={key} type="button" className={`card number-choice-card ${mode === key ? "selected" : ""}`} onClick={() => setMode(key)}>
              <span className="card-title">{GAME_INFO[key].label}</span>
              <span className="card-sub">{GAME_INFO[key].description}</span>
            </button>
          ))}
        </div>
        <section className="panel game-start">
          <span className="game-label">Difficulty</span>
          <div className="chiprow">
            {(Object.keys(DIFFICULTY_LABELS) as NumberDifficulty[]).map((level) => (
              <button key={level} type="button" className={`chip ${difficulty === level ? "active" : ""}`} onClick={() => setDifficulty(level)}>{DIFFICULTY_LABELS[level]}</button>
            ))}
          </div>
          <div className="btn-row">
            <button className="btn" type="button" onClick={start}>Start {GAME_INFO[mode].label}</button>
            <span className="kbd-hint">3 lives · instant feedback · Enter to continue</span>
          </div>
        </section>
      </div>
    );
  }

  if (phase === "over") {
    return (
      <section className="panel summary">
        <div className="score">{score}</div>
        <p className="lead">{GAME_INFO[mode].label} complete · {index + 1} question{index ? "s" : ""}</p>
        <div className="btn-row" style={{ justifyContent: "center" }}>
          <button className="btn" type="button" onClick={start}>Play again</button>
          <button className="btn secondary" type="button" onClick={() => setPhase("setup")}>Change game</button>
        </div>
      </section>
    );
  }

  return (
    <section className="panel">
      <div className="game-hud">
        <span className="lives" aria-label={`${lives} lives left`}>{"♥".repeat(lives)}<span className="lives-lost">{"♥".repeat(3 - lives)}</span></span>
        <span className="game-score">Score <strong>{score}</strong></span>
        <span className={`game-streak ${streak >= 3 ? "hot" : ""}`}>Streak {streak}</span>
      </div>
      {mode === "math" && (
        <div className="game-timer" aria-label={`${timeLeft} seconds remaining`}><span style={{ width: `${(timeLeft / 12) * 100}%`, background: timeLeft <= 3 ? "var(--incorrect)" : "var(--brand)" }} /></div>
      )}
      <div className="runner-head" style={{ marginTop: 16 }}>
        <span>{question.instruction}</span>
        <span className="muted">{index + 1}/{questions.length}</span>
      </div>
      <p className="game-prompt" lang="fr">{question.prompt}</p>
      <QuestionInput question={question} response={response} setResponse={setResponse} locked={feedback !== null} />
      {feedback !== null && (
        <div className={`feedback ${feedback ? "correct" : "wrong"}`} aria-live="polite">
          <h3 className={`verdict ${feedback ? "correct" : "wrong"}`}>{feedback ? "Correct!" : "Not quite"}</h3>
          {!feedback && <p>Answer: <strong lang="fr">{question.answer}</strong></p>}
          <p>{question.rule}</p>
        </div>
      )}
      <div className="btn-row">
        {feedback === null ? (
          <button className="btn" type="button" onClick={() => resolve()} disabled={!response.trim()}>Check answer</button>
        ) : (
          <button className="btn" type="button" onClick={next}>{lives <= 0 || index + 1 >= questions.length ? "See results" : "Next"}</button>
        )}
        <span className="kbd-hint">Press Enter</span>
      </div>
    </section>
  );
}

type TestTime = 0 | 300 | 600;

function TestsView() {
  const [difficulty, setDifficulty] = useState<NumberDifficulty>("mixed");
  const [categories, setCategories] = useState<Set<NumberCategory>>(new Set(["cardinals", "formats", "ordinals", "math"]));
  const [count, setCount] = useState(10);
  const [timeLimit, setTimeLimit] = useState<TestTime>(0);
  const [questions, setQuestions] = useState<NumberQuestion[]>([]);
  const [answers, setAnswers] = useState<string[]>([]);
  const [index, setIndex] = useState(0);
  const [response, setResponse] = useState("");
  const [remaining, setRemaining] = useState(0);
  const [phase, setPhase] = useState<"setup" | "test" | "results">("setup");

  const toggleCategory = (category: NumberCategory) => {
    setCategories((current) => {
      if (current.size === 1 && current.has(category)) return current;
      const next = new Set(current);
      next.has(category) ? next.delete(category) : next.add(category);
      return next;
    });
  };

  const start = () => {
    const session = generateNumberQuestions({ count, difficulty, categories: [...categories], seed: Date.now() % 1_000_000 });
    setQuestions(session); setAnswers(Array(session.length).fill("")); setIndex(0); setResponse(""); setRemaining(timeLimit); setPhase("test");
  };

  const finish = useCallback(() => setPhase("results"), []);
  const submit = () => {
    if (!response.trim()) return;
    setAnswers((current) => { const next = [...current]; next[index] = response; return next; });
    if (index + 1 >= questions.length) finish();
    else { setIndex((value) => value + 1); setResponse(answers[index + 1] ?? ""); }
  };

  useEffect(() => {
    if (phase !== "test" || timeLimit === 0) return;
    if (remaining <= 0) { finish(); return; }
    const timer = window.setTimeout(() => setRemaining((value) => value - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [phase, timeLimit, remaining, finish]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (phase !== "test" || event.key !== "Enter" || !response.trim()) return;
      event.preventDefault(); submit();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  if (phase === "setup") {
    return (
      <section className="panel test-builder">
        <h2 style={{ marginTop: 0 }}>Build a test</h2>
        <p className="muted">Choose the material and challenge level. Answers and explanations appear only after the test.</p>
        <div className="control-block">
          <span className="control-label">Topics</span>
          <div className="chiprow">
            {(Object.keys(CATEGORY_LABELS) as NumberCategory[]).map((category) => (
              <button key={category} type="button" className={`chip ${categories.has(category) ? "active" : ""}`} onClick={() => toggleCategory(category)}>{CATEGORY_LABELS[category]}</button>
            ))}
          </div>
        </div>
        <div className="test-options-grid">
          <div className="control-block">
            <span className="control-label">Difficulty</span>
            <div className="chiprow">
              {(Object.keys(DIFFICULTY_LABELS) as NumberDifficulty[]).map((level) => (
                <button key={level} type="button" className={`chip ${difficulty === level ? "active" : ""}`} onClick={() => setDifficulty(level)}>{DIFFICULTY_LABELS[level]}</button>
              ))}
            </div>
          </div>
          <div className="control-block">
            <span className="control-label">Questions</span>
            <div className="chiprow">
              {[10, 20, 30].map((value) => <button key={value} type="button" className={`chip ${count === value ? "active" : ""}`} onClick={() => setCount(value)}>{value}</button>)}
            </div>
          </div>
          <div className="control-block">
            <span className="control-label">Time</span>
            <div className="chiprow">
              {([[0, "Untimed"], [300, "5 min"], [600, "10 min"]] as const).map(([value, label]) => (
                <button key={value} type="button" className={`chip ${timeLimit === value ? "active" : ""}`} onClick={() => setTimeLimit(value)}>{label}</button>
              ))}
            </div>
          </div>
        </div>
        <div className="btn-row"><button className="btn" type="button" onClick={start}>Start test</button></div>
      </section>
    );
  }

  if (phase === "results") {
    const score = questions.reduce((total, question, questionIndex) => total + (isNumberAnswerCorrect(question, answers[questionIndex] ?? "") ? 1 : 0), 0);
    return (
      <div>
        <section className="panel summary">
          <div className="score">{score}/{questions.length}</div>
          <p className="lead">{Math.round((score / Math.max(1, questions.length)) * 100)}% · test complete</p>
          <div className="btn-row" style={{ justifyContent: "center" }}>
            <button className="btn" type="button" onClick={start}>Retake with new questions</button>
            <button className="btn secondary" type="button" onClick={() => setPhase("setup")}>Change options</button>
          </div>
        </section>
        <section className="panel">
          <h2 style={{ marginTop: 0 }}>Answer review</h2>
          {questions.map((question, questionIndex) => {
            const answer = answers[questionIndex] ?? "";
            const correct = isNumberAnswerCorrect(question, answer);
            return (
              <details key={question.id} className={`review-item ${correct ? "ok" : "bad"}`}>
                <summary>{correct ? "✓" : "✕"} {question.prompt}</summary>
                <p>Your answer: <strong>{answer || "No answer"}</strong></p>
                {!correct && <p>Correct answer: <strong lang="fr">{question.answer}</strong></p>}
                <p className="muted">{question.rule}</p>
              </details>
            );
          })}
        </section>
      </div>
    );
  }

  const question = questions[index];
  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;
  return (
    <section className="panel">
      <div className="runner-head">
        <span><strong>Question {index + 1}</strong> of {questions.length}</span>
        {timeLimit > 0 && <span className={`timer ${remaining < 60 ? "low" : ""}`}>{minutes}:{String(seconds).padStart(2, "0")}</span>}
      </div>
      <div className="progress"><span style={{ width: `${((index + 1) / questions.length) * 100}%` }} /></div>
      <p className="muted">{question.instruction}</p>
      <p className="game-prompt" lang="fr">{question.prompt}</p>
      <QuestionInput question={question} response={response} setResponse={setResponse} locked={false} />
      <div className="btn-row">
        <button className="btn" type="button" onClick={submit} disabled={!response.trim()}>{index + 1 >= questions.length ? "Finish test" : "Save and continue"}</button>
        <span className="kbd-hint">Feedback is shown at the end · Enter to continue</span>
      </div>
    </section>
  );
}

export default function NumbersWorkspace({ view }: { view: NumbersView }) {
  if (view === "converter") return <ConverterView />;
  if (view === "games") return <GamesView />;
  if (view === "tests") return <TestsView />;
  return <LearnView />;
}
