"use client";

import { useState } from "react";

/**
 * Shows French text with its English translation revealed on hover (desktop) or tap (mobile).
 * Falls back to plain French when no translation is available.
 */
export default function Translatable({
  fr,
  en,
  className = "",
  tag = "span",
}: {
  fr: string;
  en?: string;
  className?: string;
  tag?: "span" | "div" | "p";
}) {
  const [open, setOpen] = useState(false);
  const Tag = tag as any;

  if (!en) return <Tag className={`fr ${className}`.trim()} lang="fr">{fr}</Tag>;

  return (
    <Tag
      className={`ttip fr ${className}`.trim()}
      lang="fr"
      tabIndex={0}
      role="button"
      aria-expanded={open}
      aria-label={`${fr} — show English translation`}
      onClick={() => setOpen((o) => !o)}
      onKeyDown={(e: React.KeyboardEvent) => {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setOpen((o) => !o); }
      }}
    >
      {fr}
      <span className={`ttip-pop ${open ? "open" : ""}`} lang="en" role="tooltip">{en}</span>
      <span className="ttip-mark" aria-hidden="true">🌐</span>
    </Tag>
  );
}
