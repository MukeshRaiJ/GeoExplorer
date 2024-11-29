// types.ts

// Basic game types
export type Difficulty = "easy" | "medium" | "hard";
export type Continent =
  | "all"
  | "Africa"
  | "Asia"
  | "Europe"
  | "North America"
  | "South America"
  | "Oceania";

// Country information
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
  coordinates: [number, number];
  difficulty: Difficulty;
}

// Game settings
export interface GameSettings {
  selectedContinent: Continent;
  difficulty: Difficulty;
  hintsRemaining: number;
}

// View state for map
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

// User data
export interface UserData {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  highScore: number;
  gamesPlayed: number;
  totalScore: number;
  bestStreak: number;
  hasCompletedOnboarding?: boolean;
  lastPlayed?: string;
}

// Game interface props
export interface GameInterfaceProps {
  user: UserData | null;
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

// Re-export MapLayerMouseEvent from react-map-gl
export interface MapLayerMouseEvent {
  features?: Array<{
    properties: {
      name: string;
    };
  }>;
}
