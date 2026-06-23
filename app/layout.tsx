import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "FSL Trainer — GoC French A & B",
  description: "Adaptive French learning for Government of Canada Levels A & B and SLE prep.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header className="topbar">
          <Link href="/" className="brand">
            <span className="brand-mark">FSL</span> Trainer
          </Link>
          <nav className="topnav">
            <Link href="/">Modules</Link>
            <Link href="/tools/grammar">Grammar</Link>
            <Link href="/tools/conjugation">Conjugation</Link>
            <Link href="/tools/lexicon">Lexicon</Link>
            <Link href="/tools/workplace">Workplace</Link>
            <Link href="/consolidation">Consolidation</Link>
          </nav>
        </header>
        <main className="container">{children}</main>
        <footer className="footer">
          Vertical slice · content read from <code>/content</code> · original FSL material
        </footer>
      </body>
    </html>
  );
}
