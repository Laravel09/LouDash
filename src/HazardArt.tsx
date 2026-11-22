import { memo, type CSSProperties, type ReactNode } from "react"
import {
  CRUSHER_HEAD_H,
  CRUSHER_RAISED_BOTTOM,
  GROUND_Y,
  HAZARDS,
  HUD_H,
  OVERHEAD_BEAM_Y,
  SCAN_FLOOR,
  crusherHeadBottom,
  crusherPhase,
  hazardState,
  type HazardBody,
  type HazardState,
} from "./hazards"

/**
 * Cyberpunk hazard artwork. Every visual state (warning, live beam, crusher
 * stroke) is read from the same rules that produce the collision boxes, so
 * the art never disagrees with what can hit the runner.
 */

// Shared palette.
const STEEL_DARK = "#141a28"
const STEEL = "#273046"
const STEEL_MID = "#3a465f"
const STEEL_LIGHT = "#8fa3bf"
const EDGE = "#05070d"
const HAZARD_YELLOW = "#ffc93c"
const LASER = "#ff3d6e"
const LASER_CORE = "#ffe3ec"
const CYAN = "#5ff6ff"
const VIOLET = "#c38bff"
const AMBER = "#ffb347"

/** One-off <defs> used by every hazard; rendered once per game screen. */
export function HazardDefs() {
  return (
    <svg
      width="0"
      height="0"
      aria-hidden="true"
      style={{ position: "absolute" }}
    >
      <defs>
        <linearGradient id="hz-steel" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#5b6b88" />
          <stop offset="0.18" stopColor={STEEL_MID} />
          <stop offset="0.7" stopColor={STEEL} />
          <stop offset="1" stopColor={STEEL_DARK} />
        </linearGradient>
        <linearGradient id="hz-steel-h" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor={STEEL_DARK} />
          <stop offset="0.35" stopColor="#56658a" />
          <stop offset="0.6" stopColor={STEEL_MID} />
          <stop offset="1" stopColor={STEEL_DARK} />
        </linearGradient>
        <linearGradient id="hz-dark" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#323c55" />
          <stop offset="1" stopColor="#0c111c" />
        </linearGradient>
        <pattern
          id="hz-stripes"
          width="10"
          height="10"
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(45)"
        >
          <rect width="10" height="10" fill="#15161c" />
          <rect width="5" height="10" fill={HAZARD_YELLOW} />
        </pattern>
        <radialGradient id="hz-glow-red">
          <stop offset="0" stopColor="#fff2f5" />
          <stop offset="0.35" stopColor={LASER} />
          <stop offset="1" stopColor={LASER} stopOpacity="0" />
        </radialGradient>
        <radialGradient id="hz-glow-cyan">
          <stop offset="0" stopColor="#f2feff" />
          <stop offset="0.4" stopColor={CYAN} />
          <stop offset="1" stopColor={CYAN} stopOpacity="0" />
        </radialGradient>
        <radialGradient id="hz-glow-amber">
          <stop offset="0" stopColor="#fff6e0" />
          <stop offset="0.4" stopColor={AMBER} />
          <stop offset="1" stopColor={AMBER} stopOpacity="0" />
        </radialGradient>
        <linearGradient id="hz-scan" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={CYAN} stopOpacity="0.55" />
          <stop offset="1" stopColor={CYAN} stopOpacity="0.06" />
        </linearGradient>
      </defs>
    </svg>
  )
}

function hash(n: number) {
  const x = Math.sin(n * 127.1) * 43758.5453
  return x - Math.floor(x)
}

function blink(frame: number, period: number, duty = 0.5) {
  return frame % period < period * duty
}

interface ArtProps {
  e: HazardBody & { id: number }
  frame: number
  state: HazardState
}

// ── Lane hazards ─────────────────────────────────────────────────────────────
function Roadblock({ e, frame }: ArtProps) {
  const { w, h } = e
  const a = blink(frame + e.id * 7, 40)
  return (
    <svg
      width={w}
      height={h + 10}
      viewBox={`0 -10 ${w} ${h + 10}`}
      overflow="visible"
    >
      {/* A-frame legs */}
      <path
        d={`M8 ${h} L16 6 L22 6 L16 ${h}Z M${w - 8} ${h} L${w - 16} 6 L${w - 22} 6 L${w - 16} ${h}Z`}
        fill="url(#hz-steel)"
        stroke={EDGE}
        strokeWidth="1"
      />
      {/* Reinforced striped plate */}
      <rect
        x="2"
        y="4"
        width={w - 4}
        height="12"
        rx="2"
        fill="url(#hz-stripes)"
        stroke={EDGE}
        strokeWidth="1.2"
      />
      <rect
        x="2"
        y="4"
        width={w - 4}
        height="3"
        rx="1.5"
        fill="#ffffff"
        opacity="0.18"
      />
      <rect
        x="0"
        y="14"
        width={w}
        height="4"
        rx="1"
        fill="url(#hz-steel)"
        stroke={EDGE}
        strokeWidth="0.8"
      />
      {[10, w / 2, w - 10].map((x) => (
        <circle key={x} cx={x} cy="16" r="1.2" fill={STEEL_LIGHT} />
      ))}
      {/* Hazard beacons */}
      {[14, w - 14].map((x, i) => {
        const on = i === 0 ? a : !a
        return (
          <g key={x}>
            <rect
              x={x - 4}
              y="-1"
              width="8"
              height="5"
              rx="1"
              fill={STEEL_DARK}
              stroke={EDGE}
              strokeWidth="0.8"
            />
            <rect
              x={x - 3}
              y="-6"
              width="6"
              height="6"
              rx="2"
              fill={on ? AMBER : "#5a3d1a"}
              stroke={EDGE}
              strokeWidth="0.8"
            />
            {on && (
              <circle
                cx={x}
                cy="-3"
                r="9"
                fill="url(#hz-glow-amber)"
                opacity="0.7"
              />
            )}
          </g>
        )
      })}
    </svg>
  )
}

function Debris({ e, frame }: ArtProps) {
  const { w, h } = e
  const spark = hash(Math.floor(frame / 5) + e.id) > 0.72
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} overflow="visible">
      {/* Broken gear segment */}
      <g transform={`translate(${w * 0.62} ${h * 0.5})`}>
        <circle r="15" fill="url(#hz-steel)" stroke={EDGE} strokeWidth="1.2" />
        {Array.from({ length: 8 }, (_, i) => (
          <rect
            key={i}
            x="-3"
            y="-19"
            width="6"
            height="6"
            fill={STEEL_MID}
            stroke={EDGE}
            strokeWidth="0.8"
            transform={`rotate(${i * 45 + 12})`}
          />
        ))}
        <circle r="5" fill={STEEL_DARK} stroke={STEEL_LIGHT} strokeWidth="1" />
      </g>
      {/* Bent armour plates */}
      <path
        d={`M0 ${h} L4 ${h - 16} L20 ${h - 24} L30 ${h - 12} L26 ${h}Z`}
        fill="url(#hz-dark)"
        stroke={EDGE}
        strokeWidth="1.2"
      />
      <path
        d={`M14 ${h} L22 ${h - 10} L44 ${h - 14} L${w} ${h}Z`}
        fill="url(#hz-steel)"
        stroke={EDGE}
        strokeWidth="1.2"
      />
      <path
        d={`M6 ${h - 15} L19 ${h - 21}`}
        stroke={STEEL_LIGHT}
        strokeWidth="1"
        opacity="0.6"
      />
      {/* Torn cable and status LED */}
      <path
        d={`M24 ${h - 12} C 18 ${h - 30}, 8 ${h - 26}, 6 ${h - 34}`}
        stroke="#0b0f18"
        strokeWidth="3"
        fill="none"
      />
      <path
        d={`M24 ${h - 12} C 18 ${h - 30}, 8 ${h - 26}, 6 ${h - 34}`}
        stroke={HAZARD_YELLOW}
        strokeWidth="1"
        fill="none"
        strokeDasharray="2 3"
      />
      <circle
        cx="38"
        cy={h - 7}
        r="1.8"
        fill={blink(frame, 50, 0.3) ? LASER : "#4a1020"}
      />
      {spark && (
        <g transform={`translate(6 ${h - 34})`}>
          <circle r="6" fill="url(#hz-glow-cyan)" />
          <path
            d="M0 0 L5 -4 M0 0 L-4 -5 M0 0 L3 4"
            stroke="#e9feff"
            strokeWidth="1"
          />
        </g>
      )}
    </svg>
  )
}

function LaserPylonStatic({ e, frame }: ArtProps) {
  const { w, h } = e
  const pulse = 0.55 + Math.sin(frame * 0.12 + e.id) * 0.25
  return (
    <svg
      width={w + 16}
      height={h + 4}
      viewBox={`-8 -4 ${w + 16} ${h + 4}`}
      overflow="visible"
    >
      <rect
        x="-7"
        y={h - 6}
        width={w + 14}
        height="6"
        rx="1.5"
        fill="url(#hz-steel)"
        stroke={EDGE}
        strokeWidth="1"
      />
      <rect
        x="0"
        y="4"
        width={w}
        height={h - 8}
        rx="2"
        fill="url(#hz-steel-h)"
        stroke={EDGE}
        strokeWidth="1.2"
      />
      {[16, 32, 48, 64].map((y) => (
        <rect key={y} x="0" y={y} width={w} height="2" fill={STEEL_DARK} />
      ))}
      {/* Energy core */}
      <rect
        x={w / 2 - 2.5}
        y="9"
        width="5"
        height={h - 20}
        rx="2.5"
        fill={CYAN}
        opacity={pulse}
      />
      <rect
        x={w / 2 - 1}
        y="9"
        width="2"
        height={h - 20}
        rx="1"
        fill="#effeff"
        opacity={pulse}
      />
      <rect
        x={w / 2 - 6}
        y="6"
        width="12"
        height={h - 14}
        fill="url(#hz-glow-cyan)"
        opacity={pulse * 0.45}
      />
      <path
        d={`M-2 4 L${w / 2} -4 L${w + 2} 4Z`}
        fill="url(#hz-steel)"
        stroke={EDGE}
        strokeWidth="1"
      />
      <circle
        cx={w / 2}
        cy="0"
        r="1.6"
        fill={blink(frame, 36) ? CYAN : STEEL_DARK}
      />
    </svg>
  )
}

function Crawler({ e, frame }: ArtProps) {
  const { w, h } = e
  const step = frame * 0.42 + e.id
  const legs = [8, 20, 32, 44]
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} overflow="visible">
      {legs.map((x, i) => {
        const lift = Math.max(0, Math.sin(step + i * Math.PI * 0.5)) * 4
        const swing = Math.cos(step + i * Math.PI * 0.5) * 3
        return (
          <path
            key={x}
            d={`M${x} ${h - 14} L${x - 4 + swing} ${h - 8 - lift} L${x - 7 + swing} ${h - lift * 0.4}`}
            stroke={STEEL_LIGHT}
            strokeWidth="2.4"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )
      })}
      {/* Segmented carapace, head facing the runner (left) */}
      {[0, 1, 2].map((i) => (
        <path
          key={i}
          d={`M${6 + i * 15} ${h - 12} Q ${12 + i * 15} ${h - 30 + i * 2}, ${22 + i * 15} ${h - 13}Z`}
          fill="url(#hz-steel)"
          stroke={EDGE}
          strokeWidth="1.2"
        />
      ))}
      <rect
        x="4"
        y={h - 15}
        width={w - 8}
        height="5"
        rx="2"
        fill={STEEL_DARK}
        stroke={EDGE}
        strokeWidth="0.8"
      />
      <path
        d={`M2 ${h - 13} L-4 ${h - 18} L2 ${h - 20}Z`}
        fill={STEEL_MID}
        stroke={EDGE}
        strokeWidth="0.8"
      />
      <circle cx="6" cy={h - 19} r="3.2" fill={LASER} />
      <circle cx="6" cy={h - 19} r="8" fill="url(#hz-glow-red)" opacity="0.5" />
      <path
        d={`M${w - 6} ${h - 14} q 6 -6 8 -14`}
        stroke={STEEL_LIGHT}
        strokeWidth="1.5"
        fill="none"
      />
      <circle
        cx={w + 2}
        cy={h - 28}
        r="1.6"
        fill={blink(frame, 24) ? AMBER : "#6b4a1a"}
      />
    </svg>
  )
}

function SpiderBot({ e, frame }: ArtProps) {
  const { w, h } = e
  const t = frame * 0.35 + e.id
  const bob = Math.sin(t * 2) * 1.2
  const cx = w / 2
  const cy = h - 22 + bob
  const legs = [-1, 1].flatMap((side) => [0, 1, 2, 3].map((i) => ({ side, i })))
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} overflow="visible">
      {legs.map(({ side, i }) => {
        const phase = t + i * 1.6 + (side > 0 ? Math.PI : 0)
        const lift = Math.max(0, Math.sin(phase)) * 5
        const reach = 10 + i * 4
        const knee = { x: cx + side * (reach * 0.65), y: cy - 12 - lift * 0.3 }
        const foot = { x: cx + side * reach + Math.cos(phase) * 2, y: h - lift }
        const front = side > 0
        const even = i % 2 === 0
        const near = front === even
        return (
          <path
            key={`${side}${i}`}
            d={`M${cx + side * 4} ${cy - 2} L${knee.x} ${knee.y} L${foot.x} ${foot.y}`}
            stroke={near ? "#aab9d4" : "#5e6c88"}
            strokeWidth={near ? 2.4 : 1.8}
            fill="none"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        )
      })}
      <ellipse
        cx={cx}
        cy={cy}
        rx="13"
        ry="10"
        fill="url(#hz-steel)"
        stroke={EDGE}
        strokeWidth="1.2"
      />
      <path
        d={`M${cx - 10} ${cy - 3} Q ${cx} ${cy - 13}, ${cx + 10} ${cy - 3}`}
        stroke={STEEL_LIGHT}
        strokeWidth="1"
        fill="none"
        opacity="0.7"
      />
      <ellipse
        cx={cx - 7}
        cy={cy + 2}
        rx="7"
        ry="5.5"
        fill={STEEL_DARK}
        stroke={EDGE}
        strokeWidth="1"
      />
      {[
        [-10, 1],
        [-6, 3],
        [-8, -1.5],
      ].map(([dx, dy], i) => (
        <circle
          key={i}
          cx={cx + dx}
          cy={cy + dy}
          r={i === 0 ? 1.9 : 1.3}
          fill={VIOLET}
        />
      ))}
      <circle cx={cx - 8} cy={cy + 1} r="7" fill={VIOLET} opacity="0.25" />
    </svg>
  )
}

function HoverDrone({ e, frame }: ArtProps) {
  const { w, h } = e
  const flame = 4 + hash(frame + e.id) * 4
  return (
    <svg
      width={w}
      height={h + 12}
      viewBox={`0 0 ${w} ${h + 12}`}
      overflow="visible"
    >
      {/* Thrusters */}
      {[12, w - 12].map((x) => (
        <g key={x}>
          <path
            d={`M${x - 3} ${h - 4} L${x} ${h - 2 + flame} L${x + 3} ${h - 4}Z`}
            fill={CYAN}
            opacity="0.85"
          />
          <path
            d={`M${x - 1.4} ${h - 4} L${x} ${h - 3 + flame * 0.6} L${x + 1.4} ${h - 4}Z`}
            fill="#f4feff"
          />
          <ellipse
            cx={x}
            cy={h - 1}
            rx="6"
            ry="5"
            fill="url(#hz-glow-cyan)"
            opacity="0.5"
          />
          <rect
            x={x - 5}
            y={h - 9}
            width="10"
            height="6"
            rx="2"
            fill={STEEL_DARK}
            stroke={EDGE}
            strokeWidth="1"
          />
        </g>
      ))}
      <path
        d={`M2 ${h * 0.45} L10 4 L${w - 10} 4 L${w - 2} ${h * 0.45} L${w - 8} ${h - 6} L8 ${h - 6}Z`}
        fill="url(#hz-steel)"
        stroke={EDGE}
        strokeWidth="1.2"
      />
      <path
        d={`M10 6 L${w - 10} 6`}
        stroke={STEEL_LIGHT}
        strokeWidth="1"
        opacity="0.6"
      />
      <rect
        x="3"
        y={h * 0.38}
        width="16"
        height="6"
        rx="3"
        fill="#0a0d16"
        stroke={EDGE}
        strokeWidth="0.8"
      />
      <circle cx="9" cy={h * 0.38 + 3} r="2.4" fill={LASER} />
      <circle
        cx="9"
        cy={h * 0.38 + 3}
        r="7"
        fill="url(#hz-glow-red)"
        opacity="0.55"
      />
      <path
        d={`M${w / 2} 4 L${w / 2 + 4} -6`}
        stroke={STEEL_LIGHT}
        strokeWidth="1.2"
      />
      <circle
        cx={w / 2 + 4}
        cy="-6"
        r="1.5"
        fill={blink(frame, 30) ? LASER : "#4a1020"}
      />
    </svg>
  )
}

function Sentry({ e, frame }: ArtProps) {
  const { w, h } = e
  const t = frame * 0.24 + e.id
  const a = Math.sin(t) * 9
  const leg = (angle: number, x: number, tone: string) => (
    <g transform={`rotate(${angle} ${x} ${h - 30})`}>
      <rect
        x={x - 3}
        y={h - 30}
        width="6"
        height="17"
        rx="2"
        fill={tone}
        stroke={EDGE}
        strokeWidth="1"
      />
      <rect
        x={x - 3}
        y={h - 15}
        width="6"
        height="12"
        rx="2"
        fill={tone}
        stroke={EDGE}
        strokeWidth="1"
      />
      <path
        d={`M${x - 7} ${h - 1} L${x + 5} ${h - 1} L${x + 4} ${h - 4} L${x - 5} ${h - 4}Z`}
        fill={STEEL_DARK}
        stroke={EDGE}
        strokeWidth="1"
      />
    </g>
  )
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} overflow="visible">
      {leg(-a, w / 2 + 3, "#4a5672")}
      {leg(a, w / 2 - 3, STEEL_MID)}
      {/* Torso with riot shield */}
      <rect
        x="6"
        y={h - 50}
        width={w - 10}
        height="22"
        rx="4"
        fill="url(#hz-steel)"
        stroke={EDGE}
        strokeWidth="1.2"
      />
      <path
        d={`M2 ${h - 50} L10 ${h - 52} L10 ${h - 26} L2 ${h - 30}Z`}
        fill={STEEL_DARK}
        stroke={STEEL_LIGHT}
        strokeWidth="0.8"
      />
      <rect
        x="12"
        y={h - 44}
        width={w - 20}
        height="3"
        fill={LASER}
        opacity={blink(frame, 44, 0.7) ? 0.9 : 0.35}
      />
      {/* Head and visor */}
      <rect
        x="7"
        y={h - 66}
        width={w - 12}
        height="15"
        rx="4"
        fill="url(#hz-steel)"
        stroke={EDGE}
        strokeWidth="1.2"
      />
      <rect x="5" y={h - 61} width="16" height="5" rx="2" fill="#0a0d16" />
      <rect x="6" y={h - 60} width="9" height="3" rx="1.5" fill={LASER} />
      <rect
        x="2"
        y={h - 64}
        width="18"
        height="12"
        fill="url(#hz-glow-red)"
        opacity="0.45"
      />
      {/* Arm */}
      <rect
        x={w - 8}
        y={h - 48}
        width="5"
        height="16"
        rx="2"
        fill={STEEL_MID}
        stroke={EDGE}
        strokeWidth="1"
        transform={`rotate(${-a * 0.6} ${w - 6} ${h - 48})`}
      />
    </svg>
  )
}

// ── Energy hazards ───────────────────────────────────────────────────────────
function arcPath(x: number, y0: number, y1: number, seed: number, amp: number) {
  const steps = 9
  let d = `M${x} ${y0}`
  for (let i = 1; i < steps; i += 1) {
    const y = y0 + ((y1 - y0) * i) / steps
    d += ` L${x + (hash(seed + i) - 0.5) * amp * 2} ${y}`
  }
  return `${d} L${x} ${y1}`
}

function PulseGate({ e, frame, state }: ArtProps) {
  const { w, h } = e
  const live = state.phase === "active"
  const warn = state.phase === "warn"
  const capOn = live || (warn && blink(frame, 10))
  const seed = Math.floor(frame / 2) * 13 + e.id
  return (
    <svg
      width={w + 8}
      height={h + 6}
      viewBox={`-4 -3 ${w + 8} ${h + 6}`}
      overflow="visible"
    >
      <rect
        x={w / 2 - 3}
        y="0"
        width="6"
        height="12"
        fill="url(#hz-steel-h)"
        stroke={EDGE}
        strokeWidth="1"
      />
      <rect
        x={w / 2 - 3}
        y={h - 12}
        width="6"
        height="12"
        fill="url(#hz-steel-h)"
        stroke={EDGE}
        strokeWidth="1"
      />
      <rect
        x="-2"
        y="8"
        width={w + 4}
        height="7"
        rx="2"
        fill="url(#hz-steel)"
        stroke={EDGE}
        strokeWidth="1"
      />
      <rect
        x="-2"
        y={h - 15}
        width={w + 4}
        height="7"
        rx="2"
        fill="url(#hz-steel)"
        stroke={EDGE}
        strokeWidth="1"
      />
      {[14, h - 10].map((y) => (
        <rect
          key={y}
          x="2"
          y={y}
          width={w - 4}
          height="2"
          rx="1"
          fill={capOn ? VIOLET : "#3b2a55"}
        />
      ))}
      {warn && (
        <g>
          {/* Danger-zone preview: same footprint as the live arc */}
          <rect
            x={w / 2 - 8}
            y="15"
            width="16"
            height={h - 30}
            fill={VIOLET}
            opacity={blink(frame, 10) ? 0.16 : 0.07}
          />
          <path
            d={arcPath(w / 2, 16, h - 16, seed, 2)}
            stroke={VIOLET}
            strokeWidth="2"
            fill="none"
            opacity="0.9"
            strokeDasharray="4 4"
          />
        </g>
      )}
      {live && (
        <g>
          <rect
            x={w / 2 - 8}
            y="15"
            width="16"
            height={h - 30}
            fill={VIOLET}
            opacity="0.22"
          />
          <path
            d={arcPath(w / 2, 15, h - 15, seed, 6)}
            stroke={VIOLET}
            strokeWidth="3.4"
            fill="none"
            strokeLinejoin="round"
          />
          <path
            d={arcPath(w / 2, 15, h - 15, seed, 6)}
            stroke="#f7efff"
            strokeWidth="1.2"
            fill="none"
            strokeLinejoin="round"
          />
          <path
            d={arcPath(w / 2, 15, h - 15, seed + 7, 8)}
            stroke={VIOLET}
            strokeWidth="1"
            fill="none"
            opacity="0.7"
          />
        </g>
      )}
    </svg>
  )
}

function FloorLaser({ e, frame, state }: ArtProps) {
  const { w, h } = e
  const live = state.phase === "active"
  const warn = state.phase === "warn"
  const lenses = [12, 30, 48, 66, 84]
  const flicker = 0.85 + hash(frame + e.id) * 0.15
  return (
    <svg
      width={w}
      height={h + 4}
      viewBox={`0 0 ${w} ${h + 4}`}
      overflow="visible"
    >
      {live && (
        <g opacity={flicker}>
          <rect
            x="6"
            y="4"
            width={w - 12}
            height={h - 8}
            fill={LASER}
            opacity="0.12"
          />
          {lenses.map((x) => (
            <g key={x}>
              <rect
                x={x - 3}
                y="4"
                width="6"
                height={h - 8}
                fill={LASER}
                opacity="0.55"
              />
              <rect
                x={x - 1}
                y="4"
                width="2"
                height={h - 8}
                fill={LASER_CORE}
              />
              <circle cx={x} cy="4" r="4" fill="url(#hz-glow-red)" />
            </g>
          ))}
        </g>
      )}
      {warn && (
        <g>
          {lenses.map((x, i) => (
            <rect
              key={x}
              x={x - 0.5}
              y={h - 8 - state.t * (h - 12) * (0.6 + 0.4 * hash(i + e.id))}
              width="1"
              height={state.t * (h - 12) * 0.5}
              fill={LASER}
              opacity={blink(frame + i, 10) ? 0.8 : 0.3}
            />
          ))}
          <rect
            x="2"
            y={h - 9}
            width={w - 4}
            height="2"
            fill={LASER}
            opacity={blink(frame, 10) ? 0.9 : 0.25}
          />
        </g>
      )}
      {/* Emitter strip */}
      <rect
        x="0"
        y={h - 8}
        width={w}
        height="9"
        rx="2"
        fill="url(#hz-steel)"
        stroke={EDGE}
        strokeWidth="1"
      />
      <rect
        x="0"
        y={h - 3}
        width={w}
        height="3"
        fill="url(#hz-stripes)"
        opacity="0.85"
      />
      {lenses.map((x) => (
        <rect
          key={x}
          x={x - 4}
          y={h - 7}
          width="8"
          height="3"
          rx="1"
          fill={live ? LASER_CORE : warn ? LASER : "#3a1622"}
        />
      ))}
    </svg>
  )
}

function LaserPylon({ e, frame, state }: ArtProps) {
  const { w, h } = e
  const live = state.phase === "active"
  const warn = state.phase === "warn"
  // Beam band matches the collision box (GROUND_Y-30 .. GROUND_Y-16).
  const beamTop = GROUND_Y - 30 - e.y
  const headOn = live || (warn && blink(frame, 10))
  const post = (x: number) => (
    <g>
      <rect
        x={x}
        y="6"
        width="12"
        height={h - 6}
        rx="2"
        fill="url(#hz-steel-h)"
        stroke={EDGE}
        strokeWidth="1.2"
      />
      <rect
        x={x - 2}
        y={h - 4}
        width="16"
        height="4"
        rx="1"
        fill={STEEL_DARK}
        stroke={EDGE}
        strokeWidth="0.8"
      />
      <rect
        x={x + 1}
        y={beamTop + 2}
        width="10"
        height="10"
        rx="2"
        fill={STEEL_DARK}
        stroke={EDGE}
        strokeWidth="0.8"
      />
      <circle
        cx={x + 6}
        cy={beamTop + 7}
        r="3"
        fill={headOn ? LASER_CORE : "#4a1525"}
      />
      {headOn && (
        <circle cx={x + 6} cy={beamTop + 7} r="9" fill="url(#hz-glow-red)" />
      )}
      <path
        d={`M${x} 6 L${x + 6} 0 L${x + 12} 6Z`}
        fill="url(#hz-steel)"
        stroke={EDGE}
        strokeWidth="1"
      />
    </g>
  )
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} overflow="visible">
      {warn && (
        <g>
          <rect
            x="12"
            y={beamTop}
            width={w - 24}
            height="14"
            fill={LASER}
            opacity={blink(frame, 10) ? 0.2 : 0.08}
          />
          <line
            x1="12"
            x2={w - 12}
            y1={beamTop + 7}
            y2={beamTop + 7}
            stroke={LASER}
            strokeWidth="2.2"
            strokeDasharray="5 5"
            strokeDashoffset={-frame}
            opacity="0.95"
          />
        </g>
      )}
      {live && (
        <g opacity={0.9 + hash(frame + e.id) * 0.1}>
          <rect
            x="12"
            y={beamTop}
            width={w - 24}
            height="14"
            fill={LASER}
            opacity="0.25"
          />
          <rect
            x="12"
            y={beamTop + 3}
            width={w - 24}
            height="8"
            rx="4"
            fill={LASER}
          />
          <rect
            x="12"
            y={beamTop + 5.5}
            width={w - 24}
            height="3"
            rx="1.5"
            fill={LASER_CORE}
          />
        </g>
      )}
      {post(0)}
      {post(w - 12)}
    </svg>
  )
}

function OverheadLaser({ e, frame, state }: ArtProps) {
  const { w } = e
  const live = state.phase === "active"
  const warn = state.phase === "warn"
  const beamY = OVERHEAD_BEAM_Y - e.y
  const mountTop = HUD_H + 4 - e.y
  const emitter = (x: number, flip: boolean) => (
    <g transform={flip ? `translate(${2 * x} 0) scale(-1 1)` : undefined}>
      <line
        x1={x + 4}
        x2={x + 4}
        y1={mountTop}
        y2={beamY - 10}
        stroke="#1c2436"
        strokeWidth="3"
      />
      <line
        x1={x + 4}
        x2={x + 4}
        y1={mountTop}
        y2={beamY - 10}
        stroke={STEEL_LIGHT}
        strokeWidth="0.8"
        opacity="0.5"
      />
      <path
        d={`M${x - 4} ${beamY - 12} L${x + 12} ${beamY - 12} L${x + 14} ${beamY + 10} L${x - 4} ${beamY + 10}Z`}
        fill="url(#hz-steel)"
        stroke={EDGE}
        strokeWidth="1.2"
      />
      <rect
        x={x + 6}
        y={beamY - 2}
        width="9"
        height="10"
        rx="2"
        fill={STEEL_DARK}
      />
      <circle
        cx={x + 11}
        cy={beamY + 3}
        r="2.6"
        fill={live || (warn && blink(frame, 10)) ? LASER_CORE : "#4a1525"}
      />
      <rect
        x={x - 4}
        y={beamY + 10}
        width="18"
        height="3"
        fill="url(#hz-stripes)"
      />
    </g>
  )
  return (
    <svg width={w} height="70" viewBox="0 0 150 70" overflow="visible">
      {warn && (
        <g>
          <line
            x1="12"
            x2={w - 12}
            y1={beamY + 3}
            y2={beamY + 3}
            stroke={LASER}
            strokeWidth="2.2"
            strokeDasharray="6 5"
            strokeDashoffset={frame * 1.5}
            opacity={0.7 + state.t * 0.3}
          />
          <rect
            x="12"
            y={beamY - 4}
            width={w - 24}
            height="20"
            fill={LASER}
            opacity={0.06 + state.t * 0.1}
          />
          {/* Floor-to-beam “do not jump” chevrons */}
          {[w * 0.35, w * 0.65].map((x) => (
            <path
              key={x}
              d={`M${x - 5} ${beamY - 8} L${x} ${beamY - 13} L${x + 5} ${beamY - 8}`}
              stroke={LASER}
              strokeWidth="1.4"
              fill="none"
              opacity={blink(frame, 12) ? 0.9 : 0.3}
            />
          ))}
        </g>
      )}
      {live && (
        <g opacity={0.9 + hash(frame + e.id) * 0.1}>
          <rect
            x="12"
            y={beamY - 4}
            width={w - 24}
            height="20"
            fill={LASER}
            opacity="0.16"
          />
          <rect
            x="12"
            y={beamY}
            width={w - 24}
            height="12"
            rx="6"
            fill={LASER}
            opacity="0.85"
          />
          <rect
            x="12"
            y={beamY + 4}
            width={w - 24}
            height="4"
            rx="2"
            fill={LASER_CORE}
          />
        </g>
      )}
      {emitter(0, false)}
      {emitter(w, true)}
    </svg>
  )
}

function ScannerDrone({ e, frame, state }: ArtProps) {
  const { w, h } = e
  const live = state.phase === "active"
  const warn = state.phase === "warn"
  const beamTop = 28
  const beamBottom = SCAN_FLOOR - e.y
  const sweep = beamTop + ((frame * 2.2) % (beamBottom - beamTop))
  const flame = 3 + hash(frame + e.id) * 3
  return (
    <svg
      width={w}
      height={beamBottom}
      viewBox={`0 0 ${w} ${beamBottom}`}
      overflow="visible"
    >
      {warn && (
        <g>
          <path
            d={`M17 ${beamTop} L13 ${beamBottom} L41 ${beamBottom} L37 ${beamTop}Z`}
            fill={CYAN}
            opacity={blink(frame, 10) ? 0.14 : 0.06}
          />
          <path
            d={`M17 ${beamTop} L${17 - 4} ${beamBottom} M37 ${beamTop} L${37 + 4} ${beamBottom}`}
            stroke={CYAN}
            strokeWidth="1.8"
            strokeDasharray="4 4"
            opacity="0.9"
          />
        </g>
      )}
      {live && (
        <g>
          <path
            d={`M17 ${beamTop} L13 ${beamBottom} L41 ${beamBottom} L37 ${beamTop}Z`}
            fill="url(#hz-scan)"
          />
          <line
            x1="14"
            x2="40"
            y1={sweep}
            y2={sweep}
            stroke="#e8feff"
            strokeWidth="1.4"
            opacity="0.85"
          />
          <line
            x1="13"
            x2="41"
            y1={beamBottom}
            y2={beamBottom}
            stroke={CYAN}
            strokeWidth="2"
          />
        </g>
      )}
      {[10, w - 10].map((x) => (
        <path
          key={x}
          d={`M${x - 2.5} ${h - 4} L${x} ${h + flame} L${x + 2.5} ${h - 4}Z`}
          fill={CYAN}
          opacity="0.8"
        />
      ))}
      <path
        d={`M0 ${h * 0.5} L8 6 L${w - 8} 6 L${w} ${h * 0.5} L${w - 6} ${h - 4} L6 ${h - 4}Z`}
        fill="url(#hz-steel)"
        stroke={EDGE}
        strokeWidth="1.2"
      />
      <path
        d={`M14 8 Q ${w / 2} -6, ${w - 14} 8`}
        fill="url(#hz-dark)"
        stroke={EDGE}
        strokeWidth="1"
      />
      <rect x="16" y={h - 8} width="22" height="6" rx="3" fill="#0a0d16" />
      <circle
        cx={w / 2}
        cy={h - 5}
        r="2.6"
        fill={live ? "#f2feff" : warn ? CYAN : "#1b4b55"}
      />
      {(live || warn) && (
        <circle
          cx={w / 2}
          cy={h - 5}
          r="9"
          fill="url(#hz-glow-cyan)"
          opacity="0.6"
        />
      )}
    </svg>
  )
}

function HoverMine({ e, frame }: ArtProps) {
  const { w, h } = e
  const spin = (frame * 1.4 + e.id * 30) % 360
  const core = blink(frame + e.id * 3, 26, 0.35)
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} overflow="visible">
      <g transform={`rotate(${spin} ${w / 2} ${h / 2})`}>
        {Array.from({ length: 8 }, (_, i) => (
          <path
            key={i}
            d={`M${w / 2 - 2} 3 L${w / 2} -3 L${w / 2 + 2} 3Z`}
            fill={STEEL_LIGHT}
            stroke={EDGE}
            strokeWidth="0.6"
            transform={`rotate(${i * 45} ${w / 2} ${h / 2})`}
          />
        ))}
      </g>
      <circle
        cx={w / 2}
        cy={h / 2}
        r={w / 2 - 4}
        fill="url(#hz-steel)"
        stroke={EDGE}
        strokeWidth="1.2"
      />
      <path
        d={`M${w / 2 - 9} ${h / 2} L${w / 2 + 9} ${h / 2}`}
        stroke={STEEL_DARK}
        strokeWidth="2"
      />
      <circle cx={w / 2} cy={h / 2} r="4.5" fill={STEEL_DARK} />
      <circle cx={w / 2} cy={h / 2} r="3" fill={core ? "#fff1df" : AMBER} />
      <circle
        cx={w / 2}
        cy={h / 2}
        r={core ? 14 : 9}
        fill="url(#hz-glow-amber)"
        opacity={core ? 0.8 : 0.4}
      />
    </svg>
  )
}

function Crusher({ e, frame }: ArtProps) {
  const { w } = e
  const c = crusherPhase(frame - e.spawnFrame + e.cycleOffset)
  const bottom = crusherHeadBottom(e, frame) - e.y
  const shake = c.stage === "warn" ? (hash(frame) - 0.5) * 2.4 : 0
  const top = bottom - CRUSHER_HEAD_H
  const floor = GROUND_Y - e.y
  const warnGlow = c.stage === "warn" ? (blink(frame, 10) ? 1 : 0.35) : 0
  const impact =
    c.stage === "hold"
      ? 1 - c.t
      : c.stage === "rise" && c.t < 0.2
        ? 0.2 - c.t
        : 0
  return (
    <svg
      width={w}
      height={floor}
      viewBox={`0 0 ${w} ${floor}`}
      overflow="visible"
    >
      {/* Floor target marking telegraphs the strike zone */}
      <rect
        x="2"
        y={floor - 4}
        width={w - 4}
        height="4"
        fill="url(#hz-stripes)"
        opacity={0.45 + warnGlow * 0.55}
      />
      {c.stage === "warn" && (
        <rect
          x="2"
          y={bottom}
          width={w - 4}
          height={Math.max(0, floor - bottom)}
          fill={AMBER}
          opacity={0.04 + warnGlow * 0.08}
        />
      )}
      {/* Rail mount */}
      <rect
        x="-6"
        y="0"
        width={w + 12}
        height="10"
        rx="2"
        fill="url(#hz-steel)"
        stroke={EDGE}
        strokeWidth="1.2"
      />
      <rect
        x="8"
        y="10"
        width={w - 16}
        height="14"
        fill="url(#hz-dark)"
        stroke={EDGE}
        strokeWidth="1"
      />
      {/* Piston */}
      <rect
        x="22"
        y="22"
        width="14"
        height={Math.max(0, top - 22)}
        fill="url(#hz-steel-h)"
        stroke={EDGE}
        strokeWidth="1"
      />
      <rect
        x="26"
        y="22"
        width="2"
        height={Math.max(0, top - 22)}
        fill="#c7d4ea"
        opacity="0.5"
      />
      <g transform={`translate(${shake} 0)`}>
        <rect
          x="0"
          y={top}
          width={w}
          height={CRUSHER_HEAD_H}
          rx="3"
          fill="url(#hz-steel)"
          stroke={EDGE}
          strokeWidth="1.4"
        />
        <rect
          x="3"
          y={top + CRUSHER_HEAD_H - 9}
          width={w - 6}
          height="6"
          fill="url(#hz-stripes)"
        />
        <rect
          x="6"
          y={top + 6}
          width={w - 12}
          height="5"
          rx="2"
          fill={STEEL_DARK}
        />
        {[12, w - 12].map((x) => (
          <circle
            key={x}
            cx={x}
            cy={top + 8.5}
            r="2.2"
            fill={warnGlow > 0.5 ? AMBER : "#5a3d1a"}
          />
        ))}
        {warnGlow > 0 && (
          <rect
            x="-4"
            y={top - 4}
            width={w + 8}
            height={CRUSHER_HEAD_H + 8}
            fill="url(#hz-glow-amber)"
            opacity={warnGlow * 0.35}
          />
        )}
      </g>
      {c.stage === "slam" && (
        <g opacity="0.6">
          {[10, 24, 38, 50].map((x) => (
            <line
              key={x}
              x1={x}
              x2={x}
              y1={top - 30}
              y2={top - 6}
              stroke="#dbe6f7"
              strokeWidth="1.2"
            />
          ))}
        </g>
      )}
      {impact > 0 && (
        <g opacity={impact}>
          <ellipse
            cx={w / 2}
            cy={floor - 2}
            rx={w * (1.2 - impact * 0.4)}
            ry="6"
            fill="none"
            stroke="#e6edf7"
            strokeWidth="2"
          />
          {[-1, 1].map((s) => (
            <path
              key={s}
              d={`M${w / 2 + s * w * 0.55} ${floor - 2} l${s * 10} -8`}
              stroke={AMBER}
              strokeWidth="1.6"
            />
          ))}
        </g>
      )}
    </svg>
  )
}

const ART: Record<HazardBody["type"], (props: ArtProps) => ReactNode> = {
  roadblock: Roadblock,
  rock: Debris,
  barrier: LaserPylonStatic,
  crawler: Crawler,
  spiderDrone: SpiderBot,
  hoverDrone: HoverDrone,
  sentry: Sentry,
  pulseGate: PulseGate,
  floorLaser: FloorLaser,
  laserPylon: LaserPylon,
  overheadLaser: OverheadLaser,
  scannerDrone: ScannerDrone,
  hoverMine: HoverMine,
  crusher: Crusher,
}

interface ViewEntity extends HazardBody {
  id: number
  cue?: boolean
}

interface ViewProps {
  e: ViewEntity
  frame: number
  highContrast: boolean
}

function HazardView({ e, frame, highContrast }: ViewProps) {
  const spec = HAZARDS[e.type]
  const state = hazardState(e, frame)
  const Art = ART[e.type]
  const energised =
    spec.cycle !== undefined || e.type === "crusher"
      ? state.phase !== "off"
      : true
  const style: CSSProperties = {
    position: "absolute",
    left: e.x,
    top: e.y,
    width: e.w,
    height: e.h,
    pointerEvents: "none",
    filter: highContrast
      ? "contrast(1.35) drop-shadow(0 0 1.5px #fff)"
      : "drop-shadow(0 2px 2px rgba(0,0,0,.55))",
  }
  // Crusher art spans the column; everything else draws in its footprint.
  if (e.type === "crusher") style.height = GROUND_Y - e.y
  const cueVisible = e.cue && e.x > 150
  return (
    <div style={style} data-hazard={e.type} data-phase={state.phase}>
      {cueVisible && (
        <div
          className="hazard-cue"
          style={{
            color: spec.cueColor,
            bottom: "auto",
            top: e.type === "crusher" ? CRUSHER_RAISED_BOTTOM - e.y + 6 : -22,
            opacity: energised ? 1 : 0.85,
          }}
        >
          {spec.cue}
        </div>
      )}
      <Art e={e} frame={frame} state={state} />
    </div>
  )
}

export default memo(HazardView)

// ── Effects ──────────────────────────────────────────────────────────────────
export interface HazardEffect {
  id: number
  kind: "crush" | "hit"
  x: number
  y: number
  born: number
  color: string
}

interface EffectsProps {
  effects: readonly HazardEffect[]
  frame: number
  reduced: boolean
}

export function HazardEffects({ effects, frame, reduced }: EffectsProps) {
  return (
    <>
      {effects.map((fx) => {
        const age = frame - fx.born
        const life = fx.kind === "crush" ? 34 : 24
        if (age > life) return null
        const t = age / life
        const shards = reduced ? 4 : fx.kind === "crush" ? 9 : 6
        return (
          <svg
            key={fx.id}
            width="120"
            height="120"
            viewBox="-60 -60 120 120"
            style={{
              position: "absolute",
              left: fx.x - 60,
              top: fx.y - 60,
              pointerEvents: "none",
              overflow: "visible",
              zIndex: 3,
            }}
          >
            <circle
              r={8 + t * (fx.kind === "crush" ? 34 : 20)}
              fill="none"
              stroke={fx.color}
              strokeWidth={3 * (1 - t)}
              opacity={1 - t}
            />
            {fx.kind === "crush" && (
              <circle r={14 * (1 - t)} fill="#fff7d1" opacity={(1 - t) * 0.8} />
            )}
            {Array.from({ length: shards }, (_, i) => {
              const a = (i / shards) * Math.PI * 2 + hash(fx.id + i) * 0.6
              const d =
                6 +
                t *
                  (fx.kind === "crush" ? 46 : 26) *
                  (0.7 + hash(fx.id * 3 + i) * 0.5)
              const x = Math.cos(a) * d
              const y = Math.sin(a) * d + t * t * 18
              return fx.kind === "crush" ? (
                <rect
                  key={i}
                  x={x - 2.5}
                  y={y - 1.5}
                  width="5"
                  height="3"
                  fill={i % 2 ? STEEL_LIGHT : fx.color}
                  opacity={1 - t}
                  transform={`rotate(${(a * 180) / Math.PI + age * 12} ${x} ${y})`}
                />
              ) : (
                <line
                  key={i}
                  x1={x * 0.5}
                  y1={y * 0.5}
                  x2={x}
                  y2={y}
                  stroke={i % 2 ? "#ffffff" : fx.color}
                  strokeWidth="1.6"
                  opacity={1 - t}
                />
              )
            })}
          </svg>
        )
      })}
    </>
  )
}
