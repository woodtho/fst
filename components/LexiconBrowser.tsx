"use client";

import { useMemo, useState } from "react";

type Entry = { fr: string; en: string; of: number; objectiveId: string };
type Obj = { id: string; of: number; titleFr: string };

function strip(s: string) { return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase(); }

export default function LexiconBrowser({ entries, objectives }: { entries: Entry[]; objectives: Obj[] }) {
  const [q, setQ] = useState("");
  const [of, setOf] = useState<number | "all">("all");

  const filtered = useMemo(() => {
    const needle = strip(q.trim());
    return entries.filter((e) => {
      if (of !== "all" && e.of !== of) return false;
      if (!needle) return true;
      return strip(e.fr).includes(needle) || strip(e.en).includes(needle);
    });
  }, [entries, q, of]);

  const shown = filtered.slice(0, 400);

  return (
    <>
      <div className="lex-controls">
        <input className="text-input" placeholder="Search French or English…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search lexicon" />
        <select className="match-select" value={of} onChange={(e) => setOf(e.target.value === "all" ? "all" : Number(e.target.value))} aria-label="Filter by objective">
          <option value="all">All objectives</option>
          {objectives.map((o) => <option key={o.id} value={o.of}>{o.id} — {o.titleFr}</option>)}
        </select>
      </div>
      <p className="muted" style={{ fontSize: ".85rem" }}>
        {filtered.length.toLocaleString()} entr{filtered.length === 1 ? "y" : "ies"}{filtered.length > shown.length ? ` (showing first ${shown.length})` : ""}
      </p>
      <table className="lex-table">
        <thead><tr><th>Français</th><th>English</th><th>OF</th></tr></thead>
        <tbody>
          {shown.map((e, i) => (
            <tr key={i}>
              <td className="fr" lang="fr">{e.fr}</td>
              <td lang="en">{e.en}</td>
              <td className="muted">{e.objectiveId}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {shown.length === 0 && <p className="muted">No entries match your search.</p>}
    </>
  );
}
