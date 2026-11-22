import type { CharacterId } from "./types"

/**
 * Skeletal rig cut from each runner's approved contact pose. Every part keeps
 * the original artwork; the rig only rotates pieces about measured joints so
 * the run cycle and jump states share one set of proportions and one baseline.
 * All coordinates are in source-sheet pixels.
 */

type Rect = readonly [x: number, y: number, w: number, h: number]
type Point = readonly [x: number, y: number]

export type RigPart = "torso" | "arm" | "thigh" | "shin" | "foot"

export interface RigMeta {
  parts: Record<RigPart, Rect>
  shoulder: Point
  hip: Point
  knee: Point
  ankle: Point
  heel: Point
  toe: Point
  /** Height of the original sprite crop; keeps the previous on-screen scale. */
  cropHeight: number
}

export const RIG_META: Record<CharacterId, RigMeta> = {
  lou: {
    parts: {
      torso: [160, 478, 158, 265],
      arm: [99, 575, 136, 193],
      thigh: [173, 726, 115, 134],
      shin: [246, 826, 82, 155],
      foot: [282, 959, 121, 84],
    },
    shoulder: [195, 602.5],
    hip: [217.5, 760],
    knee: [267.5, 859],
    ankle: [312.5, 977.5],
    heel: [292.5, 1037.5],
    toe: [396, 1036],
    cropHeight: 648,
  },
  dash: {
    parts: {
      torso: [143, 524, 182, 255],
      arm: [94, 623, 150, 182],
      thigh: [176, 767, 134, 137],
      shin: [262, 864, 72, 150],
      foot: [286, 989, 108, 59],
    },
    shoulder: [200, 650],
    hip: [227.5, 800],
    knee: [295, 886],
    ankle: [315, 1005],
    heel: [294, 1043],
    toe: [387.5, 1042],
    cropHeight: 658,
  },
  nova: {
    parts: {
      torso: [103, 489, 224, 246],
      arm: [102, 611, 134, 170],
      thigh: [168, 729, 141, 171],
      shin: [261, 862, 73, 157],
      foot: [289, 997, 102, 71],
    },
    shoulder: [210, 632.5],
    hip: [210, 760],
    knee: [282.5, 885],
    ankle: [312.5, 1017.5],
    heel: [299, 1062],
    toe: [385, 1061],
    cropHeight: 687,
  },
}

/** Visible sprite height relative to the character box (matches v4 art). */
export const RIG_HEIGHT_RATIO = 1.22

export interface LegPose {
  /** Thigh angle from vertical, degrees; positive swings forward (right). */
  thigh: number
  /** Knee flexion, degrees; shin angle = thigh - knee. */
  knee: number
  /** Foot pitch, degrees clockwise; positive points the toe down. */
  foot: number
}

export interface RigPose {
  /** Torso lean about the hip, degrees; positive leans forward. */
  lean: number
  /** Arm swing relative to the drawn pose; positive swings forward. */
  armNear: number
  armFar: number
  near: LegPose
  far: LegPose
}

export type RigLayer = "armFar" | "thighFar" | "shinFar" | "footFar" | "torso" | "thighNear" | "shinNear" | "footNear" | "armNear"

/** Back-to-front draw order. */
export const RIG_LAYERS: readonly RigLayer[] = [
  "armFar",
  "thighFar",
  "shinFar",
  "footFar",
  "torso",
  "thighNear",
  "shinNear",
  "footNear",
  "armNear",
]

export const LAYER_PART: Record<RigLayer, RigPart> = {
  armFar: "arm",
  thighFar: "thigh",
  shinFar: "shin",
  footFar: "foot",
  torso: "torso",
  thighNear: "thigh",
  shinNear: "shin",
  footNear: "foot",
  armNear: "arm",
}

/** SVG affine matrix [a, b, c, d, e, f]. */
export type Matrix = [number, number, number, number, number, number]

const DEG = Math.PI / 180

function mul(m: Matrix, n: Matrix): Matrix {
  return [
    m[0] * n[0] + m[2] * n[1],
    m[1] * n[0] + m[3] * n[1],
    m[0] * n[2] + m[2] * n[3],
    m[1] * n[2] + m[3] * n[3],
    m[0] * n[4] + m[2] * n[5] + m[4],
    m[1] * n[4] + m[3] * n[5] + m[5],
  ]
}

/** Clockwise rotation (screen space) of `deg` about point p. */
function rotAbout(deg: number, p: Point): Matrix {
  const c = Math.cos(deg * DEG)
  const s = Math.sin(deg * DEG)
  return [c, s, -s, c, p[0] - c * p[0] + s * p[1], p[1] - s * p[0] - c * p[1]]
}

function translate(x: number, y: number): Matrix {
  return [1, 0, 0, 1, x, y]
}

function apply(m: Matrix, p: Point): Point {
  return [m[0] * p[0] + m[2] * p[1] + m[4], m[1] * p[0] + m[3] * p[1] + m[5]]
}

function angleFromVertical(a: Point, b: Point): number {
  return Math.atan2(b[0] - a[0], b[1] - a[1]) / DEG
}

function dist(a: Point, b: Point): number {
  return Math.hypot(b[0] - a[0], b[1] - a[1])
}

interface LegSolve {
  thigh: Matrix
  shin: Matrix
  foot: Matrix
  knee: Point
  heel: Point
  toe: Point
}

function solveLeg(meta: RigMeta, leg: LegPose, hip: Point): LegSolve {
  const t0 = angleFromVertical(meta.hip, meta.knee)
  const s0 = angleFromVertical(meta.knee, meta.ankle)
  const lt = dist(meta.hip, meta.knee)
  const ls = dist(meta.knee, meta.ankle)
  const shinAngle = leg.thigh - leg.knee
  const hipShift = translate(hip[0] - meta.hip[0], hip[1] - meta.hip[1])
  const knee: Point = [
    hip[0] + lt * Math.sin(leg.thigh * DEG),
    hip[1] + lt * Math.cos(leg.thigh * DEG),
  ]
  const ankle: Point = [
    knee[0] + ls * Math.sin(shinAngle * DEG),
    knee[1] + ls * Math.cos(shinAngle * DEG),
  ]
  const thigh = mul(hipShift, rotAbout(-(leg.thigh - t0), meta.hip))
  const shin = mul(
    translate(knee[0] - meta.knee[0], knee[1] - meta.knee[1]),
    rotAbout(-(shinAngle - s0), meta.knee),
  )
  const foot = mul(
    translate(ankle[0] - meta.ankle[0], ankle[1] - meta.ankle[1]),
    rotAbout(leg.foot, meta.ankle),
  )
  return {
    thigh,
    shin,
    foot,
    knee,
    heel: apply(foot, meta.heel),
    toe: apply(foot, meta.toe),
  }
}

export interface RigFrame {
  matrices: Record<RigLayer, Matrix>
  /** Lowest sole point after posing, used for grounding. */
  lowest: number
  nearHeelX: number
}

export interface SolveOptions {
  /** Snap the lowest sole to the baseline. */
  ground?: boolean
  lift?: number
  /** 0 = grounded body height, 1 = steady airborne height. */
  airWeight?: number
  /**
   * Kneeling contact: when set, each knee joint plus this pad (sheet px, the
   * armour's thickness below the joint) also counts as a ground contact.
   * Only the defeat sequence uses it; run and jump poses never pass it.
   */
  kneeContact?: number
}

/** Depth offsets for the far-side limbs, in sheet pixels. */
const FAR_SHOULDER: Point = [9, -4]
const FAR_HIP: Point = [-7, -2]

/**
 * Solves the pose. `bob` moves the whole body vertically; `ground` (when
 * supplied) overrides it so the lowest sole rests exactly on the baseline.
 */
export function solveRig(
  meta: RigMeta,
  pose: RigPose,
  options: SolveOptions = {},
): RigFrame {
  const groundY = Math.max(meta.heel[1], meta.toe[1])
  const build = (bob: number) => {
    const body = translate(0, bob)
    const lean = mul(body, rotAbout(pose.lean, meta.hip))
    const hip: Point = [meta.hip[0], meta.hip[1] + bob]
    const farHip: Point = [hip[0] + FAR_HIP[0], hip[1] + FAR_HIP[1]]
    const near = solveLeg(meta, pose.near, hip)
    const far = solveLeg(meta, pose.far, farHip)
    const farShoulder = mul(lean, translate(FAR_SHOULDER[0], FAR_SHOULDER[1]))
    const matrices: Record<RigLayer, Matrix> = {
      armFar: mul(farShoulder, rotAbout(-pose.armFar, meta.shoulder)),
      thighFar: far.thigh,
      shinFar: far.shin,
      footFar: far.foot,
      torso: lean,
      thighNear: near.thigh,
      shinNear: near.shin,
      footNear: near.foot,
      armNear: mul(lean, rotAbout(-pose.armNear, meta.shoulder)),
    }
    const pad = options.kneeContact
    const lowest = Math.max(
      near.heel[1],
      near.toe[1],
      far.heel[1],
      far.toe[1],
      pad === undefined ? -Infinity : near.knee[1] + pad,
      pad === undefined ? -Infinity : far.knee[1] + pad,
    )
    return { matrices, lowest, nearHeelX: near.heel[0] }
  }
  const first = build(0)
  const groundBob = groundY - first.lowest - (options.lift ?? 0)
  if (options.ground) return build(groundBob)
  // Airborne: settle toward a steady hip height, never letting a foot dip
  // below the character box; blend from the grounded height after takeoff.
  const airBob = Math.min(0, groundY - first.lowest)
  const w = clamp(options.airWeight ?? 1, 0, 1)
  return build(groundBob + (airBob - groundBob) * w)
}

// ── Run cycle ────────────────────────────────────────────────────────────────

/** Fraction of the cycle a foot is planted. */
export const STANCE_DUTY = 0.4

// [phase, thigh, knee, foot]. Stance runs 0 → STANCE_DUTY with the thigh
// sweeping linearly so the planted sole tracks the ground; the swing drives
// the knee high and reaches forward before the next touchdown.
const RUN_KEYS: ReadonlyArray<readonly [number, number, number, number]> = [
  [0, 30, 14, 0],
  [0.1, 15, 30, 0],
  [0.2, 0, 36, 0],
  [0.3, -15, 28, 0],
  [0.4, -30, 16, 0],
  [0.52, -20, 76, 44],
  [0.66, 10, 118, 32],
  [0.8, 46, 90, 10],
  [0.91, 38, 30, -4],
]

function wrap(q: number) {
  return ((q % 1) + 1) % 1
}

function sampleRun(q: number, column: 1 | 2 | 3): number {
  const n = RUN_KEYS.length
  q = wrap(q)
  let i = n - 1
  for (let k = 0; k < n; k += 1) {
    const next = k + 1 < n ? RUN_KEYS[k + 1][0] : 1
    if (q >= RUN_KEYS[k][0] && q < next) {
      i = k
      break
    }
  }
  const k0 = RUN_KEYS[(i - 1 + n) % n]
  const k1 = RUN_KEYS[i]
  const k2 = RUN_KEYS[(i + 1) % n]
  const k3 = RUN_KEYS[(i + 2) % n]
  const t1 = k1[0]
  const t2 = i + 1 < n ? k2[0] : 1
  const span = t2 - t1
  const t = (q - t1) / span
  const m1 = ((k2[column] - k0[column]) / 2) * 0.9
  const m2 = ((k3[column] - k1[column]) / 2) * 0.9
  const t2s = t * t
  const t3 = t2s * t
  return (
    (2 * t3 - 3 * t2s + 1) * k1[column] +
    (t3 - 2 * t2s + t) * m1 +
    (-2 * t3 + 3 * t2s) * k2[column] +
    (t3 - t2s) * m2
  )
}

interface Personality {
  lean: number
  stride: number
  arm: number
  knee: number
  /** Jump-specific tweaks. */
  drive: number
  tuck: number
  airArm: number
}

const PERSONALITY: Record<CharacterId, Personality> = {
  // Balanced, neutral form.
  lou: { lean: 7, stride: 1, arm: 1, knee: 1, drive: 0, tuck: 1, airArm: 0 },
  // Aggressive forward lean and big arm drive.
  dash: {
    lean: 11,
    stride: 1.06,
    arm: 1.12,
    knee: 1.05,
    drive: 8,
    tuck: 0.92,
    airArm: 10,
  },
  // Light, controlled and compact.
  nova: {
    lean: 5,
    stride: 0.96,
    arm: 0.88,
    knee: 1.08,
    drive: -2,
    tuck: 1.16,
    airArm: -6,
  },
}

/** Lengths and rest angles derived from the measured joints. */
function legGeometry(meta: RigMeta) {
  return {
    lt: dist(meta.hip, meta.knee),
    ls: dist(meta.knee, meta.ankle),
  }
}

/** Horizontal ankle offset from the hip for a thigh angle and knee flex. */
function ankleX(meta: RigMeta, thigh: number, knee: number) {
  const g = legGeometry(meta)
  return g.lt * Math.sin(thigh * DEG) + g.ls * Math.sin((thigh - knee) * DEG)
}

/** Solves the thigh angle that places the ankle `x` ahead of the hip. */
function thighForAnkleX(meta: RigMeta, x: number, knee: number) {
  let lo = -75
  let hi = 75
  for (let i = 0; i < 22; i += 1) {
    const mid = (lo + hi) / 2
    if (ankleX(meta, mid, knee) < x) lo = mid
    else hi = mid
  }
  return (lo + hi) / 2
}

function legAt(meta: RigMeta, q: number, amp: number, p: Personality): LegPose {
  const w = wrap(q)
  const stride = amp * p.stride
  if (w <= STANCE_DUTY) {
    // Planted: the ankle moves back at a constant rate so the sole stays
    // locked to the scrolling ground (no foot slide).
    const knee = sampleRun(w, 2)
    const x0 = ankleX(meta, RUN_KEYS[0][1] * stride, RUN_KEYS[0][2])
    const x1 = ankleX(meta, -RUN_KEYS[0][1] * stride, RUN_KEYS[4][2])
    const x = x0 + (x1 - x0) * (w / STANCE_DUTY)
    return { thigh: thighForAnkleX(meta, x, knee), knee, foot: 0 }
  }
  return {
    thigh: sampleRun(w, 1) * stride,
    knee: sampleRun(w, 2) * Math.min(1.25, amp) * p.knee,
    foot: sampleRun(w, 3),
  }
}

function armFor(thigh: number, p: Personality) {
  // Opposite arm/leg timing: the arm swings forward as its side's leg goes back.
  return clamp(30 - thigh * 1.3 * p.arm, -16, 74)
}

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v))
}

/** Stride amplitude grows gently with world speed (1 = base speed). */
export function strideForSpeed(speedRatio: number): number {
  return clamp(0.95 + (speedRatio - 1) * 0.2, 0.95, 1.45)
}

export function runPose(id: CharacterId, phase: number, amp = 1): RigPose {
  const p = PERSONALITY[id]
  const meta = RIG_META[id]
  const near = legAt(meta, phase, amp, p)
  const far = legAt(meta, phase + 0.5, amp, p)
  return {
    lean: p.lean + (amp - 1) * 10,
    armNear: armFor(near.thigh, p),
    armFar: armFor(far.thigh, p),
    near,
    far,
  }
}

const strideCache = new Map<string, number>()

/** Sheet-pixel distance the planted heel travels during one stance. */
function stanceTravel(id: CharacterId, amp: number): number {
  const key = `${id}:${amp.toFixed(3)}`
  const cached = strideCache.get(key)
  if (cached !== undefined) return cached
  const meta = RIG_META[id]
  const stride = amp * PERSONALITY[id].stride
  const travel =
    ankleX(meta, RUN_KEYS[0][1] * stride, RUN_KEYS[0][2]) -
    ankleX(meta, -RUN_KEYS[0][1] * stride, RUN_KEYS[4][2])
  strideCache.set(key, travel)
  return travel
}

/** Screen pixels per sheet pixel when drawn in a box `boxHeight` tall. */
export function rigScale(id: CharacterId, boxHeight: number): number {
  return (boxHeight * RIG_HEIGHT_RATIO) / RIG_META[id].cropHeight
}

export const MAX_RUN_CYCLES_PER_FRAME = 0.1

/**
 * Cycles advanced per 60 Hz frame so the planted foot moves with the ground.
 * `worldSpeed` and `displayHeight` must use the same pixel units.
 */
export function runCycleRate(
  id: CharacterId,
  worldSpeed: number,
  displayHeight: number,
  amp: number,
): number {
  const travel = stanceTravel(id, amp) * rigScale(id, displayHeight)
  const rate = (worldSpeed * STANCE_DUTY) / travel
  return clamp(rate, 0.018, MAX_RUN_CYCLES_PER_FRAME)
}

// ── Jump states ──────────────────────────────────────────────────────────────

export type JumpState = "takeoff" | "ascent" | "apex" | "descent" | "landing"

function airKey(id: CharacterId, state: JumpState): RigPose {
  const p = PERSONALITY[id]
  const tk = p.tuck
  switch (state) {
    case "takeoff":
      // Lead knee drives up while the push leg extends from the ground.
      return {
        lean: 12 + p.drive,
        armNear: -10,
        armFar: 64 + p.airArm,
        near: { thigh: 40 + p.drive, knee: 82, foot: 16 },
        far: { thigh: -26 - p.drive * 0.5, knee: 12, foot: 40 },
      }
    case "ascent":
      return {
        lean: 9 + p.drive * 0.8,
        armNear: 4,
        armFar: 56 + p.airArm,
        near: { thigh: 64 + p.drive * 0.5, knee: 104 * tk, foot: 18 },
        far: { thigh: -16, knee: 58 * tk, foot: 30 },
      }
    case "apex":
      // Compact: knees tucked, hands held near the waist.
      return {
        lean: 4 + p.drive * 0.5,
        armNear: 32,
        armFar: 42 + p.airArm * 0.5,
        near: { thigh: 72 * Math.min(1.08, tk), knee: 116 * tk, foot: 10 },
        far: { thigh: 14, knee: 100 * tk, foot: 22 },
      }
    case "descent":
      // Legs extend toward the landing; arms open slightly for balance.
      return {
        lean: 2 + p.drive * 0.3,
        armNear: 22,
        armFar: 48,
        near: { thigh: 34, knee: 38, foot: -2 },
        far: { thigh: 2, knee: 56, foot: 12 },
      }
    case "landing":
      // Absorb: both knees bent, torso dips forward.
      return {
        lean: 12 + p.drive * 0.4,
        armNear: 8,
        armFar: 44,
        near: { thigh: 22, knee: 56, foot: 0 },
        far: { thigh: -14, knee: 50, foot: 18 },
      }
  }
}

function mixLeg(a: LegPose, b: LegPose, t: number): LegPose {
  return {
    thigh: a.thigh + (b.thigh - a.thigh) * t,
    knee: a.knee + (b.knee - a.knee) * t,
    foot: a.foot + (b.foot - a.foot) * t,
  }
}

export function mixPose(a: RigPose, b: RigPose, t: number): RigPose {
  const k = clamp(t, 0, 1)
  return {
    lean: a.lean + (b.lean - a.lean) * k,
    armNear: a.armNear + (b.armNear - a.armNear) * k,
    armFar: a.armFar + (b.armFar - a.armFar) * k,
    near: mixLeg(a.near, b.near, k),
    far: mixLeg(a.far, b.far, k),
  }
}

function smooth(t: number) {
  const k = clamp(t, 0, 1)
  return k * k * (3 - 2 * k)
}

/**
 * Airborne pose from normalized vertical velocity: -1 at launch, 0 at apex,
 * +1 when falling as fast as the launch. Blends continuously between the
 * takeoff → ascent → apex → descent keys.
 */
export function airPose(id: CharacterId, u: number): RigPose {
  const v = clamp(u, -1, 1.1)
  if (v < -0.55) {
    return mixPose(
      airKey(id, "takeoff"),
      airKey(id, "ascent"),
      smooth((v + 1) / 0.45),
    )
  }
  if (v < 0) {
    return mixPose(
      airKey(id, "ascent"),
      airKey(id, "apex"),
      smooth((v + 0.55) / 0.55),
    )
  }
  return mixPose(airKey(id, "apex"), airKey(id, "descent"), smooth(v / 0.6))
}

export function jumpStateFor(u: number): JumpState {
  if (u < -0.62) return "takeoff"
  if (u < -0.18) return "ascent"
  if (u <= 0.18) return "apex"
  return "descent"
}

export function landingPose(id: CharacterId): RigPose {
  return airKey(id, "landing")
}

/** Neutral stance for menus. */
export function idlePose(id: CharacterId, breath = 0): RigPose {
  const p = PERSONALITY[id]
  return {
    lean: p.lean * 0.4 + Math.sin(breath) * 0.6,
    armNear: 26,
    armFar: 34,
    near: { thigh: 10, knee: 14, foot: 0 },
    far: { thigh: -6, knee: 10, foot: 0 },
  }
}

export const LANDING_BLEND_FRAMES = 9
export const TAKEOFF_BLEND_FRAMES = 4

export interface RigState {
  onGround: boolean
  /** Continuous run cycle phase (cycles). */
  phase: number
  /** Stride amplitude from `strideForSpeed`. */
  stride: number
  /** Vertical velocity normalized by launch speed (airborne only). */
  airU: number
  framesSinceJump: number
  framesSinceLanding: number
}

export interface ResolvedPose {
  pose: RigPose
  grounded: boolean
  airWeight: number
}

/** Resolves the full pose and grounding mode for a game-state snapshot. */
export function poseForState(id: CharacterId, s: RigState): ResolvedPose {
  const run = runPose(id, s.phase, s.stride)
  if (s.onGround) {
    if (s.framesSinceLanding < LANDING_BLEND_FRAMES) {
      const t = s.framesSinceLanding / LANDING_BLEND_FRAMES
      return {
        pose: mixPose(landingPose(id), run, smooth(t)),
        grounded: true,
        airWeight: 0,
      }
    }
    return { pose: run, grounded: true, airWeight: 0 }
  }
  const air = airPose(id, s.airU)
  const t = smooth(s.framesSinceJump / TAKEOFF_BLEND_FRAMES)
  return { pose: mixPose(run, air, t), grounded: false, airWeight: t }
}

// ── Final-hit shutdown ───────────────────────────────────────────────────────

/** Defeat timeline, in seconds after the final heart is lost. */
export const SHUTDOWN = {
  /** Recoil from the impact. */
  impact: 0.15,
  /** Off-balance malfunction ends; the collapse begins. */
  malfunction: 0.45,
  /** Kneel reached; armour powers down. */
  collapse: 1.05,
  /** Fully powered down; the Game Over card appears. */
  powerDown: 1.5,
  /**
   * Hand-off to the results screen: the GAME OVER title holds on its own for
   * 2 seconds after power-down (Stage A) before the results reveal (Stage B).
   */
  results: 3.5,
} as const

/** Armour thickness under the knee joint when kneeling, in sheet px. */
export const KNEEL_PAD = 28

function shutdownKey(
  id: CharacterId,
  key: "recoil" | "offBalance" | "kneel" | "down",
): RigPose {
  const p = PERSONALITY[id]
  switch (key) {
    case "recoil":
      // Knocked back: torso tips behind the hips, arms thrown forward.
      return {
        lean: -14,
        armNear: 42,
        armFar: 64,
        near: { thigh: 16, knee: 22, foot: -6 },
        far: { thigh: -14, knee: 18, foot: 8 },
      }
    case "offBalance":
      // Systems failing: knees soften, one arm reaches out for balance.
      return {
        lean: 6 + p.lean * 0.2,
        armNear: -18,
        armFar: 70,
        near: { thigh: 20, knee: 40, foot: 0 },
        far: { thigh: -8, knee: 36, foot: 6 },
      }
    case "kneel":
      // Controlled drop to one knee, the near hand braced on the front knee.
      return {
        lean: 22,
        armNear: 58,
        armFar: 44,
        near: { thigh: 78, knee: 96, foot: 0 },
        far: { thigh: 6, knee: 100, foot: 40 },
      }
    case "down":
      // Powered down: weight settles forward and the arms go slack.
      return {
        lean: 32,
        armNear: 40,
        armFar: 26,
        near: { thigh: 80, knee: 104, foot: 2 },
        far: { thigh: 4, knee: 102, foot: 44 },
      }
  }
}

function easeOut(t: number) {
  const k = clamp(t, 0, 1)
  return 1 - (1 - k) * (1 - k)
}

/**
 * Articulated defeat pose `t` seconds after the final hit, blended from the
 * pose the runner was in when hit. Every segment keeps the approved artwork;
 * the solver keeps the soles (and the kneeling knee) on the runway.
 */
export function shutdownPose(
  id: CharacterId,
  t: number,
  from: RigPose,
  jitter = 0,
): RigPose {
  const S = SHUTDOWN
  let pose: RigPose
  if (t < S.impact) {
    pose = mixPose(from, shutdownKey(id, "recoil"), easeOut(t / S.impact))
  } else if (t < S.malfunction) {
    const u = (t - S.impact) / (S.malfunction - S.impact)
    pose = mixPose(
      shutdownKey(id, "recoil"),
      shutdownKey(id, "offBalance"),
      smooth(u),
    )
    // Servo stutter while the systems fail.
    pose = { ...pose, lean: pose.lean + Math.sin(t * 70) * 1.8 * jitter }
  } else if (t < S.collapse) {
    const u = (t - S.malfunction) / (S.collapse - S.malfunction)
    pose = mixPose(
      shutdownKey(id, "offBalance"),
      shutdownKey(id, "kneel"),
      smooth(u),
    )
  } else {
    const u = (t - S.collapse) / (S.powerDown - S.collapse)
    pose = mixPose(shutdownKey(id, "kneel"), shutdownKey(id, "down"), smooth(u))
  }
  return pose
}
