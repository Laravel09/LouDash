import { useLayoutEffect, useRef } from "react"
import type { GameResult } from "./types"
import { playBack, playConfirm, playUIClick } from "./audio"

interface Props {
  result: GameResult
  highScores: number[]
  onPlayAgain: () => void
  onMenu: () => void
  onCharSelect: () => void
}

export default function GameOver({
  result,
  highScores,
  onPlayAgain,
  onMenu,
  onCharSelect,
}: Props) {
  const best = highScores[0] ?? 0
  const rank = highScores.findIndex((score) => score === result.score) + 1
  const rootRef = useRef<HTMLDivElement>(null)
  const titleRef = useRef<HTMLDivElement>(null)

  // Stage A (the GAME OVER title alone for 2 s) plays over the powered-down
  // runner in GamePlay. This screen opens with the title in exactly that
  // centred spot, then settles it into the card while the results fade in
  // (Stage B). Measured before paint so the first frame matches the hand-off.
  useLayoutEffect(() => {
    const root = rootRef.current
    const title = titleRef.current
    if (!root || !title) return
    const centre = title.offsetTop + title.offsetHeight / 2
    title.style.setProperty("--go-dy", `${(root.offsetHeight / 2 - centre).toFixed(1)}px`)
  }, [])


  return (
    <div
      ref={rootRef}
      style={{
        position: "absolute",
        inset: 0,
        background: "rgba(8,12,24,0.94)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backdropFilter: "blur(4px)",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          overflow: "hidden",
          pointerEvents: "none",
          opacity: 0.05,
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            height: 2,
            background:
              "linear-gradient(90deg, transparent, #ff3060, transparent)",
            animation: "scan-line 3s linear infinite",
          }}
        />
      </div>

      <div
        className="go-card"
        style={{
          width: 430,
          background: "#0f1830",
          border: "1px solid #1e3060",
          borderRadius: 16,
          padding: "12px 22px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          boxShadow:
            "0 0 60px rgba(255,48,96,0.12), 0 20px 60px rgba(0,0,0,0.8)",
        }}
      >
        <div
          ref={titleRef}
          className="go-title font-orbitron"
          style={{
            fontSize: 24,
            fontWeight: 900,
            color: "#ff3060",
            letterSpacing: "0.1em",
            marginBottom: 6,
            textShadow: "0 0 24px rgba(255,48,96,0.5)",
          }}
        >
          GAME OVER
        </div>

        {result.achievement && (
          <div
            style={{
              marginBottom: 6,
              padding: "4px 16px",
              background: "rgba(255,228,52,0.1)",
              border: "1px solid rgba(255,228,52,0.4)",
              borderRadius: 20,
              animation: "new-hs-pop 0.6s cubic-bezier(0.34,1.56,0.64,1) both",
              animationDelay: "0.55s",
              opacity: 0,
            }}
          >
            <span
              className="font-orbitron"
              style={{
                fontSize: 12,
                color: "#ffe434",
                letterSpacing: "0.14em",
              }}
            >
              {result.achievement === "personalBest"
                ? "NEW BEST!"
                : `RANK #${rank} IN TOP 5`}
            </span>
          </div>
        )}

        {/* Run Score — primary stat */}
        <div
          className="go-reveal"
          style={
            {
              textAlign: "center",
              margin: "2px 0 8px",
              "--go-delay": "0.22s",
            } as React.CSSProperties
          }
        >
          <div
            className="font-mono"
            style={{
              fontSize: 12,
              color: "#8da2cc",
              letterSpacing: "0.16em",
              marginBottom: 2,
            }}
          >
            RUN SCORE
          </div>
          <div
            className="font-orbitron"
            style={{
              fontSize: 40,
              fontWeight: 900,
              color: result.achievement ? "#ffe434" : "#e8f0ff",
              letterSpacing: "0.04em",
              lineHeight: 1,
              textShadow: result.achievement
                ? "0 0 24px rgba(255,228,52,0.5)"
                : "none",
            }}
          >
            {result.score.toLocaleString()}
          </div>
        </div>

        {/* Run summary */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            width: "100%",
            marginBottom: 10,
            background: "#080c18",
            borderRadius: 8,
            border: "1px solid #162040",
            overflow: "hidden",
          }}
        >
          {([
            {
              label: "DISTANCE",
              value: `${result.distance.toLocaleString()} m`,
              color: "#00e5c8",
            },
            {
              label: "TIME",
              value: `${Math.floor(result.seconds / 60)}:${String(result.seconds % 60).padStart(2, "0")}`,
              color: "#9db8d8",
            },
            {
              label: "COINS",
              value: result.coins.toLocaleString(),
              color: "#e8c840",
            },
            {
              label: "BURSTS",
              value: result.bursts.toString(),
              color: "#c084fc",
            },
            {
              label: "BEST TIER",
              value: result.bestTier,
              color: "#fb923c",
            },
            {
              label: "RECORD",
              value: best.toLocaleString(),
              color: "#ffe434",
            },
          ] as { label: string; value: string; color: string }[]).map(
            ({ label, value, color }, i) => (
              <div
                key={label}
                style={{
                  flex: 1,
                  padding: "6px 10px",
                  textAlign: "center",
                  borderRight: i % 3 !== 2 ? "1px solid #26396b" : "none",
                  borderBottom: i < 3 ? "1px solid #26396b" : "none",
                  animation: "fade-in 0.4s ease both",
                  animationDelay: `${0.3 + i * 0.05}s`,
                }}
              >
                <div
                  className="font-mono"
                  style={{
                    fontSize: 12,
                    color: "#8da2cc",
                    letterSpacing: "0.12em",
                    marginBottom: 3,
                  }}
                >
                  {label}
                </div>
                <div
                  className="font-orbitron"
                  style={{ fontSize: 17, fontWeight: 700, color }}
                >
                  {value}
                </div>
              </div>
            ),
          )}
        </div>

        {/* Buttons */}
        <div
          className="go-reveal"
          style={
            {
              display: "flex",
              flexDirection: "column",
              gap: 8,
              width: "100%",
              "--go-delay": "0.5s",
            } as React.CSSProperties
          }
        >
          <button
            onClick={() => {
              playConfirm()
              onPlayAgain()
            }}
            className="font-orbitron"
            style={{
              width: "100%",
              height: 42,
              background: "linear-gradient(135deg, #00e5c8, #00b8a0)",
              color: "#080c18",
              border: "none",
              borderRadius: 8,
              fontSize: 15,
              fontWeight: 900,
              letterSpacing: "0.1em",
              cursor: "pointer",
              boxShadow: "0 4px 20px rgba(0,229,200,0.35)",
              transition: "transform 0.1s",
            }}
            onMouseEnter={(e) => {
              ;(e.currentTarget as HTMLElement).style.transform = "scale(1.02)"
            }}
            onMouseLeave={(e) => {
              ;(e.currentTarget as HTMLElement).style.transform = "scale(1)"
            }}
          >
            PLAY AGAIN
          </button>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={() => {
                playUIClick()
                onCharSelect()
              }}
              className="font-outfit"
              style={{
                flex: 1,
                height: 38,
                background: "rgba(120,150,210,0.07)",
                color: "#b9c9e4",
                border: "1px solid #2f487f",
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.15s",
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget as HTMLElement
                el.style.borderColor = "#00e5c8"
                el.style.color = "#e8f0ff"
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget as HTMLElement
                el.style.borderColor = "#2f487f"
                el.style.color = "#b9c9e4"
              }}
            >
              CHARACTERS
            </button>
            <button
              onClick={() => {
                playBack()
                onMenu()
              }}
              className="font-outfit"
              style={{
                flex: 1,
                height: 38,
                background: "rgba(120,150,210,0.07)",
                color: "#b9c9e4",
                border: "1px solid #2f487f",
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.15s",
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget as HTMLElement
                el.style.borderColor = "#00e5c8"
                el.style.color = "#e8f0ff"
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget as HTMLElement
                el.style.borderColor = "#2f487f"
                el.style.color = "#b9c9e4"
              }}
            >
              MAIN MENU
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
