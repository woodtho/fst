import Link from "next/link";
import NumbersWorkspace, { type NumbersView } from "@/components/NumbersWorkspace";

export const dynamic = "force-dynamic";

const VIEWS: { key: NumbersView; label: string }[] = [
  { key: "learn", label: "Learn" },
  { key: "converter", label: "Converter" },
  { key: "games", label: "Games" },
  { key: "tests", label: "Tests" },
];

export default function NumbersTool({ searchParams }: { searchParams: { view?: string } }) {
  const view = VIEWS.some((item) => item.key === searchParams.view)
    ? searchParams.view as NumbersView
    : "learn";

  return (
    <>
      <p className="muted"><Link href="/tools">← Tools</Link></p>
      <h1>French numbers &amp; math</h1>
      <p className="lead">Learn how French numbers work, convert everyday formats, play focused games, and test your accuracy.</p>

      <div className="tabs" role="tablist" aria-label="Numbers and math sections">
        {VIEWS.map((item) => (
          <Link
            key={item.key}
            href={`/tools/numbers?view=${item.key}`}
            className={`tab ${view === item.key ? "active" : ""}`}
            role="tab"
            aria-selected={view === item.key}
          >
            {item.label}
          </Link>
        ))}
      </div>

      <NumbersWorkspace view={view} />
    </>
  );
}
