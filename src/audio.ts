// ── LouDash Audio Engine ─────────────────────────────────────────────────────
// One Web Audio graph for the whole app:
//
//   sample / synth voices ─▶ sfxBus ──────────────────────▶ master ─▶ out
//   music track ─▶ trackGain ─▶ musicBus ─▶ musicDuck ─────▶ master
//
// Music is streamed from bundled CC0 loops (see assets/audio/CREDITS.md) and
// falls back to the original synthesized loops if a file cannot be decoded.
// Short UI / impact effects use bundled CC0 samples; rhythmic gameplay cues
// (jump, landing, coins, warnings, power-down) stay synthesized so they can be
// tuned and never overlap badly.

import type { PlaceId } from "./types"

import musicMenuUrl from "./assets/audio/music-menu.mp3"
import musicCityUrl from "./assets/audio/music-city.mp3"
import musicRoadUrl from "./assets/audio/music-road.mp3"
import musicNeonUrl from "./assets/audio/music-neon.mp3"
import sfxClickUrl from "./assets/audio/sfx-click.mp3"
import sfxConfirmUrl from "./assets/audio/sfx-confirm.mp3"
import sfxBackUrl from "./assets/audio/sfx-back.mp3"
import sfxSelectCharUrl from "./assets/audio/sfx-select-char.mp3"
import sfxSelectPlaceUrl from "./assets/audio/sfx-select-place.mp3"
import sfxPauseUrl from "./assets/audio/sfx-pause.mp3"
import sfxResumeUrl from "./assets/audio/sfx-resume.mp3"
import sfxDamageUrl from "./assets/audio/sfx-damage.mp3"
import sfxFinalHitUrl from "./assets/audio/sfx-final-hit.mp3"
import sfxLaserOnUrl from "./assets/audio/sfx-laser-on.mp3"
import sfxDroneUrl from "./assets/audio/sfx-drone.mp3"
import sfxCrusherUrl from "./assets/audio/sfx-crusher.mp3"
import sfxBurstUrl from "./assets/audio/sfx-burst.mp3"

export type MusicTrack = "menu" | PlaceId

export interface AudioPrefs {
  /** Silences everything: music, gameplay and interface sounds. */
  masterMute: boolean
  sound: boolean
  music: boolean
  /** 0–100 */
  musicVolume: number
  /** 0–100 */
  sfxVolume: number
}

let ctx: AudioContext | null = null
let master: GainNode | null = null
let sfxBus: GainNode | null = null
let musicBus: GainNode | null = null
let musicDuck: GainNode | null = null

let sfxOn = true
let musicOn = true
let masterMuted = false
let musicVolume = 0.7
let sfxVolume = 0.8

/** Output level of the master bus while not muted. */
const MASTER_LEVEL = 0.65
/** Full-scale music level; tracks are loudness-matched to −16 LUFS. */
const MUSIC_LEVEL = 0.42
/** Music level while gameplay is paused (relative). */
const PAUSE_DUCK = 0.3

/** Perceptual volume curve so 50% sounds roughly half as loud. */
const curve = (v: number) => v * v

function musicGain() {
  return musicOn && !masterMuted ? MUSIC_LEVEL * curve(musicVolume) : 0
}
function sfxGain() {
  return sfxOn && !masterMuted ? curve(sfxVolume) * 1.15 : 0
}
function sfxAudible() {
  return !masterMuted && sfxOn && sfxVolume > 0
}
function musicAudible() {
  return !masterMuted && musicOn
}

function getCtx(): AudioContext | null {
  if (!ctx) {
    try {
      ctx = new AudioContext()
    } catch {
      return null
    }
    master = ctx.createGain()
    master.gain.value = masterMuted ? 0 : MASTER_LEVEL
    master.connect(ctx.destination)

    sfxBus = ctx.createGain()
    sfxBus.gain.value = sfxGain()
    sfxBus.connect(master)

    musicDuck = ctx.createGain()
    musicDuck.gain.value = 1
    musicDuck.connect(master)
    musicBus = ctx.createGain()
    musicBus.gain.value = musicGain()
    musicBus.connect(musicDuck)

    installLifecycle()
    preloadSamples()
  }
  if (ctx.state === "suspended" && !document.hidden)
    ctx.resume().catch(() => {})
  return ctx
}

// Browsers only start audio after a user gesture, and hidden tabs should be
// silent. Installed once, together with the context.
function installLifecycle() {
  const unlock = () => {
    if (ctx && ctx.state === "suspended" && !document.hidden)
      ctx.resume().catch(() => {})
  }
  window.addEventListener("pointerdown", unlock, { passive: true })
  window.addEventListener("keydown", unlock)
  document.addEventListener("visibilitychange", () => {
    if (!ctx) return
    if (document.hidden) ctx.suspend().catch(() => {})
    else ctx.resume().catch(() => {})
  })
}

function ramp(param: AudioParam, value: number, tc = 0.06) {
  if (!ctx) return
  param.cancelScheduledValues(ctx.currentTime)
  param.setTargetAtTime(value, ctx.currentTime, tc)
}

/** Short linear fade that lands exactly on `value` (true silence for 0). */
function setLevel(param: AudioParam, value: number, seconds = 0.04) {
  if (!ctx) {
    param.value = value
    return
  }
  const now = ctx.currentTime
  param.cancelScheduledValues(now)
  param.setValueAtTime(param.value, now)
  param.linearRampToValueAtTime(value, now + seconds)
}

// Schedule a shaped oscillator note
function oNote(
  freq: number,
  type: OscillatorType,
  start: number,
  dur: number,
  gain: number,
  dest: AudioNode,
): void {
  if (!ctx) return
  const osc = ctx.createOscillator()
  const g = ctx.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, start)
  g.gain.setValueAtTime(0, start)
  g.gain.linearRampToValueAtTime(gain, start + Math.min(0.008, dur * 0.15))
  g.gain.exponentialRampToValueAtTime(0.0001, start + dur)
  osc.connect(g)
  g.connect(dest)
  osc.start(start)
  osc.stop(start + dur + 0.01)
}

// Schedule a filtered noise burst
function oNoise(
  start: number,
  dur: number,
  gain: number,
  filterHz: number,
  dest: AudioNode,
  filterType: BiquadFilterType = "lowpass",
): void {
  if (!ctx) return
  const len = Math.ceil(ctx.sampleRate * dur)
  const buf = ctx.createBuffer(1, len, ctx.sampleRate)
  const d = buf.getChannelData(0)
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1
  const src = ctx.createBufferSource()
  src.buffer = buf
  const filt = ctx.createBiquadFilter()
  filt.type = filterType
  filt.frequency.value = filterHz
  const g = ctx.createGain()
  g.gain.setValueAtTime(gain, start)
  g.gain.exponentialRampToValueAtTime(0.0001, start + dur)
  src.connect(filt)
  filt.connect(g)
  g.connect(dest)
  src.start(start)
  src.stop(start + dur + 0.01)
}

// Pitch sweep with an exponential envelope.
function oSweep(
  type: OscillatorType,
  from: number,
  to: number,
  start: number,
  dur: number,
  gain: number,
  dest: AudioNode,
): void {
  if (!ctx) return
  const osc = ctx.createOscillator()
  const g = ctx.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(from, start)
  osc.frequency.exponentialRampToValueAtTime(to, start + dur)
  g.gain.setValueAtTime(0, start)
  g.gain.linearRampToValueAtTime(gain, start + 0.012)
  g.gain.exponentialRampToValueAtTime(0.0001, start + dur)
  osc.connect(g)
  g.connect(dest)
  osc.start(start)
  osc.stop(start + dur + 0.02)
}

// ── Bundled samples ──────────────────────────────────────────────────────────

const SAMPLE_URLS = {
  click: sfxClickUrl,
  confirm: sfxConfirmUrl,
  back: sfxBackUrl,
  selectChar: sfxSelectCharUrl,
  selectPlace: sfxSelectPlaceUrl,
  pause: sfxPauseUrl,
  resume: sfxResumeUrl,
  damage: sfxDamageUrl,
  finalHit: sfxFinalHitUrl,
  laserOn: sfxLaserOnUrl,
  drone: sfxDroneUrl,
  crusher: sfxCrusherUrl,
  burst: sfxBurstUrl,
} as const
type SampleName = keyof typeof SAMPLE_URLS

const sampleBuffers = new Map<SampleName, AudioBuffer>()
const lastPlayed = new Map<string, number>()
const activeVoices = new Map<SampleName, number>()
let samplesRequested = false

/**
 * Raw file bytes fetched ahead of time (during the loading screen). Fetching
 * needs no AudioContext, so this works before the first user gesture; the
 * bytes are decoded once a context exists.
 */
const fileCache = new Map<string, Promise<ArrayBuffer | null>>()

function fetchFile(url: string): Promise<ArrayBuffer | null> {
  let p = fileCache.get(url)
  if (!p) {
    p = fetch(url)
      .then((r) => (r.ok ? r.arrayBuffer() : null))
      .catch(() => null)
    fileCache.set(url, p)
  }
  return p
}

function decode(url: string): Promise<AudioBuffer | null> {
  return fetchFile(url)
    .then((data) =>
      // decodeAudioData detaches its input, so decode a copy.
      data && ctx ? ctx.decodeAudioData(data.slice(0)) : null,
    )
    .catch(() => null)
}

function preloadSamples() {
  if (samplesRequested) return
  samplesRequested = true
  for (const name of Object.keys(SAMPLE_URLS) as SampleName[]) {
    void decode(SAMPLE_URLS[name]).then((buf) => {
      if (buf) sampleBuffers.set(name, buf)
    })
  }
}

/** True (and records the time) when `key` is outside its cooldown window. */
function ready(key: string, cooldown: number): boolean {
  if (!ctx) return false
  const now = ctx.currentTime
  const last = lastPlayed.get(key) ?? -Infinity
  if (now - last < cooldown) return false
  lastPlayed.set(key, now)
  return true
}

interface SampleOptions {
  gain?: number
  rate?: number
  /** Maximum simultaneous voices of this sample. */
  voices?: number
  delay?: number
}

/** Plays a bundled sample; returns false if it is not decoded yet. */
function sample(name: SampleName, options: SampleOptions = {}): boolean {
  const c = getCtx()
  const buf = sampleBuffers.get(name)
  if (!c || !sfxBus || !buf) return false
  const voices = activeVoices.get(name) ?? 0
  if (voices >= (options.voices ?? 2)) return true
  const src = c.createBufferSource()
  src.buffer = buf
  src.playbackRate.value = options.rate ?? 1
  const g = c.createGain()
  g.gain.value = options.gain ?? 0.6
  src.connect(g)
  g.connect(sfxBus)
  activeVoices.set(name, voices + 1)
  src.onended = () => {
    activeVoices.set(name, Math.max(0, (activeVoices.get(name) ?? 1) - 1))
    g.disconnect()
  }
  src.start(c.currentTime + (options.delay ?? 0))
  return true
}

function sfxCtx(): AudioContext | null {
  if (!sfxAudible()) return null
  const c = getCtx()
  return c && sfxBus ? c : null
}

// ── Menu sounds ──────────────────────────────────────────────────────────────

export function playUIClick(): void {
  const c = sfxCtx()
  if (!c || !ready("click", 0.04)) return
  if (!sample("click", { gain: 0.5, voices: 2 }))
    oNote(880, "sine", c.currentTime, 0.032, 0.16, sfxBus!)
}

export function playConfirm(): void {
  const c = sfxCtx()
  if (!c || !ready("confirm", 0.12)) return
  if (!sample("confirm", { gain: 0.5, voices: 1 })) {
    oNote(880, "sine", c.currentTime, 0.06, 0.18, sfxBus!)
    oNote(1318.5, "sine", c.currentTime + 0.06, 0.1, 0.16, sfxBus!)
  }
}

export function playBack(): void {
  const c = sfxCtx()
  if (!c || !ready("back", 0.08)) return
  if (!sample("back", { gain: 0.5, voices: 1 }))
    oNote(587.33, "sine", c.currentTime, 0.05, 0.16, sfxBus!)
}

export function playSelectCharacter(): void {
  const c = sfxCtx()
  if (!c || !ready("selectChar", 0.15)) return
  if (!sample("selectChar", { gain: 0.5, voices: 1 })) playConfirm()
}

export function playSelectPlace(): void {
  const c = sfxCtx()
  if (!c || !ready("selectPlace", 0.15)) return
  if (!sample("selectPlace", { gain: 0.5, voices: 1 })) playConfirm()
}

export function playPause(): void {
  const c = sfxCtx()
  if (!c || !ready("pause", 0.15)) return
  if (!sample("pause", { gain: 0.5, voices: 1 }))
    oSweep("sine", 660, 330, c.currentTime, 0.12, 0.16, sfxBus!)
}

export function playResume(): void {
  const c = sfxCtx()
  if (!c || !ready("resume", 0.15)) return
  if (!sample("resume", { gain: 0.5, voices: 1 }))
    oSweep("sine", 330, 660, c.currentTime, 0.12, 0.16, sfxBus!)
}

// ── Player sounds ────────────────────────────────────────────────────────────

/** Servo-assisted takeoff: a short rising tone over an airy push. */
export function playJump(): void {
  const c = sfxCtx()
  if (!c || !ready("jump", 0.06)) return
  const t = c.currentTime
  oSweep("triangle", 260, 620, t, 0.12, 0.2, sfxBus!)
  oNoise(t, 0.09, 0.08, 1800, sfxBus!, "bandpass")
}

/** Armoured boots meeting the runway: a soft, low thump. */
export function playLand(): void {
  const c = sfxCtx()
  if (!c || !ready("land", 0.1)) return
  const t = c.currentTime
  oSweep("sine", 120, 52, t, 0.1, 0.26, sfxBus!)
  oNoise(t, 0.05, 0.07, 900, sfxBus!)
}

let coinStreak = 0
let lastCoinT = -Infinity
/** Bright chime; a quick run of coins climbs gently instead of stacking. */
export function playCoin(): void {
  const c = sfxCtx()
  if (!c) return
  const t = c.currentTime
  if (t - lastCoinT < 0.055) return // throttle rapid coin collection
  coinStreak = t - lastCoinT < 0.5 ? Math.min(coinStreak + 1, 6) : 0
  lastCoinT = t
  const lift = Math.pow(2, coinStreak / 12)
  oNote(1318.5 * lift, "sine", t, 0.08, 0.3, sfxBus!) // E6
  oNote(1975.5 * lift, "sine", t + 0.035, 0.09, 0.2, sfxBus!) // B6
}

export function playHit(): void {
  const c = sfxCtx()
  if (!c || !ready("hit", 0.15)) return
  const t = c.currentTime
  oNote(75, "sine", t, 0.18, 0.42, sfxBus!)
  if (!sample("damage", { gain: 0.55, voices: 1 }))
    oNoise(t, 0.12, 0.32, 480, sfxBus!)
}

/** Final heart lost: heavy armour crunch. */
export function playFinalHit(): void {
  const c = sfxCtx()
  if (!c || !ready("finalHit", 1)) return
  const t = c.currentTime
  oNote(58, "sine", t, 0.32, 0.5, sfxBus!)
  if (!sample("finalHit", { gain: 0.6, voices: 1 })) {
    oNoise(t, 0.3, 0.36, 700, sfxBus!)
    oSweep("sawtooth", 220, 60, t, 0.3, 0.18, sfxBus!)
  }
}

/** Mech power-down: a falling whine that settles into a dying hum. */
export function playShutdown(): void {
  const c = sfxCtx()
  if (!c || !ready("shutdown", 1)) return
  const t = c.currentTime
  const osc = c.createOscillator()
  const filt = c.createBiquadFilter()
  const g = c.createGain()
  osc.type = "sawtooth"
  osc.frequency.setValueAtTime(520, t)
  osc.frequency.exponentialRampToValueAtTime(38, t + 0.75)
  filt.type = "lowpass"
  filt.frequency.setValueAtTime(2600, t)
  filt.frequency.exponentialRampToValueAtTime(160, t + 0.75)
  g.gain.setValueAtTime(0, t)
  g.gain.linearRampToValueAtTime(0.2, t + 0.03)
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.8)
  osc.connect(filt)
  filt.connect(g)
  g.connect(sfxBus!)
  osc.start(t)
  osc.stop(t + 0.82)
  oNote(110, "sine", t + 0.05, 0.6, 0.12, sfxBus!)
  oNoise(t + 0.62, 0.05, 0.08, 3000, sfxBus!, "highpass") // relay click
}

// ── Hazard sounds ────────────────────────────────────────────────────────────

/** Laser charging: two quiet pips. Shared cooldown so packs never chatter. */
export function playLaserWarning(): void {
  const c = sfxCtx()
  if (!c || !ready("laserWarn", 0.7)) return
  const t = c.currentTime
  oNote(1480, "square", t, 0.045, 0.05, sfxBus!)
  oNote(1480, "square", t + 0.09, 0.045, 0.05, sfxBus!)
}

export function playLaserActive(): void {
  const c = sfxCtx()
  if (!c || !ready("laserOn", 0.35)) return
  if (!sample("laserOn", { gain: 0.32, voices: 1 }))
    oSweep("sawtooth", 1800, 600, c.currentTime, 0.14, 0.08, sfxBus!)
}

export function playDroneActivate(): void {
  const c = sfxCtx()
  if (!c || !ready("drone", 1.4)) return
  if (!sample("drone", { gain: 0.26, voices: 1 }))
    oSweep("triangle", 180, 360, c.currentTime, 0.3, 0.08, sfxBus!)
}

export function playCrusherSlam(): void {
  const c = sfxCtx()
  if (!c || !ready("crusher", 0.6)) return
  if (!sample("crusher", { gain: 0.34, voices: 1 }))
    oNote(70, "sine", c.currentTime, 0.2, 0.3, sfxBus!)
}

// ── Power-ups and progression ────────────────────────────────────────────────

export function playBurstCollect(): void {
  const c = sfxCtx()
  if (!c) return
  const t = c.currentTime
  // Rising arpeggio: C5 E5 G5 C6 E6
  ;[523.25, 659.25, 783.99, 1046.5, 1318.5].forEach((f, i) =>
    oNote(f, "sawtooth", t + i * 0.065, 0.15, 0.2, sfxBus!),
  )
  oNote(1046.5, "sine", t + 0.3, 0.5, 0.16, sfxBus!) // sustain
  if (!sample("burst", { gain: 0.4, voices: 1 }))
    oNoise(t, 0.36, 0.2, 5500, sfxBus!)
}

export function playBurstEnd(): void {
  const c = sfxCtx()
  if (!c) return
  const t = c.currentTime
  ;[1046.5, 783.99, 659.25, 523.25, 392.0].forEach((f, i) =>
    oNote(f, "sine", t + i * 0.075, 0.18, 0.2, sfxBus!),
  )
}

export function playCountdownTick(final = false): void {
  const c = sfxCtx()
  if (!c) return
  oNote(
    final ? 1760 : 1108.73,
    "sine",
    c.currentTime,
    0.055,
    final ? 0.3 : 0.2,
    sfxBus!,
  )
}

export function playSpeedUp(): void {
  const c = sfxCtx()
  if (!c || !ready("speedUp", 0.5)) return
  const t = c.currentTime
  const osc = c.createOscillator()
  const g = c.createGain()
  osc.type = "sawtooth"
  osc.frequency.setValueAtTime(220, t)
  osc.frequency.exponentialRampToValueAtTime(880, t + 0.22)
  g.gain.setValueAtTime(0, t)
  g.gain.linearRampToValueAtTime(0.22, t + 0.02)
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.22)
  osc.connect(g)
  g.connect(sfxBus!)
  osc.start(t)
  osc.stop(t + 0.23)
  oNote(1318.5, "sine", t + 0.2, 0.16, 0.14, sfxBus!)
}

export function playMilestone(): void {
  const c = sfxCtx()
  if (!c) return
  const t = c.currentTime
  oNote(783.99, "sine", t, 0.13, 0.26, sfxBus!) // G5
  oNote(1046.5, "sine", t + 0.1, 0.18, 0.23, sfxBus!) // C6
}

export function playGameOver(): void {
  const c = sfxCtx()
  if (!c || !ready("gameOver", 1)) return
  const t = c.currentTime
  ;[523.25, 466.16, 415.3, 369.99, 329.63, 261.63].forEach((f, i) =>
    oNote(f, "sine", t + i * 0.13, 0.3, 0.3, sfxBus!),
  )
  oNoise(t + 0.06, 0.22, 0.12, 320, sfxBus!)
}

// ── Background Music ─────────────────────────────────────────────────────────

const MUSIC: Record<MusicTrack, { url: string; loopSeconds: number }> = {
  // Loop lengths are exact bar lengths of each composition.
  menu: { url: musicMenuUrl, loopSeconds: (320 * 60) / 165 },
  city: { url: musicCityUrl, loopSeconds: (240 * 60) / 145 },
  road: { url: musicRoadUrl, loopSeconds: (208 * 60) / 140 },
  neon: { url: musicNeonUrl, loopSeconds: (152 * 60) / 100 },
}

const trackBuffers = new Map<MusicTrack, Promise<AudioBuffer | null>>()

function loadTrack(track: MusicTrack): Promise<AudioBuffer | null> {
  let p = trackBuffers.get(track)
  if (!p) {
    p = decode(MUSIC[track].url)
    trackBuffers.set(track, p)
  }
  return p
}

/** Encoder priming silence at the head of a decoded file, in seconds. */
function leadIn(buf: AudioBuffer): number {
  const d = buf.getChannelData(0)
  const limit = Math.min(d.length, Math.floor(buf.sampleRate * 0.1))
  let i = 0
  while (i < limit && Math.abs(d[i]) < 1e-4) i++
  return i < 32 || i >= limit ? 0 : i / buf.sampleRate
}

// ── Music controller ─────────────────────────────────────────────────────────
// Single owner of background music. Every instance ever started is tracked in
// `live` until it has fully stopped, and a new track is only scheduled to
// begin once every previous instance has faded to silence, so two tracks can
// never be heard at the same time (no crossfade overlap, no orphaned loops).

/** Fade-out of the outgoing track; the next track waits for it to finish. */
const MUSIC_FADE_OUT = 0.45
/** Fade-in of the incoming track. */
const MUSIC_FADE_IN = 0.6

interface Playing {
  track: MusicTrack
  gain: GainNode
  source: AudioBufferSourceNode | null
  synthTimer: ReturnType<typeof setTimeout> | null
  /** Context time at which this instance is silent and stopped (retired). */
  endsAt: number | null
}

let wantedTrack: MusicTrack | null = null
/** The one instance allowed to be audible (null while switching/stopped). */
let playing: Playing | null = null
/** All instances that still exist, including ones fading out. */
const live = new Set<Playing>()
let musicToken = 0

function release(p: Playing) {
  if (!live.has(p)) return
  live.delete(p)
  if (p.synthTimer !== null) clearTimeout(p.synthTimer)
  p.synthTimer = null
  try {
    p.source?.stop()
  } catch {
    // Already stopped.
  }
  p.gain.disconnect()
}

/**
 * Fades out and stops every music instance. Returns the context time when
 * all of them are silent, i.e. the earliest moment the next track may start.
 */
function retireAll(seconds: number): number {
  playing = null
  if (!ctx) return 0
  const now = ctx.currentTime
  let silentAt = now
  for (const p of live) {
    if (p.synthTimer !== null) {
      clearTimeout(p.synthTimer)
      p.synthTimer = null
    }
    if (p.endsAt === null || p.endsAt > now + seconds) {
      const g = p.gain.gain
      g.cancelScheduledValues(now)
      g.setValueAtTime(g.value, now)
      g.linearRampToValueAtTime(0, now + seconds)
      p.endsAt = now + seconds
      if (p.source) {
        p.source.onended = () => release(p)
        p.source.stop(p.endsAt + 0.02)
      } else {
        // Synth notes already scheduled ride on this gain, which is now 0.
        setTimeout(() => release(p), (seconds + 0.1) * 1000)
      }
    }
    silentAt = Math.max(silentAt, p.endsAt)
  }
  return silentAt
}

function fadeIn(gain: GainNode, at: number, seconds: number) {
  gain.gain.setValueAtTime(0, at)
  gain.gain.linearRampToValueAtTime(1, at + seconds)
}

function startTrack(track: MusicTrack, buf: AudioBuffer, at: number) {
  if (!ctx || !musicBus) return
  const gain = ctx.createGain()
  gain.gain.value = 0
  gain.connect(musicBus)
  const source = ctx.createBufferSource()
  source.buffer = buf
  source.loop = true
  const start = leadIn(buf)
  source.loopStart = start
  source.loopEnd = Math.min(buf.duration, start + MUSIC[track].loopSeconds)
  source.connect(gain)
  fadeIn(gain, at, MUSIC_FADE_IN)
  source.start(at, start)
  const p: Playing = { track, gain, source, synthTimer: null, endsAt: null }
  source.onended = () => release(p)
  live.add(p)
  playing = p
}

// Original synthesized loops, kept as a fallback when a file is unavailable.
type NoteSpec = [number, number, number, OscillatorType, number]
// [frequency, beat_offset, duration_beats, waveform, gain]

// Menu: 100 BPM, beat = 0.6s, C major arpeggio, 8 beats = 4.8s
const MENU_BEAT = 0.6
const MENU_DUR = 8 * MENU_BEAT
const MENU_MELODY: NoteSpec[] = [
  [523.25, 0, 0.76, "sine", 0.34], // C5
  [659.25, 1, 0.76, "sine", 0.3], // E5
  [783.99, 2, 0.76, "sine", 0.3], // G5
  [1046.5, 3, 0.76, "sine", 0.25], // C6
  [783.99, 4, 0.76, "sine", 0.3], // G5
  [659.25, 5, 0.76, "sine", 0.3], // E5
  [587.33, 6, 0.76, "sine", 0.27], // D5
  [523.25, 7, 0.76, "sine", 0.34], // C5
]

// Game: 132 BPM, beat = 0.4545s, 8 beats = 3.636s
const GAME_BEAT = 60 / 132
const GAME_DUR = 8 * GAME_BEAT
const GAME_MELODY: NoteSpec[] = [
  [523.25, 0, 0.38, "triangle", 0.25], // C5
  [659.25, 0.5, 0.36, "triangle", 0.23], // E5
  [783.99, 1.0, 0.38, "triangle", 0.25], // G5
  [659.25, 1.5, 0.34, "triangle", 0.2], // E5
  [880.0, 2.0, 0.38, "triangle", 0.25], // A5
  [783.99, 2.5, 0.34, "triangle", 0.23], // G5
  [659.25, 3.0, 0.38, "triangle", 0.23], // E5
  [587.33, 3.5, 0.34, "triangle", 0.2], // D5
  [523.25, 4.0, 0.38, "triangle", 0.25], // C5
  [659.25, 4.5, 0.36, "triangle", 0.23], // E5
  [698.46, 5.0, 0.38, "triangle", 0.25], // F5
  [659.25, 5.5, 0.34, "triangle", 0.2], // E5
  [783.99, 6.0, 0.38, "triangle", 0.25], // G5
  [880.0, 6.5, 0.34, "triangle", 0.23], // A5
  [1046.5, 7.0, 0.45, "triangle", 0.25], // C6
  [783.99, 7.5, 0.34, "triangle", 0.2], // G5
]
const GAME_BASS: NoteSpec[] = [
  [130.81, 0, 1.7, "sine", 0.34], // C3
  [174.61, 2, 1.7, "sine", 0.3], // F3
  [196.0, 4, 1.7, "sine", 0.3], // G3
  [220.0, 6, 1.7, "sine", 0.3], // A3
]

function schedulePhrase(
  mode: "menu" | "game",
  start: number,
  dest: AudioNode,
): void {
  if (!ctx) return
  const beat = mode === "menu" ? MENU_BEAT : GAME_BEAT
  const melody = mode === "menu" ? MENU_MELODY : GAME_MELODY
  const now = ctx.currentTime
  // The synth loop was balanced for a 0.17 bus; scale it to the new bus.
  const k = 0.17 / MUSIC_LEVEL

  for (const [freq, bo, db, type, vol] of melody) {
    const t = start + bo * beat
    if (t >= now - 0.05) oNote(freq, type, t, db * beat * 0.86, vol * k, dest)
  }

  if (mode === "game") {
    for (const [freq, bo, db, , vol] of GAME_BASS) {
      const t = start + bo * beat
      if (t >= now - 0.05)
        oNote(freq, "sine", t, db * beat * 0.8, vol * 0.6 * k, dest)
    }
    for (const kb of [0, 4]) {
      const t = start + kb * beat
      if (t >= now - 0.05) {
        oSweep("sine", 145, 38, t, 0.13, 0.5 * k, dest)
        oNoise(t, 0.04, 0.1 * k, 160, dest)
      }
    }
    for (let i = 0; i < 8; i++) {
      const t = start + i * beat
      if (t >= now - 0.05) oNoise(t, 0.026, 0.06 * k, 10000, dest)
    }
    for (const sb of [2, 6]) {
      const t = start + sb * beat
      if (t >= now - 0.05) {
        oNoise(t, 0.055, 0.16 * k, 4200, dest)
        oNote(215, "sine", t, 0.05, 0.1 * k, dest)
      }
    }
  }
}

function startSynth(track: MusicTrack, at: number) {
  if (!ctx || !musicBus) return
  const mode = track === "menu" ? "menu" : "game"
  const phraseDur = mode === "menu" ? MENU_DUR : GAME_DUR
  const gain = ctx.createGain()
  gain.gain.value = 0
  gain.connect(musicBus)
  fadeIn(gain, at, 0.4)
  const p: Playing = { track, gain, source: null, synthTimer: null, endsAt: null }
  live.add(p)
  playing = p
  let next = at + 0.02
  const loop = () => {
    if (!ctx || playing !== p) return
    schedulePhrase(mode, next, gain)
    const waitMs = (next - ctx.currentTime + phraseDur * 0.82) * 1000
    next += phraseDur
    p.synthTimer = setTimeout(loop, Math.max(50, waitMs))
  }
  loop()
}

/**
 * Switches background music to `track`: the current track fades out and is
 * fully stopped before the new one fades in. Re-requesting the track that is
 * already playing (or about to) is a no-op, so screens and pause/resume can
 * call this freely without restarting or duplicating the loop.
 */
export function startMusic(track: MusicTrack): void {
  if (!musicAudible()) return
  const c = getCtx()
  if (!c) return
  if (wantedTrack === track) return
  wantedTrack = track
  const token = ++musicToken
  const silentAt = retireAll(MUSIC_FADE_OUT)
  void loadTrack(track).then((buf) => {
    if (token !== musicToken || !ctx) return
    // Anything still audible (should be nothing) is retired first; the new
    // track starts only once all previous instances are silent.
    const at = Math.max(silentAt, retireAll(MUSIC_FADE_OUT), ctx.currentTime + 0.03)
    if (buf) startTrack(track, buf, at)
    else startSynth(track, at)
  })
}

export function stopMusic(): void {
  wantedTrack = null
  musicToken++
  retireAll(MUSIC_FADE_OUT)
}

/** Ducks the music while gameplay is paused. */
export function setMusicPaused(paused: boolean): void {
  if (musicDuck) ramp(musicDuck.gain, paused ? PAUSE_DUCK : 1, 0.12)
}

export function updateAudioSettings(prefs: AudioPrefs): void {
  masterMuted = prefs.masterMute
  sfxOn = prefs.sound
  musicOn = prefs.music
  musicVolume = Math.min(1, Math.max(0, prefs.musicVolume / 100))
  sfxVolume = Math.min(1, Math.max(0, prefs.sfxVolume / 100))
  if (!musicAudible() && wantedTrack !== null) stopMusic()
  // Switching something off cuts it immediately; volume changes glide.
  if (master) setLevel(master.gain, masterMuted ? 0 : MASTER_LEVEL)
  if (sfxBus) {
    if (sfxGain() === 0) setLevel(sfxBus.gain, 0)
    else ramp(sfxBus.gain, sfxGain())
  }
  if (musicBus) {
    if (musicGain() === 0) setLevel(musicBus.gain, 0)
    else ramp(musicBus.gain, musicGain())
  }
}

/**
 * Fetches the menu loop and every interface/gameplay sample so the first
 * sounds are instant. Resolves when the files are in memory (or failed);
 * never rejects. Place music streams in lazily when a run starts.
 */
export function preloadAudio(): Promise<void> {
  const urls = [MUSIC.menu.url, ...Object.values(SAMPLE_URLS)]
  return Promise.all(urls.map(fetchFile)).then(() => undefined)
}

/** Prefetches one place's music, e.g. while a run is being selected. */
export function preloadTrack(track: MusicTrack): void {
  void fetchFile(MUSIC[track].url)
}

// Development hot reload re-executes this module with a fresh AudioContext.
// Close the old one so its music cannot keep looping alongside the new one.
if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    musicToken++
    for (const p of [...live]) release(p)
    void ctx?.close().catch(() => {})
    ctx = null
  })
}
