"use client";
import React, { useState, useEffect } from "react";
import { MapLayerMouseEvent, ViewState } from "react-map-gl";
import GameInterface from "./map";

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

const GeographyGame = () => {
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

  const [viewState, setViewState] = useState<ViewState>({
    longitude: 0,
    latitude: 20,
    zoom: 1.8,
    bearing: 0,
    padding: { top: 0, bottom: 0, left: 0, right: 0 },
    pitch: 0,
  });

  useEffect(() => {
    Promise.all([
      fetch("/geojson.json").then((response) => response.json()),
      fetch("/countries.json").then((response) => response.json()),
    ])
      .then(([geoJSON, countries]) => {
        setGeoJSONData(geoJSON);
        setCountryData(countries);
      })
      .catch((error) => console.error("Error loading data:", error));

    const savedHighScore = localStorage.getItem("geographyGameHighScore");
    if (savedHighScore) setHighScore(parseInt(savedHighScore));
  }, []);

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

  const selectNewCountry = () => {
    if (!geoJSONData || !countryData) return;

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

    const newHint =
      availableHints[Math.floor(Math.random() * availableHints.length)];
    setRevealedHints((prev) => [...prev, newHint]);
    setSettings((prev) => ({
      ...prev,
      hintsRemaining: prev.hintsRemaining - 1,
    }));
  };

  const startGame = () => {
    setGameStarted(true);
    setScore(0);
    setStreak(0);
    setTimeRemaining(60);
    selectNewCountry();
  };

  const endGame = () => {
    setGameStarted(false);
    setGameActive(false);
    if (score > highScore) {
      setHighScore(score);
      localStorage.setItem("geographyGameHighScore", score.toString());
    }
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

  return (
    <GameInterface
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
  );
};

export default GeographyGame;
