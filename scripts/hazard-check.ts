/**
 * Deterministic hazard-fairness check.
 *   node --experimental-strip-types scripts/hazard-check.ts
 *
 * 1. Solver sanity: known-possible and known-impossible patterns.
 * 2. Generator sweep: seeded groups for every tier, runner and speed, each
 *    re-validated independently.
 * 3. Headless runs: a frame-exact replica of the game loop (speed ramp, tier
 *    changes, spawn scheduling, collisions) played by a precise bot. Any hit
 *    means the schedule produced an unavoidable situation.
 * Exits non-zero on any failure.
 */
import {
  CHAR_GROUND_Y,
  GROUND_Y,
  HAZARDS,
  TIERS,
  createRng,
  estimateArrival,
  generateGroup,
  hazardBoxes,
  instantiate,
  jumpArc,
  nextSpawnAfterGroup,
  stepSpeed,
  BASE_SPEED,
  DISTANCE_PER_SCORE,
  type SpeedState,
  overlaps,
  playerBox,
  solveHazards,
  stepHazard,
  tierForDistance,
  validatePlan,
  type HazardBody,
  type HazardKind,
  type PlannedHazard,
} from "../src/hazards.ts"
import { MIN_REACTION_FRAMES } from "../src/gameplayBalance.ts"

const RUNNERS = {
  lou: { rise: 165, gravity: 0.5, speedMod: 1.0 },
  dash: { rise: 145, gravity: 0.55, speedMod: 1.15 },
  nova: { rise: 188, gravity: 0.42, speedMod: 0.95 },
}
let failures = 0
const fail = (msg: string) => {
  failures += 1
  console.log("FAIL", msg)
}
const jumpOf = (r: { rise: number; gravity: number }) => ({
  gravity: r.gravity,
  velocity: -Math.sqrt(2 * r.gravity * r.rise),
})

// ── 1. Solver sanity ──────────────────────────────────────────────────────────
{
  const jump = jumpOf(RUNNERS.lou)
  const opts = { jump, recovery: 12, window: 4, margin: 2, readyAt: 0 }
  const at = (
    type: HazardKind,
    dx: number,
    cycleOffset = 0,
  ): PlannedHazard => ({
    type,
    dx,
    y: HAZARDS[type].baseY,
    cycleOffset,
  })
  const expect = (
    label: string,
    plan: PlannedHazard[],
    speed: number,
    ok: boolean,
    jumps?: number,
  ) => {
    const v = validatePlan(plan, speed, opts)
    if (v.ok !== ok || (ok && jumps !== undefined && v.jumps !== jumps)) {
      fail(`sanity ${label}: ok=${v.ok} jumps=${v.jumps}`)
    } else console.log(`sanity ok: ${label} (jumps ${v.jumps})`)
  }
  expect("single roadblock needs 1 jump", [at("roadblock", 0)], 3.2, true, 1)
  expect("hover mine needs 0 jumps", [at("hoverMine", 0)], 3.2, true, 0)
  // 110px apart: too long for one jump, and the landing + recovery overlaps the
  // second block, so no schedule exists (worked by hand: see README note).
  expect(
    "roadblocks too close for a double jump",
    [at("roadblock", 0), at("roadblock", 110)],
    3.2,
    false,
  )
  // 150px apart is tight but genuinely clearable with two jumps.
  expect(
    "roadblocks 150px apart",
    [at("roadblock", 0), at("roadblock", 150)],
    3.2,
    true,
    2,
  )
  expect(
    "barriers far apart",
    [at("roadblock", 0), at("roadblock", 700)],
    3.2,
    true,
    2,
  )
}

if (process.env.SKIP_SWEEP) {
} else {
  // ── 2. Generator sweep ────────────────────────────────────────────────────────
  let groups = 0
  let worstMs = 0
  let totalMs = 0
  const kinds = new Map<HazardKind, number>()
  for (const [name, r] of Object.entries(RUNNERS)) {
    const jump = jumpOf(r)
    for (let tier = 0; tier < TIERS.length; tier += 1) {
      const mults = [TIERS[tier].mult, tier === 6 ? 3.6 : TIERS[tier + 1].mult]
      for (const mult of mults) {
        const speed = BASE_SPEED * mult * r.speedMod
        const rng = createRng(1000 * tier + Math.round(mult * 10) + name.length)
        for (let i = 0; i < 100; i += 1) {
          const t0 = performance.now()
          const g = generateGroup(rng, {
            tier,
            speed,
            jump,
            readyAt: 0,
            speedVariants: [speed * 1.08],
          })
          const ms = performance.now() - t0
          worstMs = Math.max(worstMs, ms)
          totalMs += ms
          groups += 1
          for (const p of g.plan)
            kinds.set(p.type, (kinds.get(p.type) ?? 0) + 1)
          for (const s of [speed, speed * 1.08]) {
            const v = validatePlan(g.plan, s, {
              jump,
              recovery: TIERS[tier].recovery,
              window: TIERS[tier].window,
              margin: 1,
              readyAt: 0,
            })
            if (!v.ok)
              fail(
                `sweep ${name} tier ${tier} speed ${s.toFixed(2)} ${JSON.stringify(g.plan)}`,
              )
          }
        }
      }
    }
  }
  console.log("kinds", JSON.stringify(Object.fromEntries(kinds)))
  console.log(
    `sweep: ${groups} groups, avg ${(totalMs / groups).toFixed(2)}ms, worst ${worstMs.toFixed(1)}ms`,
  )
}
// ── 3. Headless runs with a precise bot ───────────────────────────────────────
/** Signal Burst world-speed multiplier (mirrors BURST_SPEED_MULT in GamePlay). */
const BURST_SPEED = 1.3
interface BurstWindow {
  start: number
  frames: number
}

function headlessRun(
  name: keyof typeof RUNNERS,
  seed: number,
  frames: number,
  burst?: BurstWindow,
) {
  const r = RUNNERS[name]
  // Independent stream so the hazard schedule stays identical to a no-burst run.
  const inputRng = createRng(seed ^ 0x9e3779b9)
  const jump = jumpOf(r)
  const arc = jumpArc(jump)
  const rng = createRng(seed)
  let frame = 0
  const sp: SpeedState = { mult: 1, target: 1, distance: 0 }
  let charY = CHAR_GROUND_Y
  let vy = 0
  let onGround = true
  let groundedFor = 99
  let busyUntil = 0
  let nextSpawnFrame = 80
  let firstSpawned = false
  let coinStreak = 0
  let hits = 0
  let stuck = 0
  let spawned = 0
  let maxTier = 0
  let worstSpawnMs = 0
  let hazards: HazardBody[] = []
  for (; frame < frames; ) {
    frame += 1
    stepSpeed(sp)
    const tier = tierForDistance(sp.distance)
    maxTier = Math.max(maxTier, tier)
    const target = sp.target
    const bursting =
      !!burst && frame >= burst.start && frame < burst.start + burst.frames
    // Reaction grace the game grants when a Burst expires (see GamePlay).
    const grace =
      !!burst &&
      frame >= burst.start + burst.frames &&
      frame < burst.start + burst.frames + MIN_REACTION_FRAMES
    const boost = bursting ? BURST_SPEED : 1
    const speed = BASE_SPEED * sp.mult * r.speedMod * boost
    const profileNow = () => ({
      ...sp,
      base: BASE_SPEED * r.speedMod,
      boost: BURST_SPEED,
      boostFrames: bursting ? burst!.start + burst!.frames - frame : 0,
    })
    sp.distance += speed / DISTANCE_PER_SCORE
    if (onGround) groundedFor += 1
    else {
      vy += jump.gravity
      charY += vy
      if (charY >= CHAR_GROUND_Y) {
        charY = CHAR_GROUND_Y
        vy = 0
        onGround = true
        groundedFor = 0
      }
    }
    for (const h of hazards) stepHazard(h, frame, speed)
    hazards = hazards.filter((h) => h.x + h.w > -60)
    if (frame >= nextSpawnFrame) {
      const rules = TIERS[tier]
      const readyAt = Math.max(0, busyUntil - frame)
      const profile = profileNow()
      const nextTarget =
        BASE_SPEED *
        (TIERS[Math.min(6, tier + 1)].mult + (tier === 6 ? 0.4 : 0)) *
        r.speedMod *
        boost
      const arrival = estimateArrival(Math.max(speed, nextTarget))
      if (arrival < readyAt + 2) {
        nextSpawnFrame = frame + (readyAt + 2 - arrival)
      } else if (
        !firstSpawned ||
        (tier >= 3 && coinStreak >= 1) ||
        rng() < rules.hazardChance
      ) {
        const t0 = performance.now()
        const g = generateGroup(rng, {
          tier,
          speed,
          jump,
          readyAt,
          profile,
        })
        worstSpawnMs = Math.max(worstSpawnMs, performance.now() - t0)
        if (!g.validation.ok)
          fail(`${name} seed ${seed} frame ${frame}: unvalidated group spawned`)
        if (
          process.env.TRACE &&
          Math.abs(frame - Number(process.env.TRACE)) < 400
        )
          console.log(
            "SPAWN",
            frame,
            "readyAt",
            readyAt,
            "estArr",
            arrival,
            "val",
            JSON.stringify(g.validation),
            JSON.stringify(
              g.plan.map((p) => p.type + "@" + p.dx + "/co" + p.cycleOffset),
            ),
          )
        hazards.push(...instantiate(g.plan, frame))
        const next = nextSpawnAfterGroup(
          frame,
          g.validation.settle,
          rules,
          rng,
          Math.max(speed, nextTarget),
        )
        busyUntil = next.busyUntil
        nextSpawnFrame = next.nextSpawnFrame
        firstSpawned = true
        coinStreak = 0
        spawned += g.plan.length
      } else {
        coinStreak += 1
        nextSpawnFrame = frame + Math.round(200 / speed) + 20
      }
    }
    const p = playerBox(charY)
    for (const h of hazards) {
      if (hazardBoxes(h, frame).some((b) => overlaps(p, b))) {
        if (bursting) {
          // Signal Burst crushes whatever it touches; no damage.
          hazards = hazards.filter((x) => x !== h)
          break
        }
        if (grace) continue
        if (process.env.DEBUG)
          console.log(
            "HIT",
            name,
            seed,
            frame,
            h.type,
            h.x.toFixed(1),
            "charY",
            charY.toFixed(1),
            "onGround",
            onGround,
            "speed",
            speed.toFixed(2),
            "tier",
            tier,
            "dist",
            sp.distance.toFixed(1),
            "sf",
            h.spawnFrame,
            JSON.stringify(
              hazards.map((x) => ({
                t: x.type,
                x: +x.x.toFixed(0),
                sf: x.spawnFrame,
              })),
            ),
          )
        hits += 1
        hazards = hazards.filter((x) => x !== h)
        break
      }
    }
    // Input between frames: precise bot that jumps as late as possible.
    if (
      process.env.TRACE &&
      !onGround &&
      Math.abs(frame - Number(process.env.TRACE)) < 70
    )
      console.log("A", frame, charY.toFixed(1))
    if (bursting) {
      // Invulnerable: the player jumps at random, so the burst can end with
      // the runner in any state, then the precise bot takes over.
      if (onGround && inputRng() < 0.02) {
        vy = jump.velocity
        onGround = false
      }
    } else if (onGround) {
      const near = hazards.filter((h) => h.x + h.w > 60)
      if (near.length > 0) {
        const profile = profileNow()
        const res = solveHazards(
          near,
          profile,
          { jump, recovery: 0, window: 1, margin: 1, readyAt: 0 },
          { frame, groundedFor },
        )
        if (
          process.env.TRACE &&
          Math.abs(frame - Number(process.env.TRACE)) < 70
        )
          console.log(
            "T",
            frame,
            "x",
            near.map((h) => h.type + "@" + h.x.toFixed(1)).join(","),
            "ok",
            res.ok,
            "stay",
            res.stayOk,
            "jump",
            res.jumpNow,
            "gf",
            groundedFor,
            "spd",
            speed.toFixed(3),
            "tgt",
            target,
          )
        if (!res.ok) {
          if (stuck === 0 && process.env.DEBUG)
            console.log(
              "STUCK",
              name,
              seed,
              "frame",
              frame,
              "tier",
              tier,
              "speed",
              speed.toFixed(2),
              "target",
              target,
              "busyUntil",
              busyUntil,
              "groundedFor",
              groundedFor,
              JSON.stringify(
                near.map((h) => ({
                  t: h.type,
                  x: +h.x.toFixed(1),
                  y: +h.y.toFixed(1),
                  sf: h.spawnFrame,
                  co: h.cycleOffset,
                })),
              ),
            )
          if (!grace) stuck += 1
        } else if (!res.stayOk && res.jumpNow) {
          vy = jump.velocity
          onGround = false
        }
      }
    }
  }
  return { hits, stuck, spawned, maxTier, distance: sp.distance, worstSpawnMs }
}

for (const name of (process.env.RUNNERS
  ? process.env.RUNNERS.split(",")
  : Object.keys(RUNNERS)) as Array<keyof typeof RUNNERS>) {
  for (const seed of process.env.SEEDS
    ? process.env.SEEDS.split(",").map(Number)
    : [7, 4242]) {
    const res = headlessRun(name, seed, 14000)
    console.log(
      `run ${name} seed ${seed}: distance ${res.distance.toFixed(0)} max tier ${res.maxTier} hazards ${res.spawned} hits ${res.hits} stuck ${res.stuck} worst spawn ${res.worstSpawnMs.toFixed(1)}ms`,
    )
    if (res.hits > 0 || res.stuck > 0) fail(`run ${name} seed ${seed}`)
  }
}

// ── 4. Signal Burst: pickup mid-wave, expiry with hazards already queued ──────
{
  let runs = 0
  for (const name of Object.keys(RUNNERS) as Array<keyof typeof RUNNERS>) {
    for (const seed of [11, 23]) {
      for (const [i, start] of [900, 2600, 4300, 6100, 7900, 9700, 11500].entries()) {
        for (const seconds of [i % 2 === 0 ? 10 : 11.5]) {
          const res = headlessRun(name, seed, 14000, {
            start,
            frames: Math.round(seconds * 60),
          })
          runs += 1
          if (res.hits > 0 || res.stuck > 0)
            fail(
              `burst ${name} seed ${seed} start ${start} ${seconds}s: hits ${res.hits} stuck ${res.stuck}`,
            )
        }
      }
    }
  }
  console.log(`burst scenarios: ${runs} runs`)
}

console.log(failures === 0 ? "ALL CHECKS PASSED" : `${failures} FAILURES`)
if (failures > 0) process.exit(1)
void GROUND_Y
