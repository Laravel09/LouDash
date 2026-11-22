import { memo, type ReactNode } from "react"
import type { CharacterDef } from "./types"
import { RIG_IMAGES } from "./gameArt"
import {
  KNEEL_PAD,
  LAYER_PART,
  RIG_LAYERS,
  RIG_META,
  SHUTDOWN,
  idlePose,
  poseForState,
  rigScale,
  runPose,
  shutdownPose,
  solveRig,
  type Matrix,
  type RigState,
} from "./characterRig"

export type CharacterPose = "idle" | "run"

interface Props {
  character: CharacterDef
  width: number
  height: number
  /** Run-cycle phase in cycles (menus / previews). */
  phase?: number
  pose?: CharacterPose
  /** Live game state; overrides `pose` and `phase` when supplied. */
  state?: RigState
  burst?: boolean
  hit?: boolean
  /** Seconds since the final hit; drives the power-down sequence. */
  shutdown?: number
  /** Reduced Effects: no flicker, sparks or servo stutter. */
  reduced?: boolean
  /**
   * Inner contour colour. Defaults to the character accent; gameplay passes a
   * neutral tone when the accent matches the environment's dominant light.
   */
  rimColor?: string
  /** Draw the built-in contact shadow (gameplay draws its own on the ground). */
  groundShadow?: boolean
}

// Sheet-pixel window around the hip that every pose fits inside.
const VIEW_BACK = 280
const VIEW_FRONT = 280
const VIEW_UP = 680
const VIEW_DOWN = 18

/** Visor centre on each torso cut-out, in sheet px. */
const VISOR: Record<string, readonly [number, number]> = {
  lou: [272, 526],
  dash: [282, 584],
  nova: [292, 552],
}

function hash(n: number) {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

function at(m: Matrix, p: readonly [number, number]): [number, number] {
  return [m[0] * p[0] + m[2] * p[1] + m[4], m[1] * p[0] + m[3] * p[1] + m[5]]
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * Math.min(1, Math.max(0, t))
}

/** Armour lighting for the power-down sequence: 1 = normal, 0 = dark. */
function shutdownLighting(t: number, reduced: boolean) {
  const S = SHUTDOWN
  const flicker =
    !reduced && t >= S.impact && t < S.collapse
      ? hash(Math.floor(t * 24)) > 0.62
        ? 0.25
        : 1
      : 1
  let glow: number
  if (t < S.impact) glow = 1.6 - t / S.impact * 0.6
  else if (t < S.collapse) glow = lerp(1, 0.7, (t - S.impact) / (S.collapse - S.impact))
  else glow = lerp(0.7, 0, (t - S.collapse) / (S.powerDown - S.collapse))
  const power = t < S.collapse ? 1 : lerp(1, 0, (t - S.collapse) / (S.powerDown - S.collapse))
  return {
    glow: glow * flicker,
    brightness: t < S.impact ? lerp(1.9, 1.12, t / S.impact) : lerp(0.62, 1.12, power),
    saturate: lerp(0.45, 1, power),
    visor: t < S.powerDown ? glow * flicker : 0,
  }
}

function alpha(a: number) {
  return Math.round(Math.min(1, Math.max(0, a)) * 255)
    .toString(16)
    .padStart(2, "0")
}

function CharacterArt({
  character,
  width,
  height,
  phase = 0,
  pose = "idle",
  state,
  burst = false,
  hit = false,
  shutdown,
  reduced = false,
  rimColor,
  groundShadow = true,
}: Props) {
  const id = character.id
  const meta = RIG_META[id]
  const images = RIG_IMAGES[id]
  const accent = character.accentColor

  let frame
  let airborne = false
  if (state) {
    const resolved = poseForState(id, state)
    airborne = !resolved.grounded
    const pose =
      shutdown === undefined
        ? resolved.pose
        : shutdownPose(id, shutdown, resolved.pose, reduced ? 0 : 1)
    frame = solveRig(meta, pose, {
      ground: resolved.grounded,
      airWeight: resolved.airWeight,
      kneeContact: shutdown === undefined ? undefined : KNEEL_PAD,
    })
  } else if (pose === "run") {
    frame = solveRig(meta, runPose(id, phase, 1), { ground: true })
  } else {
    frame = solveRig(meta, idlePose(id, phase), { ground: true })
  }

  const k = rigScale(id, height)
  const groundY = Math.max(meta.heel[1], meta.toe[1])
  const vx = meta.hip[0] - VIEW_BACK
  const vy = groundY - VIEW_UP
  const vw = VIEW_BACK + VIEW_FRONT
  const vh = VIEW_UP + VIEW_DOWN

  // A crisp accent rim keeps the dark armour readable on all three maps
  // without recolouring the approved designs.
  // A fine near-black contour outside the accent rim separates the armour from
  // similar-hued scenery (e.g. Dash's orange on the Outer Road sunset).
  // A soft outer falloff lifts the silhouette off bright scenery without a glow.
  const rimTone = rimColor ?? accent
  // A faint top key light is applied first so the contour above reads as a
  // lit edge rather than a flat outline.
  const rim = `drop-shadow(0 -0.7px 0 rgba(235,245,255,.32)) drop-shadow(0 0 0.6px ${rimTone}) drop-shadow(0 0 0.6px ${rimTone}) drop-shadow(0 0 0.9px rgba(4,7,16,.96)) drop-shadow(0 0 0.9px rgba(4,7,16,.9)) drop-shadow(0 0 2.4px rgba(3,5,12,.45))`
  const light =
    shutdown === undefined ? null : shutdownLighting(shutdown, reduced)
  const filter = light
    ? // Character-coloured armour light fades out as the mech powers down.
      `brightness(${light.brightness.toFixed(3)}) saturate(${light.saturate.toFixed(3)}) drop-shadow(0 0 0.7px ${accent}${alpha(light.glow)}) drop-shadow(0 0 ${(2 + light.glow * 6).toFixed(1)}px ${accent}${alpha(light.glow * 0.55)}) drop-shadow(0 3px 3px rgba(0,0,0,.6))`
    : hit
      ? "brightness(2) saturate(0.3)"
      : burst
        ? `brightness(1.12) ${rim} drop-shadow(0 0 6px ${accent})`
        : `brightness(1.12) ${rim} drop-shadow(0 3px 3px rgba(0,0,0,.6))`

  // Visor glow and joint sparks live in an unfiltered overlay so they stay
  // bright while the armour beneath them goes dark.
  let overlay: ReactNode = null
  if (light && shutdown !== undefined) {
    const torso = frame.matrices.torso
    const visor = at(torso, VISOR[id])
    const sparks: ReactNode[] = []
    const S = SHUTDOWN
    if (!reduced && shutdown >= S.impact && shutdown < S.collapse + 0.15) {
      const tick = Math.floor(shutdown * 18)
      const joints = [
        at(torso, meta.shoulder),
        at(torso, [meta.hip[0] + 10, meta.hip[1] - 30]),
        at(frame.matrices.thighNear, meta.knee),
      ]
      joints.forEach((joint, j) => {
        if (hash(tick * 3 + j) < 0.55) return
        for (let k = 0; k < 3; k++) {
          const a = hash(tick * 7 + j * 13 + k) * Math.PI * 2
          const len = 14 + hash(tick * 11 + j + k * 5) * 30
          const x2 = joint[0] + Math.cos(a) * len
          const y2 = joint[1] + Math.sin(a) * len
          sparks.push(
            <g key={`${j}-${k}`}>
              <line x1={joint[0]} y1={joint[1]} x2={x2} y2={y2} stroke={accent} strokeOpacity={0.55} strokeWidth={8} strokeLinecap="round" />
              <line x1={joint[0]} y1={joint[1]} x2={x2} y2={y2} stroke="#fff6d2" strokeWidth={3.5} strokeLinecap="round" />
            </g>,
          )
        }
      })
    }
    overlay = (
      <>
        {light.visor > 0.02 && (
          <ellipse
            cx={visor[0]}
            cy={visor[1]}
            rx={30}
            ry={16}
            fill={`url(#visor-${id})`}
            opacity={Math.min(1, light.visor * 0.85)}
            style={{ mixBlendMode: "screen" }}
          />
        )}
        {sparks}
      </>
    )
  }

  return (
    <div
      aria-hidden="true"
      style={{ position: "relative", width, height, overflow: "visible" }}
    >
      {groundShadow && <div
        style={{
          position: "absolute",
          left: "50%",
          bottom: -height * 0.03,
          width: width * (airborne ? 0.6 : 1.1),
          height: Math.max(3, height * 0.07),
          transform: "translateX(-50%)",
          borderRadius: "50%",
          background:
            "radial-gradient(ellipse at 50% 50%, rgba(0,0,0,.85) 0%, rgba(0,0,0,.6) 55%, rgba(0,0,0,0) 100%)",
          opacity: airborne ? 0.3 : 1,
        }}
      />}
      {burst && (
        <div
          style={{
            position: "absolute",
            inset: `${-height * 0.12}px ${-width * 0.3}px`,
            borderRadius: "50%",
            border: `1.5px solid ${accent}`,
            opacity: 0.45,
          }}
        />
      )}
      <svg
        viewBox={`${vx} ${vy} ${vw} ${vh}`}
        width={vw * k}
        height={vh * k}
        style={{
          position: "absolute",
          left: width / 2 - VIEW_BACK * k,
          bottom: -VIEW_DOWN * k - height * 0.015,
          overflow: "visible",
          filter,
          pointerEvents: "none",
        }}
      >
        {RIG_LAYERS.map((layer) => {
          const [x, y, w, h] = meta.parts[LAYER_PART[layer]]
          const m = frame.matrices[layer]
          return (
            <image
              key={layer}
              href={images[layer]}
              x={x}
              y={y}
              width={w}
              height={h}
              preserveAspectRatio="none"
              transform={`matrix(${m[0].toFixed(4)} ${m[1].toFixed(4)} ${m[2].toFixed(4)} ${m[3].toFixed(4)} ${m[4].toFixed(2)} ${m[5].toFixed(2)})`}
            />
          )
        })}
      </svg>
      {overlay && (
        <svg
          viewBox={`${vx} ${vy} ${vw} ${vh}`}
          width={vw * k}
          height={vh * k}
          style={{
            position: "absolute",
            left: width / 2 - VIEW_BACK * k,
            bottom: -VIEW_DOWN * k - height * 0.015,
            overflow: "visible",
            pointerEvents: "none",
          }}
        >
          <defs>
            <radialGradient id={`visor-${id}`}>
              <stop offset="0" stopColor="#ffffff" />
              <stop offset="0.35" stopColor={accent} />
              <stop offset="1" stopColor={accent} stopOpacity={0} />
            </radialGradient>
          </defs>
          {overlay}
        </svg>
      )}
    </div>
  )
}

export default memo(CharacterArt)
