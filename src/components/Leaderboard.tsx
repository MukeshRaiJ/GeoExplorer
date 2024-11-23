import { useState, useEffect } from "react";
import {
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
} from "firebase/firestore";
import { db } from "@/components/firebase/firesbase";
import { LeaderboardEntry } from "@/components/types";
import { Trophy, Medal, Crown } from "lucide-react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";

export const Leaderboard = () => {
  const [leaders, setLeaders] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, "users"),
      orderBy("highScore", "desc"),
      limit(10)
    );
    return onSnapshot(q, (snapshot) => {
      const leaderboardData: LeaderboardEntry[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        leaderboardData.push({
          uid: doc.id,
          displayName: data.displayName,
          photoURL: data.photoURL,
          highScore: data.highScore,
          bestStreak: data.bestStreak,
        });
      });
      setLeaders(leaderboardData);
      setLoading(false);
    });
  }, []);

  const getRankIcon = (index: number) => {
    switch (index) {
      case 0:
        return <Crown className="w-6 h-6 text-yellow-400" />;
      case 1:
        return <Medal className="w-6 h-6 text-gray-300" />;
      case 2:
        return <Medal className="w-6 h-6 text-amber-600" />;
      default:
        return (
          <span className="text-lg font-bold text-white/80 w-6 text-center">
            {index + 1}
          </span>
        );
    }
  };

  if (loading) {
    return (
      <Card className="bg-black/40 backdrop-blur-md border-white/20">
        <CardContent className="p-8">
          <div className="flex items-center justify-center space-x-2 animate-pulse">
            <div className="w-3 h-3 bg-white/40 rounded-full animate-bounce"></div>
            <div className="w-3 h-3 bg-white/40 rounded-full animate-bounce delay-75"></div>
            <div className="w-3 h-3 bg-white/40 rounded-full animate-bounce delay-150"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-black/40 backdrop-blur-md border-white/20">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <Trophy className="w-8 h-8 text-yellow-400" />
          <h2 className="text-2xl font-bold text-white">Global Leaderboard</h2>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {leaders.map((leader, index) => (
          <div
            key={leader.uid}
            className="group flex items-center gap-4 p-3 rounded-xl bg-white/10 hover:bg-white/20 transition-all duration-300 transform hover:scale-102"
          >
            <div className="flex items-center gap-3 flex-1">
              {getRankIcon(index)}
              <div className="relative">
                <img
                  src={leader.photoURL}
                  alt={leader.displayName}
                  className="w-10 h-10 rounded-full border-2 border-white/20 group-hover:border-white/40 transition-all"
                />
                {index < 3 && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full border-2 border-black animate-pulse" />
                )}
              </div>
              <div className="flex flex-col">
                <span className="text-white font-medium">
                  {leader.displayName}
                </span>
                <span className="text-white/60 text-sm">
                  Streak: {leader.bestStreak}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-yellow-400 font-bold text-xl">
                {leader.highScore.toLocaleString()}
              </span>
              <span className="text-white/60 text-sm">pts</span>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default Leaderboard;
