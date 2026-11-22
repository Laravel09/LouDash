/**
 * Hazard rules shared by the live game, the renderer and the pattern
 * validator. Every hazard's motion, warning/active timing and collision boxes
 * come from here, so what the player sees is exactly what can hit them, and
 * the spawner can prove each pattern is clearable before it appears.
 */

// ── World geometry (game pixels, 60 Hz frames) ───────────────────────────────
export const GW = 844
export const GH = 390
export const GROUND_Y = 304
export const HUD_H = 50
export const CHAR_X = 108
export const CHAR_W = 36
export const CHAR_H = 56
export const CHAR_GROUND_Y = GROUND_Y - CHAR_H
/** Forgiving inset applied to the runner's collision box on every side. */
export const PLAYER_INSET = 8
export const SPAWN_X = GW + 20

export interface Box {
  x: number
  y: number
  w: number
  h: number
}

export function playerBox(charY: number): Box {
  return {
    x: CHAR_X + PLAYER_INSET,
    y: charY + PLAYER_INSET,
    w: CHAR_W - PLAYER_INSET * 2,
    h: CHAR_H - PLAYER_INSET * 2,
  }
}

export function overlaps(a: Box, b: Box, margin = 0): boolean {
  return (
    a.x < b.x + b.w + margin &&
    a.x + a.w > b.x - margin &&
    a.y < b.y + b.h + margin &&
    a.y + a.h > b.y - margin
  )
}

// ── Seeded randomness ────────────────────────────────────────────────────────
export type Rng = () => number

/** Mulberry32: small, fast, deterministic for a given seed. */
export function createRng(seed: number): Rng {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// ── Hazard catalogue ─────────────────────────────────────────────────────────
export type HazardKind = "roadblock" | "rock" | "barrier" | "crawler" | "spiderDrone" | "hoverDrone" | "sentry" | "pulseGate" | "floorLaser" | "laserPylon" | "overheadLaser" | "scannerDrone" | "hoverMine" | "crusher"

/**
 * jump     – sits in the running lane; clear it with a jump.
 * timed    – in the lane only while active; jump it or pass while it is off.
 * stayLow  – sits in the jump arc; stay grounded (or time the jump around it).
 */
export type HazardRole = "jump" | "timed" | "stayLow"

export interface HazardCycle {
  off: number
  warn: number
  active: number
}

export interface HazardSpec {
  w: number
  h: number
  role: HazardRole
  /** World-relative drift; >1 closes in faster than the ground. */
  speedFactor: number
  /** Top of the footprint at spawn, before any per-spawn jitter. */
  baseY: number
  yJitter: number
  cycle?: HazardCycle
  /** Short onboarding cue shown the first time a hazard appears. */
  cue: string
  cueColor: string
}

const ground = (h: number) => GROUND_Y - h

export const HAZARDS: Record<HazardKind, HazardSpec> = {
  roadblock: {
    w: 86,
    h: 26,
    role: "jump",
    speedFactor: 1,
    baseY: ground(26),
    yJitter: 0,
    cue: "JUMP",
    cueColor: "#ffd36b",
  },
  rock: {
    w: 52,
    h: 40,
    role: "jump",
    speedFactor: 1,
    baseY: ground(40),
    yJitter: 0,
    cue: "JUMP",
    cueColor: "#9fd6ff",
  },
  barrier: {
    w: 14,
    h: 84,
    role: "jump",
    speedFactor: 1,
    baseY: ground(84),
    yJitter: 0,
    cue: "JUMP",
    cueColor: "#79fff0",
  },
  crawler: {
    w: 54,
    h: 34,
    role: "jump",
    speedFactor: 1.12,
    baseY: ground(34),
    yJitter: 0,
    cue: "JUMP",
    cueColor: "#ff9a70",
  },
  spiderDrone: {
    w: 54,
    h: 36,
    role: "jump",
    speedFactor: 1.06,
    baseY: ground(36),
    yJitter: 0,
    cue: "JUMP",
    cueColor: "#e4b8ff",
  },
  hoverDrone: {
    w: 46,
    h: 26,
    role: "jump",
    speedFactor: 0.85,
    baseY: CHAR_GROUND_Y + 2,
    yJitter: 6,
    cue: "JUMP",
    cueColor: "#79fff0",
  },
  sentry: {
    w: 32,
    h: 68,
    role: "jump",
    speedFactor: 1.08,
    baseY: ground(68),
    yJitter: 0,
    cue: "JUMP",
    cueColor: "#ff8aa5",
  },
  pulseGate: {
    w: 22,
    h: 76,
    role: "timed",
    speedFactor: 1,
    baseY: ground(76),
    yJitter: 0,
    cycle: { off: 34, warn: 22, active: 40 },
    cue: "WAIT · JUMP",
    cueColor: "#e4b8ff",
  },
  floorLaser: {
    w: 96,
    h: 46,
    role: "timed",
    speedFactor: 1,
    baseY: ground(46),
    yJitter: 0,
    cycle: { off: 40, warn: 26, active: 46 },
    cue: "JUMP WHEN LIT",
    cueColor: "#ff5a7a",
  },
  laserPylon: {
    w: 124,
    h: 40,
    role: "timed",
    speedFactor: 1,
    baseY: ground(40),
    yJitter: 0,
    cycle: { off: 44, warn: 26, active: 56 },
    cue: "LONG JUMP",
    cueColor: "#ff5a7a",
  },
  overheadLaser: {
    w: 150,
    h: 60,
    role: "stayLow",
    speedFactor: 1,
    baseY: 150,
    yJitter: 0,
    cycle: { off: 36, warn: 24, active: 60 },
    cue: "STAY LOW",
    cueColor: "#ff5a7a",
  },
  scannerDrone: {
    w: 54,
    h: 30,
    role: "stayLow",
    speedFactor: 0.9,
    baseY: 128,
    yJitter: 8,
    cycle: { off: 40, warn: 24, active: 50 },
    cue: "STAY LOW",
    cueColor: "#79fff0",
  },
  hoverMine: {
    w: 30,
    h: 30,
    role: "stayLow",
    speedFactor: 0.95,
    baseY: 196,
    yJitter: 4,
    cue: "STAY LOW",
    cueColor: "#ffb347",
  },
  crusher: {
    w: 58,
    h: GROUND_Y - HUD_H,
    role: "stayLow",
    speedFactor: 1,
    baseY: HUD_H,
    yJitter: 0,
    cue: "TIME IT",
    cueColor: "#ffd36b",
  },
}

export const HAZARD_KINDS = Object.keys(HAZARDS) as HazardKind[]

export function isHazardKind(type: string): type is HazardKind {
  return type in HAZARDS
}

/** Minimal state each hazard instance carries. */
export interface HazardBody {
  type: HazardKind
  x: number
  y: number
  baseY: number
  w: number
  h: number
  spawnFrame: number
  /** Frames added to the age when reading the warning/active cycle. */
  cycleOffset: number
}

// ── Timed states ─────────────────────────────────────────────────────────────
export type HazardPhase = "off" | "warn" | "active"

export interface HazardState {
  phase: HazardPhase
  /** 0..1 through the current phase. */
  t: number
  age: number
}

export function hazardState(e: HazardBody, frame: number): HazardState {
  const age = frame - e.spawnFrame
  if (e.type === "crusher") {
    const c = crusherPhase(age + e.cycleOffset)
    return {
      phase:
        c.stage === "raised" ? "off" : c.stage === "warn" ? "warn" : "active",
      t: c.t,
      age,
    }
  }
  const cycle = HAZARDS[e.type].cycle
  if (!cycle) return { phase: "active", t: 0, age }
  const period = cycle.off + cycle.warn + cycle.active
  const p = (((age + e.cycleOffset) % period) + period) % period
  if (p < cycle.off) return { phase: "off", t: p / cycle.off, age }
  if (p < cycle.off + cycle.warn)
    return { phase: "warn", t: (p - cycle.off) / cycle.warn, age }
  return {
    phase: "active",
    t: (p - cycle.off - cycle.warn) / cycle.active,
    age,
  }
}

// Crusher: raised → warning shake → slam → hold → slow rise.
export const CRUSHER_TIMING = {
  raised: 54,
  warn: 22,
  slam: 6,
  hold: 16,
  rise: 28,
}
const CRUSHER_PERIOD =
  CRUSHER_TIMING.raised +
  CRUSHER_TIMING.warn +
  CRUSHER_TIMING.slam +
  CRUSHER_TIMING.hold +
  CRUSHER_TIMING.rise
export const CRUSHER_HEAD_H = 34
/** Head bottom while raised: above any standing runner, inside the jump arc. */
export const CRUSHER_RAISED_BOTTOM = 168

export type CrusherStage = "raised" | "warn" | "slam" | "hold" | "rise"

export function crusherPhase(
  age: number,
): {
  stage: CrusherStage
  t: number
  /** 0 = raised, 1 = on the ground. */
  drop: number
} {
  let p = ((age % CRUSHER_PERIOD) + CRUSHER_PERIOD) % CRUSHER_PERIOD
  const T = CRUSHER_TIMING
  if (p < T.raised) return { stage: "raised", t: p / T.raised, drop: 0 }
  p -= T.raised
  if (p < T.warn) return { stage: "warn", t: p / T.warn, drop: 0 }
  p -= T.warn
  if (p < T.slam) {
    const t = p / T.slam
    return { stage: "slam", t, drop: t * t }
  }
  p -= T.slam
  if (p < T.hold) return { stage: "hold", t: p / T.hold, drop: 1 }
  p -= T.hold
  const t = p / T.rise
  return { stage: "rise", t, drop: 1 - t * (2 - t) }
}

export function crusherHeadBottom(e: HazardBody, frame: number): number {
  const { drop } = crusherPhase(frame - e.spawnFrame + e.cycleOffset)
  return CRUSHER_RAISED_BOTTOM + (GROUND_Y - CRUSHER_RAISED_BOTTOM) * drop
}

// ── Motion ───────────────────────────────────────────────────────────────────
/** Advances one 60 Hz frame. `frame` is the frame being simulated. */
export function stepHazard(e: HazardBody, frame: number, speed: number) {
  const spec = HAZARDS[e.type]
  e.x -= speed * spec.speedFactor
  const age = frame - e.spawnFrame
  if (e.type === "hoverDrone") e.y = e.baseY + Math.sin(age * 0.08) * 14
  else if (e.type === "scannerDrone") e.y = e.baseY + Math.sin(age * 0.05) * 6
  else if (e.type === "hoverMine") e.y = e.baseY + Math.sin(age * 0.06) * 16
}

function inset(e: HazardBody, ix: number, iy: number): Box {
  return { x: e.x + ix, y: e.y + iy, w: e.w - ix * 2, h: e.h - iy * 2 }
}

/**
 * Collision boxes for this frame. Deliberately inset from the artwork and
 * empty while a timed hazard is off or still warning.
 */
export function hazardBoxes(e: HazardBody, frame: number): Box[] {
  switch (e.type) {
    case "roadblock":
    case "rock":
    case "crawler":
    case "hoverDrone":
    case "sentry":
      return [inset(e, 8, 8)]
    case "barrier":
      return [inset(e, 6, 8)]
    case "spiderDrone":
      return [inset(e, 9, 8)]
    case "hoverMine":
      return [inset(e, 6, 6)]
    case "pulseGate":
      return hazardState(e, frame).phase === "active" ? [inset(e, 5, 6)] : []
    case "floorLaser":
      return hazardState(e, frame).phase === "active"
        ? [{ x: e.x + 8, y: GROUND_Y - 40, w: e.w - 16, h: 32 }]
        : []
    case "laserPylon": {
      const posts: Box[] = [
        { x: e.x + 3, y: e.y + 8, w: 6, h: e.h - 8 },
        { x: e.x + e.w - 9, y: e.y + 8, w: 6, h: e.h - 8 },
      ]
      if (hazardState(e, frame).phase === "active") {
        posts.push({ x: e.x + 12, y: GROUND_Y - 30, w: e.w - 24, h: 14 })
      }
      return posts
    }
    case "overheadLaser":
      return hazardState(e, frame).phase === "active"
        ? [{ x: e.x + 6, y: OVERHEAD_BEAM_Y, w: e.w - 12, h: 12 }]
        : []
    case "scannerDrone": {
      const body = inset(e, 8, 8)
      if (hazardState(e, frame).phase !== "active") return [body]
      const top = e.y + 28
      return [body, { x: e.x + 17, y: top, w: 20, h: SCAN_FLOOR - top }]
    }
    case "crusher": {
      const bottom = crusherHeadBottom(e, frame)
      const top = bottom - CRUSHER_HEAD_H
      return [
        { x: e.x + 22, y: HUD_H, w: 14, h: Math.max(0, top - HUD_H) },
        { x: e.x + 6, y: top + 4, w: e.w - 12, h: CRUSHER_HEAD_H - 6 },
      ]
    }
  }
}

export const OVERHEAD_BEAM_Y = 194
/** Scanner beams stop well above a standing runner's head. */
export const SCAN_FLOOR = 232

// ── Difficulty tiers ─────────────────────────────────────────────────────────
export interface TierRules {
  name: string
  /** Run distance (score units) at which the tier begins. */
  distance: number
  /** World-speed multiplier target. */
  mult: number
  /** Chance a spawn slot is a hazard group rather than coins. */
  hazardChance: number
  /** Hazards per group. */
  count: readonly [number, number]
  /** Edge-to-edge spacing inside a group, in frames of travel. */
  gapFrames: readonly [number, number]
  /** Frames between one group being settled and the next arriving. */
  cushion: number
  cushionRandom: number
  /** Grounded frames required between landing and the next jump. */
  recovery: number
  /** Every required jump must succeed across ±window launch frames. */
  window: number
  weights: Partial<Record<HazardKind, number>>
}

export const TIERS: readonly TierRules[] = [
  {
    name: "EASY",
    distance: 0,
    mult: 1.0,
    hazardChance: 0.52,
    count: [1, 1],
    gapFrames: [60, 80],
    cushion: 44,
    cushionRandom: 40,
    recovery: 14,
    window: 5,
    weights: { roadblock: 3, rock: 3, barrier: 2 },
  },
  {
    name: "EASY+",
    distance: 70,
    mult: 1.35,
    hazardChance: 0.62,
    count: [1, 2],
    gapFrames: [48, 70],
    cushion: 34,
    cushionRandom: 32,
    recovery: 12,
    window: 5,
    weights: {
      roadblock: 2.4,
      rock: 2.4,
      barrier: 2,
      crawler: 2,
      hoverDrone: 1.4,
      floorLaser: 1.8,
    },
  },
  {
    name: "NORMAL",
    distance: 160,
    mult: 1.7,
    hazardChance: 0.7,
    count: [1, 2],
    gapFrames: [42, 64],
    cushion: 26,
    cushionRandom: 26,
    recovery: 11,
    window: 4,
    weights: {
      roadblock: 1.8,
      rock: 1.8,
      barrier: 1.6,
      crawler: 1.8,
      hoverDrone: 1.6,
      floorLaser: 1.8,
      spiderDrone: 2,
      pulseGate: 1.8,
      overheadLaser: 1.6,
      hoverMine: 1.4,
    },
  },
  {
    name: "HARD",
    distance: 280,
    mult: 2.05,
    hazardChance: 0.76,
    count: [2, 3],
    gapFrames: [36, 58],
    cushion: 20,
    cushionRandom: 20,
    recovery: 10,
    window: 4,
    weights: {
      roadblock: 1.2,
      rock: 1.3,
      barrier: 1.3,
      crawler: 1.6,
      hoverDrone: 1.6,
      floorLaser: 1.6,
      spiderDrone: 1.8,
      pulseGate: 1.6,
      overheadLaser: 1.6,
      hoverMine: 1.5,
      sentry: 1.8,
      scannerDrone: 1.6,
      laserPylon: 1.6,
    },
  },
  {
    name: "VERY HARD",
    distance: 440,
    mult: 2.45,
    hazardChance: 0.8,
    count: [2, 3],
    gapFrames: [32, 52],
    cushion: 15,
    cushionRandom: 16,
    recovery: 9,
    window: 4,
    weights: {
      roadblock: 1,
      rock: 1,
      barrier: 1.1,
      crawler: 1.5,
      hoverDrone: 1.5,
      floorLaser: 1.6,
      spiderDrone: 1.7,
      pulseGate: 1.6,
      overheadLaser: 1.7,
      hoverMine: 1.5,
      sentry: 1.7,
      scannerDrone: 1.7,
      laserPylon: 1.6,
      crusher: 1.5,
    },
  },
  {
    name: "EXPERT",
    distance: 640,
    mult: 2.85,
    hazardChance: 0.85,
    count: [2, 4],
    gapFrames: [30, 48],
    cushion: 11,
    cushionRandom: 12,
    recovery: 8,
    window: 3,
    weights: {
      roadblock: 0.8,
      rock: 0.8,
      barrier: 1,
      crawler: 1.4,
      hoverDrone: 1.5,
      floorLaser: 1.6,
      spiderDrone: 1.6,
      pulseGate: 1.6,
      overheadLaser: 1.8,
      hoverMine: 1.6,
      sentry: 1.6,
      scannerDrone: 1.8,
      laserPylon: 1.6,
      crusher: 1.7,
    },
  },
  {
    name: "EXTREME",
    distance: 900,
    mult: 3.2,
    hazardChance: 0.9,
    count: [3, 4],
    gapFrames: [28, 44],
    cushion: 8,
    cushionRandom: 9,
    recovery: 8,
    window: 3,
    weights: {
      roadblock: 0.7,
      rock: 0.7,
      barrier: 0.9,
      crawler: 1.3,
      hoverDrone: 1.5,
      floorLaser: 1.6,
      spiderDrone: 1.5,
      pulseGate: 1.6,
      overheadLaser: 1.9,
      hoverMine: 1.6,
      sentry: 1.5,
      scannerDrone: 1.9,
      laserPylon: 1.6,
      crusher: 1.8,
    },
  },
]

export function tierForDistance(distance: number): number {
  for (let i = TIERS.length - 1; i >= 0; i -= 1) {
    if (distance >= TIERS[i].distance) return i
  }
  return 0
}

// ── Jump model (mirrors the game's integration exactly) ──────────────────────
export interface JumpModel {
  gravity: number
  velocity: number
}

/** Rise of the runner's top-left y for each airborne frame; last = landing. */
export function jumpArc(jump: JumpModel): number[] {
  const ys: number[] = []
  let y = CHAR_GROUND_Y
  let vy = jump.velocity
  for (let i = 0; i < 400; i += 1) {
    vy += jump.gravity
    y += vy
    if (y < HUD_H + 2) {
      y = HUD_H + 2
      if (vy < 0) vy = 0
    }
    if (y >= CHAR_GROUND_Y) {
      ys.push(CHAR_GROUND_Y)
      break
    }
    ys.push(y)
  }
  return ys
}

// ── Pattern plans ────────────────────────────────────────────────────────────
export interface PlannedHazard {
  type: HazardKind
  /** Offset from the spawn edge, px. */
  dx: number
  y: number
  cycleOffset: number
}

export function instantiate(
  plan: readonly PlannedHazard[],
  frame: number,
): HazardBody[] {
  return plan.map((p) => {
    const spec = HAZARDS[p.type]
    return {
      type: p.type,
      x: SPAWN_X + p.dx,
      y: p.y,
      baseY: p.y,
      w: spec.w,
      h: spec.h,
      spawnFrame: frame,
      cycleOffset: p.cycleOffset,
    }
  })
}

export interface ValidationOptions {
  jump: JumpModel
  recovery: number
  window: number
  /** Extra px around every hazard box while validating. */
  margin: number
  /** First frame (after the start) the runner is guaranteed free to act. */
  readyAt: number
}

export interface Validation {
  ok: boolean
  /** First frame a box reaches the runner's column. */
  arrival: number
  /** Frame by which the runner is grounded and recovered on every valid path. */
  settle: number
  /** Fewest jumps on a valid path (for tests/telemetry). */
  jumps: number
}

const PLAYER_LEFT = CHAR_X + PLAYER_INSET
const PLAYER_RIGHT = CHAR_X + CHAR_W - PLAYER_INSET

// ── Speed model (the game calls these every frame) ──────────────────────────
export const BASE_SPEED = 3.2
export const SPEED_LERP_RATE = 0.0045
export const DISTANCE_PER_SCORE = 64
export const OVERDRIVE_DISTANCE = 1215
export const OVERDRIVE_SPAN = 600
export const OVERDRIVE_BONUS = 0.4

export interface SpeedState {
  /** Current multiplier (ramps toward target). */
  mult: number
  /** Monotonic target multiplier. */
  target: number
  /** Run distance in score units. */
  distance: number
}

/** Updates target and multiplier for a new frame (before speed is applied). */
export function stepSpeed(s: SpeedState): void {
  const tierMult = TIERS[tierForDistance(s.distance)].mult
  if (tierMult > s.target) s.target = tierMult
  if (s.distance >= OVERDRIVE_DISTANCE) {
    const progress = Math.min(
      1,
      (s.distance - OVERDRIVE_DISTANCE) / OVERDRIVE_SPAN,
    )
    s.target = Math.max(
      s.target,
      TIERS[TIERS.length - 1].mult + progress * OVERDRIVE_BONUS,
    )
  }
  if (s.mult < s.target) s.mult = Math.min(s.target, s.mult + SPEED_LERP_RATE)
}

/**
 * Exact future world speed: replays `stepSpeed` from the current state, with
 * an optional temporary boost (Signal Burst) for its remaining frames.
 */
export interface SpeedProfile
  extends SpeedState {
  /** px/frame at multiplier 1 (BASE_SPEED × runner speed mod). */
  base: number
  boost?: number
  boostFrames?: number
}

export type SpeedInput = number | SpeedProfile

function speedSeries(input: SpeedInput): (k: number) => number {
  if (typeof input === "number") return () => input
  const state: SpeedState = {
    mult: input.mult,
    target: input.target,
    distance: input.distance,
  }
  const out: number[] = [0]
  return (k: number) => {
    while (out.length <= k) {
      const frame = out.length
      stepSpeed(state)
      const boosted = frame <= (input.boostFrames ?? 0) ? (input.boost ?? 1) : 1
      const v = input.base * state.mult * boosted
      state.distance += v / DISTANCE_PER_SCORE
      out.push(v)
    }
    return out[k]
  }
}

export interface SolverResult {
  ok: boolean
  arrival: number
  settle: number
  jumps: number
  /** Jumping right now lies on a valid path. */
  jumpNow: boolean
  /** Staying grounded this frame lies on a valid path. */
  stayOk: boolean
}

export interface SpawnSchedule {
  busyUntil: number
  nextSpawnFrame: number
}

export interface SolverStart {
  /** Frame of the supplied hazard state; simulation starts at frame + 1. */
  frame: number
  /** Airborne trajectory still to fly (top-left y per frame), if any. */
  airborne?: readonly number[]
  /** Grounded frames already accumulated toward recovery. */
  groundedFor?: number
}

/**
 * Frame-by-frame solver: simulates the hazards exactly as the game does and
 * searches every jump schedule (with landing recovery and a timing window) for
 * one that avoids all collision boxes. `firstJump` reports whether the first
 * decision on the found path is an immediate jump (used by the test bot).
 */
export function solveHazards(
  source: readonly HazardBody[],
  speed: SpeedInput,
  options: ValidationOptions,
  start: SolverStart = { frame: 0 },
): SolverResult {
  const bodies = source.map((b) => ({ ...b }))
  const speedAt = speedSeries(speed)
  const arc = jumpArc(options.jump)
  const airtime = arc.length
  const boxes: Box[][] = [bodies.flatMap((b) => hazardBoxes(b, start.frame))]
  let arrival = -1
  let passed = -1
  for (let k = 1; k < 2400; k += 1) {
    const v = speedAt(k)
    for (const b of bodies) stepHazard(b, start.frame + k, v)
    boxes.push(bodies.flatMap((b) => hazardBoxes(b, start.frame + k)))
    if (arrival < 0 && bodies.some((b) => b.x <= PLAYER_RIGHT + 2)) arrival = k
    if (bodies.every((b) => b.x + b.w < PLAYER_LEFT - 4)) {
      passed = k
      break
    }
  }
  const fail = {
    ok: false,
    arrival,
    settle: 0,
    jumps: 0,
    jumpNow: false,
    stayOk: false,
  }
  if (passed < 0) return fail
  const pending = start.airborne ?? []
  const R = options.recovery
  const readyAt = Math.max(options.readyAt, pending.length)
  const end = Math.max(passed, readyAt) + airtime + R + 1
  for (let k = boxes.length; k <= end + airtime + 2; k += 1) boxes.push([])

  const m = options.margin
  const hit = (k: number, y: number) => {
    const list = boxes[k]
    if (!list || list.length === 0) return false
    const p = playerBox(y)
    for (const b of list) if (overlaps(p, b, m)) return true
    return false
  }
  // Finish any jump already in progress.
  for (let j = 0; j < pending.length; j += 1) {
    if (hit(j + 1, pending[j])) return fail
  }
  const groundSafe: boolean[] = []
  for (let k = 0; k <= end + airtime + 2; k += 1)
    groundSafe[k] = !hit(k, CHAR_GROUND_Y)
  const jumpCache = new Map<number, boolean>()
  const safeJump = (launch: number) => {
    let v = jumpCache.get(launch)
    if (v === undefined) {
      v = true
      for (let j = 0; j < airtime; j += 1) {
        if (hit(launch + 1 + j, arc[j])) {
          v = false
          break
        }
      }
      jumpCache.set(launch, v)
    }
    return v
  }
  // A jump only counts if nearby launch frames work too (human timing).
  const robust = (launch: number) => {
    const from = Math.max(readyAt, launch - options.window)
    for (let t = from; t <= launch + options.window; t += 1) {
      if (!safeJump(t)) return false
    }
    return true
  }

  const s0 = pending.length > 0 ? pending.length : Math.max(0, options.readyAt)
  if (!groundSafe[s0]) return fail
  const lastLaunch = Math.max(passed, readyAt)
  const size = end + airtime + 3

  /**
   * Backward feasibility then forward reachability for one player model.
   * `rec` = grounded frames needed before jumping again; `launchOk` decides
   * whether a jump from frame k is acceptable.
   */
  const search = (
    rec: number,
    launchOk: (k: number) => boolean,
    r0: number,
  ) => {
    const can: Uint8Array[] = []
    for (let r = 0; r <= rec; r += 1) can.push(new Uint8Array(size))
    for (let r = 0; r <= rec; r += 1) can[r][end] = groundSafe[end] ? 1 : 0
    for (let k = end - 1; k >= s0; k -= 1) {
      if (!groundSafe[k]) continue
      for (let r = rec; r >= 0; r -= 1) {
        let ok = groundSafe[k + 1] && can[Math.min(rec, r + 1)][k + 1] === 1
        if (!ok && r === rec && k >= readyAt && k <= lastLaunch) {
          const land = k + airtime
          ok = land <= end && can[0][land] === 1 && launchOk(k)
        }
        if (ok) can[r][k] = 1
      }
    }
    const reach: Uint8Array[] = []
    for (let r = 0; r <= rec; r += 1) reach.push(new Uint8Array(size))
    const jumps = new Float64Array(size).fill(Infinity)
    let latestLanding = 0
    if (!can[r0][s0]) return { can, ok: false, latestLanding, jumps: 0 }
    reach[r0][s0] = 1
    jumps[s0] = 0
    for (let k = s0; k < end; k += 1) {
      for (let r = 0; r <= rec; r += 1) {
        if (!reach[r][k]) continue
        const nr = Math.min(rec, r + 1)
        if (groundSafe[k + 1] && can[nr][k + 1]) {
          reach[nr][k + 1] = 1
          jumps[k + 1] = Math.min(jumps[k + 1], jumps[k])
        }
        if (r === rec && k >= readyAt && k <= lastLaunch) {
          const land = k + airtime
          if (land <= end && can[0][land] && launchOk(k)) {
            reach[0][land] = 1
            jumps[land] = Math.min(jumps[land], jumps[k] + 1)
            latestLanding = Math.max(latestLanding, land)
          }
        }
      }
    }
    return { can, ok: true, latestLanding, jumps: jumps[end] }
  }

  const r0 = pending.length > 0 ? 0 : Math.min(R, start.groundedFor ?? R)
  const strict = search(R, robust, r0)
  if (!strict.ok) return fail
  // Any physically survivable line (exact timing, instant re-jumps) bounds how
  // late the runner might still be airborne; the next group must wait for it.
  const loose = search(0, safeJump, 0)
  const latest = Math.max(strict.latestLanding, loose.latestLanding)
  const can = strict.can
  const stayOk =
    pending.length === 0 &&
    groundSafe[s0 + 1] &&
    can[Math.min(R, r0 + 1)][s0 + 1] === 1
  const jumpNow =
    pending.length === 0 &&
    r0 === R &&
    s0 >= readyAt &&
    robust(s0) &&
    can[0][s0 + airtime] === 1
  return {
    ok: true,
    arrival,
    settle: Math.max(passed, latest) + R,
    jumps: strict.jumps,
    jumpNow,
    stayOk,
  }
}

export function validatePlan(
  plan: readonly PlannedHazard[],
  speed: SpeedInput,
  options: ValidationOptions,
): Validation {
  const v = solveHazards(instantiate(plan, 0), speed, options)
  if (v.ok && v.arrival >= 0 && v.arrival <= options.readyAt) {
    return { ...v, ok: false }
  }
  return { ok: v.ok, arrival: v.arrival, settle: v.settle, jumps: v.jumps }
}

/** Conservative frames for a fresh spawn to reach the runner (fastest drift). */
export function estimateArrival(speed: number): number {
  const fastest = Math.max(...HAZARD_KINDS.map((k) => HAZARDS[k].speedFactor))
  return Math.floor((SPAWN_X - PLAYER_RIGHT - 2) / (speed * fastest))
}

/** Next spawn frame after a validated group was placed at `now`. */
export function nextSpawnAfterGroup(
  now: number,
  settle: number,
  rules: TierRules,
  rng: Rng,
  speed: number,
): SpawnSchedule {
  const busyUntil = now + settle
  const cushion = rules.cushion + rng() * rules.cushionRandom
  return {
    busyUntil,
    nextSpawnFrame: Math.max(
      now + 1,
      Math.round(busyUntil + cushion - estimateArrival(speed)),
    ),
  }
}

export interface GeneratedGroup {
  plan: PlannedHazard[]
  validation: Validation
  attempts: number
}

function pickWeighted(rng: Rng, weights: Partial<Record<HazardKind, number>>) {
  const entries = Object.entries(weights) as Array<[HazardKind, number]>
  const total = entries.reduce((sum, [, w]) => sum + w, 0)
  let roll = rng() * total
  for (const [kind, w] of entries) {
    roll -= w
    if (roll <= 0) return kind
  }
  return entries[entries.length - 1][0]
}

function cyclePeriod(kind: HazardKind): number {
  if (kind === "crusher") return CRUSHER_PERIOD
  const c = HAZARDS[kind].cycle
  return c ? c.off + c.warn + c.active : 1
}

export interface GenerateOptions {
  tier: number
  speed: number
  jump: JumpModel
  readyAt: number
  /** Exact expected speed over time; defaults to constant `speed`. */
  profile?: SpeedProfile
  /** Extra speed profiles the group must also survive (ramps, burst end). */
  speedVariants?: readonly SpeedInput[]
  /** Kinds the run has already shown, for gentler first encounters. */
  maxCount?: number
}

function buildPlan(
  rng: Rng,
  rules: TierRules,
  speed: number,
  airtime: number,
  count: number,
  spread: number,
): PlannedHazard[] {
  const plan: PlannedHazard[] = []
  let cursor = 0
  let prevRole: HazardRole | null = null
  for (let i = 0; i < count; i += 1) {
    let kind = pickWeighted(rng, rules.weights)
    // Never stack two long overhead hazards back to back in one group.
    if (
      i > 0 &&
      HAZARDS[kind].role === "stayLow" &&
      HAZARDS[plan[i - 1].type].role === "stayLow"
    ) {
      kind = pickWeighted(rng, rules.weights)
    }
    const spec = HAZARDS[kind]
    if (i > 0) {
      const [lo, hi] = rules.gapFrames
      let gap = (lo + rng() * (hi - lo)) * spread
      // A stay-low hazard must never sit where the runner is still airborne
      // from clearing the previous lane hazard.
      if (spec.role === "stayLow" && prevRole !== "stayLow") {
        gap = Math.max(gap, airtime * 0.75 + rules.recovery + 10)
      }
      cursor += gap * speed
    }
    const y = spec.baseY + (spec.yJitter ? (rng() - 0.5) * 2 * spec.yJitter : 0)
    plan.push({
      type: kind,
      dx: Math.round(cursor),
      y,
      cycleOffset: Math.floor(rng() * cyclePeriod(kind)),
    })
    cursor += spec.w
    prevRole = spec.role
  }
  return plan
}

/**
 * Builds a group for the tier and proves it clearable at every speed variant.
 * Failed candidates are re-rolled with wider spacing, then with fewer hazards,
 * and finally fall back to a single low roadblock that is always fair.
 */
export function generateGroup(
  rng: Rng,
  options: GenerateOptions,
): GeneratedGroup {
  const rules = TIERS[options.tier]
  const airtime = jumpArc(options.jump).length
  const [cmin, cmax] = rules.count
  let count = Math.min(
    options.maxCount ?? cmax,
    cmin + Math.floor(rng() * (cmax - cmin + 1)),
  )
  const speeds: SpeedInput[] = [
    options.profile ?? options.speed,
    ...(options.speedVariants ?? []),
  ]
  let attempts = 0
  while (count >= 1) {
    for (let pass = 0; pass < 4; pass += 1) {
      attempts += 1
      const plan = buildPlan(
        rng,
        rules,
        options.speed,
        airtime,
        count,
        1 + pass * 0.22,
      )
      const result = validateAll(plan, speeds, rules, options)
      if (result.ok) return { plan, validation: result, attempts }
    }
    count -= 1
  }
  const plan: PlannedHazard[] = [
    { type: "roadblock", dx: 0, y: HAZARDS.roadblock.baseY, cycleOffset: 0 },
  ]
  return {
    plan,
    validation: validateAll(plan, speeds, rules, options),
    attempts,
  }
}

function validateAll(
  plan: readonly PlannedHazard[],
  speeds: readonly SpeedInput[],
  rules: TierRules,
  options: GenerateOptions,
): Validation {
  let merged: Validation | null = null
  for (const s of speeds) {
    const v = validatePlan(plan, s, {
      jump: options.jump,
      recovery: rules.recovery,
      window: rules.window,
      margin: 2,
      readyAt: options.readyAt,
    })
    if (!v.ok) return v
    merged = merged
      ? {
          ok: true,
          arrival: Math.min(merged.arrival, v.arrival),
          settle: Math.max(merged.settle, v.settle),
          jumps: Math.max(merged.jumps, v.jumps),
        }
      : v
  }
  return merged as Validation
}
