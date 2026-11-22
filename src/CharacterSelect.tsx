import { useEffect, useState } from "react"
import { CHARACTERS, type CharacterId } from "./types"
import { playBack, playSelectCharacter, playUIClick } from "./audio"
import { getBurstDuration } from "./gameplayBalance"
import CharacterArt from "./CharacterArt"

/** Relaxed jog for the selection preview (the in-run cadence follows speed). */
const PREVIEW_CYCLES_PER_SECOND = 2.2

interface Props {
  current: CharacterId
  onSelect: (id: CharacterId) => void
  onBack: () => void
}

function StatRow({
  label,
  value,
  color,
}: {
  label: string
  value: number
  color: string
}) {
  return (
    <div className="character-stat">
      <span>{label}</span>
      <div>
        {Array.from({ length: 5 }).map((_, index) => (
          <i
            key={index}
            style={{
              background: index < value ? color : "#2a3b5e",
              boxShadow: index < value ? `0 0 5px ${color}70` : "none",
            }}
          />
        ))}
      </div>
    </div>
  )
}

export default function CharacterSelect({ current, onSelect, onBack }: Props) {
  const [preview, setPreview] = useState<CharacterId>(current)
  const [previewPhase, setPreviewPhase] = useState(0)
  const previewIndex = CHARACTERS.findIndex(
    (character) => character.id === preview,
  )
  const activeCharacter = CHARACTERS[previewIndex]

  useEffect(() => {
    let animationFrame = 0
    const startedAt = performance.now()
    const animate = (now: number) => {
      // Base-speed cadence (cycles per second), matching the in-run stride.
      setPreviewPhase(((now - startedAt) / 1000) * PREVIEW_CYCLES_PER_SECOND)
      animationFrame = requestAnimationFrame(animate)
    }
    animationFrame = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(animationFrame)
  }, [])

  const movePreview = (direction: -1 | 1) => {
    const nextIndex =
      (previewIndex + direction + CHARACTERS.length) % CHARACTERS.length
    setPreview(CHARACTERS[nextIndex].id)
    playUIClick()
  }

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
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
      }
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [onBack, onSelect, preview, previewIndex])

  return (
    <section
      className="character-select-screen"
      style={{
        background: `radial-gradient(circle at 50% 42%, ${activeCharacter.accentColor}16, transparent 38%), linear-gradient(155deg, #080c18, #0c1428 58%, #080c18)`,
      }}
    >
      <header className="character-select-header">
        <button
          type="button"
          className="character-back"
          onClick={() => {
            playBack()
            onBack()
          }}
        >
          BACK
        </button>
        <div>
          <h1>CHOOSE YOUR RUNNER</h1>
          <p>Preview a runner, then confirm your loadout</p>
        </div>
        <span className="character-count font-mono">
          {String(previewIndex + 1).padStart(2, "0")} / 03
        </span>
      </header>

      <main className="character-select-main">
        <button
          type="button"
          aria-label="Previous character"
          className="character-nav-arrow"
          onClick={() => movePreview(-1)}
        >
          ‹
        </button>

        <div className="character-card-grid">
          {CHARACTERS.map((character, index) => {
            const isPreview = character.id === preview
            const isEquipped = character.id === current
            const status = isEquipped
              ? "EQUIPPED"
              : isPreview
                ? "PREVIEWING"
                : "SELECT"

            return (
              <button
                type="button"
                key={character.id}
                className={`character-card${isPreview ? " is-preview" : ""}`}
                aria-pressed={isPreview}
                aria-label={`${character.name}, ${status.toLowerCase()}`}
                onClick={() => {
                  setPreview(character.id)
                  playUIClick()
                }}
                style={
                  {
                    "--runner-accent": character.accentColor,
                    "--card-delay": `${index * 50}ms`,
                  } as React.CSSProperties
                }
              >
                <span className="character-card-status" data-status={status}>
                  {status}
                </span>

                <div className="character-art-slot">
                  <CharacterArt
                    character={character}
                    width={66}
                    height={99}
                    phase={isPreview ? previewPhase : index * 1.8}
                    pose={isPreview ? "run" : "idle"}
                  />
                </div>

                <div className="character-card-copy">
                  <h2>{character.name}</h2>
                  <p>{character.role}</p>
                </div>

                <div
                  className={`character-card-stats${
                    isPreview ? " is-visible" : ""
                  }`}
                >
                  <StatRow
                    label="SPD"
                    value={character.speedStars}
                    color={character.accentColor}
                  />
                  <StatRow
                    label="JMP"
                    value={character.jumpStars}
                    color={character.accentColor}
                  />
                  <StatRow
                    label="PWR"
                    value={character.powerStars}
                    color={character.accentColor}
                  />
                  <span className="burst-duration font-mono">
                    BURST{" "}
                    {getBurstDuration(character.powerStars).toFixed(
                      character.powerStars === 4 ? 1 : 0,
                    )}
                    s
                  </span>
                </div>
              </button>
            )
          })}
        </div>

        <button
          type="button"
          aria-label="Next character"
          className="character-nav-arrow"
          onClick={() => movePreview(1)}
        >
          ›
        </button>
      </main>

      <footer className="character-select-footer">
        <div className="preview-summary">
          <span className="font-mono">PREVIEW</span>
          <strong style={{ color: activeCharacter.accentColor }}>
            {activeCharacter.name}
          </strong>
        </div>
        <button
          type="button"
          className="confirm-character"
          onClick={() => {
            playSelectCharacter()
            onSelect(preview)
          }}
          style={{
            background: `linear-gradient(180deg, color-mix(in srgb, ${activeCharacter.accentColor} 78%, #fff), ${activeCharacter.accentColor})`,
            boxShadow: `0 5px 20px ${activeCharacter.accentColor}38`,
          }}
        >
          CONFIRM CHARACTER
          <span>{activeCharacter.name}</span>
        </button>
        <div className="selection-hint font-mono">A / D OR ARROWS</div>
      </footer>
    </section>
  )
}
