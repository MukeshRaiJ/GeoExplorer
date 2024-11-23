"use client";
import React, { useState, useEffect } from "react";
import GameInterface from "./map";
import GameSettingsDialog from "./GameSettings";
import OnboardingFlow from "./Onboarding";
import { useAuth } from "@/components/firebase/useAuth";
import { doc, updateDoc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/components/firebase/firesbase";
import { Globe2 } from "lucide-react";

import {
  CountryInfo,
  GameSettings,
  MapLayerMouseEvent,
  ViewState,
  UserData,
} from "@/components/types";

const GeographyGame = () => {
  const { user } = useAuth();
  const [initialLoading, setInitialLoading] = useState(true);
  const [geoJSONData, setGeoJSONData] = useState<any>(null);
  const [countryData, setCountryData] = useState<CountryInfo[]>([]);
  const [currentCountry, setCurrentCountry] = useState<CountryInfo | null>(
    null
  );
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [feedback, setFeedback] = useState<string>("");
  const [showFeedback, setShowFeedback] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [gameActive, setGameActive] = useState(true);
  const [settings, setSettings] = useState<GameSettings>({
    selectedContinent: "all",
    difficulty: "medium",
    hintsRemaining: 3,
  });
  const [revealedHints, setRevealedHints] = useState<string[]>([]);
  const [timeRemaining, setTimeRemaining] = useState<number>(60);
  const [gameStarted, setGameStarted] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showGameSettings, setShowGameSettings] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  const [viewState, setViewState] = useState<ViewState>({
    longitude: 0,
    latitude: 20,
    zoom: 1.8,
    bearing: 0,
    padding: { top: 0, bottom: 0, left: 0, right: 0 },
    pitch: 0,
  });

  useEffect(() => {
    const loadGameData = async () => {
      if (!user) return; // Wait for user to be available

      try {
        // Load game data first
        const [geoJSONResponse, countriesResponse] = await Promise.all([
          fetch("/geojson.json"),
          fetch("/countries.json"),
        ]);

        const [geoJSON, countries] = await Promise.all([
          geoJSONResponse.json(),
          countriesResponse.json(),
        ]);

        setGeoJSONData(geoJSON);
        setCountryData(countries);

        // Then load user data
        const userRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userRef);

        if (userDoc.exists()) {
          const userData = userDoc.data() as UserData;
          setHighScore(userData.highScore);
          if (!userData.hasCompletedOnboarding) {
            setShowOnboarding(true);
            setShowGameSettings(false);
          } else {
            setShowOnboarding(false);
            setShowGameSettings(true);
          }
        } else {
          // Initialize new user data
          await setDoc(userRef, {
            uid: user.uid,
            displayName: user.displayName,
            email: user.email,
            photoURL: user.photoURL,
            hasCompletedOnboarding: false,
            highScore: 0,
            gamesPlayed: 0,
            totalScore: 0,
            bestStreak: 0,
            lastPlayed: new Date().toISOString(),
          });
          setShowOnboarding(true);
          setShowGameSettings(false);
        }

        setIsInitialized(true);
      } catch (error) {
        console.error("Error loading game data:", error);
      } finally {
        setInitialLoading(false);
      }
    };

    if (user) {
      loadGameData();
    }
  }, [user]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (gameStarted && timeRemaining > 0) {
      timer = setInterval(() => {
        setTimeRemaining((prev) => prev - 1);
      }, 1000);
    } else if (timeRemaining === 0) {
      endGame();
    }
    return () => clearInterval(timer);
  }, [gameStarted, timeRemaining]);

  const updateUserStats = async (finalScore: number, finalStreak: number) => {
    if (!user) return;

    const userRef = doc(db, "users", user.uid);
    const userDoc = await getDoc(userRef);

    if (userDoc.exists()) {
      const userData = userDoc.data() as UserData;
      await updateDoc(userRef, {
        gamesPlayed: userData.gamesPlayed + 1,
        totalScore: userData.totalScore + finalScore,
        highScore: Math.max(userData.highScore, finalScore),
        bestStreak: Math.max(userData.bestStreak, finalStreak),
        lastPlayed: new Date().toISOString(),
      });
    }
  };

  const handleCompleteOnboarding = async () => {
    if (user) {
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, {
        hasCompletedOnboarding: true,
      });
    }
    setShowOnboarding(false);
    setShowGameSettings(true);
  };

  const selectNewCountry = () => {
    if (!geoJSONData || !countryData || countryData.length === 0) return;

    const filteredCountries = countryData.filter(
      (country) =>
        settings.selectedContinent === "all" ||
        country.continent === settings.selectedContinent
    );

    const randomCountry =
      filteredCountries[Math.floor(Math.random() * filteredCountries.length)];
    setCurrentCountry(randomCountry);
    setSelectedCountry(null);
    setShowFeedback(false);
    setGameActive(true);
    setRevealedHints([]);
  };

  const getHint = () => {
    if (
      !currentCountry ||
      settings.hintsRemaining <= 0 ||
      revealedHints.length >= 3
    )
      return;

    const availableHints = [
      `Population: ${currentCountry.population.toLocaleString()}`,
      `Area: ${currentCountry.area.toLocaleString()} km²`,
      `Languages: ${currentCountry.languages.join(", ")}`,
      `Subregion: ${currentCountry.subregion}`,
      `Currency: ${currentCountry.currency}`,
    ].filter((hint) => !revealedHints.includes(hint));

    if (availableHints.length === 0) return;

    const newHint =
      availableHints[Math.floor(Math.random() * availableHints.length)];
    setRevealedHints((prev) => [...prev, newHint]);
    setSettings((prev) => ({
      ...prev,
      hintsRemaining: prev.hintsRemaining - 1,
    }));
  };

  const startGame = () => {
    const difficultySettings = {
      easy: { time: 60, hints: 5 },
      medium: { time: 45, hints: 3 },
      hard: { time: 30, hints: 1 },
    };

    setGameStarted(true);
    setShowGameSettings(false);
    setScore(0);
    setStreak(0);
    setTimeRemaining(difficultySettings[settings.difficulty].time);
    setSettings((prev) => ({
      ...prev,
      hintsRemaining: difficultySettings[settings.difficulty].hints,
    }));
    selectNewCountry();
  };

  const handleCloseSettings = () => {
    if (score > 0) {
      setShowGameSettings(false);
      setScore(0);
      startGame();
    } else {
      setShowGameSettings(false);
      setShowOnboarding(true);
    }
  };

  const endGame = async () => {
    setGameStarted(false);
    setGameActive(false);
    if (score > highScore) {
      setHighScore(score);
    }
    await updateUserStats(score, streak);
    setShowGameSettings(true);
  };

  const handleMapClick = (event: MapLayerMouseEvent) => {
    if (!gameActive || !currentCountry || !geoJSONData) return;

    const features = event.features;
    if (!features || features.length === 0) return;

    const clickedCountry = features[0].properties.name;
    setSelectedCountry(clickedCountry);
    setGameActive(false);

    const isCorrect = clickedCountry === currentCountry.name;
    const pointsMultiplier = {
      easy: 1,
      medium: 1.5,
      hard: 2,
    }[settings.difficulty];

    if (isCorrect) {
      const basePoints = 100;
      const streakBonus = streak * 20;
      const difficultyBonus = Math.floor(
        (basePoints + streakBonus) * pointsMultiplier
      );
      const timeBonus = Math.floor(timeRemaining * 2);
      const totalPoints = difficultyBonus + timeBonus;

      setScore((prev) => prev + totalPoints);
      setStreak((prev) => prev + 1);
      setFeedback(
        `Correct! +${totalPoints} points (${
          streak + 1
        }x streak, ${timeBonus} time bonus)`
      );
    } else {
      setFeedback(`Wrong! That was ${clickedCountry}`);
      setStreak(0);
    }

    setShowFeedback(true);

    setTimeout(() => {
      selectNewCountry();
    }, 2000);
  };

  if (initialLoading || !isInitialized) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#001324]">
        <div className="text-white text-xl flex items-center gap-3">
          <Globe2 className="w-8 h-8 animate-pulse" />
          Loading Game Data...
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <OnboardingFlow
        open={showOnboarding}
        onComplete={handleCompleteOnboarding}
      />

      <GameSettingsDialog
        open={!showOnboarding && !gameStarted && showGameSettings}
        onClose={handleCloseSettings}
        settings={settings}
        onSettingsChange={setSettings}
        onStartGame={startGame}
        score={score}
        highScore={highScore}
        streak={streak}
      />

      <GameInterface
        user={user}
        score={score}
        highScore={highScore}
        currentCountry={currentCountry}
        streak={streak}
        showFeedback={showFeedback}
        feedback={feedback}
        gameActive={gameActive}
        selectedCountry={selectedCountry}
        viewState={viewState}
        geoJSONData={geoJSONData}
        settings={settings}
        setSettings={setSettings}
        revealedHints={revealedHints}
        timeRemaining={timeRemaining}
        gameStarted={gameStarted}
        onGetHint={getHint}
        onStartGame={startGame}
        onEndGame={endGame}
        onMapClick={handleMapClick}
        onMove={(evt: { viewState: ViewState }) => setViewState(evt.viewState)}
      />
    </div>
  );
};

export default GeographyGame;
