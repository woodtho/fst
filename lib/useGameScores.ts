"use client";

import { useCallback, useEffect, useState } from "react";
import {
  GAME_SCORE_STORAGE_KEY,
  emptyGameScoreStore,
  mergeGameScore,
  parseGameScoreStore,
  type CompletedGame,
  type GameScoreStore,
} from "./gameScores";

const SCORE_EVENT = "fsl-trainer:game-score-updated";

export function useGameScores() {
  const [store, setStore] = useState<GameScoreStore>(emptyGameScoreStore);

  const reload = useCallback(() => {
    try { setStore(parseGameScoreStore(window.localStorage.getItem(GAME_SCORE_STORAGE_KEY))); }
    catch { setStore(emptyGameScoreStore()); }
  }, []);

  useEffect(() => {
    reload();
    const onStorage = (event: StorageEvent) => { if (event.key === GAME_SCORE_STORAGE_KEY) reload(); };
    const onLocal = () => reload();
    window.addEventListener("storage", onStorage);
    window.addEventListener(SCORE_EVENT, onLocal);
    return () => { window.removeEventListener("storage", onStorage); window.removeEventListener(SCORE_EVENT, onLocal); };
  }, [reload]);

  const record = useCallback((completed: CompletedGame) => {
    try {
      const current = parseGameScoreStore(window.localStorage.getItem(GAME_SCORE_STORAGE_KEY));
      const next = mergeGameScore(current, completed);
      window.localStorage.setItem(GAME_SCORE_STORAGE_KEY, JSON.stringify(next));
      setStore(next);
      window.dispatchEvent(new Event(SCORE_EVENT));
      return next;
    } catch {
      return null;
    }
  }, []);

  return { store, record };
}
