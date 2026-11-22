import { useEffect } from "react"
import { playBack } from "./audio"

interface Props {
  onBack: () => void
}

function Section({
  title,
  accent = "#00e5c8",
  children,
}: {
  title: string
  accent?: string
  children: React.ReactNode
}) {
  return (
    <div
      style={{
        background: "#0f1830",
        border: "1px solid #26396b",
        borderRadius: 10,
        padding: "12px 16px 12px 18px",
        // Accent rail makes each topic quick to find while scrolling.
        boxShadow: `inset 3px 0 0 ${accent}`,
      }}
    >
      <div
        className="font-orbitron"
        style={{
          fontSize: 13,
          letterSpacing: "0.16em",
          color: accent,
          marginBottom: 10,
        }}
      >
        {title}
      </div>
      {children}
    </div>
  )
}

function Row({
  icon,
  label,
  note,
}: {
  icon: React.ReactNode
  label: React.ReactNode
  note?: string
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        marginBottom: 6,
      }}
    >
      <div style={{ width: 44, textAlign: "center", flexShrink: 0 }}>
        {icon}
      </div>
      <div
        className="font-outfit"
        style={{ fontSize: 13, color: "#b6c9e4", lineHeight: 1.4, flex: 1 }}
      >
        {label}
      </div>
      {note && (
        <div className="font-mono" style={{ fontSize: 12, color: "#ffe434" }}>
          {note}
        </div>
      )}
    </div>
  )
}

function ObstaclePill({ label, color }: { label: string; color: string }) {
  return (
    <div
      style={{
        padding: "3px 10px",
        borderRadius: 6,
        border: `1px solid ${color}80`,
        background: `${color}10`,
        color,
        fontSize: 12,
        fontFamily: "JetBrains Mono, monospace",
        letterSpacing: "0.08em",
      }}
    >
      {label}
    </div>
  )
}

const iconText: React.CSSProperties = {
  fontSize: 11,
  letterSpacing: "0.06em",
  color: "#a9c0df",
}

const mutedText: React.CSSProperties = { fontSize: 13, color: "#a9bcd8" }

function Key({ children }: { children: React.ReactNode }) {
  return (
    <kbd
      className="font-mono"
      style={{
        display: "inline-block",
        minWidth: 20,
        margin: "0 1px",
        padding: "1px 6px 2px",
        textAlign: "center",
        fontSize: 11,
        fontWeight: 700,
        color: "#e8f0ff",
        background: "#1a2646",
        border: "1px solid #3a5190",
        borderBottomWidth: 2,
        borderRadius: 5,
      }}
    >
      {children}
    </kbd>
  )
}

const statLine: React.CSSProperties = {
  display: "flex",
  gap: 8,
  alignItems: "baseline",
  margin: "8px 0",
}

const chip: React.CSSProperties = {
  display: "flex",
  alignItems: "baseline",
  gap: 6,
  padding: "4px 8px",
  background: "#080c18",
  borderRadius: 6,
}

function Text({
  children,
  style,
}: {
  children: React.ReactNode
  style?: React.CSSProperties
}) {
  return (
    <div
      className="font-outfit"
      style={{ fontSize: 13, color: "#b6c9e4", lineHeight: 1.5, ...style }}
    >
      {children}
    </div>
  )
}

function HazardGroup({
  title,
  note,
  items,
  color,
}: {
  title: string
  note: string
  items: string[]
  color: string
}) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: "flex", gap: 8, alignItems: "baseline", marginBottom: 6 }}>
        <span className="font-mono" style={{ fontSize: 12, color, letterSpacing: "0.1em" }}>
          {title}
        </span>
        <span className="font-outfit" style={mutedText}>
          {note}
        </span>
      </div>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {items.map((item) => (
          <ObstaclePill key={item} label={item} color={color} />
        ))}
      </div>
    </div>
  )
}

export default function HowToPlay({ onBack }: Props) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.code === "Escape") {
        event.preventDefault()
        playBack()
        onBack()
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [onBack])

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: "linear-gradient(160deg, #080c18 0%, #0d1428 100%)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          padding: "14px 20px 10px",
          borderBottom: "1px solid #1e3060",
          gap: 12,
          flexShrink: 0,
        }}
      >
        <button
          onClick={() => {
            playBack()
            onBack()
          }}
          style={{
            background: "transparent",
            border: "1px solid #1e3060",
            borderRadius: 6,
            color: "#93a8cf",
            fontSize: 13,
            padding: "4px 12px",
            cursor: "pointer",
            fontFamily: "Outfit, sans-serif",
            transition: "all 0.15s",
          }}
          onMouseEnter={(e) => {
            ;(e.currentTarget as HTMLElement).style.borderColor = "#00e5c8"
            ;(e.currentTarget as HTMLElement).style.color = "#00e5c8"
          }}
          onMouseLeave={(e) => {
            ;(e.currentTarget as HTMLElement).style.borderColor = "#1e3060"
            ;(e.currentTarget as HTMLElement).style.color = "#93a8cf"
          }}
        >
          ← BACK
        </button>
        <div
          className="font-orbitron"
          style={{
            fontSize: 16,
            fontWeight: 700,
            color: "#e8f0ff",
            letterSpacing: "0.12em",
          }}
        >
          HOW TO PLAY
        </div>
      </div>

      {/* 2-column grid (scrolls inside the landscape frame) */}
      <div
        style={{
          flex: 1,
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 12,
          padding: "12px 16px 18px",
          overflow: "auto",
          alignContent: "start",
        }}
      >
        <Section title="CONTROLS">
          <Row
            icon={<span className="font-mono" style={iconText}>RUN</span>}
            label="Your runner moves forward automatically"
          />
          <Row
            icon={<span className="font-mono" style={iconText}>JUMP</span>}
            label={
              <>
                <Key>Space</Key> <Key>W</Key> <Key>↑</Key> or tap / click the
                screen
              </>
            }
          />
          <Row
            icon={<span className="font-mono" style={iconText}>PAUSE</span>}
            label={
              <>
                <Key>P</Key> <Key>Esc</Key> or the pause button; resume counts
                3‑2‑1
              </>
            }
          />
        </Section>

        <Section title="OBJECTIVE & HEALTH" accent="#ff6b8d">
          <Text>
            Survive as long as you can: avoid hazards, collect coins and beat
            your high score.
          </Text>
          <div style={statLine}>
            <span
              className="font-mono"
              style={{ color: "#ff6b8d", fontSize: 12, whiteSpace: "nowrap" }}
            >
              3 HEARTS
            </span>
            <span className="font-outfit" style={mutedText}>
              Each hit costs one heart, then you blink safely for 1.5 s.
            </span>
          </div>
          <Text>
            Losing the last heart shuts your mech down — Game Over.
          </Text>
        </Section>

        <Section title="SCORE & COINS" accent="#ffe434">
          <Row
            icon={<span className="font-mono" style={iconText}>SCORE</span>}
            label="1 point per metre run — faster speed, faster score"
          />
          <Row
            icon={
              <div
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: "50%",
                  background:
                    "radial-gradient(circle at 35% 35%, #ffe878, #e8a000)",
                  boxShadow: "0 0 8px rgba(255,228,52,0.6)",
                  margin: "auto",
                }}
              />
            }
            label="COINS count +1 per pickup and never add SCORE"
          />
        </Section>

        <Section title="SIGNAL BURST" accent="#ffe434">
          <Text>
            First Burst appears at SCORE 450–650; the next 200–500 SCORE after
            one ends. Miss it and it returns in 10–15 s.
          </Text>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 4,
              marginTop: 8,
            }}
          >
            {[
              ["SHIELD", "No damage"],
              ["SPEED", "1.3× boost"],
              ["MAGNET", "Pulls coins"],
              ["CRUSH", "Smashes hazards"],
            ].map(([tag, text]) => (
              <div key={tag} style={chip}>
                <span className="font-mono" style={{ fontSize: 12, color: "#ffe434" }}>
                  {tag}
                </span>
                <span className="font-outfit" style={mutedText}>
                  {text}
                </span>
              </div>
            ))}
          </div>
          <Text style={{ marginTop: 8 }}>
            Lasts 10 s for Lou and Dash, 11.5 s for Nova, then about a second of protection while you get your bearings.
          </Text>
        </Section>

        <div style={{ gridColumn: "1 / -1" }}>
          <Section title="HAZARDS — AVOID THESE" accent="#ff3060">
            <HazardGroup
              title="JUMP OVER"
              note="Ground hazards and low flyers"
              items={[
                "ROADBLOCK",
                "DEBRIS",
                "LASER POST",
                "ROBOTIC CRAWLER",
                "SPIDER BOT",
                "HOVER DRONE",
                "SENTRY",
              ]}
              color="#ff8040"
            />
            <HazardGroup
              title="TIMED LASERS"
              note="Jump while lit, or run through while off"
              items={["ENERGY GATE", "FLOOR LASER", "LASER PYLON · LONG JUMP"]}
              color="#ff3060"
            />
            <HazardGroup
              title="STAY GROUNDED"
              note="Airborne threats — don't jump into them"
              items={[
                "OVERHEAD LASER",
                "SCANNER DRONE",
                "HOVER MINE",
                "CRUSHER · PASS WHILE RAISED",
              ]}
              color="#c084fc"
            />
            <Text style={{ marginTop: 4 }}>
              Lasers and the scanner drone flash a warning before they fire.
              With Tutorial Hints on, each new hazard shows a cue the first
              time.
            </Text>
          </Section>
        </div>

        <Section title="DIFFICULTY" accent="#ffa53b">
          <Text>
            Seven tiers, EASY → EXTREME, unlock at SCORE 70, 160, 280, 440, 640
            and 900.
          </Text>
          <Text style={{ marginTop: 6 }}>
            Each tier raises speed (×1.0 → ×3.2), spawns hazards more often,
            groups up to four together and adds new hazard types. Past 1,215
            OVERDRIVE builds speed toward ×3.6.
          </Text>
        </Section>

        <Section title="SETTINGS" accent="#a87cff">
          <Text>
            Music and Sound FX can each be switched off or set from 0–100% in
            Settings, independently of each other.
          </Text>
          <Text style={{ marginTop: 6 }}>
            Reduce Effects limits glow, particles and motion; High Contrast
            sharpens hazards and the HUD.
          </Text>
        </Section>
      </div>
    </div>
  )
}
