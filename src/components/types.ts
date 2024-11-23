// Game Data Types
export interface CountryInfo {
  name: string;
  capital: string;
  continent: string;
  population: number;
  area: number;
  languages: string[];
  subregion: string;
  currency: string;
  flag: string;
  fact: string;
  difficulty: "easy" | "medium" | "hard";
  coordinates: [number, number];
}

// Game Settings Types
export interface GameSettings {
  selectedContinent: string;
  difficulty: "easy" | "medium" | "hard";
  hintsRemaining: number;
}

// Props Types
export interface GameInterfaceProps {
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

// Re-export types from react-map-gl for convenience
export type { MapLayerMouseEvent, ViewState } from "react-map-gl";

export interface CountryInfo {
  id: string;
  name: string;
  capital: string;
  flag: string;
  fact: string;
  population: number;
  area: number;
  languages: string[];
  subregion: string;
  currency: string;
  continent: string;
  coordinates: [number, number];
  difficulty: number; // 1-5 scale
  hints: string[];
}

export interface GameSettings {
  selectedContinent: string;
  difficulty: "easy" | "medium" | "hard";
  hintsRemaining: number;
  gameMode: "classic" | "time-attack" | "challenge";
  soundEnabled: boolean;
  autoPan: boolean;
}

export interface GameState {
  score: number;
  streak: number;
  highScores: {
    classic: number;
    timeAttack: number;
    challenge: number;
  };
  gamesPlayed: number;
  accuracy: number;
  correctGuesses: number;
  totalGuesses: number;
}

export interface Feedback {
  type: "success" | "error" | "info";
  message: string;
  breakdown?: {
    base: number;
    streak: number;
    speed: number;
    accuracy: number;
    difficulty: number;
  };
  correctAnswer?: string;
}

export interface ViewState {
  longitude: number;
  latitude: number;
  zoom: number;
  bearing: number;
  pitch: number;
  padding: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
}


export interface UserData {
  uid: string;
  displayName: string;
  email: string;
  photoURL: string;
  highScore: number;
  gamesPlayed: number;
  totalScore: number;
  bestStreak: number;
}

export interface LeaderboardEntry {
  uid: string;
  displayName: string;
  photoURL: string;
  highScore: number;
  bestStreak: number;
