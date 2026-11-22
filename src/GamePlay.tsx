import { useEffect, useRef, useCallback, useState } from "react"
import type {
  AppSettings,
  CharacterId,
  CharacterDef,
  PlaceId,
  PlaceDef,
} from "./types"
import { isPortraitViewport } from "./viewport"
import { CHARACTERS, PLACES } from "./types"
import {
  playJump,
  playCoin,
  playHit,
  playBurstCollect,
  playBurstEnd,
  playCountdownTick,
  playSpeedUp,
  playGameOver,
  playUIClick,
  playBack,
  playFinalHit,
  playShutdown,
  playLand,
  playPause,
  playResume,
  playLaserWarning,
  playLaserActive,
  playDroneActivate,
  playCrusherSlam,
  setMusicPaused,
  stopMusic,
  updateAudioSettings,
} from "./audio"
import {
  FIRST_BURST_MAX_SCORE,
  FIRST_BURST_MIN_SCORE,
  MISSED_BURST_MAX_SECONDS,
  MISSED_BURST_MIN_SECONDS,
  NEXT_BURST_MAX_SCORE,
  NEXT_BURST_MIN_SCORE,
} from "./gameplayConfig"
import {
  MIN_REACTION_FRAMES,
  getBurstDuration,
  getJumpClearance,
  getJumpVelocity,
} from "./gameplayBalance"
import {
  BASE_SPEED,
  CHAR_GROUND_Y,
  CHAR_H,
  CHAR_W,
  CHAR_X,
  DISTANCE_PER_SCORE,
  GH,
  GROUND_Y,
  GW,
  HAZARDS,
  HUD_H,
  OVERDRIVE_BONUS,
  OVERDRIVE_DISTANCE,
  OVERDRIVE_SPAN,
  SPAWN_X,
  TIERS,
  createRng,
  estimateArrival,
  generateGroup,
  hazardBoxes,
  hazardState,
  instantiate,
  isHazardKind,
  nextSpawnAfterGroup,
  overlaps,
  playerBox,
  stepHazard,
  stepSpeed,
  tierForDistance,
  type HazardBody,
  type HazardKind,
  type Rng,
  type SpeedProfile,
} from "./hazards"
import HazardView, {
  HazardDefs,
  HazardEffects,
  type HazardEffect,
} from "./HazardArt"
import CharacterArt from "./CharacterArt"
import Settings from "./Settings"
import { SHUTDOWN, runCycleRate, strideForSpeed } from "./characterRig"
import { ENVIRONMENT_ART, RUNWAY_HEIGHT, SCENE_HEIGHT } from "./gameArt"
import {
  AmbientLife,
  RunwaySurface,
  SceneLighting,
  SceneryBack,
  SceneryFront,
  SceneryRoadside,
  ScreenGrade,
} from "./EnvironmentFX"

// ── Constants ─────────────────────────────────────────────────────────────────
// World geometry, speed and tier rules live in ./hazards so the spawner's
// fairness solver uses exactly the numbers the game runs on.
/** Visual scale of the runner sprite; collision uses CHAR_W × CHAR_H. */
const CHAR_SCALE = 1.15
const BURST_SPEED_MULT = 1.3 // super-speed multiplier during burst
const INV_FRAMES = 90
const SIMULATION_STEP = 1 / 60
const MAX_CATCH_UP_STEPS = 5
const MAGNET_RANGE = 170 // pixels — coin attraction radius during burst
const MAGNET_FORCE = 5.5 // pixels/frame pull speed

// ── Difficulty levels ─────────────────────────────────────────────────────────
const DIFFICULTY_LEVELS = TIERS
/** Share of easy (flat) coin patterns per tier. */
const COIN_EASY_BIAS = [1, 0.8, 0.6, 0.4, 0.25, 0.1, 0] as const

function getDiffColor(level: number): string {
  return (
    [
      "#4ade80",
      "#86efac",
      "#facc15",
      "#fb923c",
      "#f87171",
      "#c084fc",
      "#ff3060",
    ][level] ?? "#4ade80"
  )
}

// ── Coin patterns ─────────────────────────────────────────────────────────────
interface CoinOffset {
  dx: number
  y: number
}

const COIN_PATTERNS: CoinOffset[][] = [
  [
    { dx: 0, y: 265 },
    { dx: 38, y: 265 },
    { dx: 76, y: 265 },
    { dx: 114, y: 265 },
  ],
  [
    { dx: 0, y: 270 },
    { dx: 38, y: 248 },
    { dx: 76, y: 222 },
    { dx: 114, y: 200 },
  ],
  [
    { dx: 0, y: 252 },
    { dx: 38, y: 215 },
    { dx: 76, y: 190 },
    { dx: 114, y: 215 },
    { dx: 152, y: 252 },
  ],
  [
    { dx: 0, y: 275 },
    { dx: 40, y: 275 },
    { dx: 80, y: 275 },
  ],
  [
    { dx: 0, y: 205 },
    { dx: 38, y: 185 },
    { dx: 76, y: 175 },
    { dx: 114, y: 185 },
    { dx: 152, y: 205 },
  ],
  [
    { dx: 0, y: 268 },
    { dx: 38, y: 268 },
    { dx: 76, y: 235 },
    { dx: 114, y: 235 },
    { dx: 152, y: 268 },
  ],
]

// ── Types ─────────────────────────────────────────────────────────────────────
type EntityType = HazardKind | "coin" | "signalBurst"

interface Entity {
  id: number
  type: EntityType
  x: number
  y: number
  baseY: number // reference y for animated movement (signalBurst wave)
  spawnFrame: number
  w: number
  h: number
  /** Offset into a timed hazard's warning/active cycle. */
  cycleOffset: number
  collected: boolean
  /** Show the onboarding cue (first sighting of this hazard kind). */
  cue?: boolean
  /** Arrival sound already played (drones). */
  announced?: boolean
}

type HazardEntity = Entity & HazardBody

function isHazard(e: Entity): e is HazardEntity {
  return isHazardKind(e.type)
}

const LASER_KINDS: ReadonlySet<HazardKind> = new Set<HazardKind>([
  "pulseGate",
  "floorLaser",
  "laserPylon",
  "overheadLaser",
  "scannerDrone",
])
const DRONE_KINDS: ReadonlySet<HazardKind> = new Set<HazardKind>([
  "hoverDrone",
  "spiderDrone",
  "scannerDrone",
  "hoverMine",
])

/**
 * Sound cues for on-screen hazards. Only real state changes make a sound
 * (drone arrival, laser warning/firing, crusher slam); the audio engine adds
 * per-cue cooldowns so packs of hazards never chatter.
 */
function cueHazardAudio(e: HazardEntity, frame: number) {
  if (e.x > GW || e.x + e.w < 0) return
  if (!e.announced && DRONE_KINDS.has(e.type) && e.x < GW - e.w) {
    e.announced = true
    playDroneActivate()
  }
  if (e.type !== "crusher" && !LASER_KINDS.has(e.type)) return
  const now = hazardState(e, frame).phase
  if (now === hazardState(e, frame - 1).phase) return
  if (e.type === "crusher") {
    if (now === "active") playCrusherSlam()
  } else if (now === "warn") playLaserWarning()
  else if (now === "active") playLaserActive()
}

interface Banner {
  id: number
  text: string
  color: string
  born: number
}
interface Popup {
  id: number
  x: number
  y: number
  text: string
  born: number
}

interface GS {
  running: boolean
  paused: boolean
  frame: number
  speedMultTarget: number
  speedMultActual: number
  speed: number
  score: number
  runDistance: number
  coinsCollected: number
  health: number
  diffLevel: number
  burstActive: boolean
  burstTimer: number
  burstCollectedFrame: number
  burstCeilLast: number
  charY: number
  charVY: number
  charOnGround: boolean
  lastLandingFrame: number
  lastJumpFrame: number
  runPhase: number
  runStride: number
  invFrames: number
  entities: Entity[]
  popups: Popup[]
  banners: Banner[]
  distanceScoreRemainder: number
  /** Seeded generator for every spawn decision (reproducible runs). */
  rng: Rng
  seed: number
  nextSpawnFrame: number
  /** Frame by which the last hazard group is cleared on every valid line. */
  busyUntil: number
  firstObstacleSpawned: boolean
  consecutiveCoinGroups: number
  /** Hazard kinds already shown this run (cue only on first sight). */
  seenKinds: string[]
  effects: HazardEffect[]
  shakeUntil: number
  nextBurstFrame: number
  nextBurstScore: number | null
  burstsCollected: number
  overdriveStarted: boolean
  idCtr: number
  bgOffset: number
  bg2Offset: number
  groundOffset: number
  /** Seconds since the final hit; null while the run is live. */
  shutdownT: number | null
}

interface RS {
  score: number
  runDistance: number
  coinsCollected: number
  health: number
  diffLevel: number
  burstActive: boolean
  burstTimer: number
  burstCollectedFrame: number
  charY: number
  charVY: number
  charOnGround: boolean
  lastLandingFrame: number
  lastJumpFrame: number
  runPhase: number
  runStride: number
  invFrames: number
  entities: Entity[]
  popups: Popup[]
  banners: Banner[]
  bgOffset: number
  bg2Offset: number
  groundOffset: number
  frame: number
  paused: boolean
  speedMultActual: number
  burstsCollected: number
  overdrive: boolean
  effects: HazardEffect[]
  seenKinds: string[]
  shake: number
  shutdownT: number | null
}

// ── Collision ─────────────────────────────────────────────────────────────────
function aabb(
  ax: number,
  ay: number,
  aw: number,
  ah: number,
  bx: number,
  by: number,
  bw: number,
  bh: number,
  shrink = 8,
): boolean {
  const shrinkX = shrink < 0 ? shrink : Math.min(shrink, aw / 2 - 1, bw / 2 - 1)
  const shrinkY = shrink < 0 ? shrink : Math.min(shrink, ah / 2 - 1, bh / 2 - 1)
  return (
    ax + shrinkX < bx + bw - shrinkX &&
    ax + aw - shrinkX > bx + shrinkX &&
    ay + shrinkY < by + bh - shrinkY &&
    ay + ah - shrinkY > by + shrinkY
  )
}

// ── Spawning ──────────────────────────────────────────────────────────────────
function speedProfile(gs: GS, charDef: CharacterDef): SpeedProfile {
  return {
    mult: gs.speedMultActual,
    target: gs.speedMultTarget,
    distance: gs.runDistance,
    base: BASE_SPEED * charDef.speedMod,
    boost: BURST_SPEED_MULT,
    boostFrames: gs.burstActive ? Math.ceil(gs.burstTimer * 60) : 0,
  }
}

function pushEntity(gs: GS, entity: Omit<Entity, "id">): Entity {
  gs.idCtr++
  const e = { id: gs.idCtr, ...entity }
  gs.entities.push(e)
  return e
}

/** Places a coin pattern; returns its width in px. */
function addCoinPattern(gs: GS, x: number, diffLevel: number): number {
  const easy = COIN_EASY_BIAS[diffLevel] ?? 0
  let patIdx: number
  const r = gs.rng()
  if (r < easy) {
    patIdx = gs.rng() < 0.5 ? 0 : 3
  } else if (r < easy + (1 - easy) * 0.55) {
    patIdx = gs.rng() < 0.5 ? 1 : 5
  } else {
    patIdx = gs.rng() < 0.5 ? 2 : 4
  }
  let width = 0
  for (const { dx, y } of COIN_PATTERNS[patIdx]) {
    pushEntity(gs, {
      type: "coin",
      x: x + dx,
      y,
      baseY: y,
      spawnFrame: gs.frame,
      w: 22,
      h: 22,
      cycleOffset: 0,
      collected: false,
    })
    width = Math.max(width, dx + 22)
  }
  return width
}

/**
 * Spawns the next wave. Hazard groups come from the seeded generator and are
 * proven clearable for this runner's jump, the exact upcoming speed ramp, a
 * landing-recovery period and a human timing window before they appear. The
 * next wave is held back until every valid line through this one has landed.
 */
function spawnWave(gs: GS, charDef: CharacterDef, showCues: boolean): void {
  const tier = gs.diffLevel
  const rules = TIERS[tier]
  const nextMult =
    tier < TIERS.length - 1
      ? TIERS[tier + 1].mult
      : TIERS[tier].mult + OVERDRIVE_BONUS
  const fastest = Math.max(
    gs.speed,
    BASE_SPEED *
      charDef.speedMod *
      nextMult *
      (gs.burstActive ? BURST_SPEED_MULT : 1),
  )
  const readyAt = Math.max(0, gs.busyUntil - gs.frame)
  const arrival = estimateArrival(fastest)
  if (arrival < readyAt + 2) {
    gs.nextSpawnFrame = gs.frame + (readyAt + 2 - arrival)
    return
  }

  const forceAfterCoins = tier >= 3 && gs.consecutiveCoinGroups >= 1
  if (
    !gs.firstObstacleSpawned ||
    forceAfterCoins ||
    gs.rng() < rules.hazardChance
  ) {
    const group = generateGroup(gs.rng, {
      tier,
      speed: gs.speed,
      jump: {
        gravity: charDef.gravity,
        velocity: getJumpVelocity(charDef),
      },
      readyAt,
      profile: speedProfile(gs, charDef),
    })
    if (!group.validation.ok) {
      gs.nextSpawnFrame = gs.frame + 20
      return
    }
    for (const body of instantiate(group.plan, gs.frame)) {
      const firstSight = !gs.seenKinds.includes(body.type)
      if (firstSight) gs.seenKinds.push(body.type)
      const e = pushEntity(gs, { ...body, collected: false })
      if (firstSight && showCues) e.cue = true
    }
    const next = nextSpawnAfterGroup(
      gs.frame,
      group.validation.settle,
      rules,
      gs.rng,
      fastest,
    )
    gs.busyUntil = next.busyUntil
    gs.nextSpawnFrame = next.nextSpawnFrame
    gs.firstObstacleSpawned = true
    gs.consecutiveCoinGroups = 0
  } else {
    gs.consecutiveCoinGroups++
    const width = addCoinPattern(gs, SPAWN_X, tier)
    gs.nextSpawnFrame =
      gs.frame + Math.round((width + 140) / gs.speed + gs.rng() * 18)
  }
}

function spawnSignalBurst(gs: GS): void {
  gs.idCtr++
  const baseY = 198 // oscillates in a Dash-reachable mid-jump band
  gs.entities.push({
    id: gs.idCtr,
    type: "signalBurst",
    x: GW + 60,
    y: baseY,
    baseY,
    spawnFrame: gs.frame,
    w: 34,
    h: 34,
    cycleOffset: 0,
    collected: false,
  })
}

// ── Init ──────────────────────────────────────────────────────────────────────
function randomFrameDelay(minSeconds: number, maxSeconds: number): number {
  return Math.round(
    (minSeconds + Math.random() * (maxSeconds - minSeconds)) * 60,
  )
}

function randomScoreTarget(minScore: number, maxScore: number): number {
  return minScore + Math.floor(Math.random() * (maxScore - minScore + 1))
}

function runSeed(): number {
  const param = new URLSearchParams(window.location.search).get("seed")
  const parsed = param === null ? NaN : Number(param)
  return Number.isFinite(parsed)
    ? Math.floor(parsed)
    : Math.floor(Math.random() * 2 ** 31)
}

function initGS(): GS {
  const seed = runSeed()
  return {
    running: true,
    paused: false,
    frame: 0,
    speedMultTarget: 1.0,
    speedMultActual: 1.0,
    speed: BASE_SPEED,
    score: 0,
    runDistance: 0,
    coinsCollected: 0,
    health: 3,
    diffLevel: 0,
    burstActive: false,
    burstTimer: 0,
    burstCollectedFrame: -300,
    burstCeilLast: 12,
    charY: CHAR_GROUND_Y,
    charVY: 0,
    charOnGround: true,
    lastLandingFrame: -100,
    lastJumpFrame: -100,
    runPhase: 0,
    runStride: 1,
    invFrames: 0,
    entities: [],
    popups: [],
    banners: [],
    distanceScoreRemainder: 0,
    rng: createRng(seed),
    seed,
    nextSpawnFrame: 80,
    busyUntil: 0,
    firstObstacleSpawned: false,
    consecutiveCoinGroups: 0,
    seenKinds: [],
    effects: [],
    shakeUntil: 0,
    nextBurstFrame: Number.POSITIVE_INFINITY,
    nextBurstScore: randomScoreTarget(
      FIRST_BURST_MIN_SCORE,
      FIRST_BURST_MAX_SCORE,
    ),
    burstsCollected: 0,
    overdriveStarted: false,
    idCtr: 0,
    bgOffset: 0,
    bg2Offset: 0,
    groundOffset: 0,
    shutdownT: null,
  }
}

// ── Character ─────────────────────────────────────────────────────────────────
function Character({
  y,
  velocity,
  onGround,
  invFrames,
  burstActive,
  frame,
  charDef,
  lastLandingFrame,
  lastJumpFrame,
  runPhase,
  runStride,
  shutdownT,
  reduced,
  rimColor,
  dustColor,
  speedMult,
}: {
  y: number
  velocity: number
  onGround: boolean
  invFrames: number
  burstActive: boolean
  frame: number
  charDef: CharacterDef
  lastLandingFrame: number
  lastJumpFrame: number
  runPhase: number
  runStride: number
  shutdownT: number | null
  reduced: boolean
  rimColor?: string
  /** Kicked-up dust / sparks colour on takeoff and landing. */
  dustColor: string
  /** Current world speed multiplier; scales the energy trail. */
  speedMult: number
}) {
  const launchSpeed = Math.abs(getJumpVelocity(charDef))
  const shuttingDown = shutdownT !== null
  // The shutdown sequence has its own impact flash; i-frame blinking would
  // freeze mid-blink because the world clock stops.
  const flickering =
    !shuttingDown && invFrames > 0 && Math.floor(frame / 4) % 2 === 0
  const hitFlash = !shuttingDown && invFrames > INV_FRAMES - 12
  // Contact shadow stays on the runway and tightens/fades with jump height.
  const lift = Math.max(0, CHAR_GROUND_Y - y)
  const near = Math.max(0, 1 - lift / 150)
  const shadowW = CHAR_W * CHAR_SCALE * (0.55 + near * 0.75)

  // Squash on touchdown and stretch on takeoff. Purely visual: the collision
  // box stays CHAR_W × CHAR_H and the sprite stays anchored at the feet.
  const sinceLand = frame - lastLandingFrame
  const sinceJump = frame - lastJumpFrame
  let sx = 1
  let sy = 1
  if (!reduced && !shuttingDown) {
    if (onGround && sinceLand >= 0 && sinceLand < LAND_SQUASH_FRAMES) {
      const k = 1 - sinceLand / LAND_SQUASH_FRAMES
      const amt = k * k * 0.085
      sy = 1 - amt
      sx = 1 + amt * 0.55
    } else if (!onGround && sinceJump >= 0 && sinceJump < TAKEOFF_STRETCH_FRAMES) {
      const k = 1 - sinceJump / TAKEOFF_STRETCH_FRAMES
      const amt = k * 0.06
      sy = 1 + amt
      sx = 1 - amt * 0.5
    }
  }
  const footX = CHAR_X + CHAR_W / 2
  const landingDust =
    !reduced && !shuttingDown && sinceLand >= 0 && sinceLand < DUST_FRAMES
  const takeoffDust =
    !reduced && !shuttingDown && sinceJump >= 0 && sinceJump < DUST_FRAMES * 0.7

  return (
    <>
    {/* Soft accent backlight lifts the silhouette off busy scenery. */}
    <div
      aria-hidden="true"
      style={{
        position: "absolute",
        left: CHAR_X + CHAR_W / 2 - 48,
        top: y + CHAR_H / 2 - 52,
        width: 96,
        height: 96,
        borderRadius: "50%",
        background: `radial-gradient(circle, ${charDef.accentColor}2e 0%, ${charDef.accentColor}12 42%, transparent 70%)`,
        opacity: shuttingDown ? 0 : 1,
        pointerEvents: "none",
      }}
    />
    <div
      aria-hidden="true"
      style={{
        position: "absolute",
        left: CHAR_X + CHAR_W / 2 - shadowW / 2,
        top: GROUND_Y - 4,
        width: shadowW,
        height: 8,
        borderRadius: "50%",
        background:
          "radial-gradient(ellipse at 50% 50%, rgba(0,0,0,.92) 0%, rgba(0,0,0,.7) 34%, rgba(0,0,0,.32) 62%, rgba(0,0,0,0) 100%)",
        opacity: 0.3 + near * 0.7,
        pointerEvents: "none",
      }}
    />
    <div
      style={{
        position: "absolute",
        left: CHAR_X,
        top: y,
        width: CHAR_W,
        height: CHAR_H,
        opacity: flickering ? 0.28 : 1,
        transform: `scale(${(CHAR_SCALE * sx).toFixed(4)}, ${(CHAR_SCALE * sy).toFixed(4)})`,
        transformOrigin: "50% 100%",
      }}
    >
      <CharacterArt
        character={charDef}
        width={CHAR_W}
        height={CHAR_H}
        state={{
          onGround,
          phase: runPhase,
          stride: runStride,
          airU: velocity / launchSpeed,
          framesSinceJump: frame - lastJumpFrame,
          framesSinceLanding: frame - lastLandingFrame,
        }}
        burst={burstActive && !shuttingDown}
        hit={hitFlash}
        shutdown={shutdownT ?? undefined}
        reduced={reduced}
        rimColor={rimColor}
        groundShadow={false}
      />
    </div>
    {/* Neon energy trail behind the runner, stronger at higher speeds. */}
    {!reduced && !shuttingDown && (
      <div
        aria-hidden="true"
        className="runner-trail"
        style={
          {
            left: CHAR_X - 4,
            top: y + CHAR_H * 0.22,
            "--trail-accent": charDef.accentColor,
            "--trail-len": `${Math.round(40 + Math.min(1, (speedMult - 1) / 2) * 70)}px`,
            opacity: 0.35 + Math.min(1, (speedMult - 1) / 2) * 0.45,
            // Driven by the simulation clock so it freezes on pause.
            backgroundPosition: `${-((frame * 2) % 24)}px 0, 0 0`,
          } as React.CSSProperties
        }
      />
    )}
    {onGround && !reduced && !shuttingDown && (
      <RunFootfalls phase={runPhase} color={dustColor} />
    )}
    {landingDust && (
      <DustBurst
        x={footX}
        age={sinceLand / DUST_FRAMES}
        color={dustColor}
        spread={1}
      />
    )}
    {takeoffDust && (
      <DustBurst
        x={footX - 6}
        age={sinceJump / (DUST_FRAMES * 0.7)}
        color={dustColor}
        spread={0.6}
      />
    )}
    </>
  )
}

/** Foot touchdown, px ahead of the runner's centre (rig ankle reach). */
const TOUCHDOWN_AHEAD = 11
/** Planted-foot travel per run cycle (stance sweeps ±11 px over 40%). */
const FOOT_DRIFT_PER_CYCLE = 55
const FOOTFALL_LIFE = 0.3

/**
 * Sparks on every foot contact. The near foot plants at phase 0 and the far
 * foot at 0.5 (characterRig RUN_KEYS), so this needs no extra state and stays
 * in sync with each character's own cadence.
 */
function RunFootfalls({ phase, color }: { phase: number; color: string }) {
  const x0 = CHAR_X + CHAR_W / 2 + TOUCHDOWN_AHEAD
  return (
    <>
      {[0, 0.5].map((offset) => {
        const since = (((phase - offset) % 1) + 1) % 1
        if (since >= FOOTFALL_LIFE) return null
        const age = since / FOOTFALL_LIFE
        const x = x0 - since * FOOT_DRIFT_PER_CYCLE
        const ease = 1 - Math.pow(1 - age, 2.2)
        return (
          <div key={offset} aria-hidden="true" style={{ pointerEvents: "none" }}>
            <div
              style={{
                position: "absolute",
                left: x - 8,
                top: GROUND_Y - 6,
                width: 16,
                height: 7,
                borderRadius: "50%",
                transform: `scale(${(0.5 + ease * 0.8).toFixed(3)})`,
                background: `radial-gradient(ellipse, ${color}88 0%, ${color}26 50%, transparent 72%)`,
                opacity: 1 - age,
              }}
            />
            {[0, 1].map((k) => (
              <span
                key={k}
                style={{
                  position: "absolute",
                  left: x - 1,
                  top: GROUND_Y - 3,
                  width: 2,
                  height: 2,
                  borderRadius: 1,
                  background: color,
                  boxShadow: `0 0 3px ${color}`,
                  transform: `translate3d(${(-ease * (8 + k * 9)).toFixed(1)}px, ${(-Math.sin(age * Math.PI) * (4 + k * 3)).toFixed(1)}px, 0)`,
                  opacity: 1 - age,
                }}
              />
            ))}
          </div>
        )
      })}
    </>
  )
}

const LAND_SQUASH_FRAMES = 10
const TAKEOFF_STRETCH_FRAMES = 8
const DUST_FRAMES = 22

/** Ring of dust puffs and sparks that spreads and fades along the runway. */
function DustBurst({
  x,
  age,
  color,
  spread,
}: {
  x: number
  /** 0 → 1 over the burst lifetime. */
  age: number
  color: string
  spread: number
}) {
  const ease = 1 - Math.pow(1 - age, 3)
  const fade = 1 - age
  return (
    <div aria-hidden="true" style={{ pointerEvents: "none" }}>
      {[-1, 1].map((dir) => (
        <div
          key={dir}
          style={{
            position: "absolute",
            left: x - 9,
            top: GROUND_Y - 9,
            width: 18,
            height: 10,
            borderRadius: "50%",
            transform: `translate3d(${(dir * ease * 26 * spread).toFixed(1)}px, ${(-ease * 3).toFixed(1)}px, 0) scale(${(0.6 + ease * 0.9).toFixed(3)})`,
            background: `radial-gradient(ellipse, ${color}66 0%, ${color}22 50%, transparent 72%)`,
            opacity: fade,
          }}
        />
      ))}
      {[0, 1, 2, 3].map((i) => {
        const dir = i % 2 ? 1 : -1
        const lift = (1 + (i >> 1)) * 6 * spread
        return (
          <span
            key={i}
            style={{
              position: "absolute",
              left: x - 1,
              top: GROUND_Y - 3,
              width: 2,
              height: 2,
              borderRadius: 1,
              background: color,
              boxShadow: `0 0 3px ${color}`,
              transform: `translate3d(${(dir * ease * (16 + i * 7) * spread).toFixed(1)}px, ${(-Math.sin(age * Math.PI) * lift).toFixed(1)}px, 0)`,
              opacity: fade * 0.9,
            }}
          />
        )
      })}
    </div>
  )
}

/** Dust tone per place: cool cyan grit, warm sand, violet sparks. */
const DUST_COLOR: Record<PlaceId, string> = {
  city: "#9fe9ff",
  road: "#ffc98a",
  neon: "#d9b0ff",
}

function hexRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.replace("#", ""), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

/**
 * When a runner's accent rim matches the environment light (Dash on the
 * orange Outer Road, Lou in cyan Neon City, Nova in the violet Signal Zone)
 * the rim would vanish, so a cool neutral contour is used instead.
 */
function rimForPlace(charAccent: string, placeAccent: string): string | undefined {
  const a = hexRgb(charAccent)
  const b = hexRgb(placeAccent)
  const d = Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2])
  return d < 110 ? "#dcecff" : undefined
}

// ── Entity visuals ─────────────────────────────────────────────────────────────
function EntityView({
  e,
  frame,
  envAccent,
  highContrast,
}: {
  e: Entity
  frame: number
  envAccent: string
  highContrast: boolean
}) {
  if (e.collected) return null

  if (e.type === "coin") {
    const bob = Math.sin(frame / 28 + e.id) * 3
    // Spin about the vertical axis; the hitbox is unaffected.
    const turn = Math.cos(frame / 11 + e.id * 0.7)
    const face = Math.max(0.2, Math.abs(turn))
    const back = turn < 0
    const glint = (frame + e.id * 17) % 96 < 10
    return (
      <div
        style={{
          position: "absolute",
          left: e.x,
          top: e.y + bob,
          width: e.w,
          height: e.h,
          filter: highContrast
            ? "contrast(1.3) drop-shadow(0 0 2px #fff)"
            : "drop-shadow(0 0 5px rgba(255,214,64,0.65))",
        }}
      >
        <svg
          viewBox="0 0 22 22"
          width={e.w}
          height={e.h}
          aria-hidden="true"
          style={{
            display: "block",
            transform: `scaleX(${face.toFixed(3)})`,
            overflow: "visible",
          }}
        >
          <circle cx="11" cy="11" r="10.5" fill={back ? "#b06e00" : "#c98400"} />
          <circle cx="11" cy="11" r="9.2" fill={`url(#coin-face${back ? "-b" : ""})`} />
          <circle
            cx="11"
            cy="11"
            r="6.8"
            fill="none"
            stroke={back ? "#9a5c00" : "#b87400"}
            strokeWidth="1.1"
            opacity="0.8"
          />
          <path
            d="M12.4 5.2 7.6 12h3l-.9 4.8 4.8-6.9h-3Z"
            fill={back ? "#7a4600" : "#7a4200"}
            opacity="0.85"
          />
          <ellipse cx="7.6" cy="6.6" rx="3.2" ry="1.7" fill="#fff8cf" opacity="0.55" transform="rotate(-35 7.6 6.6)" />
        </svg>
        {glint && (
          <span
            style={{
              position: "absolute",
              left: 3,
              top: 1,
              width: 8,
              height: 8,
              background:
                "radial-gradient(circle, #fff 0%, rgba(255,255,255,.6) 25%, transparent 60%)",
              transform: `scale(${(1 - Math.abs(((frame + e.id * 17) % 96) - 5) / 5).toFixed(2)})`,
            }}
          />
        )}
      </div>
    )
  }

  if (e.type === "signalBurst") {
    const pulse = 0.7 + Math.abs(Math.sin(frame / 14)) * 0.5
    const ring = 0.4 + Math.abs(Math.sin(frame / 10)) * 0.6
    return (
      <div
        style={{
          position: "absolute",
          left: e.x,
          top: e.y,
          width: e.w,
          height: e.h,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          filter: highContrast
            ? "contrast(1.25) drop-shadow(0 0 3px #fff)"
            : "none",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: -8,
            borderRadius: "50%",
            border: `2px solid ${envAccent}`,
            opacity: ring,
            boxShadow: `0 0 ${12 * pulse}px ${envAccent}, 0 0 ${24 * pulse}px ${envAccent}40`,
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "50%",
            background: `radial-gradient(circle, ${envAccent}35, transparent 70%)`,
            border: `1px solid ${envAccent}70`,
          }}
        />
        <span
          style={{
            fontSize: 20,
            filter: `drop-shadow(0 0 ${6 * pulse}px ${envAccent}) drop-shadow(0 0 ${14 * pulse}px ${envAccent})`,
            transform: `scale(${0.85 + pulse * 0.15})`,
            display: "inline-block",
          }}
        >
          <svg viewBox="0 0 20 24" width="18" height="22" aria-hidden="true">
            <path d="M12 1 3 14h6l-1 9 9-14h-6Z" fill="#ffe434" />
          </svg>
        </span>
      </div>
    )
  }

  if (isHazard(e)) {
    return <HazardView e={e} frame={frame} highContrast={highContrast} />
  }
  return null
}

// ── Background ─────────────────────────────────────────────────────────────────
// Runway back edge sits 22px above the collision ground so feet land on the walkway.
const RUNWAY_TOP = GROUND_Y - 22

/**
 * One horizontally looping art layer. Two tile copies ride a GPU-composited
 * translate3d strip, so scrolling only moves an already-rasterised texture.
 */
function LoopLayer({
  src,
  tileWidth,
  height,
  top,
  offset,
}: {
  src: string
  tileWidth: number
  height: number
  top: number
  offset: number
}) {
  // Snap to half pixels: whole device pixels at 2× and steadier texture
  // sampling than arbitrary sub-pixel offsets, which soften the artwork.
  const x = Math.round(-(offset % tileWidth) * 2) / 2
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        top,
        width: GW,
        height,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: tileWidth * 2,
          height,
          transform: `translate3d(${x}px, 0, 0)`,
          willChange: "transform",
        }}
      >
        {[0, 1].map((copy) => (
          <img
            key={copy}
            src={src}
            alt=""
            draggable={false}
            style={{
              position: "absolute",
              left: copy * tileWidth,
              top: 0,
              width: tileWidth,
              height,
              maxWidth: "none",
              userSelect: "none",
              pointerEvents: "none",
            }}
          />
        ))}
      </div>
    </div>
  )
}

interface BackgroundProps {
  bgOffset: number
  bg2Offset: number
  groundOffset: number
  place: PlaceDef
  burstActive: boolean
  charAccent: string
  speedMult: number
  reduceEffects: boolean
  /** Simulation seconds; ambient lighting pauses with the game clock. */
  time: number
}

/** Fixed lanes for the high-speed streaks (y, length, parallax rate). */
const SPEED_STREAKS = [
  [74, 120, 1.6],
  [112, 70, 2.1],
  [150, 150, 1.4],
  [188, 90, 2.4],
  [214, 60, 1.8],
  [238, 110, 2.6],
] as const

function Background({
  bgOffset,
  bg2Offset,
  groundOffset,
  place,
  burstActive,
  charAccent,
  speedMult,
  reduceEffects,
  time,
}: BackgroundProps) {
  // Speed streaks fade in from ×1.8 so high tiers feel faster without clutter.
  const streak = reduceEffects
    ? 0
    : Math.min(1, Math.max(0, (speedMult - 1.8) / 1.4))
  const art = ENVIRONMENT_ART[place.id]
  // Depth order, slowest to fastest: atmosphere (bgOffset), painted scene
  // (bg2Offset), roadside structures, runway (1x world speed, tracks
  // obstacles exactly) and foreground silhouettes. Every layer loops
  // seamlessly and advances only inside the fixed simulation step.
  const fx = {
    place: place.id,
    offsets: { far: bgOffset, scene: bg2Offset, ground: groundOffset },
    time,
    reduced: reduceEffects,
    sceneTileWidth: art.sceneTileWidth,
    runwayTop: RUNWAY_TOP,
  }
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
        background: place.sky1,
      }}
    >
      <LoopLayer
        src={art.scene}
        tileWidth={art.sceneTileWidth}
        height={SCENE_HEIGHT}
        top={RUNWAY_TOP - SCENE_HEIGHT}
        offset={bg2Offset}
      />
      <SceneryBack {...fx} />
      <SceneLighting {...fx} />
      <AmbientLife {...fx} />
      {/* Contrast pass: calm the scenery behind the HUD and the runner lane. */}
      <div
        style={{
          position: "absolute",
          inset: `0 0 ${GH - RUNWAY_TOP}px`,
          pointerEvents: "none",
          background: `linear-gradient(180deg, rgba(3,5,14,.38) 0%, rgba(3,5,14,0) 22%, rgba(3,5,14,0) 62%, rgba(3,5,14,.3) 100%), radial-gradient(ellipse 150px 120px at 128px 250px, rgba(2,4,12,.42), transparent 72%)`,
        }}
      />
      <SceneryRoadside {...fx} />
      <LoopLayer
        src={art.ground}
        tileWidth={art.groundTileWidth}
        height={RUNWAY_HEIGHT}
        top={RUNWAY_TOP}
        offset={groundOffset}
      />
      <RunwaySurface {...fx} />
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: RUNWAY_TOP - 6,
          height: 12,
          pointerEvents: "none",
          background: `linear-gradient(180deg, transparent, ${place.groundGlow}, transparent)`,
        }}
      />
      <SceneryFront {...fx} />
      <ScreenGrade place={place.id} />
      {streak > 0 &&
        SPEED_STREAKS.map(([y, length, rate], i) => {
          const span = GW + length + 80
          const x =
            GW - ((((groundOffset * rate + i * 211) % span) + span) % span)
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: 0,
                top: y,
                width: length,
                height: 1.5,
                transform: `translate3d(${x.toFixed(1)}px, 0, 0)`,
                background: `linear-gradient(90deg, transparent, ${place.accentColor})`,
                opacity: streak * 0.32,
                pointerEvents: "none",
              }}
            />
          )
        })}
      {burstActive && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            boxShadow: `inset 0 0 40px ${charAccent}30, inset 0 0 80px ${charAccent}15`,
            borderRadius: 4,
          }}
        />
      )}
    </div>
  )
}

// ── Top HUD ────────────────────────────────────────────────────────────────────
function TopHUD({
  score,
  coinsCollected,
  health,
  diffLevel,
  burstActive,
  burstTimer,
  burstDuration,
  speedMultActual,
  charAccent,
  showSpeedIndicator,
  overdrive,
  onPause,
}: {
  score: number
  coinsCollected: number
  health: number
  diffLevel: number
  burstActive: boolean
  burstTimer: number
  burstDuration: number
  speedMultActual: number
  charAccent: string
  showSpeedIndicator: boolean
  overdrive: boolean
  onPause: () => void
}) {
  const hearts = [1, 2, 3].map((i) => health >= i)
  const timerStr = Math.ceil(burstTimer).toString().padStart(2, "0")
  const dl = DIFFICULTY_LEVELS[diffLevel]
  const diffColor = getDiffColor(diffLevel)
  const multColor =
    speedMultActual >= 2.5
      ? "#ff3060"
      : speedMultActual >= 1.8
        ? "#ffe434"
        : speedMultActual >= 1.3
          ? "#fb923c"
          : "#93a8cf"

  return (
    <div
      className="game-hud"
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: HUD_H,
        display: "flex",
        alignItems: "center",
        padding: "0 10px",
        background: "rgba(8,12,24,0.88)",
        backdropFilter: "blur(3px)",
        borderBottom: "1px solid #1e3060",
        zIndex: 10,
      }}
    >
      {/* Left: hearts + coins stacked */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          gap: 3,
          flex: "0 0 auto",
          minWidth: 96,
        }}
      >
        <div style={{ display: "flex", gap: 2, alignItems: "center" }}>
          {hearts.map((filled, i) => (
            <svg
              key={i}
              aria-hidden="true"
              viewBox="0 0 24 22"
              style={{
                width: 17,
                height: 16,
                filter: filled ? "drop-shadow(0 0 4px #ff306080)" : "none",
                animation: filled ? "none" : "heart-break 0.35s ease both",
              }}
            >
              <path
                d="M12 20 2.8 11.2C-2 5.8 5.2-1.2 12 5.1 18.8-1.2 26 5.8 21.2 11.2Z"
                fill={filled ? "#ff416c" : "#18213a"}
                stroke={filled ? "#ff8aa5" : "#33405f"}
                strokeWidth="1.2"
              />
            </svg>
          ))}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <svg
            aria-hidden="true"
            viewBox="0 0 20 20"
            style={{ width: 14, height: 14 }}
          >
            <circle
              cx="10"
              cy="10"
              r="8"
              fill="#f0b92d"
              stroke="#ffe878"
              strokeWidth="2"
            />
            <path
              d="M10 5v10M7.5 7h4a2 2 0 0 1 0 4h-3a2 2 0 0 0 0 4h4"
              fill="none"
              stroke="#8b5000"
              strokeWidth="1.2"
            />
          </svg>
          <span
            className="font-mono"
            style={{ fontSize: 12, color: "#7f96bb", letterSpacing: "0.08em" }}
          >
            COINS
          </span>
          <span
            className="font-orbitron"
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: "#e8c840",
              lineHeight: 1,
              letterSpacing: "0.04em",
            }}
          >
            {coinsCollected}
          </span>
        </div>
      </div>

      {/* Center: score — primary stat */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <div
          className="font-mono"
          style={{
            fontSize: 12,
            color: burstActive ? charAccent : "#8da2cc",
            letterSpacing: "0.14em",
            transition: "color 0.3s",
          }}
        >
          SCORE
        </div>
        <div
          className="font-orbitron"
          style={{
            fontSize: 22,
            fontWeight: 700,
            color: burstActive ? "#ffe434" : "#e8f0ff",
            letterSpacing: "0.06em",
            lineHeight: 1,
            textShadow: burstActive ? "0 0 12px rgba(255,228,52,0.6)" : "none",
            transition: "color 0.3s",
          }}
        >
          {score.toLocaleString()}
        </div>
      </div>

      {/* Right: burst info OR speed badge + pause */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          flex: "0 0 auto",
        }}
      >
        {burstActive ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-end",
              gap: 2,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
              <span
                className="font-orbitron"
                style={{ fontSize: 12, color: charAccent }}
              >
                BURST
              </span>
              <div
                className="font-orbitron"
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  padding: 3,
                  background: `conic-gradient(${charAccent} ${(burstTimer / burstDuration) * 360}deg, #1e3060 0deg)`,
                }}
              >
                <div
                  style={{
                    width: "100%",
                    height: "100%",
                    borderRadius: "50%",
                    background: "#080c18",
                    display: "grid",
                    placeItems: "center",
                    color: "#fff",
                    fontSize: 12,
                  }}
                >
                  {timerStr}
                </div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <span
                style={{
                  fontFamily: "JetBrains Mono",
                  fontSize: 12,
                  color: "#9db8d8",
                }}
              >
                SHIELD
              </span>
              <span
                style={{
                  fontFamily: "JetBrains Mono",
                  fontSize: 12,
                  color: "#ffe434",
                }}
              >
                SPEED ×{(speedMultActual * BURST_SPEED_MULT).toFixed(1)}
              </span>
              <span
                style={{
                  fontFamily: "JetBrains Mono",
                  fontSize: 12,
                  color: "#e8c840",
                }}
              >
                MAGNET
              </span>
            </div>
          </div>
        ) : (
          showSpeedIndicator && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-end",
                gap: 1,
              }}
            >
              <div
                className="font-mono"
                style={{
                  fontSize: 12,
                  color: multColor,
                  letterSpacing: "0.1em",
                  background: "#0f1830",
                  border: "1px solid #1e3060",
                  borderRadius: "4px 4px 0 0",
                  padding: "2px 8px",
                  minWidth: 48,
                  textAlign: "center",
                  transition: "color 0.5s",
                }}
              >
                ×{speedMultActual.toFixed(1)}
              </div>
              <div
                className="font-mono"
                style={{
                  fontSize: 12,
                  color: diffColor,
                  background: `${diffColor}18`,
                  border: `1px solid ${diffColor}40`,
                  borderRadius: "0 0 4px 4px",
                  padding: "1px 8px",
                  minWidth: 48,
                  textAlign: "center",
                  letterSpacing: "0.08em",
                  fontWeight: 700,
                }}
              >
                {overdrive ? "OVERDRIVE" : dl.name}
              </div>
            </div>
          )
        )}
        <button
          aria-label="Pause game"
          onClick={onPause}
          style={{
            width: 30,
            height: 30,
            background: "transparent",
            border: "1px solid #1e3060",
            borderRadius: 6,
            color: "#93a8cf",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 12,
            flexShrink: 0,
            transition: "all 0.15s",
          }}
          onMouseEnter={(e) => {
            const el = e.currentTarget as HTMLElement
            el.style.borderColor = "#00e5c8"
            el.style.color = "#00e5c8"
          }}
          onMouseLeave={(e) => {
            const el = e.currentTarget as HTMLElement
            el.style.borderColor = "#1e3060"
            el.style.color = "#93a8cf"
          }}
        >
          <span aria-hidden="true" style={{ display: "flex", gap: 3 }}>
            <i
              style={{
                width: 3,
                height: 11,
                borderRadius: 1,
                background: "currentColor",
              }}
            />
            <i
              style={{
                width: 3,
                height: 11,
                borderRadius: 1,
                background: "currentColor",
              }}
            />
          </span>
        </button>
      </div>
    </div>
  )
}

// ── Burst popup ────────────────────────────────────────────────────────────────
function BurstPopup({
  frame,
  collectedFrame,
  charAccent,
  duration,
}: {
  frame: number
  collectedFrame: number
  charAccent: string
  duration: number
}) {
  const age = frame - collectedFrame
  const SHOW = 72
  if (age < 0 || age >= SHOW) return null
  const opacity = age < 15 ? age / 15 : age > SHOW - 20 ? (SHOW - age) / 20 : 1
  const scale = age < 12 ? 0.8 + (age / 12) * 0.2 : 1
  return (
    <div
      style={{
        position: "absolute",
        top: HUD_H + 8,
        left: 0,
        right: 0,
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        pointerEvents: "none",
        zIndex: 22,
      }}
    >
      <div
        style={{
          padding: "8px 18px",
          background: `${charAccent}15`,
          border: `2px solid ${charAccent}`,
          borderRadius: 14,
          opacity,
          transform: `scale(${scale})`,
          boxShadow: `0 0 40px ${charAccent}30`,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 6,
        }}
      >
        <div
          className="font-orbitron"
          style={{
            fontSize: 16,
            fontWeight: 900,
            color: charAccent,
            letterSpacing: "0.1em",
            textShadow: `0 0 20px ${charAccent}`,
          }}
        >
          SIGNAL BURST
        </div>
        <div
          className="font-mono"
          style={{ fontSize: 12, color: "#9db8d8", letterSpacing: "0.14em" }}
        >
          POWER-UP ACTIVATED
        </div>
        <div style={{ display: "flex", gap: 16, marginTop: 2 }}>
          <span
            className="font-mono"
            style={{ fontSize: 12, color: "#9db8d8" }}
          >
            INVINCIBLE
          </span>
          <span
            className="font-mono"
            style={{ fontSize: 12, color: "#ffe434" }}
          >
            SUPER SPEED
          </span>
          <span
            className="font-mono"
            style={{ fontSize: 12, color: "#e8c840" }}
          >
            MAGNET
          </span>
        </div>
        <div
          className="font-mono"
          style={{ fontSize: 12, color: "#8da2cc", letterSpacing: "0.1em" }}
        >
          {duration.toFixed(duration % 1 ? 1 : 0)} SECONDS
        </div>
      </div>
    </div>
  )
}

// ── Pause overlay ──────────────────────────────────────────────────────────────
type AudioToggleKey = "music" | "sound" | "masterMute"

function GearIcon() {
  return (
    <svg
      className="pause-btn-icon"
      viewBox="0 0 24 24"
      width="16"
      height="16"
      aria-hidden="true"
    >
      <path
        fill="currentColor"
        d="M19.14 12.94a7.07 7.07 0 0 0 0-1.88l2.03-1.58a.5.5 0 0 0 .12-.64l-1.92-3.32a.5.5 0 0 0-.6-.22l-2.39.96a7.03 7.03 0 0 0-1.63-.94l-.36-2.54A.5.5 0 0 0 13.9 2.4h-3.84a.5.5 0 0 0-.49.42l-.36 2.54c-.59.24-1.13.56-1.63.94l-2.39-.96a.5.5 0 0 0-.6.22L2.67 8.88a.5.5 0 0 0 .12.64l2.03 1.58a7.07 7.07 0 0 0 0 1.88l-2.03 1.58a.5.5 0 0 0-.12.64l1.92 3.32c.13.22.39.3.6.22l2.39-.96c.5.38 1.04.7 1.63.94l.36 2.54c.04.24.25.42.49.42h3.84c.24 0 .45-.18.49-.42l.36-2.54c.59-.24 1.13-.56 1.63-.94l2.39.96c.22.08.47 0 .6-.22l1.92-3.32a.5.5 0 0 0-.12-.64l-2.03-1.58ZM12 15.6a3.6 3.6 0 1 1 0-7.2 3.6 3.6 0 0 1 0 7.2Z"
      />
    </svg>
  )
}

/**
 * Four actions, most important first: RESUME (primary), RESTART, SETTINGS
 * (opens the Settings screen over the paused run) and MAIN MENU (subdued,
 * coral on hover as it ends the run).
 */
function PauseOverlay({
  onResume,
  onRestart,
  onSettings,
  onMenu,
}: {
  onResume: () => void
  onRestart: () => void
  onSettings?: () => void
  onMenu: () => void
}) {
  const press = (action: () => void) => () => {
    playUIClick()
    action()
  }
  return (
    <div className="pause-overlay">
      <div className="pause-panel" role="dialog" aria-modal="true" aria-labelledby="pause-title">
        <div className="pause-head">
          <div id="pause-title" className="pause-title font-orbitron">
            PAUSED
          </div>
          <div className="pause-divider" aria-hidden="true" />
        </div>
        <div className="pause-actions">
          <button
            type="button"
            className="pause-btn is-primary font-orbitron"
            onClick={press(onResume)}
          >
            <svg
              className="pause-btn-icon"
              viewBox="0 0 12 14"
              width="11"
              height="13"
              aria-hidden="true"
            >
              <path
                fill="currentColor"
                d="M1 1.2v11.6c0 .6.7 1 1.2.7l9.3-5.8c.5-.3.5-1.1 0-1.4L2.2.5C1.7.2 1 .6 1 1.2Z"
              />
            </svg>
            RESUME
          </button>
          <button
            type="button"
            className="pause-btn is-secondary font-outfit"
            onClick={press(onRestart)}
          >
            RESTART
          </button>
          {onSettings && (
            <button
              type="button"
              className="pause-btn is-secondary font-outfit"
              onClick={press(onSettings)}
            >
              <GearIcon />
              SETTINGS
            </button>
          )}
          <button
            type="button"
            className="pause-btn is-exit font-outfit"
            onClick={press(onMenu)}
          >
            MAIN MENU
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Banner notification ────────────────────────────────────────────────────────
interface BannerViewProps {
  banner: Banner
  frame: number
}

function BannerView({ banner, frame }: BannerViewProps) {
  const age = frame - banner.born
  const duration = 100
  if (age >= duration) return null
  const opacity =
    age < 12 ? age / 12 : age > duration - 20 ? (duration - age) / 20 : 1
  const ty = age < 12 ? (12 - age) * 2 : 0
  return (
    <div
      className="font-orbitron"
      style={{
        position: "absolute",
        top: HUD_H + 10 + ty,
        left: "50%",
        transform: "translateX(-50%)",
        padding: "5px 18px",
        background: "rgba(8,12,24,0.85)",
        border: `1px solid ${banner.color}60`,
        borderRadius: 20,
        color: banner.color,
        fontSize: 13,
        fontWeight: 700,
        letterSpacing: "0.1em",
        opacity,
        whiteSpace: "nowrap",
        zIndex: 9,
        textShadow: `0 0 12px ${banner.color}60`,
        boxShadow: `0 0 20px ${banner.color}20`,
      }}
    >
      {banner.text}
    </div>
  )
}

// ── Score popup ────────────────────────────────────────────────────────────────
interface ScorePopupProps {
  popup: Popup
  frame: number
}

function ScorePopup({ popup, frame }: ScorePopupProps) {
  const age = frame - popup.born
  const opacity = Math.max(0, 1 - age / 60)
  const ty = -age * 0.7
  return (
    <div
      className="font-orbitron"
      style={{
        position: "absolute",
        left: popup.x,
        top: popup.y + ty,
        fontSize: 13,
        fontWeight: 700,
        color: "#ffe434",
        opacity,
        pointerEvents: "none",
        textShadow:
          "0 1px 2px rgba(8,12,24,0.95), 0 0 8px rgba(255,228,52,0.5)",
        whiteSpace: "nowrap",
        zIndex: 5,
      }}
    >
      {popup.text}
    </div>
  )
}

// ── Main GamePlay ──────────────────────────────────────────────────────────────
interface Props {
  onGameOver: (result: {
    score: number
    coins: number
    distance: number
    seconds: number
    bursts: number
    bestTier: string
  }) => void
  onMenu: () => void
  settings: AppSettings
  /** Lets the pause screen and the M shortcut change audio preferences. */
  onSettingsChange?: (settings: AppSettings) => void
  characterId: CharacterId
  placeId: PlaceId
}

export default function GamePlay({
  onGameOver,
  onMenu,
  settings,
  onSettingsChange,
  characterId,
  placeId,
}: Props) {
  const settingsRef = useRef(settings)
  settingsRef.current = settings
  const toggleAudio = useCallback(
    (key: AudioToggleKey) => {
      if (!onSettingsChange) return
      const current = settingsRef.current
      const next = { ...current, [key]: !current[key] }
      // Apply to the engine immediately; App persists and re-syncs on render.
      updateAudioSettings(next)
      settingsRef.current = next
      onSettingsChange(next)
      playUIClick()
    },
    [onSettingsChange],
  )
  const charDef = CHARACTERS.find((c) => c.id === characterId)!
  const placeDef: PlaceDef = PLACES.find((p) => p.id === placeId)!
  const gsRef = useRef<GS>(initGS())
  const rafRef = useRef<number>(0)
  const lastTimeRef = useRef<number>(0)
  const accumulatorRef = useRef(0)

  const [rs, setRS] = useState<RS>(() => ({
    score: 0,
    runDistance: 0,
    coinsCollected: 0,
    health: 3,
    diffLevel: 0,
    burstActive: false,
    burstTimer: 0,
    burstCollectedFrame: -300,
    charY: CHAR_GROUND_Y,
    charVY: 0,
    charOnGround: true,
    lastLandingFrame: -100,
    lastJumpFrame: -100,
    runPhase: 0,
    runStride: 1,
    invFrames: 0,
    entities: [],
    popups: [],
    banners: [],
    bgOffset: 0,
    bg2Offset: 0,
    groundOffset: 0,
    frame: 0,
    paused: false,
    speedMultActual: 1.0,
    burstsCollected: 0,
    overdrive: false,
    effects: [],
    seenKinds: [],
    shake: 0,
    shutdownT: null,
  }))

  const [showGameOverFlash, setShowGameOverFlash] = useState(false)
  const [resumeCountdown, setResumeCountdown] = useState<number | null>(null)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const settingsOpenRef = useRef(false)
  settingsOpenRef.current = settingsOpen
  const openSettings = useCallback(() => setSettingsOpen(true), [])
  // Settings' own BACK button plays the back sound; keys play it here.
  const closeSettings = useCallback(() => setSettingsOpen(false), [])

  const jump = useCallback(() => {
    const gs = gsRef.current
    if (gs.charOnGround && !gs.paused && gs.running) {
      gs.charVY = getJumpVelocity(charDef)
      gs.charOnGround = false
      gs.lastJumpFrame = gs.frame
      playJump()
    }
  }, [charDef.jumpMod])

  const togglePause = useCallback(() => {
    const gs = gsRef.current
    if (!gs.running) return
    if (gs.paused) {
      if (resumeCountdown === null) setResumeCountdown(3)
      return
    }
    gs.paused = !gs.paused
    accumulatorRef.current = 0
    lastTimeRef.current = performance.now()
    playPause()
    setRS((prev) => ({ ...prev, paused: gs.paused }))
  }, [resumeCountdown])

  const restart = useCallback(() => {
    gsRef.current = initGS()
    accumulatorRef.current = 0
    lastTimeRef.current = performance.now()
    setShowGameOverFlash(false)
    setResumeCountdown(null)
    setRS({
      score: 0,
      runDistance: 0,
      coinsCollected: 0,
      health: 3,
      diffLevel: 0,
      burstActive: false,
      burstTimer: 0,
      burstCollectedFrame: -300,
      charY: CHAR_GROUND_Y,
      charVY: 0,
      charOnGround: true,
      lastLandingFrame: -100,
      lastJumpFrame: -100,
      runPhase: 0,
      runStride: 1,
      invFrames: 0,
      entities: [],
      popups: [],
      banners: [],
      bgOffset: 0,
      bg2Offset: 0,
      groundOffset: 0,
      frame: 0,
      paused: false,
      speedMultActual: 1.0,
      burstsCollected: 0,
      overdrive: false,
      effects: [],
      seenKinds: [],
      shake: 0,
      shutdownT: null,
    })
  }, [])

  useEffect(() => {
    if (resumeCountdown === null) return
    if (resumeCountdown <= 0) {
      playResume()
      gsRef.current.paused = false
      accumulatorRef.current = 0
      lastTimeRef.current = performance.now()
      setRS((current) => ({ ...current, paused: false }))
      setResumeCountdown(null)
      return
    }
    playCountdownTick()
    const timer = window.setTimeout(
      () => setResumeCountdown((value) => (value ?? 1) - 1),
      700,
    )
    return () => window.clearTimeout(timer)
  }, [resumeCountdown])

  const tick = useCallback(
    (time: number) => {
      const gs = gsRef.current
      const elapsed =
        lastTimeRef.current === 0 ? 0 : (time - lastTimeRef.current) / 1000
      lastTimeRef.current = time

      if (gs.shutdownT !== null) {
        // ── Final-hit shutdown: no input, scoring, spawning or collisions ──
        const dt = Math.min(Math.max(elapsed, 0), 0.05)
        const prev = gs.shutdownT
        const t = Math.min(SHUTDOWN.powerDown, prev + dt)
        gs.shutdownT = t
        // The world coasts to a stop as the runner goes down.
        const coast = Math.max(0, 1 - t / SHUTDOWN.malfunction)
        const drift = gs.speed * coast * coast * dt * 60
        if (drift > 0) {
          for (const e of gs.entities) {
            if (isHazard(e)) stepHazard(e, gs.frame, drift)
            else e.x -= drift
          }
          gs.groundOffset += drift
          gs.bgOffset += drift * 0.14
          gs.bg2Offset += drift * 0.3
        }
        // A runner hit mid-air drops to the runway before kneeling.
        if (!gs.charOnGround) {
          const k = dt * 60
          gs.charVY += charDef.gravity * k
          gs.charY += gs.charVY * k
          if (gs.charY >= CHAR_GROUND_Y) {
            gs.charY = CHAR_GROUND_Y
            gs.charVY = 0
            gs.charOnGround = true
            gs.lastLandingFrame = gs.frame
            playLand()
          }
        }
        if (prev < SHUTDOWN.collapse && t >= SHUTDOWN.collapse) playShutdown()
        if (prev < SHUTDOWN.powerDown && t >= SHUTDOWN.powerDown) {
          playGameOver()
          setShowGameOverFlash(true)
        }
      } else if (!gs.running) {
        return
      } else if (gs.paused) {
        accumulatorRef.current = 0
      } else {
        accumulatorRef.current += Math.min(Math.max(elapsed, 0), 0.1)
        let steps = 0

        while (
          accumulatorRef.current >= SIMULATION_STEP &&
          steps < MAX_CATCH_UP_STEPS &&
          gs.running
        ) {
          accumulatorRef.current -= SIMULATION_STEP
          steps++
          gs.frame++

          // ── Speed: step-function tiers, strictly monotonic, burst adds super-speed ─
          // Shared with the spawn validator so its speed forecast is exact.
          const speedState = {
            mult: gs.speedMultActual,
            target: gs.speedMultTarget,
            distance: gs.runDistance,
          }
          stepSpeed(speedState)
          gs.speedMultActual = speedState.mult
          gs.speedMultTarget = speedState.target
          if (gs.runDistance >= OVERDRIVE_DISTANCE) {
            if (!gs.overdriveStarted) {
              gs.overdriveStarted = true
              gs.banners.push({
                id: gs.idCtr++,
                text: "OVERDRIVE · ×3.2 → ×3.6",
                color: "#fff0a8",
                born: gs.frame,
              })
              playSpeedUp()
            }
          }
          const burstBoost = gs.burstActive ? BURST_SPEED_MULT : 1
          gs.speed =
            BASE_SPEED * gs.speedMultActual * charDef.speedMod * burstBoost

          // ── Score: gradual progress derived from authoritative world travel ───────
          gs.distanceScoreRemainder += gs.speed / DISTANCE_PER_SCORE
          gs.runDistance += gs.speed / DISTANCE_PER_SCORE
          while (gs.distanceScoreRemainder >= 1) {
            gs.score += 1
            gs.distanceScoreRemainder -= 1
          }

          // ── Difficulty level: one-way only, fires banner when tier changes ────────
          const newDiff = tierForDistance(gs.runDistance)
          if (newDiff > gs.diffLevel) {
            gs.diffLevel = newDiff
            const newDl = DIFFICULTY_LEVELS[newDiff]
            const diffColor = getDiffColor(newDiff)
            gs.banners.push({
              id: gs.idCtr++,
              text: `TIER ${newDiff + 1} · ${newDl.name} · ×${newDl.mult.toFixed(2).replace(/0$/, "")}`,
              color: diffColor,
              born: gs.frame,
            })
            playSpeedUp()
          }

          // ── Signal Burst spawn eligibility ───────────────────────────────────────
          if (
            !gs.burstActive &&
            (gs.frame >= gs.nextBurstFrame ||
              (gs.nextBurstScore !== null && gs.score >= gs.nextBurstScore))
          ) {
            const alreadyLive = gs.entities.some(
              (e) => e.type === "signalBurst" && !e.collected,
            )
            if (!alreadyLive) {
              spawnSignalBurst(gs)
              gs.nextBurstFrame = Number.POSITIVE_INFINITY
              gs.nextBurstScore = null
            }
          }

          // ── Run cycle: cadence follows world speed so planted feet track the
          // ground. Frozen while airborne so the landing resumes the stride.
          if (gs.charOnGround) {
            gs.runStride = strideForSpeed(gs.speed / BASE_SPEED)
            gs.runPhase += runCycleRate(
              charDef.id,
              gs.speed,
              CHAR_H * CHAR_SCALE,
              gs.runStride,
            )
          }

          // ── Character physics ────────────────────────────────────────────────────
          if (!gs.charOnGround) {
            gs.charVY += charDef.gravity
            gs.charY += gs.charVY
            if (gs.charY >= CHAR_GROUND_Y) {
              gs.charY = CHAR_GROUND_Y
              gs.charVY = 0
              gs.charOnGround = true
              gs.lastLandingFrame = gs.frame
              playLand()
            }
          }
          if (gs.charY < HUD_H + 2) {
            gs.charY = HUD_H + 2
            if (gs.charVY < 0) gs.charVY = 0
          }

          // ── Signal Burst coin magnet ─────────────────────────────────────────────
          if (gs.burstActive) {
            const px = CHAR_X + CHAR_W / 2
            const py = gs.charY + CHAR_H / 2
            for (const e of gs.entities) {
              if (e.type !== "coin" || e.collected) continue
              const ex = e.x + e.w / 2,
                ey = e.y + e.h / 2
              const dx = px - ex,
                dy = py - ey
              const dist = Math.sqrt(dx * dx + dy * dy)
              if (dist < MAGNET_RANGE && dist > 1) {
                const pull = Math.min(MAGNET_FORCE, dist)
                e.x += (dx / dist) * pull
                e.y += (dy / dist) * pull
              }
            }
          }

          // ── Move entities + animate signal burst wave ─────────────────────────────
          for (const e of gs.entities) {
            if (isHazard(e)) {
              stepHazard(e, gs.frame, gs.speed)
              cueHazardAudio(e, gs.frame)
              continue
            }
            e.x -= gs.speed
            if (e.type === "signalBurst" && !e.collected) {
              const age = gs.frame - e.spawnFrame
              e.y = e.baseY + Math.sin(age * 0.045) * 18
            }
          }

          // ── Remove off-screen ────────────────────────────────────────────────────
          const missedBurst = gs.entities.some(
            (e) => e.type === "signalBurst" && !e.collected && e.x + e.w <= -60,
          )
          gs.entities = gs.entities.filter((e) => e.x + e.w > -60)
          if (missedBurst) {
            gs.nextBurstFrame =
              gs.frame +
              randomFrameDelay(
                MISSED_BURST_MIN_SECONDS,
                MISSED_BURST_MAX_SECONDS,
              )
            gs.nextBurstScore = null
          }

          // ── Difficulty-aware spawning (validated, seeded waves) ──────────────────
          if (gs.frame >= gs.nextSpawnFrame) {
            spawnWave(gs, charDef, settings.tutorialHints)
          }

          // ── Collision ────────────────────────────────────────────────────────────
          if (gs.invFrames > 0) gs.invFrames--

          for (const e of gs.entities) {
            if (e.collected) continue

            if (e.type === "coin") {
              if (
                !aabb(CHAR_X, gs.charY, CHAR_W, CHAR_H, e.x, e.y, e.w, e.h, -6)
              )
                continue
              e.collected = true
              gs.coinsCollected += 1
              gs.popups.push({
                id: gs.idCtr++,
                x: e.x - 8,
                y: e.y - 12,
                text: "+1 COIN",
                born: gs.frame,
              })
              playCoin()
              continue
            }

            if (e.type === "signalBurst") {
              if (
                !aabb(CHAR_X, gs.charY, CHAR_W, CHAR_H, e.x, e.y, e.w, e.h, -4)
              )
                continue
              e.collected = true
              gs.burstActive = true
              gs.burstTimer = getBurstDuration(charDef.powerStars)
              gs.burstCollectedFrame = gs.frame
              gs.burstCeilLast = Math.ceil(gs.burstTimer)
              gs.burstsCollected++
              gs.invFrames = Math.max(gs.invFrames, INV_FRAMES)
              playBurstCollect()
              continue
            }

            if (!isHazard(e)) continue
            // Collision boxes come from the hazard rules (inset from the art and
            // only present while a timed hazard is live).
            const runner = playerBox(gs.charY)
            if (!hazardBoxes(e, gs.frame).some((box) => overlaps(runner, box)))
              continue

            // During burst: CRUSH the obstacle — no damage
            if (gs.burstActive) {
              e.collected = true
              gs.effects.push({
                id: gs.idCtr++,
                kind: "crush",
                x: e.x + e.w / 2,
                y: Math.max(e.y, gs.charY) + Math.min(e.h, CHAR_H) / 2,
                born: gs.frame,
                color: charDef.accentColor,
              })
              gs.popups.push({
                id: gs.idCtr++,
                x: e.x + e.w / 2 - 16,
                y: e.y - 20,
                text: "CRUSH!",
                born: gs.frame,
              })
              continue
            }

            // Invincibility frames: pass through
            if (gs.invFrames > 0) continue

            // Normal hit
            e.collected = true
            gs.health--
            gs.invFrames = INV_FRAMES
            gs.shakeUntil = gs.frame + 14
            gs.effects.push({
              id: gs.idCtr++,
              kind: "hit",
              x: CHAR_X + CHAR_W * 0.75,
              y: gs.charY + CHAR_H / 2,
              born: gs.frame,
              color: HAZARDS[e.type].cueColor,
            })
            gs.popups.push({
              id: gs.idCtr++,
              x: CHAR_X - 4,
              y: gs.charY - 18,
              text: "HIT!",
              born: gs.frame,
            })
            if (settings.vibration)
              navigator.vibrate?.(gs.health <= 0 ? [90, 60, 140] : 80)
            if (gs.health <= 0) {
              // Final heart: freeze the run here (score, coins and time are
              // final) and hand over to the timed shutdown sequence.
              gs.running = false
              gs.shutdownT = 0
              gs.popups = []
              gs.banners = []
              gs.effects = []
              playFinalHit()
              stopMusic()
              break
            }
            playHit()
          }

          if (!gs.running) {
            accumulatorRef.current = 0
            break
          }

          // ── Burst timer + countdown ticks ────────────────────────────────────────
          if (gs.burstActive) {
            gs.burstTimer -= SIMULATION_STEP
            const newCeil = Math.ceil(gs.burstTimer)
            if (gs.burstTimer > 0 && newCeil < gs.burstCeilLast) {
              playCountdownTick(newCeil <= 1)
              gs.burstCeilLast = newCeil
            }
            if (gs.burstTimer <= 0) {
              gs.burstActive = false
              gs.burstTimer = 0
              // Hazards crushed a frame ago must not turn lethal with no time
              // to react: grant the same reaction window the spawner assumes.
              gs.invFrames = Math.max(gs.invFrames, MIN_REACTION_FRAMES)
              gs.nextBurstFrame = Number.POSITIVE_INFINITY
              gs.nextBurstScore =
                gs.score +
                randomScoreTarget(NEXT_BURST_MIN_SCORE, NEXT_BURST_MAX_SCORE)
              gs.banners.push({
                id: gs.idCtr++,
                text: "SIGNAL BURST COMPLETE",
                color: "#9db8d8",
                born: gs.frame,
              })
              playBurstEnd()
            }
          }

          // ── Clean up ─────────────────────────────────────────────────────────────
          gs.popups = gs.popups.filter((p) => gs.frame - p.born < 65)
          gs.banners = gs.banners.filter((b) => gs.frame - b.born < 100)
          gs.effects = gs.effects.filter((fx) => gs.frame - fx.born < 40)

          // ── Background scroll uses the same effective world speed ────────────────
          // Scrolling is core motion feedback, so it also runs with Reduced
          // Effects; that setting only removes the ambient light layers.
          // Scenery parallax deepens a little as the world speeds up.
          const depth = Math.min(1, (gs.speedMultActual - 1) / 2.2)
          gs.bgOffset += gs.speed * (0.14 + depth * 0.05)
          gs.bg2Offset += gs.speed * (0.3 + depth * 0.1)
          gs.groundOffset += gs.speed
        }

        if (steps === MAX_CATCH_UP_STEPS) accumulatorRef.current = 0
      }

      setRS({
        score: gs.score,
        runDistance: gs.runDistance,
        coinsCollected: gs.coinsCollected,
        health: gs.health,
        diffLevel: gs.diffLevel,
        burstActive: gs.burstActive,
        burstTimer: gs.burstTimer,
        burstCollectedFrame: gs.burstCollectedFrame,
        charY: gs.charY,
        charVY: gs.charVY,
        charOnGround: gs.charOnGround,
        lastLandingFrame: gs.lastLandingFrame,
        lastJumpFrame: gs.lastJumpFrame,
        runPhase: gs.runPhase,
        runStride: gs.runStride,
        invFrames: gs.invFrames,
        entities: [...gs.entities],
        popups: [...gs.popups],
        banners: [...gs.banners],
        bgOffset: gs.bgOffset,
        bg2Offset: gs.bg2Offset,
        groundOffset: gs.groundOffset,
        frame: gs.frame,
        paused: gs.paused,
        speedMultActual: gs.speedMultActual,
        burstsCollected: gs.burstsCollected,
        overdrive: gs.overdriveStarted,
        effects: gs.effects,
        seenKinds: gs.seenKinds,
        // The world clock stops at the final hit, so the impact shake is
        // timed from the shutdown sequence instead.
        shake:
          gs.shutdownT === null
            ? Math.max(0, gs.shakeUntil - gs.frame)
            : Math.max(0, Math.round(14 * (1 - gs.shutdownT / SHUTDOWN.impact))),
        shutdownT: gs.shutdownT,
      })

      if (
        gs.running ||
        (gs.shutdownT !== null && gs.shutdownT < SHUTDOWN.powerDown)
      )
        rafRef.current = requestAnimationFrame(tick)
    },
    [charDef, settings.reduceEffects, settings.vibration],
  )

  // Music is owned by App; gameplay only ducks it while paused.
  useEffect(() => {
    setMusicPaused(rs.paused)
  }, [rs.paused])
  useEffect(() => () => setMusicPaused(false), [])

  useEffect(() => {
    const pauseForPortrait = () => {
      if (
        isPortraitViewport() &&
        gsRef.current.running &&
        !gsRef.current.paused
      ) {
        gsRef.current.paused = true
        accumulatorRef.current = 0
        setRS((current) => ({ ...current, paused: true }))
      }
    }
    window.addEventListener("resize", pauseForPortrait)
    window.addEventListener("orientationchange", pauseForPortrait)
    window.visualViewport?.addEventListener("resize", pauseForPortrait)
    return () => {
      window.removeEventListener("resize", pauseForPortrait)
      window.removeEventListener("orientationchange", pauseForPortrait)
      window.visualViewport?.removeEventListener("resize", pauseForPortrait)
    }
  }, [])

  useEffect(() => {
    lastTimeRef.current = performance.now()
    accumulatorRef.current = 0
    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [tick])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.repeat) return
      if (e.code === "Space" || e.code === "ArrowUp" || e.code === "KeyW") {
        e.preventDefault()
        jump()
      }
      if (e.code === "KeyP" || e.code === "Escape") {
        e.preventDefault()
        // From Settings, these step back to the Pause Screen (still paused).
        if (settingsOpenRef.current) {
          playBack()
          closeSettings()
        } else togglePause()
      }
      if (e.code === "KeyM") {
        e.preventDefault()
        toggleAudio("masterMute")
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [jump, togglePause, toggleAudio, closeSettings])

  useEffect(() => {
    const resetClock = () => {
      lastTimeRef.current = performance.now()
      accumulatorRef.current = 0
    }
    document.addEventListener("visibilitychange", resetClock)
    return () => document.removeEventListener("visibilitychange", resetClock)
  }, [])

  useEffect(() => {
    if (showGameOverFlash) {
      const t = setTimeout(() => {
        const gs = gsRef.current
        onGameOver({
          score: gs.score,
          coins: gs.coinsCollected,
          distance: Math.floor(gs.runDistance),
          seconds: Math.floor(gs.frame / 60),
          bursts: gs.burstsCollected,
          bestTier: gs.overdriveStarted
            ? "OVERDRIVE"
            : DIFFICULTY_LEVELS[gs.diffLevel].name,
        })
      }, (SHUTDOWN.results - SHUTDOWN.powerDown) * 1000)
      return () => clearTimeout(t)
    }
  }, [showGameOverFlash, onGameOver])

  const envAccent = placeDef.accentColor
  const shakeTransform =
    rs.shake > 0 && !settings.reduceEffects
      ? `translate3d(${(Math.sin(rs.frame * 2.7) * rs.shake * 0.28).toFixed(2)}px, ${(Math.cos(rs.frame * 3.1) * rs.shake * 0.18).toFixed(2)}px, 0)`
      : undefined
  const debugEnabled =
    new URLSearchParams(window.location.search).get("debug") === "1"
  const jumpDebug = getJumpClearance(
    BASE_SPEED * rs.speedMultActual * charDef.speedMod,
    charDef,
  )
  const nextBurstDebug = Number.isFinite(gsRef.current.nextBurstFrame)
    ? `${Math.max(0, (gsRef.current.nextBurstFrame - rs.frame) / 60).toFixed(1)}s`
    : gsRef.current.nextBurstScore !== null
      ? `+${Math.max(0, gsRef.current.nextBurstScore - rs.score)} SCORE`
      : "LIVE"

  return (
    <div
      className={`game-root${settings.highContrast ? " high-contrast" : ""}${
        settings.reduceEffects ? " reduce-effects" : ""
      }`}
      style={{
        position: "absolute",
        inset: 0,
        cursor: "pointer",
        overflow: "hidden",
        filter: settings.highContrast
          ? "contrast(1.14) saturate(1.08)"
          : "none",
      }}
    >
      <HazardDefs />
      <svg width="0" height="0" aria-hidden="true" style={{ position: "absolute" }}>
        <defs>
          <radialGradient id="coin-face" cx="0.38" cy="0.34" r="0.75">
            <stop offset="0" stopColor="#fff3a6" />
            <stop offset="0.45" stopColor="#ffd23a" />
            <stop offset="1" stopColor="#e39a00" />
          </radialGradient>
          <radialGradient id="coin-face-b" cx="0.62" cy="0.34" r="0.75">
            <stop offset="0" stopColor="#ffe07a" />
            <stop offset="0.5" stopColor="#e9a90f" />
            <stop offset="1" stopColor="#b87400" />
          </radialGradient>
        </defs>
      </svg>
      <div
        style={{
          position: "absolute",
          inset: 0,
          transform: shakeTransform,
        }}
      >
        <Background
          bgOffset={rs.bgOffset}
          bg2Offset={rs.bg2Offset}
          groundOffset={rs.groundOffset}
          place={placeDef}
          burstActive={rs.burstActive}
          charAccent={charDef.accentColor}
          speedMult={rs.speedMultActual}
          reduceEffects={settings.reduceEffects}
          time={rs.frame / 60}
        />

        <div
          aria-label="Jump input area"
          role="button"
          tabIndex={-1}
          onPointerDown={(event) => {
            event.preventDefault()
            if (!rs.paused && !showGameOverFlash) jump()
          }}
          style={{
            position: "absolute",
            top: HUD_H,
            right: 0,
            bottom: 0,
            left: 0,
            zIndex: 4,
            touchAction: "none",
          }}
        />

        {rs.burstActive && !settings.reduceEffects && (
          <>
            <div
              style={{
                position: "absolute",
                left: CHAR_X - 28,
                top: rs.charY + 8,
                width: 26,
                height: CHAR_H - 16,
                background: `linear-gradient(90deg, transparent, ${charDef.accentColor}30)`,
                borderRadius: 4,
              }}
            />
            <div
              style={{
                position: "absolute",
                left: CHAR_X - 52,
                top: rs.charY + 16,
                width: 22,
                height: CHAR_H - 32,
                background: `linear-gradient(90deg, transparent, #ffe43420)`,
                borderRadius: 4,
              }}
            />
          </>
        )}

        {rs.health === 1 && !settings.reduceEffects && (
          <div className="critical-health-pulse" />
        )}

        {rs.entities.map((e) =>
          !e.collected && isHazard(e) && Math.abs(e.y + e.h - GROUND_Y) <= 10 ? (
            <div
              key={`sh${e.id}`}
              aria-hidden="true"
              style={{
                position: "absolute",
                left: e.x - 6,
                top: GROUND_Y - 5,
                width: Math.min(140, e.w + 12),
                height: 10,
                borderRadius: "50%",
                background:
                  "radial-gradient(ellipse, rgba(0,0,0,.7) 0%, rgba(0,0,0,.35) 55%, transparent 75%)",
                pointerEvents: "none",
              }}
            />
          ) : null,
        )}

        {rs.entities.map((e) => (
          <EntityView
            key={e.id}
            e={e}
            frame={rs.frame}
            envAccent={envAccent}
            highContrast={settings.highContrast}
          />
        ))}

        <Character
          y={rs.charY}
          velocity={rs.charVY}
          onGround={rs.charOnGround}
          lastLandingFrame={rs.lastLandingFrame}
          lastJumpFrame={rs.lastJumpFrame}
          runPhase={rs.runPhase}
          runStride={rs.runStride}
          invFrames={rs.invFrames}
          burstActive={rs.burstActive}
          frame={rs.frame}
          charDef={charDef}
          shutdownT={rs.shutdownT}
          reduced={settings.reduceEffects}
          rimColor={rimForPlace(charDef.accentColor, placeDef.accentColor)}
          dustColor={DUST_COLOR[placeDef.id]}
          speedMult={rs.speedMultActual}
        />

        <HazardEffects
          effects={rs.effects}
          frame={rs.frame}
          reduced={settings.reduceEffects}
        />
      </div>

      {rs.shake > 0 && !settings.reduceEffects && (
        <div
          className="damage-flash"
          style={{ opacity: Math.min(1, rs.shake / 14) }}
        />
      )}

      {rs.popups.map((p) => (
        <ScorePopup key={p.id} popup={p} frame={rs.frame} />
      ))}
      {rs.banners.map((b) => (
        <BannerView key={b.id} banner={b} frame={rs.frame} />
      ))}

      <BurstPopup
        frame={rs.frame}
        collectedFrame={rs.burstCollectedFrame}
        charAccent={charDef.accentColor}
        duration={getBurstDuration(charDef.powerStars)}
      />

      <TopHUD
        score={rs.score}
        coinsCollected={rs.coinsCollected}
        health={rs.health}
        diffLevel={rs.diffLevel}
        burstActive={rs.burstActive}
        burstTimer={rs.burstTimer}
        burstDuration={getBurstDuration(charDef.powerStars)}
        speedMultActual={rs.speedMultActual}
        charAccent={charDef.accentColor}
        showSpeedIndicator={settings.speedIndicator}
        overdrive={rs.overdrive}
        onPause={togglePause}
      />

      {debugEnabled && (
        <div className="debug-overlay font-mono">
          <div>SPEED ×{rs.speedMultActual.toFixed(2)}</div>
          <div>
            TIER{" "}
            {rs.overdrive ? "OVERDRIVE" : DIFFICULTY_LEVELS[rs.diffLevel].name}
          </div>
          <div>DIST {rs.runDistance.toFixed(1)}</div>
          <div>
            JUMP {jumpDebug.peakRise.toFixed(0)}px /{" "}
            {(jumpDebug.airtimeFrames / 60).toFixed(2)}s
          </div>
          <div>BURST {nextBurstDebug}</div>
        </div>
      )}

      {rs.frame < 150 && settings.tutorialHints && (
        <div
          style={{
            position: "absolute",
            bottom: 12,
            left: "50%",
            transform: "translateX(-50%)",
            opacity: Math.max(0, 1 - rs.frame / 150),
            display: "flex",
            gap: 6,
            alignItems: "center",
            zIndex: 6,
          }}
        >
          {["SPACE", "W", "↑", "TAP"].map((k) => (
            <span
              key={k}
              className="font-mono"
              style={{
                fontSize: 12,
                color: envAccent,
                background: `${envAccent}10`,
                border: `1px solid ${envAccent}40`,
                borderRadius: 4,
                padding: "2px 6px",
              }}
            >
              {k}
            </span>
          ))}
          <span
            className="font-outfit"
            style={{ fontSize: 12, color: "#8da2cc" }}
          >
            to jump
          </span>
        </div>
      )}

      {rs.paused && resumeCountdown === null && !settingsOpen && (
        <PauseOverlay
          onResume={togglePause}
          onRestart={restart}
          onSettings={onSettingsChange ? openSettings : undefined}
          onMenu={onMenu}
        />
      )}

      {/* The existing Settings screen, layered over the paused run so the run
          stays mounted and paused; BACK returns to the Pause Screen. */}
      {rs.paused && settingsOpen && onSettingsChange && (
        <div className="pause-settings-layer">
          <Settings
            settings={settings}
            onSettingsChange={onSettingsChange}
            onBack={closeSettings}
          />
        </div>
      )}

      {resumeCountdown !== null && (
        <div className="resume-countdown font-orbitron">
          {resumeCountdown > 0 ? resumeCountdown : "GO"}
        </div>
      )}

      {showGameOverFlash && (
        <div
          className="gameover-hold"
          style={{
            position: "absolute",
            inset: 0,
            // Dims to the results screen's backdrop so the hand-off is seamless.
            animationDuration: `${SHUTDOWN.results - SHUTDOWN.powerDown}s`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 30,
          }}
        >
          <div
            className="font-orbitron"
            style={{
              fontSize: 36,
              fontWeight: 900,
              color: "#ff3060",
              letterSpacing: "0.1em",
              textShadow: "0 0 30px rgba(255,48,96,0.7)",
              animation: "gameover-in 0.5s ease both",
            }}
          >
            GAME OVER
          </div>
        </div>
      )}
    </div>
  )
}
