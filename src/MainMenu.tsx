import { memo, useEffect, useState } from "react"
import type { Screen, CharacterId, PlaceId, CharacterDef } from "./types"
import { CHARACTERS, PLACES } from "./types"
import LouDashLogo from "./Logo"
import MenuBackdrop, { MENU_ROAD_SPEED } from "./MenuBackdrop"
import CharacterArt from "./CharacterArt"
import { runCycleRate } from "./characterRig"
import { playConfirm, playUIClick } from "./audio"

interface Props {
  onNavigate: (s: Screen) => void
  highScores: number[]
  selectedChar: CharacterId
  selectedPlace: PlaceId
  /** Reduced Effects / OS reduced motion: calm the living backdrop. */
  reduceEffects?: boolean
  /** Seconds before the logo entrance plays (fixed at mount). */
  introDelay?: number
}

const RUNNER_W = 38
const RUNNER_H = 48
/** Where a foot touches down, measured from the runner box's left edge. */
const TOUCHDOWN_X = 27
/** Life of a footfall puff, in run cycles. */
const DUST_LIFE = 0.34
/** Dash burst: duration and pause range between bursts (seconds). */
const DASH_S = 0.95
const DASH_GAP: [number, number] = [4.5, 7.5]

interface RunnerState {
  phase: number
  /** Dash progress 0 → 1 while bursting, otherwise -1. */
  dash: number
}

/** Smooth 0 → 1 → 0 hump used for the dash surge. */
function hump(t: number) {
  return Math.sin(Math.PI * Math.min(1, Math.max(0, t)))
}

/**
 * Footfall puffs derived from the run phase itself: the near foot plants at
 * phase 0 and the far foot at 0.5 (see characterRig RUN_KEYS), so dust always
 * appears exactly on contact and drifts back with the scrolling road.
 */
function Footfalls({
  phase,
  driftPerCycle,
}: {
  phase: number
  driftPerCycle: number
}) {
  const puffs = [0, 0.5].map((offset) => {
    const since = (((phase - offset) % 1) + 1) % 1
    return since < DUST_LIFE ? { offset, age: since / DUST_LIFE, since } : null
  })
  return (
    <>
      {puffs.map((p) => {
        if (!p) return null
        const ease = 1 - Math.pow(1 - p.age, 2.4)
        const x = TOUCHDOWN_X - p.since * driftPerCycle
        return (
          <span key={p.offset} className="menu-runner-dust">
            <span
              className="menu-runner-dust-cloud"
              style={{
                transform: `translate3d(${(x - 8).toFixed(1)}px, 0, 0) scale(${(0.5 + ease * 0.9).toFixed(3)})`,
                opacity: (1 - p.age) * 0.9,
              }}
            />
            {[0, 1, 2].map((k) => (
              <i
                key={k}
                style={{
                  transform: `translate3d(${(x - ease * (6 + k * 7)).toFixed(1)}px, ${(-Math.sin(p.age * Math.PI) * (4 + k * 3)).toFixed(1)}px, 0)`,
                  opacity: 1 - p.age,
                }}
              />
            ))}
          </span>
        )
      })}
    </>
  )
}

/**
 * Live preview of the selected runner on the backdrop road, animated with the
 * same rig and run cycle as gameplay. The road scrolls like a treadmill, so
 * the cadence is derived from the road speed with gameplay's stance-travel
 * model: planted feet move with the lanes. Every few seconds the runner
 * surges forward in a short dash burst.
 */
const MenuRunner = memo(function MenuRunner({
  character,
  calm,
}: {
  character: CharacterDef
  calm: boolean
}) {
  const [run, setRun] = useState<RunnerState>({ phase: 0, dash: -1 })
  const cyclesPerSecond =
    runCycleRate(character.id, MENU_ROAD_SPEED / 60, RUNNER_H, 1) * 60
  useEffect(() => {
    let raf = 0
    let last = performance.now()
    let phase = 0
    let dashAt = -1
    let nextDash =
      last + (DASH_GAP[0] + Math.random() * (DASH_GAP[1] - DASH_GAP[0])) * 1000
    const step = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      let dash = -1
      if (!calm) {
        if (dashAt < 0 && now >= nextDash) dashAt = now
        if (dashAt >= 0) {
          dash = (now - dashAt) / (DASH_S * 1000)
          if (dash >= 1) {
            dash = -1
            dashAt = -1
            nextDash =
              now +
              (DASH_GAP[0] + Math.random() * (DASH_GAP[1] - DASH_GAP[0])) * 1000
          }
        }
      }
      // Cadence quickens during the burst, then settles back.
      const boost = dash >= 0 ? 1 + hump(dash) * 0.65 : 1
      phase = (phase + dt * cyclesPerSecond * boost) % 1000
      setRun({ phase, dash })
      raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [calm, cyclesPerSecond])

  const dashing = run.dash >= 0
  const surge = dashing ? hump(run.dash) : 0
  // Forward lunge, eased in quickly and released gently.
  const lunge = dashing ? Math.sin(Math.PI * Math.pow(run.dash, 0.7)) * 16 : 0
  const driftPerCycle = MENU_ROAD_SPEED / cyclesPerSecond

  return (
    <div
      className={`menu-runner${dashing ? " is-dashing" : ""}${calm ? " is-calm" : ""}`}
      aria-hidden="true"
      style={
        {
          "--runner-accent": character.accentColor,
          "--runner-surge": surge.toFixed(3),
        } as React.CSSProperties
      }
    >
      <span className="menu-runner-pool" />
      <span className="menu-runner-backlight" />
      <span className="menu-runner-trail">
        <i />
        <i />
        <i />
      </span>
      {!calm && (
        <span className="menu-runner-speed">
          <i />
          <i />
          <i />
          <i />
          <i />
          <i />
        </span>
      )}
      {!calm && (
        <Footfalls phase={run.phase} driftPerCycle={driftPerCycle} />
      )}
      <div
        className="menu-runner-move"
        style={{ transform: `translate3d(${lunge.toFixed(2)}px, 0, 0)` }}
      >
        {!calm && <span className="menu-runner-energy" />}
        {/* Afterimages only during the dash burst. */}
        {dashing &&
          [2, 1].map((k) => (
            <div
              key={k}
              className="menu-runner-ghost"
              style={{
                transform: `translate3d(${(-k * 11 * surge).toFixed(1)}px, 0, 0)`,
                opacity: surge * (k === 1 ? 0.42 : 0.22),
              }}
            >
              <CharacterArt
                character={character}
                width={RUNNER_W}
                height={RUNNER_H}
                pose="run"
                phase={run.phase - k * 0.07}
                groundShadow={false}
              />
            </div>
          ))}
        {/* Mirror on the glossy road surface */}
        <div className="menu-runner-reflection">
          <CharacterArt
            character={character}
            width={RUNNER_W}
            height={RUNNER_H}
            pose="run"
            phase={run.phase}
            groundShadow={false}
          />
        </div>
        <CharacterArt
          key={character.id}
          character={character}
          width={RUNNER_W}
          height={RUNNER_H}
          pose="run"
          phase={run.phase}
        />
      </div>
    </div>
  )
})

function PrimaryBtn({
  label,
  onClick,
  delay = 0,
}: {
  label: string
  onClick: () => void
  delay?: number
}) {
  return (
    <button
      type="button"
      onClick={() => {
        playConfirm()
        onClick()
      }}
      className="menu-play font-orbitron"
      style={{ "--menu-delay": `${delay}s` } as React.CSSProperties}
    >
      <svg
        className="menu-play-icon"
        viewBox="0 0 12 14"
        width="12"
        height="14"
        aria-hidden="true"
      >
        <path d="M1 1.2v11.6c0 .6.7 1 1.2.7l9.3-5.8c.5-.3.5-1.1 0-1.4L2.2.5C1.7.2 1 .6 1 1.2Z" />
      </svg>
      {label}
    </button>
  )
}

function SecondaryBtn({
  label,
  onClick,
  delay = 0,
}: {
  label: string
  onClick: () => void
  delay?: number
}) {
  return (
    <button
      type="button"
      onClick={() => {
        playUIClick()
        onClick()
      }}
      className="menu-secondary font-outfit"
      style={{ "--menu-delay": `${delay}s` } as React.CSSProperties}
    >
      <span className="menu-secondary-label">{label}</span>
      <span className="menu-secondary-arrow" aria-hidden="true">
        ›
      </span>
    </button>
  )
}

function SummaryButton({
  label,
  title,
  detail,
  accent,
  onClick,
  delay,
}: {
  label: string
  title: string
  detail?: string
  accent: string
  onClick: () => void
  delay: number
}) {
  return (
    <button
      type="button"
      className="menu-summary-card"
      aria-label={`Change ${label.toLowerCase()}: ${title}`}
      onClick={() => {
        playUIClick()
        onClick()
      }}
      style={
        {
          "--summary-accent": accent,
          "--summary-delay": `${delay}s`,
        } as React.CSSProperties
      }
    >
      <span className="menu-summary-copy">
        <span className="menu-summary-label font-mono">{label}</span>
        <span className="menu-summary-value">
          <strong className="font-orbitron">{title}</strong>
          {detail && <span>· {detail}</span>}
        </span>
      </span>
      <span className="menu-summary-action font-mono" aria-hidden="true">
        CHANGE <span>→</span>
      </span>
    </button>
  )
}

export default function MainMenu({
  onNavigate,
  highScores,
  selectedChar,
  selectedPlace,
  reduceEffects = false,
  introDelay = 0.05,
}: Props) {
  // Frozen at mount: the entrance must not restart when the splash hands off.
  const [logoDelay] = useState(introDelay)
  const best = highScores[0] ?? 0
  const char = CHARACTERS.find((c) => c.id === selectedChar)!
  const place = PLACES.find((p) => p.id === selectedPlace)!

  return (
    <div
      className={`main-menu${reduceEffects ? " reduce-effects" : ""}`}
      style={{
        ["--place-accent" as string]: place.accentColor,
        position: "absolute",
        inset: 0,
        background: "#080c18",
        display: "flex",
        alignItems: "center",
        overflow: "hidden",
      }}
    >
      <MenuBackdrop calm={reduceEffects} place={selectedPlace} />
      <MenuRunner character={char} calm={reduceEffects} />

      {/* Left: Logo + info */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          paddingLeft: 48,
          gap: 12,
          position: "relative",
          zIndex: 1,
        }}
      >
        <div style={{ animation: "fade-in 0.5s ease both" }}>
          <LouDashLogo
            size="lg"
            animated
            calm={reduceEffects}
            introDelay={logoDelay}
            introScale={1.15}
          />
        </div>

        <div className="menu-summary-stack">
          <SummaryButton
            label="CHARACTER"
            title={char.name}
            detail={char.role}
            accent={char.accentColor}
            onClick={() => onNavigate("charSelect")}
            delay={0.26}
          />
          <SummaryButton
            label="ACTIVE PLACE"
            title={place.name}
            accent={place.accentColor}
            onClick={() => onNavigate("placeSelect")}
            delay={0.32}
          />
        </div>

        {best > 0 && (
          <div className="menu-best font-mono">
            BEST: <strong>{best.toLocaleString()}</strong>
          </div>
        )}
      </div>

      {/* Divider */}
      <div
        className="menu-divider"
        style={{ position: "relative", zIndex: 1 }}
      />

      {/* Right: Buttons */}
      <div
        style={{
          width: 268,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          paddingRight: 28,
          position: "relative",
          zIndex: 1,
        }}
      >
        <div className="menu-panel">
          <PrimaryBtn
            label="PLAY"
            onClick={() => onNavigate("gameplay")}
            delay={0.15}
          />


          <SecondaryBtn
            label="CHARACTERS"
            onClick={() => onNavigate("charSelect")}
            delay={0.23}
          />
          <SecondaryBtn
            label="PLACES"
            onClick={() => onNavigate("placeSelect")}
            delay={0.3}
          />
          <SecondaryBtn
            label="HOW TO PLAY"
            onClick={() => onNavigate("howToPlay")}
            delay={0.37}
          />
          <SecondaryBtn
            label="HIGH SCORE"
            onClick={() => onNavigate("highScore")}
            delay={0.44}
          />
          <SecondaryBtn
            label="SETTINGS"
            onClick={() => onNavigate("settings")}
            delay={0.51}
          />
        </div>
      </div>
    </div>
  )
}
