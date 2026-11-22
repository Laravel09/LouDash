import {
  useState,
  useEffect,
  useLayoutEffect,
  useCallback,
  useRef,
} from "react"
import type {
  Screen,
  GameResult,
  AppSettings,
  CharacterId,
  PlaceId,
} from "./types"
import {
  preloadAudio,
  preloadTrack,
  startMusic,
  stopMusic,
  updateAudioSettings,
} from "./audio"
import SplashScreen from "./SplashScreen"
import MainMenu from "./MainMenu"
import CharacterSelect from "./CharacterSelect"
import PlaceSelect from "./PlaceSelect"
import HowToPlay from "./HowToPlay"
import HighScore from "./HighScore"
import Settings from "./Settings"
import GameOver from "./GameOver"
import GamePlay from "./GamePlay"
import { loadProfile, saveProfile } from "./profileStorage"
import { preloadGameArt } from "./gameArt"
import { getVisibleViewport } from "./viewport"

const GAME_W = 844
const GAME_H = 390

export default function App() {
  const initialProfile = useRef(loadProfile()).current
  const [screen, setScreen] = useState<Screen>("splash")
  const [settings, setSettings] = useState<AppSettings>(initialProfile.settings)
  const [highScores, setHighScores] = useState<number[]>(
    initialProfile.highScores,
  )
  const [lastResult, setLastResult] = useState<GameResult>({
    score: 0,
    coins: 0,
    distance: 0,
    seconds: 0,
    bursts: 0,
    bestTier: "EASY",
    achievement: null,
  })
  const [selectedChar, setSelectedChar] = useState<CharacterId>(
    initialProfile.selectedChar,
  )
  const [selectedPlace, setSelectedPlace] = useState<PlaceId>(
    initialProfile.selectedPlace,
  )
  const [scale, setScale] = useState(1)
  const [menuPrimed, setMenuPrimed] = useState(false)
  const [isPortrait, setIsPortrait] = useState(false)
  const gameOverHandledRef = useRef(false)
  const shellRef = useRef<HTMLDivElement>(null)

  // Decode runner and environment art during the splash, not mid-run.
  useEffect(() => {
    void preloadGameArt()
    void preloadAudio()
  }, [])

  // Fetch the active place's music ahead of the run so it starts on time.
  useEffect(() => {
    preloadTrack(selectedPlace)
  }, [selectedPlace])

  useLayoutEffect(() => {
    let resizeFrame = 0

    function calcScale() {
      const viewport = getVisibleViewport()
      setIsPortrait(viewport.height > viewport.width)

      // Use the smaller of the layout and visual viewports. Mobile browsers
      // can report different values while their address bar is expanding,
      // collapsing, or the device is rotating.
      const shell = shellRef.current
      let availW = viewport.width
      let availH = viewport.height
      if (shell) {
        const cs = getComputedStyle(shell)
        const horizontalPadding =
          parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight)
        const verticalPadding =
          parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom)
        availW = Math.min(shell.clientWidth, viewport.width) - horizontalPadding
        availH = Math.min(shell.clientHeight, viewport.height) - verticalPadding
      }
      const sx = availW / GAME_W
      const sy = availH / GAME_H
      setScale(Math.max(0.1, Math.min(sx, sy, 2.4)))
    }

    function scheduleScale() {
      cancelAnimationFrame(resizeFrame)
      resizeFrame = requestAnimationFrame(calcScale)
    }

    calcScale()
    const observer = new ResizeObserver(scheduleScale)
    if (shellRef.current) observer.observe(shellRef.current)
    window.addEventListener("resize", scheduleScale)
    window.addEventListener("orientationchange", scheduleScale)
    window.visualViewport?.addEventListener("resize", scheduleScale)

    return () => {
      cancelAnimationFrame(resizeFrame)
      observer.disconnect()
      window.removeEventListener("resize", scheduleScale)
      window.removeEventListener("orientationchange", scheduleScale)
      window.visualViewport?.removeEventListener("resize", scheduleScale)
    }
  }, [])

  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)")
    if (reducedMotion.matches) {
      setSettings((current) =>
        current.reduceEffects ? current : { ...current, reduceEffects: true },
      )
    }
  }, [])

  useEffect(() => {
    updateAudioSettings({
      masterMute: settings.masterMute,
      sound: settings.sound,
      music: settings.music,
      musicVolume: settings.musicVolume,
      sfxVolume: settings.sfxVolume,
    })
  }, [
    settings.masterMute,
    settings.sound,
    settings.music,
    settings.musicVolume,
    settings.sfxVolume,
  ])

  // Single owner of screen music. Gameplay plays the selected place's loop;
  // every other screen shares the menu loop, so navigating never restarts it.
  // GameOver is reached only after GamePlay has already faded its music out.
  useEffect(() => {
    if (!settings.music || settings.masterMute || screen === "splash") {
      stopMusic()
    } else {
      startMusic(screen === "gameplay" ? selectedPlace : "menu")
    }
  }, [screen, settings.music, settings.masterMute, selectedPlace])

  useEffect(() => {
    saveProfile({ highScores, selectedChar, selectedPlace, settings })
  }, [highScores, selectedChar, selectedPlace, settings])

  // Character Selection returns to whichever screen opened it (Main Menu or
  // Game Over), both on BACK and after confirming a runner.
  const charSelectReturnRef = useRef<Screen>("menu")

  const navigate = useCallback((s: Screen) => {
    if (s === "gameplay") gameOverHandledRef.current = false
    if (s === "charSelect") charSelectReturnRef.current = "menu"
    setScreen(s)
  }, [])

  const openCharSelectFromGameOver = useCallback(() => {
    navigate("charSelect")
    charSelectReturnRef.current = "gameover"
  }, [navigate])

  const handleGameOver = useCallback(
    (result: Omit<GameResult, "achievement">) => {
      if (gameOverHandledRef.current) return
      gameOverHandledRef.current = true

      const { score } = result
      const best = highScores[0] ?? 0
      const qualifies =
        score > 0 && (highScores.length < 5 || score >= (highScores[4] ?? 0))
      const achievement: GameResult["achievement"] =
        score > best ? "personalBest" : qualifies ? "topFive" : null
      if (qualifies)
        setHighScores((prev) =>
          [score, ...prev].sort((a, b) => b - a).slice(0, 5),
        )
      setLastResult({ ...result, achievement })
      setScreen("gameover")
    },
    [highScores],
  )

  const handleSelectChar = useCallback((id: CharacterId) => {
    setSelectedChar(id)
    setScreen(charSelectReturnRef.current)
  }, [])

  const handleSelectPlace = useCallback((id: PlaceId) => {
    setSelectedPlace(id)
    setScreen("menu")
  }, [])

  return (
    <div
      ref={shellRef}
      className="app-shell"
      style={{
        background: "#080c18",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
      }}
    >
      {isPortrait && (
        <div className="rotate-device" role="status">
          <svg aria-hidden="true" viewBox="0 0 64 64">
            <rect x="18" y="8" width="28" height="48" rx="6" />
            <path d="M8 30A25 25 0 0 1 28 6M8 30l-4-8M8 30l8-4" />
          </svg>
          <div className="font-orbitron">ROTATE DEVICE</div>
          <p>LouDash is built for landscape play.</p>
        </div>
      )}
      <div
        className="game-frame"
        style={{
          width: GAME_W,
          height: GAME_H,
          position: "relative",
          flexShrink: 0,
          overflow: "hidden",
          transform: `scale(${scale})`,
          transformOrigin: "center center",
          borderRadius: 4,
          boxShadow: "0 0 60px rgba(0,229,200,0.07), 0 0 120px rgba(0,0,0,0.8)",
        }}
      >
        {/* The menu mounts under the fading splash, so the hand-off is
            seamless and the splash ends exactly on time. */}
        {(screen === "menu" || (screen === "splash" && menuPrimed)) && (
          <MainMenu
            onNavigate={navigate}
            highScores={highScores}
            selectedChar={selectedChar}
            selectedPlace={selectedPlace}
            reduceEffects={settings.reduceEffects}
            introDelay={screen === "splash" ? 0.5 : 0.05}
          />
        )}
        {screen === "splash" && (
          <SplashScreen
            onDone={() => navigate("menu")}
            onPrime={() => setMenuPrimed(true)}
            reduceEffects={settings.reduceEffects}
          />
        )}
        {screen === "charSelect" && (
          <CharacterSelect
            current={selectedChar}
            onSelect={handleSelectChar}
            onBack={() => setScreen(charSelectReturnRef.current)}
          />
        )}
        {screen === "placeSelect" && (
          <PlaceSelect
            reduceEffects={settings.reduceEffects}
            current={selectedPlace}
            onSelect={handleSelectPlace}
            onBack={() => navigate("menu")}
          />
        )}
        {screen === "howToPlay" && (
          <HowToPlay onBack={() => navigate("menu")} />
        )}
        {screen === "highScore" && (
          <HighScore onBack={() => navigate("menu")} scores={highScores} />
        )}
        {screen === "settings" && (
          <Settings
            onBack={() => navigate("menu")}
            settings={settings}
            onSettingsChange={setSettings}
          />
        )}
        {screen === "gameplay" && (
          <GamePlay
            key={screen + selectedChar + selectedPlace}
            onGameOver={handleGameOver}
            onMenu={() => navigate("menu")}
            settings={settings}
            onSettingsChange={setSettings}
            characterId={selectedChar}
            placeId={selectedPlace}
          />
        )}
        {screen === "gameover" && (
          <GameOver
            result={lastResult}
            highScores={highScores}
            onPlayAgain={() => navigate("gameplay")}
            onMenu={() => navigate("menu")}
            onCharSelect={openCharSelectFromGameOver}
          />
        )}
      </div>
    </div>
  )
}
