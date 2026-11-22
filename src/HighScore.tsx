import { playBack } from "./audio"

interface Props {
  onBack: () => void
  scores: number[]
}

export default function HighScore({ onBack, scores }: Props) {
  const medals = ["01", "02", "03"]

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: "linear-gradient(160deg, #080c18 0%, #0d1428 100%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        overflowY: "auto",
        padding: "8px 0",
      }}
    >
      {/* Back */}
      <button
        onClick={() => {
          playBack()
          onBack()
        }}
        style={{
          position: "absolute",
          top: 14,
          left: 16,
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
          fontSize: 12,
          color: "#ffe434",
          letterSpacing: "0.2em",
          marginTop: "auto",
          marginBottom: 4,
        }}
      >
        TOP RUNS
      </div>

      <div
        className="font-orbitron"
        style={{
          fontSize: 22,
          fontWeight: 700,
          letterSpacing: "0.14em",
          color: "#ffe434",
          marginBottom: 4,
        }}
      >
        HIGH SCORE
      </div>

      {/* Best score */}
      {scores.length > 0 && (
        <div
          style={{
            marginBottom: 8,
            padding: "3px 36px",
            background: "rgba(255,228,52,0.06)",
            border: "1px solid rgba(255,228,52,0.2)",
            borderRadius: 12,
            textAlign: "center",
          }}
        >
          <div
            className="font-mono"
            style={{
              fontSize: 12,
              color: "#93a8cf",
              letterSpacing: "0.15em",
              marginBottom: 4,
            }}
          >
            BEST
          </div>
          <div
            className="font-orbitron"
            style={{
              fontSize: 38,
              fontWeight: 900,
              color: "#ffe434",
              letterSpacing: "0.06em",
              lineHeight: 1,
            }}
          >
            {scores[0].toLocaleString()}
          </div>
        </div>
      )}

      {/* Score list */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 5,
          width: 280,
          marginBottom: "auto",
          flexShrink: 0,
        }}
      >
        {scores.slice(0, 5).map((score, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              padding: "5px 16px",
              background: i === 0 ? "rgba(255,228,52,0.04)" : "#0f1830",
              border: `1px solid ${
                i === 0 ? "rgba(255,228,52,0.2)" : "#1e3060"
              }`,
              borderRadius: 8,
              animation: "fade-in 0.4s ease both",
              animationDelay: `${i * 0.08}s`,
              opacity: 0,
            }}
          >
            <span style={{ fontSize: 18, width: 24 }}>
              {medals[i] ?? String(i + 1).padStart(2, "0")}
            </span>
            <div
              className="font-orbitron"
              style={{
                fontSize: 20,
                fontWeight: 700,
                color: i === 0 ? "#ffe434" : "#e8f0ff",
                flex: 1,
              }}
            >
              {score.toLocaleString()}
            </div>
            <div
              className="font-mono"
              style={{ fontSize: 12, color: "#8da2cc" }}
            >
              #{i + 1}
            </div>
          </div>
        ))}
        {scores.length === 0 && (
          <div
            style={{
              textAlign: "center",
              padding: "18px 20px",
              border: "1px dashed #3a5190",
              borderRadius: 12,
              background: "rgba(120,150,210,0.06)",
            }}
          >
            <div
              className="font-orbitron"
              style={{
                fontSize: 13,
                color: "#ffe434",
                letterSpacing: "0.16em",
                marginBottom: 8,
              }}
            >
              NO RUNS YET
            </div>
            <div
              className="font-outfit"
              style={{ color: "#b6c9e4", fontSize: 14, lineHeight: 1.4 }}
            >
              No scores yet. Play to set a record!
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
