"use client";

import { useEffect, useMemo, useState } from "react";

type SourceKind = "all" | "source" | "supplemental";
type LevelFilter = "all" | "A" | "B" | "Supplemental";
type Entry = {
  fr: string;
  en: string;
  of: number;
  objectiveId: string;
  titleFr?: string;
  level?: "A" | "B" | "Supplemental";
  sourceKind?: "source" | "supplemental";
  category?: string;
};
type Obj = { id: string; of: number; titleFr: string };

function strip(s: string) { return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase(); }

export default function LexiconBrowser({ entries, objectives }: { entries: Entry[]; objectives: Obj[] }) {
  const [q, setQ] = useState("");
  const [of, setOf] = useState<number | "all">("all");
  const [sourceKind, setSourceKind] = useState<SourceKind>("all");
  const [level, setLevel] = useState<LevelFilter>("all");
  const [category, setCategory] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(100);

  const categories = useMemo(() => {
    return Array.from(new Set(entries.map((e) => e.category).filter(Boolean) as string[])).sort();
  }, [entries]);

  const filtered = useMemo(() => {
    const needle = strip(q.trim());
    return entries.filter((e) => {
      if (of !== "all" && e.of !== of) return false;
      if (sourceKind !== "all" && e.sourceKind !== sourceKind) return false;
      if (level !== "all" && e.level !== level) return false;
      if (category !== "all" && e.category !== category) return false;
      if (!needle) return true;
      return strip(e.fr).includes(needle) || strip(e.en).includes(needle) || strip(e.category ?? "").includes(needle);
    });
  }, [entries, q, of, sourceKind, level, category]);

  useEffect(() => {
    setPage(1);
  }, [q, of, sourceKind, level, category, pageSize]);

  const clearFilters = () => {
    setQ("");
    setOf("all");
    setSourceKind("all");
    setLevel("all");
    setCategory("all");
    setPageSize(100);
  };

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * pageSize;
  const shown = filtered.slice(start, start + pageSize);
  const firstShown = filtered.length === 0 ? 0 : start + 1;
  const lastShown = start + shown.length;

  return (
    <>
      <div className="lex-controls">
        <input className="text-input" placeholder="Search French or English…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search lexicon" />
        <select className="match-select" value={of} onChange={(e) => setOf(e.target.value === "all" ? "all" : Number(e.target.value))} aria-label="Filter by objective">
          <option value="all">All objectives</option>
          {objectives.map((o) => <option key={o.id} value={o.of}>{o.id} — {o.titleFr}</option>)}
        </select>
        <select className="match-select" value={sourceKind} onChange={(e) => setSourceKind(e.target.value as SourceKind)} aria-label="Filter by source type">
          <option value="all">All sources</option>
          <option value="source">Official PFL2 source</option>
          <option value="supplemental">Supplemental workplace terms</option>
        </select>
        <select className="match-select" value={level} onChange={(e) => setLevel(e.target.value as LevelFilter)} aria-label="Filter by level">
          <option value="all">All levels</option>
          <option value="A">Level A</option>
          <option value="B">Level B</option>
          <option value="Supplemental">Supplemental</option>
        </select>
        <select className="match-select" value={category} onChange={(e) => setCategory(e.target.value)} aria-label="Filter by supplemental category">
          <option value="all">All categories</option>
          {categories.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select className="match-select" value={pageSize} onChange={(e) => setPageSize(Number(e.target.value))} aria-label="Entries per page">
          <option value={50}>50 per page</option>
          <option value={100}>100 per page</option>
          <option value={250}>250 per page</option>
          <option value={500}>500 per page</option>
        </select>
        <button className="btn secondary" type="button" onClick={clearFilters}>Reset filters</button>
      </div>
      <div className="lex-pagebar">
        <p className="muted" style={{ fontSize: ".85rem", margin: 0 }}>
          {filtered.length.toLocaleString()} entr{filtered.length === 1 ? "y" : "ies"}
          {filtered.length > 0 ? ` · showing ${firstShown.toLocaleString()}-${lastShown.toLocaleString()} · page ${currentPage.toLocaleString()} of ${totalPages.toLocaleString()}` : ""}
        </p>
        <div className="btn-row" style={{ margin: 0 }}>
          <button className="btn secondary" onClick={() => setPage(1)} disabled={currentPage <= 1}>First</button>
          <button className="btn secondary" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={currentPage <= 1}>Previous</button>
          <button className="btn secondary" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage >= totalPages}>Next</button>
          <button className="btn secondary" onClick={() => setPage(totalPages)} disabled={currentPage >= totalPages}>Last</button>
        </div>
      </div>
      <table className="lex-table">
        <thead><tr><th>Français</th><th>English</th><th>Source</th><th>Category</th></tr></thead>
        <tbody>
          {shown.map((e, i) => (
            <tr key={`${e.objectiveId}-${start + i}-${e.fr}-${e.en}`}>
              <td className="fr" lang="fr">{e.fr}</td>
              <td lang="en">{e.en}</td>
              <td className="muted">{e.objectiveId}{e.level && e.level !== "Supplemental" ? ` · ${e.level}` : ""}</td>
              <td className="muted">{e.category ?? "PFL2 source"}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {filtered.length === 0 && <p className="muted">No entries match your search.</p>}
    </>
  );
}
