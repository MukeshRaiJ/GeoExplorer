// GameSettings.tsx
import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { GameSettings, Continent, Difficulty } from "@/components/types";

// Define the props interface
interface GameSettingsProps {
  open: boolean;
  onClose: () => void;
  settings: GameSettings;
  onSettingsChange: (settings: GameSettings) => void;
  onStartGame: () => void;
  score: number;
  highScore: number;
  streak: number;
}

const GameSettingsDialog: React.FC<GameSettingsProps> = ({
  open,
  onClose,
  settings,
  onSettingsChange,
  onStartGame,
  score,
  highScore,
  streak,
}) => {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-[#001324]/95 text-white border border-white/20">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            {score > 0 ? "Game Over!" : "Geography Challenge Settings"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Continent</label>
            <Select
              value={settings.selectedContinent}
              onValueChange={(value: Continent) =>
                onSettingsChange({ ...settings, selectedContinent: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select continent" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Continents</SelectItem>
                <SelectItem value="Africa">Africa</SelectItem>
                <SelectItem value="Asia">Asia</SelectItem>
                <SelectItem value="Europe">Europe</SelectItem>
                <SelectItem value="North America">North America</SelectItem>
                <SelectItem value="South America">South America</SelectItem>
                <SelectItem value="Oceania">Oceania</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Difficulty</label>
            <Select
              value={settings.difficulty}
              onValueChange={(value: Difficulty) =>
                onSettingsChange({ ...settings, difficulty: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select difficulty" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="easy">Easy (60s, 5 hints)</SelectItem>
                <SelectItem value="medium">Medium (45s, 3 hints)</SelectItem>
                <SelectItem value="hard">Hard (30s, 1 hint)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {score > 0 && (
            <div className="space-y-2">
              <p className="text-lg">Final Score: {score}</p>
              {score > highScore && (
                <p className="text-green-500">New High Score! 🎉</p>
              )}
              <p>Longest Streak: {streak}</p>
            </div>
          )}

          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} className="w-full">
              Cancel
            </Button>
            <Button onClick={onStartGame} className="w-full">
              {score > 0 ? "Play Again" : "Start Game"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default GameSettingsDialog;
