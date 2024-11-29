import { useState, useCallback } from "react";
import { GameSettings, CountryInfo } from "@/components/types";

export const useGameState = () => {
  const [gameState, setGameState] = useState({
    score: 0,
    streak: 0,
    timeRemaining: 60,
    hintsRemaining: 3,
    gameActive: false,
    currentCountry: null as CountryInfo | null,
  });

  const updateGameState = useCallback((updates: Partial<typeof gameState>) => {
    setGameState((prev) => ({ ...prev, ...updates }));
  }, []);

  const resetGame = useCallback((settings: GameSettings) => {
    const difficultySettings = {
      easy: { time: 60, hints: 5 },
      medium: { time: 45, hints: 3 },
      hard: { time: 30, hints: 1 },
    };

    setGameState({
      score: 0,
      streak: 0,
      timeRemaining: difficultySettings[settings.difficulty].time,
      hintsRemaining: difficultySettings[settings.difficulty].hints,
      gameActive: true,
      currentCountry: null,
    });
  }, []);

  return { gameState, updateGameState, resetGame };
};
