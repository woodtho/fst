"use client";

import { sortedGameScores } from "@/lib/gameScores";
import type { GameScope } from "@/lib/gameTypes";
import { useGameScores } from "@/lib/useGameScores";

export default function LocalScoreboard({ scope, limit = 12, compact = false }: { scope?: GameScope; limit?: number; compact?: boolean }) {
  const { store } = useGameScores();
  const scores = sortedGameScores(store, scope, limit);

  return (
    <section className={`panel local-scoreboard ${compact ? "compact" : ""}`} aria-labelledby="local-scores-title">
      <div className="section-head">
        <div>
          <h2 id="local-scores-title">Your local scores</h2>
          <p className="muted">Stored only in this browser.</p>
        </div>
        <span className="pill available">Private</span>
      </div>
      {scores.length === 0 ? (
        <p className="score-empty">Finish a game to set your first high score.</p>
      ) : (
        <div className="score-table-wrap">
          <table className="score-table">
            <thead><tr><th>Game</th><th>Topic</th><th>High score</th><th>Best streak</th><th>Played</th></tr></thead>
            <tbody>
              {scores.map((entry) => (
                <tr key={entry.key}>
                  <td>{entry.modeLabel}</td>
                  <td>{entry.scope.label}</td>
                  <td><strong>{entry.highScore.toLocaleString()}</strong></td>
                  <td>{entry.bestStreak}</td>
                  <td>{entry.gamesPlayed}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
