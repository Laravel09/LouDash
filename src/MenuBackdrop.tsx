import type { PlaceId } from "./types"
import { memo } from "react"

/**
 * Living city behind the Main Menu. Pure SVG + CSS transforms: every moving
 * layer is a seamless 844px tile animated on the compositor, so the menu UI
 * above never re-renders. Decorative only (aria-hidden, pointer-events none).
 */

const W = 844
const H = 390
/** Road travel speed in px/s; the menu runner's cadence is matched to it. */
export const MENU_ROAD_SPEED = 120
const LANE_PERIOD = 64
const HORIZON = 312
const ROAD_TOP = 326

function rng(seed: number) {
  let s = seed >>> 0
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 4294967296
  }
}

interface Tower {
  x: number
  w: number
  h: number
  cap: "flat" | "spire" | "step"
  trim?: string
}

function towers(
  seed: number,
  minH: number,
  maxH: number,
  minW: number,
  maxW: number,
) {
  const r = rng(seed)
  const list: Tower[] = []
  let x = -6
  while (x < W) {
    const w = minW + r() * (maxW - minW)
    const tall = r()
    const h = minH + Math.pow(tall, 1.6) * (maxH - minH)
    const capRoll = r()
    list.push({
      x,
      w,
      h,
      cap: capRoll < 0.18 ? "spire" : capRoll < 0.4 ? "step" : "flat",
      trim: r() < 0.22 ? (r() < 0.6 ? "#00e5c8" : "#a87cff") : undefined,
    })
    x += w + (r() < 0.3 ? 2 + r() * 10 : 0)
  }
  return list
}

const MEGA = towers(3, 120, 250, 46, 96)
const FAR = towers(11, 46, 150, 22, 54)
const MID = towers(29, 60, 205, 26, 62)

/** Small neon signs bolted to mid-layer towers; a few flicker. */
const SIGNS = (() => {
  const r = rng(71)
  const colors = ["#00e5c8", "#a87cff", "#ffa53b", "#ff5d9e"]
  return MID.filter((t) => t.h > 110 && t.w > 30)
    .filter(() => r() < 0.55)
    .map((t) => {
      const vertical = r() < 0.6
      return {
        x: t.x + (vertical ? t.w - 7 : 6),
        y: HORIZON - t.h + 18 + r() * Math.max(4, t.h - 70),
        w: vertical ? 3 : Math.min(t.w - 12, 18 + r() * 14),
        h: vertical ? 16 + r() * 22 : 4,
        color: colors[Math.floor(r() * colors.length)],
        flicker: r() < 0.3,
        delay: r() * 6,
      }
    })
})()

const WINDOW_COLORS = ["#7fd8ff", "#7fd8ff", "#7fd8ff", "#a87cff", "#ffa53b"]

function Windows({
  list,
  seed,
  size,
  density,
  opacity,
}: {
  list: Tower[]
  seed: number
  size: [number, number]
  density: number
  opacity: number
}) {
  const r = rng(seed)
  const rects: React.ReactNode[] = []
  for (const t of list) {
    const top = HORIZON - t.h + 10
    for (let y = top; y < HORIZON - 8; y += size[1] + 4) {
      for (let x = t.x + 4; x < t.x + t.w - 4 - size[0]; x += size[0] + 3) {
        const roll = r()
        if (roll > density) continue
        const blink = roll < density * 0.1
        const glow = !blink && roll < density * 0.22
        rects.push(
          <rect
            key={rects.length}
            x={x.toFixed(1)}
            y={y.toFixed(1)}
            width={size[0]}
            height={size[1]}
            fill={WINDOW_COLORS[Math.floor(r() * WINDOW_COLORS.length)]}
            opacity={(opacity * (0.5 + r() * 0.5)).toFixed(2)}
            className={
              blink
                ? "menu-window-blink"
                : glow
                  ? "menu-window-glow"
                  : undefined
            }
            style={
              blink || glow
                ? { animationDelay: `${(-r() * 9).toFixed(1)}s` }
                : undefined
            }
          />,
        )
      }
    }
  }
  return <>{rects}</>
}

function Skyline({
  list,
  fill,
  edge,
  antennas,
  /** Paint (colour or gradient url) for the tower bodies. */
}: {
  list: Tower[]
  fill: string
  edge: string
  antennas: boolean
}) {
  return (
    <>
      {list.map((t, i) => {
        const top = HORIZON - t.h
        return (
          <g key={i}>
            <rect x={t.x} y={top} width={t.w} height={t.h + 20} fill={fill} />
            {t.cap === "step" && (
              <rect
                x={t.x + t.w * 0.2}
                y={top - 12}
                width={t.w * 0.6}
                height={12}
                fill={fill}
              />
            )}
            {t.cap === "spire" && (
              <>
                <polygon
                  points={`${t.x + t.w * 0.3},${top} ${t.x + t.w * 0.5},${top - 26} ${t.x + t.w * 0.7},${top}`}
                  fill={fill}
                />
                {antennas && (
                  <circle
                    cx={t.x + t.w * 0.5}
                    cy={top - 27}
                    r={1.4}
                    fill="#ff5d7a"
                    className="menu-antenna"
                    style={{ animationDelay: `${(i % 5) * 0.7}s` }}
                  />
                )}
              </>
            )}
            <line
              x1={t.x}
              y1={top}
              x2={t.x + t.w}
              y2={top}
              stroke={edge}
              strokeWidth={1}
            />
            {t.trim && (
              <line
                x1={t.x + t.w - 1}
                y1={top + 4}
                x2={t.x + t.w - 1}
                y2={HORIZON}
                stroke={t.trim}
                strokeWidth={1}
                opacity={0.5}
              />
            )}
          </g>
        )
      })}
    </>
  )
}

function Signs() {
  return (
    <>
      {SIGNS.map((g, i) => (
        <rect
          key={i}
          x={g.x}
          y={g.y}
          width={g.w}
          height={g.h}
          rx={1}
          fill={g.color}
          opacity={0.78}
          className={g.flicker ? "menu-sign-flicker" : undefined}
          style={{
            filter: `drop-shadow(0 0 3px ${g.color})`,
            animationDelay: g.flicker ? `${g.delay.toFixed(1)}s` : undefined,
          }}
        />
      ))}
    </>
  )
}

/** Renders one tile twice so a -844px translate loops seamlessly. */
function Tile({
  children,
  className,
  defs,
}: {
  children: React.ReactNode
  className: string
  defs?: React.ReactNode
}) {
  return (
    <div className={`menu-layer ${className}`}>
      <svg width={W * 2} height={H} viewBox={`0 0 ${W * 2} ${H}`}>
        {defs && <defs>{defs}</defs>}
        {/* The left copy supplies towers that overhang the tile edge. */}
        <g transform={`translate(${-W} 0)`}>{children}</g>
        <g>{children}</g>
        <g transform={`translate(${W} 0)`}>{children}</g>
      </svg>
    </div>
  )
}

const PARTICLES = Array.from({ length: 16 }, (_, i) => {
  const r = rng(101 + i * 7)
  return {
    left: r() * W,
    top: 90 + r() * 230,
    size: 1 + r() * 1.6,
    duration: 14 + r() * 14,
    delay: -r() * 20,
    color: r() < 0.7 ? "#7fe9ff" : "#c4a6ff",
  }
})

const BEAMS = [
  { left: 150, color: "rgba(0,229,200,.10)", duration: 13, delay: 0 },
  { left: 560, color: "rgba(168,124,255,.11)", duration: 17, delay: -6 },
  { left: 760, color: "rgba(0,200,255,.08)", duration: 15, delay: -11 },
]

/** Light trails on the roadway: [top, width, duration, delay, colour, reverse]. */
const TRAILS: [number, number, number, number, string, boolean][] = [
  [10, 90, 5.5, 0, "rgba(0,229,200,.8)", false],
  [16, 120, 8, -3, "rgba(168,124,255,.7)", false],
  [31, 70, 7, -2, "rgba(255,120,90,.7)", true],
  [36, 100, 9.5, -6, "rgba(255,190,110,.6)", true],
  [21, 60, 4.6, -1.5, "rgba(120,240,255,.75)", false],
]

/** Accent lighting per active place: Neon City, Outer Road, Signal Zone. */
const PLACE_MOOD: Record<PlaceId, { accent: string; accent2: string }> = {
  city: { accent: "#00e5c8", accent2: "#a87cff" },
  road: { accent: "#ffa53b", accent2: "#ff5a3a" },
  neon: { accent: "#c084fc", accent2: "#6f5cff" },
}
const PLACE_IDS: PlaceId[] = ["city", "road", "neon"]

/** Flying traffic lanes above the city: [top, duration s, delay s, reverse]. */
const SKY_TRAFFIC = [
  { top: 118, duration: 19, delay: -4, reverse: false },
  { top: 152, duration: 26, delay: -15, reverse: true },
  { top: 96, duration: 33, delay: -9, reverse: false },
  { top: 182, duration: 15, delay: -2, reverse: true },
]

/** Place-tinted embers rising off the road. */
const MOTES = Array.from({ length: 16 }, (_, i) => {
  const r = rng(900 + i)
  return {
    left: 20 + r() * 804,
    size: 1.4 + r() * 2,
    duration: 7 + r() * 7,
    delay: -r() * 14,
  }
})

/**
 * `calm` (Reduced Effects) keeps the slow parallax drift and road motion but
 * drops flicker, particles, beams and light sweeps.
 */
function MenuBackdrop({ calm, place }: { calm: boolean; place: PlaceId }) {
  const mood = PLACE_MOOD[place]
  return (
    <div
      className={`menu-backdrop${calm ? " is-calm" : ""}`}
      aria-hidden="true"
      style={
        {
          "--menu-lane-period": `${(LANE_PERIOD / MENU_ROAD_SPEED).toFixed(3)}s`,
          "--menu-accent": mood.accent,
          "--menu-accent-2": mood.accent2,
        } as React.CSSProperties
      }
    >
      {/* Sky and horizon glow */}
      <div className="menu-sky" />
      {/* Location mood: every tint is mounted so a change cross-fades. */}
      {PLACE_IDS.map((id) => (
        <div
          key={id}
          className={`menu-tint menu-tint-${id}`}
          style={{ opacity: id === place ? 1 : 0 }}
        />
      ))}
      <div className="menu-aurora" />
      <div className="menu-horizon-glow" />
      {!calm &&
        BEAMS.map((b, i) => (
          <div
            key={i}
            className="menu-beam"
            style={{
              left: b.left,
              background: `linear-gradient(0deg, ${b.color}, transparent 85%)`,
              animationDuration: `${b.duration}s`,
              animationDelay: `${b.delay}s`,
            }}
          />
        ))}

      {/* Hazy megastructures on the horizon barely move */}
      <Tile
        className="menu-layer-mega"
        defs={
          <linearGradient id="menu-mega" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#1a2656" />
            <stop offset="0.7" stopColor="#111a3e" stopOpacity="0.6" />
            <stop offset="1" stopColor="#111a3e" stopOpacity="0" />
          </linearGradient>
        }
      >
        <Skyline list={MEGA} fill="url(#menu-mega)" edge="#2a3c78" antennas />
      </Tile>

      {/* Distant skyline drifts slowly */}
      <Tile
        className="menu-layer-far"
        defs={
          <linearGradient id="menu-far" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#152150" />
            <stop offset="1" stopColor="#0d1638" />
          </linearGradient>
        }
      >
        <Skyline
          list={FAR}
          fill="url(#menu-far)"
          edge="#273a74"
          antennas={false}
        />
        <Windows
          list={FAR}
          seed={5}
          size={[2, 3]}
          density={0.16}
          opacity={0.5}
        />
      </Tile>

      <div className="menu-haze menu-haze-a" />

      <Tile
        className="menu-layer-mid"
        defs={
          <linearGradient id="menu-mid" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#0d1536" />
            <stop offset="1" stopColor="#080d22" />
          </linearGradient>
        }
      >
        <Skyline list={MID} fill="url(#menu-mid)" edge="#2b4282" antennas />
        <Windows
          list={MID}
          seed={17}
          size={[3, 4]}
          density={0.14}
          opacity={0.62}
        />
        <Signs />
      </Tile>

      {/* Distant lighting pulses behind the far skyline */}
      {!calm && (
        <>
          <div className="menu-pulse menu-pulse-a" />
          <div className="menu-pulse menu-pulse-b" />
        </>
      )}

      <div className="menu-haze menu-haze-b" />
      <div className="menu-depth-fog" />

      {/* Hover traffic gliding between the towers */}
      {!calm &&
        SKY_TRAFFIC.map((t, i) => (
          <span
            key={i}
            className={`menu-sky-traffic${t.reverse ? " is-reverse" : ""}`}
            style={{
              top: t.top,
              animationDuration: `${t.duration}s`,
              animationDelay: `${t.delay}s`,
            }}
          >
            <i />
          </span>
        ))}

      {/* Elevated roadway */}
      <div className="menu-road">
        <div className="menu-road-edge" />
        <div className="menu-road-sheen" />
        <div className="menu-road-reflect" />
        <div className="menu-road-lanes" />
        <div className="menu-road-lanes is-glow" />
        {!calm && <div className="menu-road-lanelight" />}
        <div className="menu-road-rail" />
        {!calm &&
          TRAILS.map(([top, width, duration, delay, color, reverse], i) => (
            <span
              key={i}
              className={`menu-car${reverse ? " is-reverse" : ""}`}
              style={{
                top,
                width,
                background: reverse
                  ? `linear-gradient(90deg, ${color}, transparent)`
                  : `linear-gradient(90deg, transparent, ${color})`,
                animationDuration: `${duration}s`,
                animationDelay: `${delay}s`,
              }}
            />
          ))}
      </div>

      {!calm && (
        <>
          <div className="menu-holo-sweep" />
          {MOTES.map((m, i) => (
            <span
              key={`mote${i}`}
              className="menu-mote"
              style={{
                left: m.left,
                width: m.size,
                height: m.size,
                animationDuration: `${m.duration}s`,
                animationDelay: `${m.delay}s`,
              }}
            />
          ))}
          {PARTICLES.map((p, i) => (
            <span
              key={i}
              className="menu-particle"
              style={{
                left: p.left,
                top: p.top,
                width: p.size,
                height: p.size,
                background: p.color,
                color: p.color,
                animationDuration: `${p.duration}s`,
                animationDelay: `${p.delay}s`,
              }}
            />
          ))}
        </>
      )}

      {/* Readability: keep the logo, cards and button column on calm ground */}
      <div className="menu-scrim" />
    </div>
  )
}

export default memo(MenuBackdrop)
