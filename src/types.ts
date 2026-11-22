export type Screen = "splash" | "menu" | "charSelect" | "placeSelect" | "howToPlay" | "highScore" | "settings" | "gameplay" | "gameover"

export type PlaceId = "city" | "road" | "neon"

export interface PlaceDef {
  id: PlaceId
  name: string
  subtitle: string
  tagline: string
  accentColor: string
  sky1: string
  sky2: string
  ground: string
  groundGlow: string
  building: string
  buildingBorder: string
}

export const PLACES: PlaceDef[] = [
  {
    id: "city",
    name: "NEON CITY",
    subtitle: "Downtown Grid",
    tagline: "Steel and light. The run begins here.",
    accentColor: "#00e5c8",
    sky1: "#080c18",
    sky2: "#101a3a",
    ground: "#080e20",
    groundGlow: "rgba(0,229,200,0.2)",
    building: "#0d1f60",
    buildingBorder: "#1e3480",
  },
  {
    id: "road",
    name: "OUTER ROAD",
    subtitle: "Open Highway",
    tagline: "Flat stretch, open sky. Go faster.",
    accentColor: "#ffa53b",
    sky1: "#100a05",
    sky2: "#24150a",
    ground: "#0f0905",
    groundGlow: "rgba(255,155,50,0.18)",
    building: "#2a1608",
    buildingBorder: "#8a471a",
  },
  {
    id: "neon",
    name: "SIGNAL ZONE",
    subtitle: "Deep Circuit",
    tagline: "Where the grid ends and the surge begins.",
    accentColor: "#c084fc",
    sky1: "#12011a",
    sky2: "#1a0530",
    ground: "#0c0014",
    groundGlow: "rgba(168,85,247,0.3)",
    building: "#2a0040",
    buildingBorder: "#6010a0",
  },
]

export type CharacterId = "lou" | "dash" | "nova"

export interface CharacterDef {
  id: CharacterId
  name: string
  role: string
  tagline: string
  headColor: string
  bodyColor: string
  accentColor: string
  glowColor: string
  speedStars: number // 1-5
  jumpStars: number
  powerStars: number
  speedMod: number
  jumpMod: number
  jumpRise: number
  gravity: number
}

export const CHARACTERS: CharacterDef[] = [
  {
    id: "lou",
    name: "LOU",
    role: "Balanced Runner",
    tagline: "The classic. Ready for anything.",
    headColor: "#5eead4",
    bodyColor: "#2b4f8a",
    accentColor: "#00e5c8",
    glowColor: "#00e5c8",
    speedStars: 3,
    jumpStars: 3,
    powerStars: 3,
    speedMod: 1.0,
    jumpMod: 1.0,
    jumpRise: 165,
    gravity: 0.5,
  },
  {
    id: "dash",
    name: "DASH",
    role: "Speed Runner",
    tagline: "Born to sprint. Low but lethal.",
    headColor: "#ffaa80",
    bodyColor: "#5a2a14",
    accentColor: "#ff6030",
    glowColor: "#ff6030",
    speedStars: 5,
    jumpStars: 2,
    powerStars: 3,
    speedMod: 1.15,
    jumpMod: 0.85,
    jumpRise: 145,
    gravity: 0.55,
  },
  {
    id: "nova",
    name: "NOVA",
    role: "Agile Runner",
    tagline: "Lighter than air. Higher than most.",
    headColor: "#d8b4fe",
    bodyColor: "#4a2a7a",
    accentColor: "#a855f7",
    glowColor: "#a855f7",
    speedStars: 3,
    jumpStars: 5,
    powerStars: 4,
    speedMod: 0.95,
    jumpMod: 1.2,
    jumpRise: 188,
    gravity: 0.42,
  },
]

export interface GameResult {
  score: number
  coins: number
  distance: number
  seconds: number
  bursts: number
  bestTier: string
  achievement: "personalBest" | "topFive" | null
}

export interface AppSettings {
  /** Silences every sound in the game, regardless of the other switches. */
  masterMute: boolean
  sound: boolean
  music: boolean
  vibration: boolean
  speedIndicator: boolean
  tutorialHints: boolean
  highContrast: boolean
  reduceEffects: boolean
  /** 0–100 */
  musicVolume: number
  /** 0–100 */
  sfxVolume: number
}

/** Settings shown as on/off switches. */
export type BooleanSettingKey = {
  [K in keyof AppSettings]: AppSettings[K] extends boolean ? K : never
}[keyof AppSettings]
