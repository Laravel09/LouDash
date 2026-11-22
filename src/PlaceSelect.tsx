import { useEffect, useState } from "react"
import { PLACES, type PlaceId, type PlaceDef } from "./types"
import { playBack, playSelectPlace, playUIClick } from "./audio"
import { ENVIRONMENT_ART } from "./gameArt"

interface Props {
  /** Reduced Effects: hide the ambient preview lighting. */
  reduceEffects?: boolean
  current: PlaceId
  onSelect: (id: PlaceId) => void
  onBack: () => void
}

interface PlacePreviewProps {
  place: PlaceDef
  active: boolean
}

function PlacePreview({ place, active }: PlacePreviewProps) {
  const art = ENVIRONMENT_ART[place.id]
  return (
    <span className="place-preview-frame">
    <img
      className="place-preview-image"
      src={art.preview}
      alt={`${place.name} environment preview`}
      draggable={false}
      style={{
        objectPosition: art.previewFocus,
        boxShadow: active
          ? `0 0 0 1.5px ${place.accentColor}, 0 0 14px ${place.accentColor}55`
          : "0 0 0 1px #24375c",
        filter: active ? "none" : "saturate(0.8) brightness(0.82)",
      }}
    />
      {/* Ambient light drifting over the approved preview art. */}
      <span className="place-preview-light" aria-hidden="true" />
    </span>
  )
}

export default function PlaceSelect({
  current,
  onSelect,
  onBack,
  reduceEffects = false,
}: Props) {
  const [preview, setPreview] = useState<PlaceId>(current)
  const place = PLACES.find((p) => p.id === preview)!
  const idx = PLACES.findIndex((p) => p.id === preview)

  const movePreview = (direction: -1 | 1) => {
    const nextIndex = (idx + direction + PLACES.length) % PLACES.length
    setPreview(PLACES[nextIndex].id)
    playUIClick()
  }

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.repeat) return
      if (event.code === "ArrowLeft" || event.code === "KeyA") {
        event.preventDefault()
        movePreview(-1)
      } else if (event.code === "ArrowRight" || event.code === "KeyD") {
        event.preventDefault()
        movePreview(1)
      } else if (event.code === "Escape") {
        event.preventDefault()
        playBack()
        onBack()
      } else if (
        (event.code === "Enter" || event.code === "Space") &&
        event.target === document.body
      ) {
        event.preventDefault()
        playSelectPlace()
        onSelect(preview)
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  })

  return (
    <section
      className={`place-select-screen${reduceEffects ? " reduce-effects" : ""}`}
      style={{
        background: `linear-gradient(160deg, ${place.sky1} 0%, ${place.sky2}80 60%, ${place.sky1} 100%)`,
      }}
    >
      <header className="place-select-header">
        <button
          type="button"
          className="place-back"
          onClick={() => {
            playBack()
            onBack()
          }}
        >
          BACK
        </button>
        <div className="place-heading">
          <h1>CHOOSE YOUR PLACE</h1>
          <p>Preview a route, then confirm your destination</p>
        </div>
        <span className="place-count font-mono">
          {String(idx + 1).padStart(2, "0")} / 03
        </span>
      </header>

      <main className="place-select-main">
        <button
          type="button"
          className="place-nav-arrow"
          aria-label="Previous place"
          onClick={() => movePreview(-1)}
        >
          ‹
        </button>

        <div className="place-card-grid">
          {PLACES.map((p, i) => {
            const isActive = p.id === preview
            const isEquipped = current === p.id
            const status = isEquipped
              ? "ACTIVE"
              : isActive
                ? "PREVIEWING"
                : "SELECT"
            return (
              <button
                type="button"
                key={p.id}
                className={`place-card${isActive ? " is-preview" : ""}`}
                onClick={() => {
                  setPreview(p.id)
                  playUIClick()
                }}
                aria-pressed={isActive}
                aria-label={`${p.name}${
                  current === p.id ? ", currently active" : ""
                }`}
                style={
                  {
                    "--place-accent": p.accentColor,
                    "--place-delay": `${i * 50}ms`,
                    opacity: Math.abs(i - idx) > 1 ? 0.45 : 1,
                  } as React.CSSProperties
                }
              >
                <div className="place-card-status-row">
                  <span
                    className="place-card-status"
                    style={{
                      color: isActive || isEquipped ? p.accentColor : "#7188aa",
                    }}
                  >
                    {status}
                  </span>
                </div>
                <div className="place-art-slot">
                  <PlacePreview place={p} active={isActive} />
                </div>
                <div className="place-card-copy">
                  <h2 style={{ color: isActive ? p.accentColor : "#8299bc" }}>
                    {p.name}
                  </h2>
                  <p className="font-mono">{p.subtitle}</p>
                </div>
                <p className="place-tagline">{p.tagline}</p>
              </button>
            )
          })}
        </div>

        <button
          type="button"
          className="place-nav-arrow"
          aria-label="Next place"
          onClick={() => movePreview(1)}
        >
          ›
        </button>
      </main>

      <footer className="place-select-footer">
        <div className="preview-summary">
          <span className="font-mono">PREVIEW</span>
          <strong style={{ color: place.accentColor }}>{place.name}</strong>
        </div>
        <button
          type="button"
          onClick={() => {
            playSelectPlace()
            onSelect(preview)
          }}
          className="confirm-place"
          style={{
            background: `linear-gradient(135deg, ${place.accentColor}, ${place.accentColor}bb)`,
            boxShadow: `0 4px 20px ${place.accentColor}50`,
          }}
        >
          CONFIRM PLACE <span>{place.name}</span>
        </button>
        <div className="selection-hint font-mono">A / D OR ARROWS</div>
      </footer>
    </section>
  )
}
