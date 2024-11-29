import React, { useState, useCallback, useRef, useEffect } from "react";
import Map, { Source, Layer, MapRef } from "react-map-gl";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Lightbulb, Globe2, Timer, LogOut, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Leaderboard } from "@/components/Leaderboard";
import Image from "next/image";
import { useAuth } from "@/components/firebase/useAuth";
import "mapbox-gl/dist/mapbox-gl.css";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
const MAPBOX_STYLE = process.env.NEXT_PUBLIC_MAPBOX_STYLE;

const GameInterface: React.FC<GameInterfaceProps> = ({
  user,
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
  revealedHints,
  timeRemaining,
  gameStarted,
  onGetHint,
  onStartGame,
  onEndGame,
  onMapClick,
  onMove,
  onSelectNewCountry,
}) => {
  const { signOutUser } = useAuth();
  const [mapLoaded, setMapLoaded] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showLocationDialog, setShowLocationDialog] = useState(false);
  const [isRevealingCountry, setIsRevealingCountry] = useState(false);
  const mapRef = useRef<MapRef>(null);

  const calculateBounds = (geometry: any) => {
    let allCoords: number[][] = [];
    if (geometry.type === "Polygon") {
      allCoords = geometry.coordinates[0];
    } else if (geometry.type === "MultiPolygon") {
      geometry.coordinates.forEach((polygon: number[][][]) => {
        allCoords = [...allCoords, ...polygon[0]];
      });
    }

    const bounds = allCoords.reduce(
      (acc, coord) => ({
        minLng: Math.min(acc.minLng, coord[0]),
        maxLng: Math.max(acc.maxLng, coord[0]),
        minLat: Math.min(acc.minLat, coord[1]),
        maxLat: Math.max(acc.maxLat, coord[1]),
      }),
      { minLng: 180, maxLng: -180, minLat: 90, maxLat: -90 }
    );

    return bounds;
  };

  const flyToCountry = useCallback(
    async (country: any) => {
      if (!mapRef.current || !country) return;

      setIsRevealingCountry(true);
      const bounds = calculateBounds(country.geometry);
      const boundsWidth = bounds.maxLng - bounds.minLng;
      const boundsHeight = bounds.maxLat - bounds.minLat;
      const maxDimension = Math.max(boundsWidth, boundsHeight);

      let zoom = 4;
      if (maxDimension > 50) zoom = 3;
      if (maxDimension > 90) zoom = 2;
      if (maxDimension < 20) zoom = 5;

      const crossesAntimeridian = bounds.minLng > bounds.maxLng;
      const center = crossesAntimeridian
        ? [
            (bounds.minLng + bounds.maxLng + 360) / 2,
            (bounds.minLat + bounds.maxLat) / 2,
          ]
        : [
            (bounds.minLng + bounds.maxLng) / 2,
            (bounds.minLat + bounds.maxLat) / 2,
          ];

      try {
        // First zoom in close to the country
        await mapRef.current.flyTo({
          center,
          zoom: zoom + 2,
          duration: 2000,
          essential: true,
        });

        // Wait at close zoom
        await new Promise((resolve) => setTimeout(resolve, 2000));

        // Then zoom out to show regional context
        await mapRef.current.flyTo({
          center,
          zoom: Math.max(2, zoom - 1),
          duration: 2000,
          essential: true,
        });

        // Wait at regional view
        await new Promise((resolve) => setTimeout(resolve, 6000));

        // Reset view
        await mapRef.current.flyTo({
          center: [0, 20],
          zoom: 2,
          duration: 2000,
          essential: true,
        });

        await new Promise((resolve) => setTimeout(resolve, 2000));
        setIsRevealingCountry(false);
        onSelectNewCountry();
      } catch (error) {
        console.error("Error during fly animation:", error);
        setIsRevealingCountry(false);
      }
    },
    [onSelectNewCountry]
  );

  const handleMapLoad = useCallback(() => {
    setMapLoaded(true);
  }, []);

  const handleInternalMapClick = useCallback(
    (event: any) => {
      if (!gameActive || !currentCountry || isRevealingCountry) return;

      const features = event.features;
      if (!features || features.length === 0) return;

      const clickedCountry = features[0];
      const isCorrect = clickedCountry.properties.name === currentCountry.name;

      if (!isCorrect) {
        setShowLocationDialog(true);
      }

      onMapClick(event);
    },
    [currentCountry, gameActive, isRevealingCountry, onMapClick]
  );

  const showCorrectLocation = async () => {
    if (!currentCountry || !geoJSONData) return;

    const correctCountryFeature = geoJSONData.features.find(
      (feature) => feature.properties.name === currentCountry.name
    );

    if (correctCountryFeature) {
      setShowLocationDialog(false);
      await flyToCountry(correctCountryFeature);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="h-screen relative overflow-hidden bg-[#001324]">
      <motion.div
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="absolute top-0 left-0 right-0 z-10 bg-black/40 backdrop-blur-md border-b border-white/20"
      >
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Globe2 className="w-8 h-8 text-white animate-pulse" />
              <h1 className="text-2xl font-bold text-white">GeoExplorer</h1>
            </div>
            <div className="flex items-center gap-4">
              {user && (
                <div className="flex items-center gap-3">
                  <Image
                    src={user.photoURL}
                    alt={user.displayName || "User"}
                    width={32}
                    height={32}
                    className="rounded-full border border-white/20"
                  />
                  <span className="text-white/80">{user.displayName}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={signOutUser}
                    className="text-white hover:bg-white/10"
                  >
                    <LogOut className="w-4 h-4" />
                  </Button>
                </div>
              )}

              <motion.div
                className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full"
                animate={{ scale: timeRemaining <= 10 ? [1, 1.1, 1] : 1 }}
                transition={{
                  repeat: timeRemaining <= 10 ? Infinity : 0,
                  duration: 0.5,
                }}
              >
                <Timer className="w-5 h-5 text-white" />
                <span
                  className={`text-xl font-bold ${
                    timeRemaining <= 10 ? "text-red-400" : "text-white"
                  }`}
                >
                  {formatTime(timeRemaining)}
                </span>
              </motion.div>

              <motion.div
                className="flex items-center gap-4 px-4 py-2 bg-white/10 rounded-full"
                whileHover={{ scale: 1.05 }}
              >
                <Trophy className="w-6 h-6 text-yellow-400" />
                <span className="text-xl font-bold text-white">{score}</span>
                <span className="text-white/60">Best: {highScore}</span>
              </motion.div>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowLeaderboard(true)}
                className="text-white hover:bg-white/10 ml-2"
              >
                <Award className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </motion.div>

      <Map
        ref={mapRef}
        {...viewState}
        onMove={onMove}
        style={{ width: "100%", height: "100%" }}
        mapStyle={MAPBOX_STYLE}
        mapboxAccessToken={MAPBOX_TOKEN}
        interactiveLayerIds={
          gameActive && !isRevealingCountry ? ["countries-fill"] : []
        }
        onClick={handleInternalMapClick}
        attributionControl={false}
        onLoad={handleMapLoad}
      >
        {mapLoaded && geoJSONData && (
          <Source type="geojson" data={geoJSONData}>
            <Layer
              id="countries-fill"
              type="fill"
              paint={{
                "fill-color": [
                  "case",
                  ["==", ["get", "name"], currentCountry?.name || ""],
                  isRevealingCountry
                    ? "rgba(34, 197, 94, 0.8)"
                    : "rgba(255, 255, 255, 0.05)",
                  ["==", ["get", "name"], selectedCountry || ""],
                  selectedCountry === currentCountry?.name
                    ? "rgba(34, 197, 94, 0.8)"
                    : "rgba(239, 68, 68, 0.8)",
                  "rgba(255, 255, 255, 0.05)",
                ],
                "fill-opacity": [
                  "case",
                  ["==", ["get", "name"], currentCountry?.name || ""],
                  isRevealingCountry ? 0.8 : 0.1,
                  ["==", ["get", "name"], selectedCountry || ""],
                  0.8,
                  0.1,
                ],
              }}
            />
            <Layer
              id="countries-border"
              type="line"
              paint={{
                "line-color": "#ffffff",
                "line-width": 0.5,
                "line-opacity": 0.4,
              }}
            />
            {settings.difficulty === "easy" && !isRevealingCountry && (
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

      {currentCountry && !isRevealingCountry && (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="absolute left-4 top-20 z-10 w-64"
        >
          <div className="bg-black/60 backdrop-blur-md rounded-2xl p-4 border-2 border-white/20">
            <div className="relative overflow-hidden rounded-lg mb-4">
              <img
                src={currentCountry.flag}
                alt={`Flag of ${currentCountry.name}`}
                className="w-full h-32 object-cover"
              />
            </div>

            <div className="space-y-3">
              <h2 className="text-xl font-bold text-white">
                Find: {currentCountry.name}
              </h2>
              <p className="text-white/80 text-sm">
                Capital: {currentCountry.capital}
              </p>
              <p className="text-white/70 text-sm">{currentCountry.fact}</p>

              <div className="space-y-2">
                {revealedHints.map((hint, index) => (
                  <motion.div
                    key={`hint-${index}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-white/80 text-sm bg-white/10 p-2 rounded"
                  >
                    {hint}
                  </motion.div>
                ))}
                {settings.hintsRemaining > 0 && (
                  <Button
                    onClick={onGetHint}
                    variant="ghost"
                    className="w-full text-white hover:bg-white/20 transition-colors"
                    disabled={isRevealingCountry}
                  >
                    <Lightbulb className="w-4 h-4 mr-2" />
                    Get Hint ({settings.hintsRemaining})
                  </Button>
                )}
              </div>

              <Button
                onClick={onEndGame}
                variant="destructive"
                className="w-full bg-red-500/60 hover:bg-red-500/80 transition-colors"
                disabled={isRevealingCountry}
              >
                End Game
              </Button>
            </div>
          </div>
        </motion.div>
      )}

      <Dialog open={showLeaderboard} onOpenChange={setShowLeaderboard}>
        <DialogContent className="bg-[#001324]/95 text-white border border-white/20">
          <DialogHeader>
            <DialogTitle className="text-2xl flex items-center gap-2">
              <Award className="w-6 h-6 text-yellow-400" />
              Leaderboard
            </DialogTitle>
          </DialogHeader>
          <Leaderboard />
        </DialogContent>
      </Dialog>

      <Dialog open={showLocationDialog} onOpenChange={setShowLocationDialog}>
        <DialogContent className="bg-[#001324]/95 text-white border border-white/20">
          <DialogHeader>
            <DialogTitle>
              Would you like to see the correct location?
            </DialogTitle>
          </DialogHeader>
          <div className="flex justify-end gap-4">
            <Button
              variant="ghost"
              onClick={() => setShowLocationDialog(false)}
            >
              Continue Playing
            </Button>
            <Button onClick={showCorrectLocation} disabled={isRevealingCountry}>
              Show Location
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <AnimatePresence mode="wait">
        {showFeedback && !isRevealingCountry && (
          <motion.div
            key="feedback"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-20 left-1/2 -translate-x-1/2 max-w-sm z-20"
          >
            <Alert
              className={`backdrop-blur-md border shadow-lg bg-white/10 border-white/20 text-white ${
                feedback.includes("Correct")
                  ? "border-green-500/50"
                  : "border-red-500/50"
              }`}
            >
              <p className="text-lg font-bold">{feedback}</p>
            </Alert>
          </motion.div>
        )}

        {streak > 0 && !isRevealingCountry && (
          <motion.div
            key="streak"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute bottom-4 right-4 bg-gradient-to-r from-orange-500 to-yellow-500 backdrop-blur-sm px-6 py-2 rounded-full shadow-lg"
          >
            <motion.div
              className="flex items-center gap-2 text-white"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{
                duration: 0.5,
                repeat: Infinity,
                repeatType: "reverse",
              }}
            >
              <span className="text-2xl">🔥</span>
              <span className="font-bold">{streak}</span>
              <span>streak!</span>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {gameStarted && score === 0 && !isRevealingCountry && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white/10 backdrop-blur-md px-6 py-3 rounded-full shadow-lg text-white text-sm"
        >
          Click on the country you think matches the flag and description
        </motion.div>
      )}
    </div>
  );
};

export default GameInterface;
