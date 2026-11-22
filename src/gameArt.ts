import type { CharacterId, PlaceId } from "./types"
import {
  LAYER_PART,
  RIG_LAYERS,
  type RigLayer,
  type RigPart,
} from "./characterRig"

import cityScene from "./assets/environments/city-scene.webp"
import cityGround from "./assets/environments/city-ground.webp"
import cityPreview from "./assets/environments/city-preview.webp"
import roadScene from "./assets/environments/road-scene.webp"
import roadGround from "./assets/environments/road-ground.webp"
import roadPreview from "./assets/environments/road-preview.webp"
import neonScene from "./assets/environments/neon-scene.webp"
import neonGround from "./assets/environments/neon-ground.webp"
import neonPreview from "./assets/environments/neon-preview.webp"

const RIG_FILES = import.meta.glob<string>("./assets/characters/rig/*.webp", {
  eager: true,
  import: "default",
})

function rigFile(id: CharacterId, part: RigPart, far: boolean): string {
  const key = `./assets/characters/rig/${id}-${part}${far ? "-far" : ""}.webp`
  const url = RIG_FILES[key]
  if (!url) throw new Error(`Missing rig art: ${key}`)
  return url
}

/** Cut-out pieces of each approved contact pose, keyed by draw layer. */
export const RIG_IMAGES: Record<CharacterId, Record<RigLayer, string>> =
  Object.fromEntries(
    (["lou", "dash", "nova"] as const).map((id) => [
      id,
      Object.fromEntries(
        RIG_LAYERS.map((layer) => [
          layer,
          rigFile(id, LAYER_PART[layer], layer.endsWith("Far")),
        ]),
      ),
    ]),
  ) as Record<CharacterId, Record<RigLayer, string>>

export interface EnvironmentArt {
  /** Scenery above the runway; one loop tile drawn 282px tall. */
  scene: string
  sceneTileWidth: number
  /** Runway and platform front; one loop tile drawn 108px tall. */
  ground: string
  groundTileWidth: number
  preview: string
  /** Vertical focus that keeps the landmark visible in preview cards. */
  previewFocus: string
}

export const SCENE_HEIGHT = 282
export const RUNWAY_HEIGHT = 108

export const ENVIRONMENT_ART: Record<PlaceId, EnvironmentArt> = {
  city: {
    scene: cityScene,
    sceneTileWidth: 2411.43,
    ground: cityGround,
    groundTileWidth: 2418.31,
    preview: cityPreview,
    previewFocus: "50% 45%",
  },
  road: {
    scene: roadScene,
    sceneTileWidth: 1500.57,
    ground: roadGround,
    groundTileWidth: 1833.42,
    preview: roadPreview,
    previewFocus: "50% 35%",
  },
  neon: {
    scene: neonScene,
    sceneTileWidth: 1445,
    ground: neonGround,
    groundTileWidth: 1817.92,
    preview: neonPreview,
    previewFocus: "50% 30%",
  },
}

// ── Preloading ───────────────────────────────────────────────────────────────
/** Real load progress; every unit settles once, as loaded or failed. */
export interface ArtProgress {
  total: number
  settled: number
  /** Images that never decoded (after one retry). Fonts never count here. */
  failed: number
  done: boolean
}

let progress: ArtProgress = { total: 0, settled: 0, failed: 0, done: false }
const listeners = new Set<() => void>()
let preloadPromise: Promise<void> | null = null

function publish(change: Partial<ArtProgress>) {
  progress = { ...progress, ...change }
  listeners.forEach((listener) => listener())
}

export const getArtProgress = (): ArtProgress => progress

export function subscribeArtProgress(listener: () => void): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

const IMAGE_TIMEOUT_MS = 7000
const FONT_TIMEOUT_MS = 3000
/** Interface faces the menus use; the CSS falls back if they cannot load. */
const UI_FONTS = [
  "700 16px Orbitron",
  "500 14px 'JetBrains Mono'",
  "500 14px Outfit",
]

type Attempt = "ok" | "error" | "timeout"

function decodeOnce(url: string): Promise<Attempt> {
  const img = new Image()
  img.src = url
  return Promise.race<Attempt>([
    img.decode().then(
      () => "ok",
      () => "error",
    ),
    new Promise<Attempt>((resolve) =>
      window.setTimeout(() => resolve("timeout"), IMAGE_TIMEOUT_MS),
    ),
  ])
}

/** One retry for a fast failure; a stalled request is not retried. */
async function loadImage(url: string): Promise<boolean> {
  let result = await decodeOnce(url)
  if (result === "error") {
    await new Promise((resolve) => window.setTimeout(resolve, 350))
    result = await decodeOnce(url)
  }
  return result === "ok"
}

function loadFont(face: string): Promise<void> {
  if (typeof document === "undefined" || !document.fonts?.load)
    return Promise.resolve()
  return Promise.race([
    document.fonts.load(face).then(
      () => undefined,
      () => undefined,
    ),
    new Promise<void>((resolve) =>
      window.setTimeout(resolve, FONT_TIMEOUT_MS),
    ),
  ])
}

/**
 * Fetches and decodes every runner and environment image once, plus the
 * interface fonts, before the first run so no sprite pops in or decodes
 * mid-game. Audio is deliberately not part of this: it is decoded lazily and
 * must never hold the game back. Never rejects.
 */
export function preloadGameArt(): Promise<void> {
  if (preloadPromise) return preloadPromise
  const urls = new Set<string>()
  for (const layers of Object.values(RIG_IMAGES)) {
    for (const url of Object.values(layers)) urls.add(url)
  }
  for (const env of Object.values(ENVIRONMENT_ART)) {
    urls.add(env.scene)
    urls.add(env.ground)
    urls.add(env.preview)
  }
  publish({ total: urls.size + UI_FONTS.length })
  const settle = (failed: boolean) =>
    publish({
      settled: progress.settled + 1,
      failed: progress.failed + (failed ? 1 : 0),
    })
  const work = [
    ...[...urls].map((url) => loadImage(url).then((ok) => settle(!ok))),
    ...UI_FONTS.map((face) => loadFont(face).then(() => settle(false))),
  ]
  preloadPromise = Promise.all(work).then(() => publish({ done: true }))
  return preloadPromise
}
