"use client";

import { useMemo, useRef, useState } from "react";
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
  const [selected, setSelected] = useState<string[]>(["parler"]);
  const [tenses, setTenses] = useState<Set<Tense>>(new Set(DEFAULT_TENSES));
  const [persons, setPersons] = useState<Set<PersonKey>>(new Set(PERSONS.map((p) => p.key)));
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const blurTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const pool = useMemo(() => VERBS.filter((v) => groups.has(v.group)), [groups]);

  const q = query.trim().toLowerCase();
  const matches = useMemo(
    () => (q ? pool.filter((v) => v.inf.toLowerCase().includes(q) || v.en.toLowerCase().includes(q)) : pool).slice(0, 60),
    [pool, q],
  );
  const add = (inf: string) => { setSelected((s) => (s.includes(inf) ? s : [...s, inf])); setQuery(""); };
  const remove = (inf: string) => setSelected((s) => (s.length === 1 ? s : s.filter((x) => x !== inf)));

  const selectedVerbs = selected.map((inf) => VERBS.find((v) => v.inf === inf)!).filter(Boolean);
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

        <div className="control-block" style={{ flex: 1, minWidth: 260 }}>
          <label className="control-label" htmlFor="verb-search">Verbs ({pool.length}) — type to search, click to add</label>
          <div className="combo">
            <input
              id="verb-search" className="verb-select" type="text" autoComplete="off"
              placeholder="Search a verb to add…"
              value={open ? query : ""}
              onFocus={() => { if (blurTimer.current) clearTimeout(blurTimer.current); setOpen(true); }}
              onBlur={() => { blurTimer.current = setTimeout(() => setOpen(false), 150); }}
              onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
              onKeyDown={(e) => { if (e.key === "Enter" && matches[0]) add(matches[0].inf); if (e.key === "Escape") setOpen(false); }}
            />
            {open && (
              <ul className="combo-list">
                {matches.length === 0 ? (
                  <li className="combo-empty">No match</li>
                ) : matches.map((v) => (
                  <li key={v.inf}>
                    <button type="button" className={selected.includes(v.inf) ? "sel" : ""} onMouseDown={(e) => e.preventDefault()} onClick={() => add(v.inf)}>
                      <span className="fr" lang="fr">{v.inf}</span> <span className="muted">— {v.en}</span>{selected.includes(v.inf) ? " ✓" : ""}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      <div className="chiprow" style={{ marginTop: 10 }}>
        {selectedVerbs.map((v) => (
          <span key={v.inf} className="chip active verb-chip">
            <span className="fr" lang="fr">{v.inf}</span>
            {selected.length > 1 && (
              <button type="button" aria-label={`Remove ${v.inf}`} className="chip-x" onClick={() => remove(v.inf)}>×</button>
            )}
          </span>
        ))}
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

      {shownTenses.length === 0 ? (
        <div className="panel" style={{ marginTop: 16 }}><p className="muted" style={{ margin: 0 }}>Select at least one form above.</p></div>
      ) : (
        selectedVerbs.map((v) => (
          <div key={v.inf} className="panel" style={{ marginTop: 16, overflowX: "auto" }}>
            <h3 style={{ marginTop: 0 }}>
              <span className="fr" lang="fr">{v.inf}</span> <span className="muted">— {v.en}</span>
            </h3>
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
                      return <td key={p.key} lang="fr" className={na ? "na" : ""}>{na ? "—" : conjugate(v, t.key, p.key)}</td>;
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))
      )}
    </div>
  );
}
