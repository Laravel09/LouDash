import type {
  AppSettings,
  BooleanSettingKey,
  CharacterId,
  PlaceId,
} from "./types"

const STORAGE_KEY = "loudash.profile"
const STORAGE_VERSION = 1

export const DEFAULT_SETTINGS: AppSettings = {
  masterMute: false,
  sound: true,
  music: true,
  vibration: true,
  speedIndicator: true,
  tutorialHints: true,
  highContrast: false,
  reduceEffects: false,
  musicVolume: 70,
  sfxVolume: 80,
}

export interface PlayerProfile {
  highScores: number[]
  selectedChar: CharacterId
  selectedPlace: PlaceId
  settings: AppSettings
}

export const DEFAULT_PROFILE: PlayerProfile = {
  highScores: [],
  selectedChar: "lou",
  selectedPlace: "city",
  settings: DEFAULT_SETTINGS,
}

function isCharacterId(value: unknown): value is CharacterId {
  return value === "lou" || value === "dash" || value === "nova"
}

function isPlaceId(value: unknown): value is PlaceId {
  return value === "city" || value === "road" || value === "neon"
}

const BOOLEAN_KEYS: BooleanSettingKey[] = [
  "masterMute",
  "sound",
  "music",
  "vibration",
  "speedIndicator",
  "tutorialHints",
  "highContrast",
  "reduceEffects",
]

function validVolume(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.round(Math.min(100, Math.max(0, value)))
    : fallback
}

// Profiles saved before a setting existed keep every stored preference and
// pick up the default for the new one.
function validSettings(value: unknown): AppSettings {
  if (!value || typeof value !== "object") return DEFAULT_SETTINGS
  const candidate = value as Record<string, unknown>
  const settings = { ...DEFAULT_SETTINGS }
  for (const key of BOOLEAN_KEYS) {
    const stored = candidate[key]
    if (typeof stored === "boolean") settings[key] = stored
  }
  settings.musicVolume = validVolume(
    candidate.musicVolume,
    DEFAULT_SETTINGS.musicVolume,
  )
  settings.sfxVolume = validVolume(
    candidate.sfxVolume,
    DEFAULT_SETTINGS.sfxVolume,
  )
  return settings
}

function validScores(value: unknown): number[] {
  if (!Array.isArray(value)) return []
  return value
    .filter(
      (score): score is number => Number.isSafeInteger(score) && score > 0,
    )
    .sort((a, b) => b - a)
    .slice(0, 5)
}

export function loadProfile(): PlayerProfile {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_PROFILE
    const parsed = JSON.parse(raw) as Record<string, unknown>
    if (!parsed || parsed.version !== STORAGE_VERSION) return DEFAULT_PROFILE
    return {
      highScores: validScores(parsed.highScores),
      selectedChar: isCharacterId(parsed.selectedChar)
        ? parsed.selectedChar
        : DEFAULT_PROFILE.selectedChar,
      selectedPlace: isPlaceId(parsed.selectedPlace)
        ? parsed.selectedPlace
        : DEFAULT_PROFILE.selectedPlace,
      settings: validSettings(parsed.settings),
    }
  } catch {
    return DEFAULT_PROFILE
  }
}

export function saveProfile(profile: PlayerProfile): void {
  try {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ version: STORAGE_VERSION, ...profile }),
    )
  } catch {
    // Storage can be blocked or full. The current session remains fully playable.
  }
}
