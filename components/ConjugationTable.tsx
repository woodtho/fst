"use client";

import { useMemo, useState } from "react";
import { VERBS, TENSES, PERSONS, GROUPS, conjugate, type Tense, type PersonKey, type Mood } from "@/lib/conjugation";

const DEFAULT_TENSES: Tense[] = ["present", "passe_compose", "imparfait", "futur_simple", "conditionnel", "subjonctif", "imperatif"];
const MOODS: Mood[] = ["Indicatif", "Conditionnel", "Subjonctif", "Impératif"];

function toggle<T>(set: Set<T>, key: T): Set<T> {
  const next = new Set(set);
  next.has(key) ? next.delete(key) : next.add(key);
  return next;
}

export default function ConjugationTable() {
  const [groups, setGroups] = useState<Set<string>>(new Set(GROUPS.map((g) => g.key)));
  const [verbInf, setVerbInf] = useState("parler");
  const [tenses, setTenses] = useState<Set<Tense>>(new Set(DEFAULT_TENSES));
  const [persons, setPersons] = useState<Set<PersonKey>>(new Set(PERSONS.map((p) => p.key)));

  const pool = useMemo(() => VERBS.filter((v) => groups.has(v.group)), [groups]);
  const verb = useMemo(() => VERBS.find((v) => v.inf === verbInf) ?? VERBS[0], [verbInf]);

  // if the current verb is filtered out, fall back to the first in pool
  const activeVerb = pool.some((v) => v.inf === verbInf) ? verb : pool[0] ?? verb;

  const shownTenses = TENSES.filter((t) => tenses.has(t.key));
  const shownPersons = PERSONS.filter((p) => persons.has(p.key));

  return (
    <div>
      <div className="conj-controls">
        <div className="control-block">
          <label className="control-label">Verb type</label>
          <div className="chiprow">
            {GROUPS.map((g) => (
              <button key={g.key} type="button" title={g.en}
                className={`chip ${groups.has(g.key) ? "active" : ""}`}
                onClick={() => setGroups((s) => (s.size === 1 && s.has(g.key) ? s : toggle(s, g.key)))}>
                {g.label}
              </button>
            ))}
          </div>
        </div>

        <div className="control-block">
          <label className="control-label" htmlFor="verb-select">Verb ({pool.length})</label>
          <select id="verb-select" className="verb-select" value={activeVerb.inf} onChange={(e) => setVerbInf(e.target.value)}>
            {GROUPS.filter((g) => groups.has(g.key)).map((g) => (
              <optgroup key={g.key} label={g.en}>
                {pool.filter((v) => v.group === g.key).map((v) => (
                  <option key={v.inf} value={v.inf}>{v.inf} — {v.en}</option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>
      </div>

      <div className="control-block" style={{ marginTop: 14 }}>
        <label className="control-label">Forms to show (pick any)</label>
        {MOODS.map((mood) => (
          <div key={mood} className="mood-row">
            <span className="mood-label">{mood}</span>
            <div className="chiprow">
              {TENSES.filter((t) => t.mood === mood).map((t) => (
                <button key={t.key} type="button" title={t.en}
                  className={`chip ${tenses.has(t.key) ? "active" : ""}`}
                  onClick={() => setTenses((s) => toggle(s, t.key))}>
                  {t.fr}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="control-block" style={{ marginTop: 12 }}>
        <label className="control-label">Persons</label>
        <div className="chiprow">
          {PERSONS.map((p) => (
            <button key={p.key} type="button"
              className={`chip ${persons.has(p.key) ? "active" : ""}`}
              onClick={() => setPersons((s) => (s.size === 1 && s.has(p.key) ? s : toggle(s, p.key)))}>
              {p.display}
            </button>
          ))}
        </div>
      </div>

      <div className="panel" style={{ marginTop: 16, overflowX: "auto" }}>
        <h3 style={{ marginTop: 0 }}>
          <span className="fr" lang="fr">{activeVerb.inf}</span> <span className="muted">— {activeVerb.en}</span>
        </h3>
        {shownTenses.length === 0 ? (
          <p className="muted">Select at least one form above.</p>
        ) : (
          <table className="conj-table">
            <thead>
              <tr>
                <th>Tense</th>
                {shownPersons.map((p) => <th key={p.key} lang="fr">{p.display}</th>)}
              </tr>
            </thead>
            <tbody>
              {shownTenses.map((t) => (
                <tr key={t.key}>
                  <th scope="row"><span>{t.fr}</span><small className="muted">{t.en}</small></th>
                  {shownPersons.map((p) => {
                    const na = t.key === "imperatif" && !["tu", "nous", "vous"].includes(p.key);
                    return <td key={p.key} lang="fr" className={na ? "na" : ""}>{na ? "—" : conjugate(activeVerb, t.key, p.key)}</td>;
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
