import React from "react";
import Map, {
  Source,
  Layer,
  MapLayerMouseEvent,
  ViewState,
} from "react-map-gl";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Lightbulb, Globe2, Timer, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const MAPBOX_TOKEN =
  "pk.eyJ1IjoibXVrZXNoMTJyb3kiLCJhIjoiY2tkZmhidWMyMmE2bzJ4cGMzOXVzc3JnYSJ9.Nq3Hwr2L4TPmn6-NlRm4-Q";
const MAPBOX_STYLE = "mapbox://styles/mukesh12roy/cm3sclwur007y01sd86m515jy";

interface GameInterfaceProps {
  score: number;
  highScore: number;
  currentCountry: CountryInfo | null;
  streak: number;
  showFeedback: boolean;
  feedback: string;
  gameActive: boolean;
  selectedCountry: string | null;
  viewState: ViewState;
  geoJSONData: any;
  settings: GameSettings;
  setSettings: React.Dispatch<React.SetStateAction<GameSettings>>;
  revealedHints: string[];
  timeRemaining: number;
  gameStarted: boolean;
  onGetHint: () => void;
  onStartGame: () => void;
  onEndGame: () => void;
  onMapClick: (event: MapLayerMouseEvent) => void;
  onMove: (evt: { viewState: ViewState }) => void;
}

interface CountryInfo {
  name: string;
  capital: string;
  flag: string;
  fact: string;
  continent: string;
  currency: string;
  subregion: string;
  wikiLink: string;
  population: number;
  area: number;
  languages: string[];
}

interface GameSettings {
  selectedContinent: string;
  difficulty: "easy" | "medium" | "hard";
  hintsRemaining: number;
}

const GameInterface: React.FC<GameInterfaceProps> = ({
  score,
  highScore,
  currentCountry,
  streak,
  showFeedback,
  feedback,
  gameActive,
  selectedCountry,
  viewState,
  geoJSONData,
  settings,
  setSettings,
  revealedHints,
  timeRemaining,
  gameStarted,
  onGetHint,
  onStartGame,
  onEndGame,
  onMapClick,
  onMove,
}) => {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="h-screen relative overflow-hidden bg-[#001324]">
      {!gameStarted && (
        <Dialog open={true}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {score > 0 ? "Game Over!" : "Geography Challenge Settings"}
              </DialogTitle>
            </DialogHeader>
            {score === 0 ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Continent
                  </label>
                  <Select
                    value={settings.selectedContinent}
                    onValueChange={(value) =>
                      setSettings({ ...settings, selectedContinent: value })
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
                      <SelectItem value="North America">
                        North America
                      </SelectItem>
                      <SelectItem value="South America">
                        South America
                      </SelectItem>
                      <SelectItem value="Oceania">Oceania</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Difficulty
                  </label>
                  <Select
                    value={settings.difficulty}
                    onValueChange={(value: "easy" | "medium" | "hard") =>
                      setSettings({ ...settings, difficulty: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select difficulty" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="easy">Easy (60s, 5 hints)</SelectItem>
                      <SelectItem value="medium">
                        Medium (45s, 3 hints)
                      </SelectItem>
                      <SelectItem value="hard">Hard (30s, 1 hint)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={onStartGame} className="w-full">
                  <Play className="w-4 h-4 mr-2" />
                  Start Game
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-lg">Final Score: {score}</p>
                {score > highScore && (
                  <p className="text-green-500">New High Score! 🎉</p>
                )}
                <p>Longest Streak: {streak}</p>
                <Button onClick={onStartGame} className="w-full">
                  Play Again
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      )}

      <motion.div
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="absolute top-0 left-0 right-0 z-10 bg-black/20 backdrop-blur-sm border-b border-white/10"
      >
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Globe2 className="w-8 h-8 text-white" />
              <h1 className="text-2xl font-bold text-white">
                Geography Challenge
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full">
                <Timer className="w-5 h-5 text-white" />
                <span className="text-xl font-bold text-white">
                  {formatTime(timeRemaining)}
                </span>
              </div>
              <div className="flex items-center gap-4 px-4 py-2 bg-white/10 rounded-full">
                <Trophy className="w-6 h-6 text-yellow-400" />
                <span className="text-xl font-bold text-white">{score}</span>
                <span className="text-white/60">Best: {highScore}</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      <AnimatePresence mode="wait">
        {currentCountry && (
          <motion.div
            key="game-panel"
            initial={{ x: -300 }}
            animate={{ x: 0 }}
            exit={{ x: -300 }}
            className="absolute left-4 top-20 z-10 max-w-md"
          >
            <div className="bg-black/40 backdrop-blur-md rounded-2xl p-6 border border-white/10">
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <img
                    src={currentCountry.flag}
                    alt={`Flag of ${currentCountry.name}`}
                    className="h-16 w-24 object-cover rounded-lg shadow-lg"
                  />
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold text-white mb-1">
                      Find: {currentCountry.name}
                    </h2>
                    <p className="text-white/80">
                      Capital: {currentCountry.capital}
                    </p>
                  </div>
                </div>
                <p className="text-white/70 text-sm">{currentCountry.fact}</p>

                <div className="space-y-2">
                  {revealedHints.map((hint, index) => (
                    <div
                      key={`hint-${index}`}
                      className="text-white/80 text-sm bg-white/10 p-2 rounded"
                    >
                      {hint}
                    </div>
                  ))}
                  {settings.hintsRemaining > 0 && (
                    <Button
                      onClick={onGetHint}
                      variant="ghost"
                      className="text-white hover:bg-white/20"
                    >
                      <Lightbulb className="w-4 h-4 mr-2" />
                      Get Hint ({settings.hintsRemaining} remaining)
                    </Button>
                  )}
                </div>

                <div className="flex gap-3 pt-2">
                  <Button
                    onClick={onEndGame}
                    variant="destructive"
                    className="bg-red-500/60 hover:bg-red-500/80"
                  >
                    End Game
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Map
        {...viewState}
        onMove={onMove}
        style={{ width: "100%", height: "100%" }}
        mapStyle={MAPBOX_STYLE}
        mapboxAccessToken={MAPBOX_TOKEN}
        interactiveLayerIds={gameActive ? ["countries-fill"] : []}
        onClick={onMapClick}
        attributionControl={false}
      >
        {geoJSONData && (
          <Source type="geojson" data={geoJSONData}>
            <Layer
              id="countries-fill"
              type="fill"
              paint={{
                "fill-color": [
                  "case",
                  ["==", ["get", "name"], selectedCountry],
                  selectedCountry === currentCountry?.name
                    ? "rgba(34, 197, 94, 0.6)"
                    : "rgba(239, 68, 68, 0.6)",
                  "#ffffff",
                ],
                "fill-opacity": [
                  "case",
                  ["==", ["get", "name"], selectedCountry],
                  0.5,
                  0.05,
                ],
              }}
            />
            <Layer
              id="countries-border"
              type="line"
              paint={{
                "line-color": "#ffffff",
                "line-width": 0.5,
                "line-opacity": 0.3,
              }}
            />
            {settings.difficulty === "easy" && (
              <Layer
                id="country-labels"
                type="symbol"
                layout={{
                  "text-field": ["get", "name"],
                  "text-size": 12,
                  "text-anchor": "center",
                }}
                paint={{
                  "text-color": "#ffffff",
                  "text-opacity": 0.7,
                }}
              />
            )}
          </Source>
        )}
      </Map>

      <AnimatePresence mode="wait">
        {showFeedback && (
          <motion.div
            key="feedback"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-20 right-4 max-w-sm"
          >
            <Alert
              className={`
                backdrop-blur-md border shadow-lg
                ${
                  feedback.includes("Correct")
                    ? "bg-green-500/20 border-green-500/50 text-green-400"
                    : "bg-red-500/20 border-red-500/50 text-red-400"
                }
              `}
            >
              <p className="text-lg font-bold">{feedback}</p>
            </Alert>
          </motion.div>
        )}

        {streak > 0 && (
          <motion.div
            key="streak"
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 100 }}
            className="absolute bottom-4 right-4 bg-gradient-to-r from-orange-500/80 to-yellow-500/80 backdrop-blur-sm px-6 py-2 rounded-full"
          >
            <div className="flex items-center gap-2 text-white">
              <span className="text-2xl">🔥</span>
              <span className="font-bold">{streak}</span>
              <span>streak!</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default GameInterface;
