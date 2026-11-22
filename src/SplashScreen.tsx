import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react"
import LouDashLogo from "./Logo"
import { getArtProgress, preloadGameArt, subscribeArtProgress } from "./gameArt"
import { preloadAudio } from "./audio"

/** The loading presentation always lasts exactly this long. */
export const SPLASH_MS = 3500
/** Cross-fade into the Main Menu, inside the final part of SPLASH_MS. */
const EXIT_MS = 400
/** Cinematic acts (ms): logo reveal → energy → finale. */
const ACT_ENERGY_MS = 800
const ACT_FINALE_MS = 2800
/** The progress bar fills smoothly across this window. */
const PROGRESS_FROM_MS = 600
const PROGRESS_TO_MS = 3000
/** When the menu is mounted underneath for a seamless hand-off. */
const PRIME_MS = 2950

interface Props {
  onDone: () => void
  /** Called shortly before the end so the next screen can mount underneath. */
  onPrime?: () => void
  /** Reduced Effects: keep the presentation calm (no particles or sweeps). */
  reduceEffects?: boolean
}

/** Status lines, each shown from its share of the progress onward. */
const STAGES: [number, string][] = [
  [0, "INITIALIZING CORE"],
  [0.12, "LOADING RUNNER RIGS"],
  [0.36, "BUILDING ENVIRONMENTS"],
  [0.6, "CALIBRATING AUDIO"],
  [0.84, "SYNCING SIGNAL GRID"],
]

const SYSTEMS = ["RIG", "ENV", "AUDIO", "GRID"] as const

function seeded(i: number, n: number) {
  const x = Math.sin((i + 1) * 12.9898 + n * 78.233) * 43758.5453
  return x - Math.floor(x)
}

const PARTICLES = Array.from({ length: 28 }, (_, i) => ({
  left: seeded(i, 1) * 844,
  top: 40 + seeded(i, 2) * 330,
  size: 1 + seeded(i, 3) * 2,
  duration: 4 + seeded(i, 4) * 5,
  delay: -seeded(i, 5) * 8,
  color: seeded(i, 6) < 0.6 ? "#7fe9ff" : "#c4a6ff",
}))

/** Ticks on the outer HUD ring, precomputed once. */
const RING_TICKS = Array.from({ length: 72 }, (_, i) => {
  const a = (i / 72) * Math.PI * 2
  const long = i % 6 === 0
  const r1 = long ? 150 : 154
  return {
    x1: Math.cos(a) * r1,
    y1: Math.sin(a) * r1,
    x2: Math.cos(a) * 160,
    y2: Math.sin(a) * 160,
    long,
  }
})

/** Smooth start and finish, steady in the middle. */
function easeProgress(t: number) {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2
}

export default function SplashScreen({
  onDone,
  onPrime,
  reduceEffects = false,
}: Props) {
  const art = useSyncExternalStore(subscribeArtProgress, getArtProgress)
  const [stage, setStage] = useState(0)
  const [exiting, setExiting] = useState(false)
  const [act, setAct] = useState<"reveal" | "energy" | "finale">("reveal")
  const [audioReady, setAudioReady] = useState(false)
  // The timeline starts on the splash's first painted frame (what the player
  // actually sees), not at render or when effects happen to run.
  const startRef = useRef<number | null>(null)
  const fillRef = useRef<HTMLDivElement>(null)
  const percentRef = useRef<HTMLSpanElement>(null)
  const barRef = useRef<HTMLDivElement>(null)
  const doneRef = useRef(onDone)
  doneRef.current = onDone
  const primeRef = useRef(onPrime)
  primeRef.current = onPrime

  // Fixed timeline: the screen neither finishes early nor waits on slow
  // assets. Art and audio keep loading in the background if they are not
  // finished by the end (the menu and runs work without them).
  useEffect(() => {
    void preloadGameArt()
    let alive = true
    void preloadAudio().then(() => {
      if (alive) setAudioReady(true)
    })

    let start = 0
    let raf = 0
    let lastStage = -1
    const timers: number[] = []
    const frame = (now: number) => {
      const elapsedMs = Math.max(0, now - start)
      const t = Math.min(1, elapsedMs / SPLASH_MS)
      const p = Math.min(
        1,
        Math.max(
          0,
          (elapsedMs - PROGRESS_FROM_MS) / (PROGRESS_TO_MS - PROGRESS_FROM_MS),
        ),
      )
      const shown = easeProgress(p)
      const pct = Math.round(shown * 100)
      if (fillRef.current)
        fillRef.current.style.transform = `scaleX(${shown.toFixed(4)})`
      if (barRef.current) {
        barRef.current.style.setProperty("--p", shown.toFixed(4))
        barRef.current.setAttribute("aria-valuenow", String(pct))
      }
      if (percentRef.current)
        percentRef.current.textContent = String(pct).padStart(3, "0")
      let next = 0
      for (let i = 0; i < STAGES.length; i++) if (p >= STAGES[i][0]) next = i
      if (next !== lastStage) {
        lastStage = next
        setStage(next)
      }
      if (t < 1) raf = requestAnimationFrame(frame)
    }
    const begin = () => {
      if (startRef.current === null) startRef.current = performance.now()
      start = startRef.current
      const elapsed = performance.now() - start
      const at = (ms: number, fn: () => void) =>
        timers.push(window.setTimeout(fn, Math.max(0, ms - elapsed)))
      at(ACT_ENERGY_MS, () => setAct("energy"))
      at(ACT_FINALE_MS, () => setAct("finale"))
      at(PRIME_MS, () => primeRef.current?.())
      at(SPLASH_MS - EXIT_MS, () => setExiting(true))
      at(SPLASH_MS, () => doneRef.current())
      raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(begin)

    return () => {
      alive = false
      cancelAnimationFrame(raf)
      timers.forEach((timer) => window.clearTimeout(timer))
    }
  }, [])

  const artShare = art.total > 0 ? art.settled / art.total : 0
  const systemsOnline = [
    artShare >= 0.5,
    art.done,
    audioReady,
    stage >= STAGES.length - 1,
  ]
  const status =
    act === "finale"
      ? art.done
        ? "SYSTEMS ONLINE"
        : "STARTING"
      : STAGES[stage][1]

  return (
    <div
      className={`splash is-${act}${reduceEffects ? " is-calm" : ""}${
        exiting ? " is-exiting" : ""
      }`}
      style={{ "--exit-ms": `${EXIT_MS}ms` } as React.CSSProperties}
    >
      <div className="splash-bg" aria-hidden="true">
        <div className="splash-glow splash-glow-a" />
        <div className="splash-glow splash-glow-b" />
        <div className="splash-horizon" />
        <div className="splash-grid" />
        <div className="splash-gridlight" />
        <div className="splash-circuit splash-circuit-a" />
        <div className="splash-circuit splash-circuit-b" />
        <svg
          className="splash-traces"
          viewBox="0 0 844 390"
          width="844"
          height="390"
        >
          <path d="M0 118 H120 L146 92 H250" />
          <path d="M0 262 H86 L112 288 H214 L232 306" />
          <path d="M844 104 H720 L694 130 H600" />
          <path d="M844 276 H760 L736 252 H628" />
          <circle cx="250" cy="92" r="2.5" />
          <circle cx="232" cy="306" r="2.5" />
          <circle cx="600" cy="130" r="2.5" />
          <circle cx="628" cy="252" r="2.5" />
        </svg>
        <div className="splash-scan" />
        {!reduceEffects &&
          PARTICLES.map((p, i) => (
            <span
              key={i}
              className="splash-particle"
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
        <div className="splash-flare" />
        <div className="splash-vignette" />
      </div>

      {/* Radial HUD behind the logo */}
      <svg
        className="splash-hud"
        aria-hidden="true"
        viewBox="-180 -180 360 360"
        width="360"
        height="360"
      >
        <defs>
          <radialGradient id="splash-core">
            <stop offset="0" stopColor="#00e5c8" stopOpacity="0.2" />
            <stop offset="0.55" stopColor="#6f5cff" stopOpacity="0.08" />
            <stop offset="1" stopColor="#6f5cff" stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle r="176" fill="url(#splash-core)" />
        <g className="splash-hud-ticks">
          {RING_TICKS.map((t, i) => (
            <line
              key={i}
              x1={t.x1}
              y1={t.y1}
              x2={t.x2}
              y2={t.y2}
              stroke={t.long ? "#5ff3e0" : "#2f4a86"}
              strokeWidth={t.long ? 1.4 : 1}
            />
          ))}
        </g>
        <g className="splash-hud-arcs">
          <circle r="138" className="splash-arc splash-arc-a" />
          <circle r="126" className="splash-arc splash-arc-b" />
        </g>
        <circle r="112" className="splash-arc splash-arc-c" />
        <circle r="168" className="splash-ring-pulse" />
      </svg>

      {/* Corner brackets with telemetry */}
      <div className="splash-corner is-tl" aria-hidden="true">
        <span className="font-mono">SYS · LD-06</span>
      </div>
      <div className="splash-corner is-tr" aria-hidden="true">
        <span className="font-mono">GRID 844×390</span>
      </div>
      <div className="splash-corner is-bl" aria-hidden="true" />
      <div className="splash-corner is-br" aria-hidden="true" />

      <div className="splash-systems font-mono" aria-hidden="true">
        {SYSTEMS.map((name, i) => (
          <span key={name} className={systemsOnline[i] ? "is-online" : ""}>
            <i />
            {name}
          </span>
        ))}
      </div>

      <div className="splash-logo">
        <LouDashLogo
          size="xl"
          animated
          calm={reduceEffects}
          introDelay={0.05}
          introScale={0.85}
          charged={act === "finale"}
        />
      </div>

      <div className="splash-loader">
        <div className="splash-loader-head font-mono">
          <span role="status" aria-live="polite" className="splash-status">
            {status}
            <span className="splash-ellipsis" aria-hidden="true" />
          </span>
          <span className="splash-percent" aria-hidden="true">
            <span ref={percentRef}>000</span>%
          </span>
        </div>
        <div
          ref={barRef}
          role="progressbar"
          aria-label="Loading LouDash"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={0}
          className="splash-bar"
        >
          <div ref={fillRef} className="splash-bar-fill" />
          <div className="splash-bar-head" />
          <div className="splash-bar-ticks" />
        </div>
      </div>

      <div className="splash-footer font-mono" aria-hidden="true">
        LOUDASH · RUNNER SYSTEMS
      </div>
    </div>
  )
}
