import type { CSSProperties } from "react"

interface LogoProps {
  size?: "sm" | "md" | "lg" | "xl"
  hideTagline?: boolean
  /**
   * Full animated identity: entrance (L activation, arrow streak, letter
   * reveal, sheen, tagline) followed by a continuous idle loop. Shared by the
   * loading screen and the main menu.
   */
  animated?: boolean
  /** Gentler idle (Reduce Effects / reduced motion): no flicker or streaks. */
  calm?: boolean
  /** Seconds before the entrance starts. */
  introDelay?: number
  /** Entrance speed multiplier (<1 = faster), e.g. a quicker menu return. */
  introScale?: number
  /** Fully lit state (loading-screen finale). */
  charged?: boolean
}

const sizes = {
  sm: { title: 18, icon: 22, gap: 2 },
  md: { title: 28, icon: 34, gap: 3 },
  lg: { title: 44, icon: 54, gap: 4 },
  xl: { title: 62, icon: 76, gap: 6 },
}

const LETTERS = ["L", "O", "U", "D", "A", "S", "H"] as const
const TAGLINE = "Run · Dodge · Survive"

/**
 * Entrance timeline in seconds (before `introScale`). The whole reveal fits
 * inside 0.8 s so the loading screen's first act can show it completely.
 */
const T = {
  mark: 0,
  arrow: 0.18,
  letters: 0.12,
  letterStep: 0.055,
  sheen: 0.5,
  tagline: 0.46,
}

export default function LouDashLogo({
  size = "md",
  hideTagline = false,
  animated = false,
  calm = false,
  introDelay = 0,
  introScale = 1,
  charged = false,
}: LogoProps) {
  const s = sizes[size]
  const at = (t: number) => `${(introDelay + t * introScale).toFixed(3)}s`
  const vars = {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 4,
    "--logo-scale": introScale,
    "--logo-mark-at": at(T.mark),
    "--logo-arrow-at": at(T.arrow),
    "--logo-sheen-at": at(T.sheen),
    "--logo-tag-at": at(T.tagline),
    // Idle loops begin once the entrance has finished.
    "--logo-idle-at": at(1),
  } as CSSProperties

  const className = [
    "logo",
    animated && "logo-live",
    animated && calm && "logo-calm",
    charged && "logo-charged",
  ]
    .filter(Boolean)
    .join(" ")

  return (
    <div className={className} style={vars}>
      <div
        className="logo-lockup"
        style={{
          display: "flex",
          alignItems: "center",
          gap: s.gap,
          position: "relative",
        }}
      >
        {animated && !calm && (
          <span className="logo-speedlines" aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
        )}
        {/* Stylized L mark */}
        <svg
          width={s.icon}
          height={s.icon}
          viewBox="0 0 54 54"
          className="logo-mark"
          aria-hidden="true"
          style={{
            flexShrink: 0,
            overflow: "visible",
            filter: animated ? undefined : "drop-shadow(0 0 8px #00e5c8)",
          }}
        >
          {/* L shape */}
          <g className="logo-l">
            <rect x="8" y="4" width="10" height="40" rx="3" fill="#00e5c8" />
            <rect x="8" y="38" width="30" height="10" rx="3" fill="#00e5c8" />
            {animated && (
              <>
                {/* Energy core that runs down and along the L when it powers up. */}
                <rect
                  className="logo-l-core"
                  x="11.5"
                  y="7"
                  width="3"
                  height="34"
                  rx="1.5"
                  fill="#e9fffb"
                />
                <rect
                  className="logo-l-core is-foot"
                  x="11.5"
                  y="41.5"
                  width="23"
                  height="3"
                  rx="1.5"
                  fill="#e9fffb"
                />
              </>
            )}
          </g>
          {/* Speed lines / arrow */}
          <g className="logo-arrow-group">
            <line
              className="logo-arrow-line"
              x1="24"
              y1="24"
              x2="48"
              y2="8"
              stroke="#ffe434"
              strokeWidth="3.5"
              strokeLinecap="round"
              pathLength={1}
            />
            <line
              className="logo-arrow-line is-thin"
              x1="24"
              y1="32"
              x2="48"
              y2="16"
              stroke="#ffe434"
              strokeWidth="2"
              strokeLinecap="round"
              opacity="0.55"
              pathLength={1}
            />
            <polygon
              className="logo-arrow"
              points="48,4 54,14 42,14"
              fill="#ffe434"
            />
            {animated && (
              // A spark of energy that travels along the arrow shaft.
              <circle className="logo-arrow-spark" r="2.4" fill="#fffbe0" />
            )}
          </g>
        </svg>

        {/* Wordmark: individual letters so the lettering itself animates. */}
        <div className="logo-wordwrap" style={{ lineHeight: 1, position: "relative" }}>
          <div
            className="font-orbitron logo-word"
            aria-label="LOUDASH"
            style={{
              fontSize: s.title,
              fontWeight: 900,
              letterSpacing: "0.06em",
              color: "#f0f8ff",
              textShadow: "0 0 24px rgba(0,229,200,0.4)",
              whiteSpace: "nowrap",
            }}
          >
            {LETTERS.map((ch, i) => (
              <span
                key={i}
                aria-hidden="true"
                className={`logo-ch${i >= 3 ? " is-dash" : ""}`}
                style={
                  {
                    "--ch-in": at(T.letters + i * T.letterStep),
                    "--ch-i": i,
                    color: i >= 3 ? "#00e5c8" : undefined,
                  } as CSSProperties
                }
              >
                <span className="logo-ch-i">{ch}</span>
              </span>
            ))}
          </div>
          {animated && (
            <div
              className="font-orbitron logo-sheen"
              aria-hidden="true"
              style={{
                fontSize: s.title,
                fontWeight: 900,
                letterSpacing: "0.06em",
                whiteSpace: "nowrap",
              }}
            >
              LOUDASH
            </div>
          )}
        </div>
      </div>

      {!hideTagline && (
        <div
          className="font-mono logo-tagline"
          style={{
            fontSize: Math.max(12, s.title * 0.38),
            letterSpacing: "0.22em",
            color: "#a6b8d6",
            textShadow: "0 1px 8px rgba(5,8,18,0.95), 0 0 2px rgba(5,8,18,0.9)",
            textTransform: "uppercase",
          }}
        >
          {TAGLINE}
        </div>
      )}
    </div>
  )
}
