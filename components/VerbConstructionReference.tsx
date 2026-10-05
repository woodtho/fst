"use client";

import { useMemo, useState } from "react";
import { VERB_CONSTRUCTIONS, type VerbConstruction, type VerbPreposition } from "@/lib/verbConstructions";

type Filter = "all" | VerbPreposition | "other" | "y" | "en";
const FILTERS: { value: Filter; label: string }[] = [
  { value: "all", label: "All" }, { value: "à", label: "À" }, { value: "de", label: "De" },
  { value: "none", label: "Direct" }, { value: "other", label: "Other prepositions" },
  { value: "y", label: "Replaced by y" }, { value: "en", label: "Replaced by en" },
];

function matchesFilter(construction: VerbConstruction, filter: Filter) {
  if (filter === "all") return true;
  if (filter === "other") return !["none", "à", "de"].includes(construction.preposition);
  if (filter === "y" || filter === "en") return construction.replacement === filter;
  return construction.preposition === filter;
}

export default function VerbConstructionReference() {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const results = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase("fr-CA");
    return VERB_CONSTRUCTIONS.filter((construction) => {
      if (!matchesFilter(construction, filter)) return false;
      if (!needle) return true;
      return [construction.infinitive, construction.meaningEn, construction.pattern, construction.exampleFr]
        .some((value) => value.toLocaleLowerCase("fr-CA").includes(needle));
    });
  }, [filter, query]);

  return (
    <>
      <section className="panel construction-intro">
        <h2 style={{ marginTop: 0 }}>How verb constructions work</h2>
        <p>A French verb may take a direct object, a specific preposition, or different constructions for different meanings. Learn the complete pattern rather than translating the English word “to”.</p>
        <div className="construction-rules">
          <span><strong>à + thing/place</strong><small>usually → y</small></span>
          <span><strong>à + person</strong><small>usually → lui / leur</small></span>
          <span><strong>de + thing</strong><small>usually → en</small></span>
          <span><strong>direct object</strong><small>→ le / la / les</small></span>
        </div>
        <p className="muted reference-sources">Usage follows the <a href="https://vitrinelinguistique.oqlf.gouv.qc.ca/la-syntaxe/les-prepositions" target="_blank" rel="noreferrer">OQLF verb-preposition reference</a> and its guidance on <a href="https://vitrinelinguistique.oqlf.gouv.qc.ca/23513/la-grammaire/les-pronoms/pronoms-personnels/le-pronom-personnel-en" target="_blank" rel="noreferrer">en</a> and <a href="https://vitrinelinguistique.oqlf.gouv.qc.ca/24206/la-grammaire/les-pronoms/pronoms-personnels/pronoms-personnels-employes-avec-un-verbe-a-limperatif" target="_blank" rel="noreferrer">imperative pronoun order</a>.</p>
      </section>

      <div className="panel construction-controls">
        <label className="control-block" style={{ flex: 1 }}>
          <span className="control-label">Search verbs, meanings, or patterns</span>
          <input className="text-input" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="parler, to respond, à quelqu’un…" />
        </label>
        <div className="filterbar" role="group" aria-label="Filter verb constructions">
          {FILTERS.map((option) => <button key={option.value} type="button" className={`chip ${filter === option.value ? "active" : ""}`} onClick={() => setFilter(option.value)}>{option.label}</button>)}
        </div>
        <p className="muted" style={{ marginBottom: 0 }}>{results.length} construction{results.length === 1 ? "" : "s"} · 90 verbs in the reference</p>
      </div>

      <div className="construction-list">
        {results.map((construction) => (
          <article className="card construction-card" key={construction.id}>
            <div className="construction-heading">
              <div><strong className="fr" lang="fr">{construction.pattern}</strong><span className="muted">{construction.meaningEn}</span></div>
              <div className="tags"><span className="tag">{construction.preposition === "none" ? "direct" : construction.preposition}</span><span className="tag">{construction.complement}</span>{construction.replacement && <span className="tag">→ {construction.replacement}</span>}</div>
            </div>
            <p className="construction-example"><span className="fr" lang="fr">{construction.exampleFr}</span><span className="muted">{construction.exampleEn}</span></p>
            {construction.note && <p className="note construction-note">{construction.note}</p>}
          </article>
        ))}
        {results.length === 0 && <div className="panel empty-state"><p>No constructions match those filters.</p><button className="btn secondary" onClick={() => { setQuery(""); setFilter("all"); }}>Clear filters</button></div>}
      </div>
    </>
  );
}
