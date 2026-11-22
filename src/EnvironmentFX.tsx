import { memo } from "react"
import type { PlaceId } from "./types"
import { GW } from "./hazards"

/**
 * Procedural parallax and ambient lighting layered around the approved
 * environment art. Everything is positioned from the gameplay offsets and the
 * simulation clock, so it moves in lockstep with the world, freezes on pause
 * and stops when the run ends. Decorative only (aria-hidden, no input).
 */

export interface SceneryOffsets {
  /** Distant atmosphere (slowest). */
  far: number
  /** The painted scene tile. */
  scene: number
  /** The runway; equals obstacle travel. */
  ground: number
}

interface LayerProps {
  place: PlaceId
  offsets: SceneryOffsets
  /** Simulation seconds; drives pulses so they pause with the game. */
  time: number
  reduced: boolean
  sceneTileWidth: number
  runwayTop: number
}

const TAU = Math.PI * 2

function wave(time: number, period: number, phase = 0) {
  return 0.5 + 0.5 * Math.sin((time / period + phase) * TAU)
}

function mod(v: number, m: number) {
  return ((v % m) + m) % m
}

/** Visible copies of an item repeating every `spacing` px at `offset`. */
function repeat(offset: number, spacing: number, margin: number) {
  const shift = mod(offset, spacing)
  const first = Math.floor(offset / spacing)
  const out: { x: number; index: number }[] = []
  for (let i = -1; i * spacing - shift < GW + margin; i++) {
    const x = i * spacing - shift
    if (x > -margin - spacing) out.push({ x, index: first + i })
  }
  return out
}

// ── Scene-attached lights (tile coordinates of each painted scene) ──────────

interface Glow {
  x: number
  y: number
  rx: number
  ry: number
  color: string
  period: number
  phase: number
  min: number
  max: number
}

const SCENE_GLOWS: Record<PlaceId, Glow[]> = {
  city: [
    {
      x: 722,
      y: 105,
      rx: 110,
      ry: 96,
      color: "0,229,255",
      period: 5.2,
      phase: 0,
      min: 0.08,
      max: 0.26,
    },
    {
      x: 1699,
      y: 89,
      rx: 114,
      ry: 100,
      color: "0,229,255",
      period: 5.8,
      phase: 0.4,
      min: 0.08,
      max: 0.26,
    },
    {
      x: 353,
      y: 139,
      rx: 40,
      ry: 42,
      color: "236,120,255",
      period: 3.4,
      phase: 0.2,
      min: 0.1,
      max: 0.34,
    },
    {
      x: 1005,
      y: 166,
      rx: 66,
      ry: 30,
      color: "0,229,255",
      period: 4.1,
      phase: 0.7,
      min: 0.08,
      max: 0.3,
    },
    {
      x: 1149,
      y: 117,
      rx: 26,
      ry: 44,
      color: "236,120,255",
      period: 2.9,
      phase: 0.1,
      min: 0.1,
      max: 0.32,
    },
    {
      x: 1265,
      y: 117,
      rx: 26,
      ry: 44,
      color: "236,120,255",
      period: 2.9,
      phase: 0.55,
      min: 0.1,
      max: 0.32,
    },
    {
      x: 1415,
      y: 166,
      rx: 62,
      ry: 30,
      color: "170,120,255",
      period: 4.6,
      phase: 0.3,
      min: 0.08,
      max: 0.3,
    },
    {
      x: 2057,
      y: 142,
      rx: 40,
      ry: 50,
      color: "236,120,255",
      period: 3.7,
      phase: 0.85,
      min: 0.1,
      max: 0.32,
    },
  ],
  road: [
    {
      x: 749,
      y: 150,
      rx: 150,
      ry: 92,
      color: "255,150,60",
      period: 7.5,
      phase: 0,
      min: 0.12,
      max: 0.3,
    },
    {
      x: 340,
      y: 123,
      rx: 62,
      ry: 56,
      color: "255,140,50",
      period: 4.8,
      phase: 0.3,
      min: 0.04,
      max: 0.18,
    },
    {
      x: 1142,
      y: 123,
      rx: 62,
      ry: 56,
      color: "255,140,50",
      period: 4.8,
      phase: 0.8,
      min: 0.04,
      max: 0.18,
    },
    {
      x: 62,
      y: 110,
      rx: 46,
      ry: 70,
      color: "255,130,40",
      period: 3.6,
      phase: 0.1,
      min: 0.05,
      max: 0.2,
    },
    {
      x: 1430,
      y: 110,
      rx: 46,
      ry: 70,
      color: "255,130,40",
      period: 3.6,
      phase: 0.6,
      min: 0.05,
      max: 0.2,
    },
  ],
  neon: [
    {
      x: 718,
      y: 110,
      rx: 42,
      ry: 132,
      color: "196,120,255",
      period: 2.6,
      phase: 0,
      min: 0.14,
      max: 0.38,
    },
    {
      x: 718,
      y: 130,
      rx: 118,
      ry: 108,
      color: "160,90,255",
      period: 4.4,
      phase: 0.25,
      min: 0.06,
      max: 0.22,
    },
    {
      x: 330,
      y: 90,
      rx: 30,
      ry: 50,
      color: "200,120,255",
      period: 3.2,
      phase: 0.5,
      min: 0.06,
      max: 0.26,
    },
    {
      x: 1120,
      y: 90,
      rx: 30,
      ry: 50,
      color: "200,120,255",
      period: 3.2,
      phase: 0.9,
      min: 0.06,
      max: 0.26,
    },
    {
      x: 240,
      y: 230,
      rx: 60,
      ry: 34,
      color: "170,90,255",
      period: 5.1,
      phase: 0.2,
      min: 0.04,
      max: 0.16,
    },
    {
      x: 1210,
      y: 230,
      rx: 60,
      ry: 34,
      color: "170,90,255",
      period: 5.1,
      phase: 0.7,
      min: 0.04,
      max: 0.16,
    },
  ],
}

/** Small blinking beacons pinned to scene landmarks. */
const SCENE_BEACONS: Record<PlaceId, {
  x: number
  y: number
  color: string
  period: number
  phase: number
}[]> = {
  city: [
    { x: 735, y: 12, color: "#ff5d7a", period: 2.2, phase: 0 },
    { x: 1716, y: 6, color: "#ff5d7a", period: 2.2, phase: 0.5 },
    { x: 960, y: 46, color: "#ff5d7a", period: 2.8, phase: 0.3 },
  ],
  road: [
    { x: 458, y: 36, color: "#ff5a3a", period: 1.8, phase: 0 },
    { x: 1044, y: 36, color: "#ff5a3a", period: 1.8, phase: 0.5 },
    { x: 540, y: 140, color: "#ffb347", period: 2.4, phase: 0.2 },
    { x: 955, y: 140, color: "#ffb347", period: 2.4, phase: 0.7 },
  ],
  neon: [
    { x: 522, y: 40, color: "#e2b8ff", period: 2.4, phase: 0 },
    { x: 930, y: 40, color: "#e2b8ff", period: 2.4, phase: 0.5 },
    { x: 1052, y: 82, color: "#e2b8ff", period: 3, phase: 0.25 },
    { x: 400, y: 82, color: "#e2b8ff", period: 3, phase: 0.75 },
  ],
}

function SceneLights({ place, offsets, time, sceneTileWidth }: LayerProps) {
  const shift = mod(offsets.scene, sceneTileWidth)
  const nodes: React.ReactNode[] = []
  for (let copy = 0; copy < 3; copy++) {
    const base = copy * sceneTileWidth - shift
    SCENE_GLOWS[place].forEach((g, i) => {
      const x = base + g.x
      if (x + g.rx < 0 || x - g.rx > GW) return
      const a = g.min + (g.max - g.min) * wave(time, g.period, g.phase)
      nodes.push(
        <div
          key={`g${copy}-${i}`}
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: g.rx * 2,
            height: g.ry * 2,
            transform: `translate3d(${(x - g.rx).toFixed(1)}px, ${g.y - g.ry}px, 0)`,
            background: `radial-gradient(ellipse at 50% 50%, rgba(${g.color},1) 0%, rgba(${g.color},.35) 38%, rgba(${g.color},0) 70%)`,
            opacity: a,
            mixBlendMode: "screen",
          }}
        />,
      )
    })
    SCENE_BEACONS[place].forEach((b, i) => {
      const x = base + b.x
      if (x < -10 || x > GW + 10) return
      const on = wave(time, b.period, b.phase)
      nodes.push(
        <span
          key={`b${copy}-${i}`}
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: 4,
            height: 4,
            borderRadius: "50%",
            transform: `translate3d(${(x - 2).toFixed(1)}px, ${b.y - 2}px, 0)`,
            background: b.color,
            boxShadow: `0 0 6px 2px ${b.color}`,
            opacity: 0.25 + on * on * 0.75,
          }}
        />,
      )
    })
    // Signal Zone: energy packets climb the central beam.
    if (place === "neon") {
      const x = base + 718
      if (x > -40 && x < GW + 40) {
        for (let k = 0; k < 3; k++) {
          const u = mod(time / 2.4 + k / 3, 1)
          nodes.push(
            <div
              key={`p${copy}-${k}`}
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                width: 14,
                height: 34,
                transform: `translate3d(${(x - 7).toFixed(1)}px, ${(214 - u * 220).toFixed(1)}px, 0)`,
                borderRadius: 8,
                background:
                  "radial-gradient(ellipse at 50% 50%, rgba(255,240,255,.95), rgba(200,130,255,.5) 45%, transparent 72%)",
                opacity: Math.sin(u * Math.PI) * 0.85,
                mixBlendMode: "screen",
              }}
            />,
          )
        }
      }
    }
  }
  return <>{nodes}</>
}

// ── Distant atmosphere ───────────────────────────────────────────────────────

interface Cloud {
  x: number
  y: number
  w: number
  h: number
  color: string
  alpha: number
}

const ATMOSPHERE: Record<PlaceId, { span: number; clouds: Cloud[] }> = {
  city: {
    span: 980,
    clouds: [
      { x: 60, y: 30, w: 300, h: 46, color: "140,110,255", alpha: 0.16 },
      { x: 430, y: 66, w: 360, h: 52, color: "0,200,255", alpha: 0.1 },
      { x: 760, y: 20, w: 240, h: 40, color: "170,120,255", alpha: 0.13 },
    ],
  },
  road: {
    span: 1040,
    clouds: [
      { x: 40, y: 176, w: 380, h: 44, color: "255,140,70", alpha: 0.18 },
      { x: 520, y: 196, w: 420, h: 40, color: "255,110,60", alpha: 0.15 },
      { x: 300, y: 40, w: 320, h: 34, color: "255,120,90", alpha: 0.12 },
      { x: 820, y: 70, w: 260, h: 30, color: "255,170,90", alpha: 0.1 },
    ],
  },
  neon: {
    span: 960,
    clouds: [
      { x: 40, y: 214, w: 360, h: 52, color: "160,80,255", alpha: 0.2 },
      { x: 500, y: 232, w: 400, h: 44, color: "190,110,255", alpha: 0.16 },
      { x: 260, y: 60, w: 300, h: 40, color: "110,80,255", alpha: 0.1 },
    ],
  },
}

const MOTES = Array.from({ length: 16 }, (_, i) => {
  const h = (n: number) => {
    const x = Math.sin((i + 1) * 91.7 + n * 47.3) * 43758.5453
    return x - Math.floor(x)
  }
  return {
    x: h(1) * (GW + 60),
    y: 70 + h(2) * 180,
    size: 1.2 + h(3) * 1.6,
    rate: 0.8 + h(4) * 0.9,
    phase: h(5),
  }
})

const MOTE_COLOR: Record<PlaceId, string> = {
  city: "#8ff0ff",
  road: "#ffc27a",
  neon: "#d7a8ff",
}

function Atmosphere({ place, offsets, time }: LayerProps) {
  const atm = ATMOSPHERE[place]
  const nodes: React.ReactNode[] = []
  repeat(offsets.far, atm.span, 420).forEach(({ x: base, index }) => {
    atm.clouds.forEach((c, i) => {
      const x = base + c.x
      if (x + c.w < 0 || x > GW) return
      nodes.push(
        <div
          key={`c${index}-${i}`}
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: c.w,
            height: c.h,
            transform: `translate3d(${x.toFixed(1)}px, ${(c.y + Math.sin(time * 0.25 + i) * 3).toFixed(1)}px, 0)`,
            background: `radial-gradient(ellipse at 50% 50%, rgba(${c.color},${c.alpha}), rgba(${c.color},0) 70%)`,
          }}
        />,
      )
    })
  })
  const color = MOTE_COLOR[place]
  const span = GW + 60
  MOTES.forEach((m, i) => {
    // Motes ride slightly faster than the scene so they read as mid-air dust.
    const x = mod(m.x - offsets.scene * m.rate * 1.4, span) - 30
    const rise =
      place === "neon" ? mod(time * 9 * m.rate + m.phase * 180, 180) : 0
    const y =
      place === "neon"
        ? m.y + 60 - rise
        : m.y + Math.sin(time * 0.8 + m.phase * TAU) * 5
    nodes.push(
      <span
        key={`m${i}`}
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: m.size,
          height: m.size,
          borderRadius: "50%",
          transform: `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`,
          background: color,
          boxShadow: `0 0 4px ${color}`,
          opacity: 0.2 + wave(time, 2.6 + m.rate, m.phase) * 0.45,
        }}
      />,
    )
  })
  // Neon City: traffic glides along the elevated highways.
  if (place === "city") {
    for (let k = 0; k < 4; k++) {
      const dir = k % 2 === 0 ? 1 : -1
      const travel =
        mod(time * (70 + k * 14) * dir + k * 260 - offsets.scene, GW + 160) - 80
      nodes.push(
        <span
          key={`t${k}`}
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: 26,
            height: 1.5,
            borderRadius: 2,
            transform: `translate3d(${travel.toFixed(1)}px, ${
              k < 2 ? 181 : 193
            }px, 0)`,
            background:
              dir > 0
                ? "linear-gradient(90deg, transparent, rgba(120,240,255,.9))"
                : "linear-gradient(90deg, rgba(255,110,170,.85), transparent)",
            opacity: 0.7,
          }}
        />,
      )
    }
  }
  return <>{nodes}</>
}

/** Slow light wash across the skyline: cyan/violet, warm, or violet. */
function SkyWash({ place, time }: { place: PlaceId; time: number }) {
  const u = mod(time / 11, 1)
  const color =
    place === "city"
      ? "rgba(110,220,255,.10), rgba(170,120,255,.08)"
      : place === "road"
        ? "rgba(255,170,90,.10), rgba(255,120,60,.07)"
        : "rgba(200,130,255,.12), rgba(140,90,255,.08)"
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        width: 220,
        height: 290,
        transform: `translate3d(${(-260 + u * (GW + 520)).toFixed(1)}px, 0, 0) skewX(-16deg)`,
        background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
        mixBlendMode: "screen",
        opacity: Math.sin(u * Math.PI),
      }}
    />
  )
}

/** Everything that sits on top of the painted scene, behind the runway. */
export const SceneryBack = memo(function SceneryBack(props: LayerProps) {
  if (props.reduced) return null
  return (
    <div
      aria-hidden="true"
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        width: GW,
        height: props.runwayTop,
        overflow: "hidden",
        pointerEvents: "none",
      }}
    >
      <Atmosphere {...props} />
      <SceneLights {...props} />
      <SkyWash place={props.place} time={props.time} />
    </div>
  )
})

// ── Roadside structures (between scene and runway) ───────────────────────────

const ROADSIDE_SPACING: Record<PlaceId, number> = {
  city: 470,
  road: 540,
  neon: 500,
}
const ROADSIDE_RATE = 0.62

function CityPost({ variant, pulse }: { variant: number; pulse: number }) {
  const sign = variant % 3 === 1
  return (
    <svg
      width={60}
      height={170}
      viewBox="0 0 60 170"
      style={{ overflow: "visible" }}
    >
      <defs>
        <linearGradient id="fx-city-cone" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#6ff3ff" stopOpacity="0.32" />
          <stop offset="1" stopColor="#6ff3ff" stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon
        points="38,22 50,22 66,168 22,168"
        fill="url(#fx-city-cone)"
        opacity={0.5 + pulse * 0.25}
      />
      <rect x={18} y={18} width={4} height={152} fill="#0a1130" />
      <rect
        x={21}
        y={18}
        width={0.8}
        height={152}
        fill="#3fd6ff"
        opacity={0.45}
      />
      <path
        d="M20 20 Q 26 12 44 16"
        stroke="#0a1130"
        strokeWidth={3}
        fill="none"
      />
      <rect
        x={36}
        y={15}
        width={12}
        height={4}
        rx={1.5}
        fill="#bff8ff"
        style={{ filter: "drop-shadow(0 0 4px #00e5ff)" }}
      />
      {sign && (
        <g>
          <rect
            x={2}
            y={52}
            width={16}
            height={30}
            rx={2}
            fill="#0b1235"
            stroke="#a87cff"
            strokeWidth={1}
          />
          <rect
            x={5}
            y={56}
            width={10}
            height={22}
            rx={1}
            fill="#a87cff"
            opacity={0.25 + pulse * 0.45}
          />
        </g>
      )}
    </svg>
  )
}

function RoadPylon({ variant, pulse }: { variant: number; pulse: number }) {
  if (variant % 2 === 1) {
    // Roadside hazard sign on a stub post.
    return (
      <svg width={60} height={170} viewBox="0 0 60 170">
        <rect x={27} y={96} width={5} height={74} fill="#1a0f0a" />
        <rect
          x={10}
          y={88}
          width={40}
          height={20}
          rx={2}
          fill="#22130b"
          stroke="#ff9a3c"
          strokeWidth={1}
          strokeOpacity={0.7}
        />
        <path
          d="M17 92 l6 6 -6 6 M27 92 l6 6 -6 6 M37 92 l6 6 -6 6"
          stroke="#ffa53b"
          strokeWidth={2.2}
          fill="none"
          opacity={0.45 + pulse * 0.5}
        />
      </svg>
    )
  }
  return (
    <svg width={60} height={170} viewBox="0 0 60 170">
      <path
        d="M18 170 L27 16 L33 16 L42 170"
        stroke="#24150c"
        strokeWidth={3}
        fill="none"
      />
      <path
        d="M21 120 L39 150 M39 120 L21 150 M23 80 L37 110 M37 80 L23 110 M25 44 L35 70 M35 44 L25 70"
        stroke="#24150c"
        strokeWidth={1.6}
      />
      <path d="M12 40 H48 M14 70 H46" stroke="#2b190e" strokeWidth={2.4} />
      <circle
        cx={30}
        cy={13}
        r={3}
        fill="#ff5a3a"
        opacity={0.3 + pulse * 0.7}
        style={{ filter: "drop-shadow(0 0 5px #ff6a3a)" }}
      />
      <circle
        cx={13}
        cy={40}
        r={1.6}
        fill="#ffb347"
        opacity={0.4 + (1 - pulse) * 0.5}
      />
      <circle
        cx={47}
        cy={40}
        r={1.6}
        fill="#ffb347"
        opacity={0.4 + (1 - pulse) * 0.5}
      />
    </svg>
  )
}

function NeonPylon({ variant, pulse }: { variant: number; pulse: number }) {
  const tall = variant % 2 === 0
  const top = tall ? 22 : 70
  return (
    <svg
      width={60}
      height={170}
      viewBox="0 0 60 170"
      style={{ overflow: "visible" }}
    >
      <rect
        x={23}
        y={top}
        width={14}
        height={170 - top}
        rx={2}
        fill="#140626"
      />
      <rect x={20} y={top} width={20} height={8} rx={2} fill="#1d0a36" />
      <rect
        x={29}
        y={top + 12}
        width={2}
        height={150 - top}
        fill="#c084fc"
        opacity={0.35 + pulse * 0.55}
        style={{ filter: "drop-shadow(0 0 3px #a855f7)" }}
      />
      <circle
        cx={30}
        cy={top - 4}
        r={4 + pulse * 2}
        fill="#e5c2ff"
        opacity={0.35 + pulse * 0.5}
        style={{ filter: "drop-shadow(0 0 6px #b06bff)" }}
      />
    </svg>
  )
}

export const SceneryRoadside = memo(function SceneryRoadside({
  place,
  offsets,
  time,
  reduced,
  runwayTop,
}: LayerProps) {
  const spacing = ROADSIDE_SPACING[place]
  const items = repeat(offsets.ground * ROADSIDE_RATE, spacing, 70)
  return (
    <div
      aria-hidden="true"
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        opacity: 0.88,
      }}
    >
      {items.map(({ x, index }) => {
        const pulse = reduced ? 0.6 : wave(time, 2.4, index * 0.37)
        const variant = mod(index, 6)
        return (
          <div
            key={index}
            style={{
              position: "absolute",
              left: 0,
              top: runwayTop - 162,
              transform: `translate3d(${x.toFixed(1)}px, 0, 0)`,
            }}
          >
            {place === "city" ? (
              <CityPost variant={variant} pulse={pulse} />
            ) : place === "road" ? (
              <RoadPylon variant={variant} pulse={pulse} />
            ) : (
              <NeonPylon variant={variant} pulse={pulse} />
            )}
          </div>
        )
      })}
    </div>
  )
})

// ── Runway highlights and foreground (in front of the runway) ────────────────

const ACCENT_RGB: Record<PlaceId, string> = {
  city: "0,229,255",
  road: "255,165,59",
  neon: "192,132,252",
}

const FOREGROUND_SPACING: Record<PlaceId, number> = {
  city: 300,
  road: 360,
  neon: 330,
}
const FOREGROUND_RATE = 1.45

function ForegroundPiece({
  place,
  variant,
}: {
  place: PlaceId
  variant: number
}) {
  if (place === "city") {
    return (
      <svg width={22} height={34} viewBox="0 0 22 34">
        <rect x={4} y={4} width={14} height={30} rx={2} fill="#03050d" />
        <rect
          x={4}
          y={4}
          width={14}
          height={2.5}
          rx={1}
          fill="#4ff0ff"
          opacity={0.85}
        />
      </svg>
    )
  }
  if (place === "road") {
    return (
      <svg width={78} height={30} viewBox="0 0 78 30">
        <path d="M4 30 L10 6 H68 L74 30 Z" fill="#070402" />
        <rect
          x={30}
          y={12}
          width={18}
          height={3}
          rx={1}
          fill="#ff9a3c"
          opacity={variant % 2 ? 0.55 : 0.85}
        />
      </svg>
    )
  }
  return (
    <svg width={46} height={30} viewBox="0 0 46 30">
      <rect x={2} y={8} width={42} height={22} rx={4} fill="#06020c" />
      <circle cx={23} cy={16} r={2.6} fill="#d29bff" opacity={0.85} />
    </svg>
  )
}

export const SceneryFront = memo(function SceneryFront({
  place,
  offsets,
  reduced,
  runwayTop,
}: LayerProps) {
  const rgb = ACCENT_RGB[place]
  const fgSpacing = FOREGROUND_SPACING[place]
  return (
    <div
      aria-hidden="true"
      style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
    >
      {/* Light pulses run along the runway lip a little faster than the road. */}
      {!reduced &&
        repeat(offsets.ground * 1.7, 620, 160).map(({ x, index }) => (
          <div
            key={`lip${index}`}
            style={{
              position: "absolute",
              left: 0,
              top: runwayTop + 2,
              width: 140,
              height: 3,
              borderRadius: 2,
              transform: `translate3d(${x.toFixed(1)}px, 0, 0)`,
              background: `linear-gradient(90deg, rgba(${rgb},0), rgba(${rgb},.9) 70%, rgba(255,255,255,.95) 92%, rgba(${rgb},0))`,
              mixBlendMode: "screen",
              opacity: 0.75,
            }}
          />
        ))}
      {/* Fast foreground silhouettes along the bottom edge. */}
      {repeat(offsets.ground * FOREGROUND_RATE, fgSpacing, 90).map(
        ({ x, index }) => (
          <div
            key={`fg${index}`}
            style={{
              position: "absolute",
              left: 0,
              bottom: -4,
              transform: `translate3d(${x.toFixed(1)}px, 0, 0)`,
              opacity: 0.92,
            }}
          >
            <ForegroundPiece place={place} variant={mod(index, 4)} />
          </div>
        ),
      )}
    </div>
  )
})

// ── Cinematic lighting and surface passes (v6.6) ─────────────────────────────

interface GradeLook {
  /** Light shafts from the sky: [x, width, skew deg, rgb, alpha]. */
  shafts: [number, number, number, string, number][]
  /** Haze/bloom along the horizon line. */
  bloom: string
  /** Colour grade over the whole frame (soft-light). */
  grade: string
  /** Reflected light colours streaking the runway surface. */
  reflections: string[]
  /** Road surface finish: wet mirror or sun-baked heat shimmer. */
  surface: "wet" | "heat"
}

const GRADE: Record<PlaceId, GradeLook> = {
  city: {
    shafts: [
      [150, 90, -18, "120,230,255", 0.07],
      [520, 130, -14, "170,130,255", 0.06],
      [760, 70, -20, "0,229,255", 0.05],
    ],
    bloom: "0,229,255",
    grade:
      "linear-gradient(180deg, rgba(40,70,160,.22) 0%, rgba(0,0,0,0) 45%, rgba(0,120,140,.12) 100%)",
    reflections: ["0,229,255", "236,120,255", "120,170,255"],
    surface: "wet",
  },
  road: {
    shafts: [
      [300, 160, -10, "255,190,110", 0.08],
      [640, 110, -8, "255,150,70", 0.06],
    ],
    bloom: "255,150,60",
    grade:
      "linear-gradient(180deg, rgba(120,50,20,.18) 0%, rgba(0,0,0,0) 50%, rgba(160,80,20,.12) 100%)",
    reflections: ["255,165,59", "255,110,60"],
    surface: "heat",
  },
  neon: {
    shafts: [
      [220, 70, -6, "200,130,255", 0.08],
      [470, 120, 4, "150,100,255", 0.06],
      [700, 80, -12, "220,160,255", 0.06],
    ],
    bloom: "170,100,255",
    grade:
      "linear-gradient(180deg, rgba(80,20,140,.24) 0%, rgba(0,0,0,0) 45%, rgba(100,40,180,.14) 100%)",
    reflections: ["192,132,252", "120,90,255", "240,170,255"],
    surface: "wet",
  },
}

/**
 * Volumetric light shafts and the horizon bloom, drawn over the painted scene
 * and behind roadside structures. Shafts drift with the distant parallax.
 */
export const SceneLighting = memo(function SceneLighting({
  place,
  offsets,
  time,
  reduced,
  runwayTop,
}: LayerProps) {
  const look = GRADE[place]
  const breathe = reduced ? 0.5 : wave(time, 7.5)
  return (
    <div
      aria-hidden="true"
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        width: GW,
        height: runwayTop,
        overflow: "hidden",
        pointerEvents: "none",
      }}
    >
      {!reduced &&
        look.shafts.map(([x, w, skew, rgb, a], i) => {
          const drift = mod(x - offsets.far * 0.35, GW + 320) - 160
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: 0,
                top: -20,
                width: w,
                height: runwayTop + 10,
                transform: `translate3d(${drift.toFixed(1)}px, 0, 0) skewX(${skew}deg)`,
                transformOrigin: "50% 0",
                background: `linear-gradient(180deg, rgba(${rgb},${(a * (0.7 + breathe * 0.6)).toFixed(3)}) 0%, rgba(${rgb},${(a * 0.4).toFixed(3)}) 55%, rgba(${rgb},0) 100%)`,
                mixBlendMode: "screen",
                WebkitMaskImage:
                  "linear-gradient(90deg, transparent, #000 35%, #000 65%, transparent)",
                maskImage:
                  "linear-gradient(90deg, transparent, #000 35%, #000 65%, transparent)",
              }}
            />
          )
        })}
      {/* Horizon bloom: atmospheric depth where the scene meets the runway. */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: runwayTop - 70,
          height: 76,
          background: `linear-gradient(180deg, rgba(${look.bloom},0) 0%, rgba(${look.bloom},${(0.07 + breathe * 0.05).toFixed(3)}) 70%, rgba(${look.bloom},${(0.12 + breathe * 0.06).toFixed(3)}) 100%)`,
          mixBlendMode: "screen",
        }}
      />
    </div>
  )
})

/**
 * Runway finish drawn over the ground art: mirrored neon on wet asphalt
 * (Neon City, Signal Zone) or heat shimmer on sun-baked tarmac (Outer Road),
 * plus ambient occlusion toward the bottom edge. Reflections are pinned to the
 * runway so they travel exactly with the obstacles.
 */
export const RunwaySurface = memo(function RunwaySurface({
  place,
  offsets,
  time,
  reduced,
  runwayTop,
}: LayerProps) {
  const look = GRADE[place]
  const height = 390 - runwayTop
  const streaks = reduced ? [] : repeat(offsets.ground, 150, 40)
  return (
    <div
      aria-hidden="true"
      style={{
        position: "absolute",
        left: 0,
        top: runwayTop,
        width: GW,
        height,
        overflow: "hidden",
        pointerEvents: "none",
      }}
    >
      {look.surface === "wet" ? (
        <>
          {/* Specular band just below the lip. */}
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: 4,
              height: 26,
              background: `linear-gradient(180deg, rgba(${look.bloom},.16), rgba(${look.bloom},0))`,
              mixBlendMode: "screen",
            }}
          />
          {streaks.map(({ x, index }) => {
            const v = mod(index, 5)
            const rgb = look.reflections[mod(index, look.reflections.length)]
            const w = 2 + v
            const flicker = 0.55 + 0.45 * wave(time, 1.8 + v * 0.4, v * 0.21)
            return (
              <div
                key={index}
                style={{
                  position: "absolute",
                  left: 0,
                  top: 8,
                  width: w,
                  height: 18 + v * 5,
                  transform: `translate3d(${(x + v * 23).toFixed(1)}px, 0, 0)`,
                  borderRadius: w,
                  background: `linear-gradient(180deg, rgba(${rgb},${(0.42 * flicker).toFixed(3)}), rgba(${rgb},0))`,
                  mixBlendMode: "screen",
                }}
              />
            )
          })}
        </>
      ) : (
        <>
          {/* Heat haze: a warm shimmer that breathes over the tarmac. */}
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: 2,
              height: 22,
              background:
                "linear-gradient(180deg, rgba(255,190,110,.14), rgba(255,150,60,0))",
              opacity: reduced ? 0.7 : 0.6 + wave(time, 3.2) * 0.4,
              mixBlendMode: "screen",
            }}
          />
          {streaks.map(({ x, index }) => {
            const v = mod(index, 4)
            if (v === 3) return null
            return (
              <div
                key={index}
                style={{
                  position: "absolute",
                  left: 0,
                  top: 10 + v * 9,
                  width: 60 + v * 30,
                  height: 2,
                  transform: `translate3d(${(x + v * 40).toFixed(1)}px, 0, 0)`,
                  borderRadius: 2,
                  background:
                    "linear-gradient(90deg, rgba(255,200,130,0), rgba(255,200,130,.22), rgba(255,200,130,0))",
                  opacity: 0.5 + wave(time, 0.9 + v * 0.3, v * 0.3) * 0.5,
                }}
              />
            )
          })}
        </>
      )}
      {/* Ambient occlusion toward the bottom edge gives the runway depth. */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(180deg, rgba(0,0,0,0) 35%, rgba(2,3,8,.42) 100%)",
        }}
      />
    </div>
  )
})

/** Frame-wide colour grade and vignette. Static, so it costs nothing per frame. */
export const ScreenGrade = memo(function ScreenGrade({
  place,
}: {
  place: PlaceId
}) {
  return (
    <div
      aria-hidden="true"
      style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: GRADE[place].grade,
          mixBlendMode: "soft-light",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse 72% 78% at 46% 52%, rgba(0,0,0,0) 58%, rgba(2,3,10,.42) 100%)",
        }}
      />
    </div>
  )
})

// ── Per-location ambient life (v6.7) ─────────────────────────────────────────

/**
 * One signature motion per map, driven by the simulation clock so it pauses
 * with the game: Neon City has patrol drones with blinking beacons, Outer
 * Road has wind-blown sand drifting off the plains, and Signal Zone has data
 * streams rising into the reactor sky.
 */
export const AmbientLife = memo(function AmbientLife({
  place,
  offsets,
  time,
  reduced,
  runwayTop,
}: LayerProps) {
  if (reduced) return null
  const nodes: React.ReactNode[] = []
  if (place === "city") {
    for (let k = 0; k < 3; k++) {
      const span = GW + 200
      const x = mod(time * (34 + k * 11) + k * 330 - offsets.far * 0.6, span) - 100
      const y = 46 + k * 34 + Math.sin(time * 1.3 + k) * 4
      const blink = mod(time * 1.6 + k * 0.37, 1) < 0.18
      nodes.push(
        <div
          key={`d${k}`}
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            transform: `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`,
          }}
        >
          <div style={{ width: 12, height: 3, borderRadius: 2, background: "#0b1430", boxShadow: "0 0 0 1px rgba(110,200,255,.35)" }} />
          <div
            style={{
              position: "absolute",
              left: 4,
              top: 3,
              width: 4,
              height: 4,
              borderRadius: "50%",
              background: blink ? "#ff5d7a" : "#5a1828",
              boxShadow: blink ? "0 0 6px #ff5d7a" : "none",
            }}
          />
          <div
            style={{
              position: "absolute",
              left: 2,
              top: 4,
              width: 8,
              height: 40,
              background: "linear-gradient(180deg, rgba(120,230,255,.16), transparent)",
              clipPath: "polygon(30% 0, 70% 0, 100% 100%, 0 100%)",
            }}
          />
        </div>,
      )
    }
  } else if (place === "road") {
    for (let k = 0; k < 7; k++) {
      const span = GW + 260
      const x = span - mod(time * (90 + k * 23) + k * 190 + offsets.scene * 0.4, span) - 130
      const y = runwayTop - 34 + (k % 4) * 9 + Math.sin(time * 2 + k) * 3
      nodes.push(
        <div
          key={`s${k}`}
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: 70 + (k % 3) * 40,
            height: 2,
            borderRadius: 2,
            transform: `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`,
            background: "linear-gradient(90deg, rgba(255,205,150,0), rgba(255,215,160,.42), rgba(255,205,150,0))",
          }}
        />,
      )
    }
  } else {
    repeat(offsets.scene, 240, 40).forEach(({ x, index }) => {
      const v = mod(index, 3)
      for (let k = 0; k < 2; k++) {
        const rise = mod(time * (60 + v * 18) + k * 90 + index * 37, runwayTop + 40)
        nodes.push(
          <div
            key={`r${index}-${k}`}
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              width: 2,
              height: 26 + v * 8,
              transform: `translate3d(${(x + 60 + v * 46 + k * 14).toFixed(1)}px, ${(runwayTop - rise).toFixed(1)}px, 0)`,
              background: "linear-gradient(0deg, rgba(210,150,255,0), rgba(235,200,255,.9))",
              boxShadow: "0 0 4px rgba(200,140,255,.6)",
              borderRadius: 2,
              opacity: 0.7,
            }}
          />,
        )
      }
    })
  }
  return (
    <div
      aria-hidden="true"
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        width: GW,
        height: runwayTop,
        overflow: "hidden",
        pointerEvents: "none",
      }}
    >
      {nodes}
    </div>
  )
})
