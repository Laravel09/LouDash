import { useState } from "react"
import type { AppSettings, BooleanSettingKey } from "./types"
import { DEFAULT_SETTINGS } from "./profileStorage"
import {
  playBack,
  playConfirm,
  playUIClick,
  updateAudioSettings,
} from "./audio"

interface Props {
  onBack: () => void
  settings: AppSettings
  onSettingsChange: (s: AppSettings) => void
}

const SWITCH_TONES = {
  accent: { track: "#00e5c8", glow: "0 0 10px rgba(0,229,200,0.4)" },
  danger: { track: "#ff3060", glow: "0 0 10px rgba(255,48,96,0.45)" },
  dim: { track: "#3a5a8a", glow: "none" },
} as const

function SwitchVisual({
  on,
  tone = "accent",
}: {
  on: boolean
  tone?: keyof typeof SWITCH_TONES
}) {
  const t = SWITCH_TONES[tone]
  return (
    <span
      aria-hidden="true"
      style={{
        width: 44,
        height: 24,
        borderRadius: 12,
        background: on ? t.track : "#1e3060",
        border: "none",
        position: "relative",
        transition: "background 0.2s",
        flexShrink: 0,
        boxShadow: on ? t.glow : "none",
      }}
    >
      <span
        style={{
          position: "absolute",
          top: 2,
          left: on ? 22 : 2,
          width: 20,
          height: 20,
          borderRadius: "50%",
          background: on ? "#080c18" : "#93a8cf",
          transition: "left 0.2s",
        }}
      />
    </span>
  )
}

type SettingKey = BooleanSettingKey

type VolumeKey = "musicVolume" | "sfxVolume"

function VolumeSlider({
  label,
  value,
  enabled,
  onChange,
  onRelease,
}: {
  label: string
  value: number
  enabled: boolean
  onChange: (value: number) => void
  onRelease?: () => void
}) {
  return (
    <label className={`volume-control${enabled ? "" : " is-muted"}`}>
      <span className="volume-control-head">
        <span className="font-outfit volume-control-label">{label}</span>
        <span className="font-mono volume-control-value">
          {enabled ? `${value}%` : "OFF"}
        </span>
      </span>
      <input
        type="range"
        className="volume-slider"
        min={0}
        max={100}
        step={5}
        value={value}
        aria-valuetext={`${value}%${enabled ? "" : ", muted"}`}
        style={{ "--fill": `${value}%` } as React.CSSProperties}
        onChange={(e) => onChange(Number(e.currentTarget.value))}
        onPointerUp={onRelease}
        onKeyUp={(e) => {
          if (e.key.startsWith("Arrow") || e.key === "Home" || e.key === "End")
            onRelease?.()
        }}
      />
    </label>
  )
}

interface SettingRow {
  key: SettingKey
  label: string
  desc: string
}

const SECTIONS: { title: string; rows: SettingRow[] }[] = [
  {
    title: "AUDIO",
    rows: [
      {
        key: "masterMute",
        label: "Master Mute",
        desc: "Silence all music and sound effects",
      },
      {
        key: "music",
        label: "Background Music",
        desc: "Menu and per-place music",
      },
      {
        key: "sound",
        label: "Sound Effects",
        desc: "Menu, jump, coin and hazard sounds",
      },
    ],
  },
  {
    title: "GAMEPLAY",
    rows: [
      {
        key: "speedIndicator",
        label: "Speed Indicator",
        desc: "Show current speed tier in HUD",
      },
      {
        key: "tutorialHints",
        label: "Tutorial Hints",
        desc: "Show control hints at game start",
      },
      { key: "vibration", label: "Vibration", desc: "Haptic feedback on hit" },
    ],
  },
  {
    title: "ACCESSIBILITY",
    rows: [
      {
        key: "highContrast",
        label: "High Contrast",
        desc: "Extra contrast for obstacles and HUD",
      },
      {
        key: "reduceEffects",
        label: "Reduce Effects",
        desc: "Limit glow, particles and parallax motion",
      },
    ],
  },
]

export default function Settings({
  onBack,
  settings,
  onSettingsChange,
}: Props) {
  // Audio changes are applied to the engine right away (not after the next
  // render), so the feedback click already reflects the new state: muting is
  // silent, unmuting confirms audibly.
  const apply = (next: AppSettings) => {
    updateAudioSettings(next)
    onSettingsChange(next)
  }
  const toggle = (key: SettingKey) => {
    apply({ ...settings, [key]: !settings[key] })
    playUIClick()
  }
  const setVolume = (key: VolumeKey, value: number) =>
    apply({ ...settings, [key]: value })
  const muted = settings.masterMute
  const stateLabel = (key: SettingKey) => {
    if (key === "masterMute") return settings.masterMute ? "MUTED" : "OFF"
    if ((key === "music" || key === "sound") && muted && settings[key])
      return "MUTED"
    return settings[key] ? "ON" : "OFF"
  }
  const rowDesc = (key: SettingKey, desc: string) => {
    if (key === "vibration" && !vibrationSupported)
      return "Not supported on this device"
    if ((key === "music" || key === "sound") && muted)
      return "Silenced by Master Mute"
    return desc
  }
  const [confirmReset, setConfirmReset] = useState(false)
  const vibrationSupported =
    typeof navigator !== "undefined" && typeof navigator.vibrate === "function"
  const resetAll = () => {
    if (!confirmReset) {
      setConfirmReset(true)
      return
    }
    apply(DEFAULT_SETTINGS)
    setConfirmReset(false)
    playConfirm()
  }

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
          padding: "12px 18px",
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
            const el = e.currentTarget as HTMLElement
            el.style.borderColor = "#00e5c8"
            el.style.color = "#00e5c8"
          }}
          onMouseLeave={(e) => {
            const el = e.currentTarget as HTMLElement
            el.style.borderColor = "#1e3060"
            el.style.color = "#93a8cf"
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
          SETTINGS
        </div>
      </div>

      {/* Settings sections */}
      <div
        style={{
          flex: 1,
          overflow: "auto",
          padding: "14px 20px 12px",
          display: "flex",
          flexDirection: "column",
          gap: 14,
        }}
      >
        {SECTIONS.map((section, si) => (
          <div key={section.title}>
            <div
              className="font-mono"
              style={{
                fontSize: 12,
                letterSpacing: "0.18em",
                color: "#8da2cc",
                marginBottom: 8,
              }}
            >
              {section.title}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {section.rows.map(({ key, label, desc }, ri) => (
                <button
                  key={key}
                  type="button"
                  role="switch"
                  aria-checked={settings[key]}
                  aria-label={`${label}: ${stateLabel(key).toLowerCase()}`}
                  disabled={key === "vibration" && !vibrationSupported}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "10px 14px",
                    background: "#0f1830",
                    border: "1px solid #1e3060",
                    borderRadius: 8,
                    cursor:
                      key === "vibration" && !vibrationSupported
                        ? "not-allowed"
                        : "pointer",
                    width: "100%",
                    textAlign: "left",
                    animation: "fade-in 0.4s ease both",
                    animationDelay: `${(si * 3 + ri) * 0.05}s`,
                    opacity:
                      key === "vibration" && !vibrationSupported ? 0.5 : 0,
                    transition: "border-color 0.15s",
                  }}
                  onClick={() => toggle(key)}
                  onMouseEnter={(e) => {
                    ;(e.currentTarget as HTMLElement).style.borderColor =
                      "#2a4080"
                  }}
                  onMouseLeave={(e) => {
                    ;(e.currentTarget as HTMLElement).style.borderColor =
                      "#1e3060"
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div
                      className="font-outfit"
                      style={{
                        fontSize: 14,
                        fontWeight: 600,
                        color: "#e8f0ff",
                      }}
                    >
                      {label}
                    </div>
                    <div
                      className="font-outfit"
                      style={{ fontSize: 12, color: "#8da2cc", marginTop: 1 }}
                    >
                      {rowDesc(key, desc)}
                    </div>
                  </div>
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 8 }}
                  >
                    <span
                      className="font-mono"
                      style={{
                        fontSize: 12,
                        color:
                          key === "masterMute" && settings.masterMute
                            ? "#ff6b8a"
                            : stateLabel(key) === "MUTED"
                              ? "#8da2cc"
                              : settings[key]
                                ? "#00e5c8"
                                : "#8da2cc",
                        letterSpacing: "0.1em",
                        minWidth: 44,
                        textAlign: "right",
                      }}
                    >
                      {stateLabel(key)}
                    </span>
                    <SwitchVisual
                      on={!!settings[key]}
                      tone={
                        key === "masterMute"
                          ? "danger"
                          : stateLabel(key) === "MUTED"
                            ? "dim"
                            : "accent"
                      }
                    />
                  </div>
                </button>
              ))}
              {section.title === "AUDIO" && (
                <div
                  className="volume-grid"
                  style={{
                    animation: "fade-in 0.4s ease both",
                    animationDelay: "0.1s",
                  }}
                >
                  <VolumeSlider
                    label="Music Volume"
                    value={settings.musicVolume}
                    enabled={settings.music && !muted}
                    onChange={(v) => setVolume("musicVolume", v)}
                  />
                  <VolumeSlider
                    label="Sound FX Volume"
                    value={settings.sfxVolume}
                    enabled={settings.sound && !muted}
                    onChange={(v) => setVolume("sfxVolume", v)}
                    onRelease={playUIClick}
                  />
                </div>
              )}
            </div>
          </div>
        ))}

        {/* System */}
        <div>
          <div
            className="font-mono"
            style={{
              fontSize: 12,
              letterSpacing: "0.18em",
              color: "#8da2cc",
              marginBottom: 8,
            }}
          >
            SYSTEM
          </div>
          <button
            onClick={resetAll}
            className="font-outfit"
            style={{
              width: "100%",
              padding: "10px 14px",
              background: "transparent",
              border: "1px solid #3a1020",
              borderRadius: 8,
              color: "#ff3060",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              textAlign: "left",
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => {
              const el = e.currentTarget as HTMLElement
              el.style.background = "rgba(255,48,96,0.05)"
              el.style.borderColor = "#ff3060"
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget as HTMLElement
              el.style.background = "transparent"
              el.style.borderColor = "#3a1020"
            }}
          >
            {confirmReset ? "Confirm Reset Settings" : "Reset All Settings"}
          </button>
        </div>
      </div>

      <div
        className="font-mono"
        style={{
          padding: "8px",
          textAlign: "center",
          fontSize: 12,
          color: "#7088b4",
          letterSpacing: "0.1em",
          borderTop: "1px solid #0f1830",
        }}
      >
        LOUDASH v6.6
      </div>
    </div>
  )
}
