"use client";

import { useMemo, useState } from "react";
import { VERBS, TENSES, PERSONS, GROUPS, type Tense, type PersonKey, type Mood } from "@/lib/conjugation";
import ConjugationRunner from "@/components/ConjugationRunner";

type Prompt = { inf: string; en: string; tense: string; tenseFr: string; person: string; personDisplay: string };
const MOODS: Mood[] = ["Indicatif", "Conditionnel", "Subjonctif", "Impératif"];
const IMP_PERSONS = ["tu", "nous", "vous"];

function toggle<T>(set: Set<T>, key: T): Set<T> {
  const next = new Set(set);
  next.has(key) ? next.delete(key) : next.add(key);
  return next;
}
const rand = <T,>(a: T[]): T => a[Math.floor(Math.random() * a.length)];

export default function ConjugationGame() {
  const [tenses, setTenses] = useState<Set<Tense>>(new Set(["present"]));
  const [groups, setGroups] = useState<Set<string>>(new Set(GROUPS.map((g) => g.key)));
  const [persons, setPersons] = useState<Set<PersonKey>>(new Set(PERSONS.map((p) => p.key)));
  const [count, setCount] = useState(12);
  const [prompts, setPrompts] = useState<Prompt[] | null>(null);

  const pool = useMemo(() => VERBS.filter((v) => groups.has(v.group)), [groups]);
  const canStart = tenses.size > 0 && pool.length > 0 && persons.size > 0;

  const start = () => {
    const tArr = [...tenses];
    const pArr = [...persons] as string[];
    const out: Prompt[] = [];
    for (let i = 0; i < count; i++) {
      const v = rand(pool);
      const t = rand(tArr);
      let choices = pArr;
      if (t === "imperatif") {
        choices = pArr.filter((k) => IMP_PERSONS.includes(k));
        if (!choices.length) choices = IMP_PERSONS;
      }
      const pk = rand(choices) as PersonKey;
      out.push({ inf: v.inf, en: v.en, tense: t, tenseFr: TENSES.find((x) => x.key === t)!.fr, person: pk, personDisplay: PERSONS.find((x) => x.key === pk)!.display });
    }
    setPrompts(out);
  };

  if (prompts) {
    return (
      <div>
        <ConjugationRunner prompts={prompts} />
        <div className="btn-row" style={{ marginTop: 12 }}>
          <button className="btn secondary" onClick={() => setPrompts(null)}>← Change options</button>
        </div>
      </div>
    );
  }

  return (
    <div className="panel">
      <p className="muted" style={{ marginTop: 0 }}>Pick any mix of tenses, verb types and persons, then start. You type the verb form; answers are graded server-side (pronoun and « que » optional).</p>

      <div className="control-block">
        <label className="control-label">Tenses (pick any)</label>
        {MOODS.map((mood) => (
          <div key={mood} className="mood-row">
            <span className="mood-label">{mood}</span>
            <div className="chiprow">
              {TENSES.filter((t) => t.mood === mood).map((t) => (
                <button key={t.key} type="button" title={t.en}
                  className={`chip ${tenses.has(t.key) ? "active" : ""}`}
                  onClick={() => setTenses((s) => toggle(s, t.key))}>{t.fr}</button>
              ))}
            </div>
          </div>
        ))}
        <div className="chiprow" style={{ marginTop: 6 }}>
          <button type="button" className="chip" onClick={() => setTenses(new Set(TENSES.map((t) => t.key)))}>Select all</button>
          <button type="button" className="chip" onClick={() => setTenses(new Set(["present"]))}>Reset</button>
        </div>
      </div>

      <div className="control-block" style={{ marginTop: 14 }}>
        <label className="control-label">Verb types ({pool.length} verbs)</label>
        <div className="chiprow">
          {GROUPS.map((g) => (
            <button key={g.key} type="button" title={g.en}
              className={`chip ${groups.has(g.key) ? "active" : ""}`}
              onClick={() => setGroups((s) => (s.size === 1 && s.has(g.key) ? s : toggle(s, g.key)))}>{g.label}</button>
          ))}
        </div>
      </div>

      <div className="control-block" style={{ marginTop: 14 }}>
        <label className="control-label">Persons</label>
        <div className="chiprow">
          {PERSONS.map((p) => (
            <button key={p.key} type="button"
              className={`chip ${persons.has(p.key) ? "active" : ""}`}
              onClick={() => setPersons((s) => (s.size === 1 && s.has(p.key) ? s : toggle(s, p.key)))}>{p.display}</button>
          ))}
        </div>
      </div>

      <div className="control-block" style={{ marginTop: 14 }}>
        <label className="control-label">Questions</label>
        <div className="chiprow">
          {[8, 12, 20, 30].map((n) => (
            <button key={n} type="button" className={`chip ${count === n ? "active" : ""}`} onClick={() => setCount(n)}>{n}</button>
          ))}
        </div>
      </div>

      <div className="btn-row" style={{ marginTop: 18 }}>
        <button className="btn" onClick={start} disabled={!canStart}>Start practice ({count})</button>
        {!canStart && <span className="muted">Select at least one tense, verb type and person.</span>}
      </div>
    </div>
  );
}
