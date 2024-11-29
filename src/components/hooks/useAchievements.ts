"use client";
import { useState, useEffect } from "react";
import { doc, updateDoc, getDoc } from "firebase/firestore";
import { db } from "@/components/firebase/firesbase";
import { UserData } from "@/components/types";

interface Achievement {
  id: string;
  title: string;
  description: string;
  condition: (stats: any) => boolean;
  reward: number;
}

const achievements: Achievement[] = [
  {
    id: "first_win",
    title: "First Victory",
    description: "Complete your first game",
    condition: (stats) => stats.gamesPlayed >= 1,
    reward: 100,
  },
  {
    id: "streak_master",
    title: "Streak Master",
    description: "Achieve a streak of 5 or more",
    condition: (stats) => stats.bestStreak >= 5,
    reward: 250,
  },
  {
    id: "high_scorer",
    title: "High Scorer",
    description: "Score over 1000 points in a single game",
    condition: (stats) => stats.highScore >= 1000,
    reward: 500,
  },
];

export const useAchievements = (userId: string) => {
  const [unlockedAchievements, setUnlockedAchievements] = useState<string[]>(
    []
  );
  const [loading, setLoading] = useState(true);

  const checkAchievements = async (stats: any) => {
    const userRef = doc(db, "users", userId);
    const userDoc = await getDoc(userRef);
    const userData = userDoc.data() as UserData & { achievements?: string[] };
    const currentAchievements = userData.achievements || [];

    const newAchievements = achievements.filter(
      (achievement) =>
        !currentAchievements.includes(achievement.id) &&
        achievement.condition(stats)
    );

    if (newAchievements.length > 0) {
      const newUnlocked = newAchievements.map((a) => a.id);
      await updateDoc(userRef, {
        achievements: [...currentAchievements, ...newUnlocked],
        score:
          (userData.totalScore || 0) +
          newAchievements.reduce((acc, a) => acc + a.reward, 0),
      });
      setUnlockedAchievements(newUnlocked);
    }
  };

  return { checkAchievements, unlockedAchievements };
};
