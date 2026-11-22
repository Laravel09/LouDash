# LOUDASH — MASTER GAMEPLAY MECHANIC REVISION & IMPROVEMENT (FIXED)

You are improving the **existing LouDash Figma Make prototype**.

## 🚨 IMPORTANT — DO NOT REBUILD FROM SCRATCH

**Do NOT rebuild the project from scratch.**

First inspect the existing LouDash implementation and understand how the current gameplay works.

Preserve the existing:

* Main Menu
* Character Select
* Three characters
* Environment/Place Select
* How to Play
* High Score
* Settings
* Pause
* Game Over
* Existing navigation
* Existing visual design
* Existing environments
* Existing character visuals
* Existing working interactions
* Existing health system
* Existing gameplay structure

Only modify the systems that are necessary to improve the gameplay mechanics described below.

**Do not remove working features unless they directly conflict with the requirements below.**

---

# 1. MAIN GOAL OF THIS REVISION

The purpose of this revision is to make LouDash:

* smoother
* more responsive
* more predictable
* more enjoyable
* easier to understand
* fairer
* more rewarding

The main gameplay problems that must be fixed are:

1. The game currently starts too fast.
2. The game sometimes appears to slow down randomly during a run.
3. The score increases too quickly.
4. The score should represent actual running progress.
5. The jump feels inconsistent.
6. Some jumps are too high or too fast.
7. Some jumps do not provide enough horizontal travel.
8. Coins can be difficult to collect while jumping.
9. Power-ups can be difficult to reach.
10. The old Energy meter makes the power-up system too slow.
11. The power-up should become a more exciting milestone-based reward.

The final gameplay should feel:

**RUN → JUMP → DODGE → COLLECT → SURVIVE → PROGRESS → POWER UP**

---

# 2. FIX THE STARTING SPEED

The current game starts too fast.

When a new run begins, use a comfortable starting speed.

The first few seconds should allow the player to:

* understand the movement
* see the first obstacle
* perform the first jump
* collect initial coins
* understand the gameplay

Use:

**BASE SPEED = ×1.0**

Do NOT start the player at high/endgame speed.

Do not immediately use ×1.5, ×2.0, or any extreme speed.

The game should feel energetic but comfortable.

---

# 3. ABSOLUTELY NO RANDOM MID-GAME SLOWDOWN

This is one of the most important requirements.

Once a run begins:

**THE GAME MUST NEVER RANDOMLY SLOW DOWN.**

If the player is currently running at:

**SPEED ×1.2**

the game must not suddenly become:

**SPEED ×1.0**

during normal gameplay.

Speed may:

* remain the same
* gradually increase

Speed must NEVER randomly decrease.

Do not allow these systems to accidentally modify the running speed:

* jumping
* landing
* collecting coins
* collecting power-ups
* obstacle generation
* coin generation
* animations
* popups
* milestone notifications
* visual effects
* Signal Burst

The only intended reason for speed to increase is the game's planned difficulty progression (Section 5).

---

# 4. USE ONE AUTHORITATIVE GAME SPEED

Create or maintain one authoritative gameplay speed value, such as:

**currentSpeed**

This value should control the actual movement of the gameplay world.

Do NOT allow multiple systems to independently modify the running speed.

The relationship should be:

**SCORE → DIFFICULTY → SPEED**

Not:

**SCORE → RANDOM SPEED**

Not:

**JUMP → SPEED CHANGE**

Not:

**COIN → SPEED CHANGE**

Not:

**POWER-UP → SPEED CHANGE**

The player must always understand why the game becomes faster.

---

# 5. GRADUAL SPEED PROGRESSION

Use the player's actual score to control difficulty. Speed is a **step function of score tier**, not a continuous function of score — within a tier, speed stays flat:

| Score range | Speed |
|---|---|
| 0–499 | ×1.0 |
| 500–999 | ×1.1 |
| 1,000–1,499 | ×1.2 |
| 1,500–1,999 | ×1.3 |
| 2,000–2,499 | ×1.4 |
| 2,500–2,999 | ×1.5 |
| 3,000+ | ×1.6 |

Speed caps at approximately **×1.6–1.7 maximum** — do not keep raising it past 3,000 score. (Score milestones and power-up checks continue indefinitely past this point per Section 25; only the speed cap stops.)

Do not suddenly *snap* between tiers — see Section 6 for how the transition itself should feel.

---

# 6. SPEED MUST NEVER DECREASE, AND TIER TRANSITIONS MUST BE SMOOTH

Two separate rules here — don't conflate them:

**A. Speed progression must be monotonic across the whole run.**
Speed can stay the same or increase, but never decrease during a run.

GOOD: **×1.0 → ×1.0 → ×1.1 → ×1.1 → ×1.2**
BAD: **×1.0 → ×1.15 → ×0.9 → ×1.2**

**B. Speed does not stay flat *for the entire duration of a tier* and then instantly jump — it should stay flat, then ramp smoothly over a short transition window right at the moment the score crosses into the next tier.**

For example, crossing from the 0–499 tier (×1.0) into the 500–999 tier (×1.1): speed should stay at exactly ×1.0 for scores 0–499, then interpolate smoothly from ×1.0 to ×1.1 over a brief transition (e.g. 1–2 seconds of gameplay) right as the score passes 500, then hold flat at ×1.1 until the next tier boundary. This avoids both a jarring instant snap and an ambiguous "what speed am I at right now" feeling in the middle of a tier.

Do not interpolate continuously across the *entire* 500-point range of a tier — only smooth the moment of transition itself.

---

# 7. SPEED-UP FEEDBACK

When the player crosses an actual speed tier boundary (Section 5's table), briefly display:

## ⚡ SPEED UP!

Then show the new current speed, e.g.:

**SPEED ×1.1**

The notification must:

* animate quickly
* stay outside the main obstacle path
* disappear automatically
* not pause gameplay
* not block the character
* only appear when speed actually increases (i.e. only at real tier crossings, never randomly)

Do not display fake or premature speed notifications.

---

# 8. FIX THE SCORE SYSTEM

The current score increases too quickly.

The score must represent actual running progress.

Do NOT award excessive score every animation frame.

Use controlled score accumulation based on actual running time / running distance / gameplay progress.

The running score should increase gradually — for example:

**101 → 102 → 103 → 104 → 105**

rather than:

**100 → 150 → 220 → 350 → 500**

within only a few seconds.

---

# 9. COIN SCORE

Normal coins should remain the primary collectible.

Each normal coin should provide:

**+10 SCORE**

Coins should not suddenly provide huge amounts of score.

Do not apply any score multiplier during normal gameplay. The only exception is the optional multiplier described in Section 36, which is conditional on Signal Burst and should not otherwise affect normal coin scoring.

---

# 10. MAKE THE SCORE EASY TO READ

The HUD should show a clean integer.

Example: **SCORE 124** → **SCORE 125** → **SCORE 126**

Do NOT display unnecessary decimals such as **124.83942**.

Use thousands separators when appropriate: **1,000** / **2,500** / **10,000**.

The player should be able to quickly understand the current score.

---

# 11. SCORE MUST NOT OUTPACE THE GAMEPLAY

The player should NOT reach **500** almost immediately.

The player should have enough time to experience running, jumping, avoiding obstacles, and collecting coins before reaching major milestones.

The progression should feel like:

**RUN → SURVIVE → SCORE → MILESTONE**

not:

**START → 500 → 1,000 → 2,000**

within a very short period.

---

# 12. USE ONE AUTHORITATIVE SCORE

The actual displayed score should be the same score used for: speed progression, milestones, power-up eligibility, high score, and game-over score.

Do NOT create separate fake milestone counters.

If the HUD says **SCORE 500**, the game has genuinely reached the 500-score milestone.

---

# 13. IMPROVE THE JUMP

The current jump does not feel reliable enough. Some jumps are too high, too fast, or too sudden. Other jumps do not provide enough distance to collect coins or power-ups.

Do NOT solve this simply by making the jump higher. Instead create **LOWER + SMOOTHER + LONGER** jump physics: smooth takeoff, moderate height, controlled upward acceleration, smooth apex, longer horizontal travel, controlled falling, predictable landing, responsive input.

---

# 14. TARGET JUMP FEEL

The player should clearly feel:

**TAKEOFF → RISE → APEX → FORWARD TRAVEL → DESCEND → LAND**

Do not make the character shoot upward instantly. Do not make the character fall immediately. Do not make the character teleport. The jump should feel natural and controllable.

---

# 15. INCREASE HORIZONTAL JUMP TRAVEL

This is very important. The player needs more horizontal movement distance during a jump.

Increase the effective horizontal jump travel by approximately **40–60%** from the current behavior.

Do NOT simply increase jump height. The goal is **WIDER BUT CONTROLLED**, not **HIGHER AND FASTER**.

The player should be able to reach coins and power-ups that are reasonably ahead of the character. Do not allow the character to fly across the entire screen.

---

# 16. KEEP JUMP HEIGHT MODERATE

The player should normally be able to clear standard obstacles, collect normal elevated coins, and reach occasional power-ups. The character should not fly excessively high above the gameplay area. Keep the jump within a predictable vertical range.

---

# 17. STANDARDIZE BASIC JUMP PHYSICS

For **LOU**, **DASH**, and **NOVA**, use the same basic jump physics. Small character differences are acceptable, but **no character should have an extreme jump advantage or disadvantage.** The player should learn one predictable jump system.

---

# 18. MAKE COIN COLLECTION MORE FORGIVING

The player should not need pixel-perfect contact with coins. Increase the invisible coin pickup radius.

Recommended: **effective pickup area ≈ 1.4–1.6× the visible coin size.**

If the character visually comes reasonably close to a coin, collect it. The player should feel *"I clearly reached that coin,"* not *"why didn't the game collect it?"*

Do not make the pickup radius so large that coins are collected from across the screen.

---

# 19. MAKE POWER-UP COLLECTION FORGIVING

Use the same principle for the special Signal Burst power-up. The player should not need perfect alignment. Use a generous but controlled pickup area. If the player jumps through or comes reasonably close to the power-up, collect it.

---

# 20. IMPROVE COIN GENERATION

Review the existing coin-generation system. Do not simply place coins at completely random positions. Use readable difficulty bands:

* **LOW** — easy to collect while running.
* **MID** — requires a normal jump.
* **HIGH** — occasional reward.

Most coin groups should be **LOW or MID**. HIGH coin groups should be occasional. Do not randomly place coins outside the player's practical jump arc.

---

# 21. USE READABLE COIN PATTERNS

Use clear, intentional layouts the player can read at a glance:

**Straight line** (all ground level):
```
🪙 🪙 🪙 🪙
```

**Rising pattern** (each coin higher than the last, following the jump arc):
```
        🪙
     🪙
  🪙
🪙
```

**Arc pattern** (matches the natural curve of a jump):
```
   🪙  🪙
 🪙      🪙
🪙        🪙
```

**Low → High → Low** (dip down, jump up, come back down):
```
🪙              🪙
   🪙        🪙
      🪙  🪙
```

The player should be able to understand the intended jump path just by looking at the pattern.

---

# 22. COINS MUST MATCH THE NEW JUMP

After changing the jump physics, review and adjust coin placement. Do not keep old coin positions if they become difficult or impossible to reach. Coin placement must be designed around the new **LOWER + SMOOTHER + LONGER** jump arc.

---

# 23. FAIR OBSTACLE + COIN GENERATION

Never generate a coin pattern that forces the player into an unavoidable obstacle. The gameplay should always provide:

**SEE → DECIDE → JUMP/DODGE → COLLECT → LAND**

Avoid: impossible jumps, coins inside obstacles, coins hidden behind obstacles, extremely narrow landing windows, obstacle combinations with no reaction time, unreachable high coins, unreachable power-ups.

As speed increases, maintain fair spacing.

---

# 24. REMOVE THE OLD ENERGY METER

Completely remove the current gameplay requirement where the player collects Energy pickups to slowly fill **0–100% SIGNAL**. Do NOT require approximately five Energy pickups to charge Signal Burst. Remove normal Energy pickups from the main gameplay loop.

Do NOT show **SIGNAL 20% / 40% / 60% / 80% / 100%**. The old meter system should no longer be part of normal gameplay. Normal coins remain the primary collectible.

---

# 25. CREATE THE NEW MILESTONE POWER-UP SYSTEM

Replace the old Energy system with a milestone-based random power-up opportunity.

Eligible score milestones: **500, 1,000, 1,500, 2,000, 2,500, 3,000, 3,500, 4,000, 4,500, 5,000**, and continuing every **500 score** indefinitely — this continues even after the speed cap is reached at 3,000+ (Section 5).

**Note:** these milestone checkpoints are the same score values used for speed tiers in Section 5, but they are two independent systems. The speed-tier increase at each checkpoint is guaranteed/deterministic. The power-up opportunity at each checkpoint is probabilistic (Section 26). Reaching 1,000 score always means "speed is now ×1.2"; it does NOT always mean "a power-up appears."

---

# 26. POWER-UP MILESTONES ARE NOT GUARANTEED

Do NOT guarantee a power-up at every milestone. At each eligible milestone, perform a controlled random chance check.

**Default recommended probability: 50% chance per milestone**, unless the existing prototype already implements a different documented rate.

This means the outcome is genuinely random each time — not a fixed alternating pattern. For example, across ten consecutive milestones the result might be:

**yes, yes, no, yes, no, no, yes, no, yes, no** (order will vary every run — this is only illustrating that it's non-deterministic, not a pattern to hardcode).

This creates anticipation and surprise. Do not make the system predictable, and do not literally alternate no/yes/no/yes.

---

# 27. PREVENT EXCESSIVE POWER-UPS

Use controlled randomness. Prevent:

* two power-ups appearing almost immediately one after another
* duplicate power-up events at the same milestone
* power-ups appearing during game over
* power-ups appearing while paused
* power-ups appearing at impossible locations
* repeated triggering of the same milestone

Each milestone may trigger its random check **only once**.

---

# 28. SIGNAL BURST POWER-UP

When a milestone successfully passes the random check, **spawn a physical Signal Burst power-up** in the gameplay world.

The player should still need to **SEE → JUMP → COLLECT** the power-up. Do not automatically activate the power-up from the milestone check itself — the milestone creates the *opportunity*; the player earns the effect by physically collecting it.

---

# 29. SIGNAL BURST VISUAL

The physical power-up should clearly communicate **⚡ SIGNAL BURST**. It should be visually distinct from coins — use a clear signal/lightning symbol, glowing outline, energy ring, and a small pulse animation. Do not make it look like an Energy meter pickup.

---

# 30. POWER-UP POPUP

When the player successfully collects the Signal Burst power-up, briefly show a centered animated popup:

# ⚡ SIGNAL BURST
### POWER-UP ACTIVATED
**INVINCIBLE + COIN MAGNET**
**5 SECONDS**

The popup should be short. Do not permanently stop gameplay. Do not require the player to press another button. The effect should activate automatically after collection.

---

# 31. SIGNAL BURST DURATION

Signal Burst must last exactly **5 seconds**. During those 5 seconds:

### 🛡 INVINCIBILITY
The player cannot lose health from normal obstacles.

### 🧲 COIN MAGNET
Nearby coins are automatically attracted toward the player.

---

# 32. SIGNAL BURST COUNTDOWN

During the effect, display a countdown in a consistent two-digit format:

**⚡ SIGNAL BURST 05s** → **04s** → **03s** → **02s** → **01s** → **SIGNAL BURST COMPLETE**

Immediately return to normal gameplay. Do not require manual deactivation. (Use this same `0Xs` format everywhere the countdown appears, including the HUD in Section 38.)

---

# 33. COIN MAGNET BEHAVIOR

During Signal Burst: nearby coins move toward the character, visibly curving rather than teleporting instantly. Use a reasonable, bounded attraction radius. Show a subtle magnetic field, a small visual trail, and satisfying collection feedback.

Do NOT attract coins from the entire screen. The player should immediately understand *"the power-up is pulling coins toward me."*

---

# 34. INVINCIBILITY BEHAVIOR

During Signal Burst: obstacle collisions do not remove health, the player remains in the run, normal health is preserved, and obstacles can visibly contact the player without damage.

Show **🛡 INVINCIBLE** in the HUD. When Signal Burst ends, normal obstacle damage immediately returns.

---

# 35. SIGNAL BURST VISUAL IDENTITY

During the 5-second effect: bright outline, subtle glow, pulsing signal ring, small shield indicator, subtle energy trail, light running streaks, subtle particles, and optionally a small screen-edge energy effect.

Do NOT cover the entire screen. The player must still clearly see the character, obstacles, coins, ground, and HUD at all times.

The visual effect should follow the selected character's accent color where appropriate. Do not replace or obscure the character.

---

# 36. DO NOT CHANGE BASE SPEED DURING SIGNAL BURST

Signal Burst must NOT randomly increase or decrease the actual running speed. The underlying speed remains controlled solely by the SCORE → SPEED system in Section 5.

Signal Burst only provides **INVINCIBILITY** and **COIN MAGNET**.

If — and only if — the existing prototype already has a separate score multiplier system, a ×2 score multiplier may optionally remain active during Signal Burst. Do not introduce a new multiplier system if one doesn't already exist; keep this optional and don't add unnecessary complexity.

---

# 37. POWER-UP POPUP ANIMATION

Use a short rewarding animation:

1. Small signal/flash effect.
2. Popup expands slightly.
3. Show **⚡ SIGNAL BURST**.
4. Show **INVINCIBLE / COIN MAGNET**.
5. Show **5 SECONDS**.
6. Transition smoothly back into gameplay.

Do not make the popup so large that it blocks gameplay for too long.

---

# 38. GAMEPLAY HUD

Simplify and improve the gameplay HUD.

**Top-left:** ❤️ ❤️ ❤️
**Top-center:** SCORE — **1,245**
**Top-right:** SPEED — **×1.2**

During Signal Burst, add a power indicator:

**⚡ SIGNAL BURST 04s**
**🛡 INVINCIBLE**
**🧲 MAGNET**

(Countdown uses the same two-digit `0Xs` format as Section 32.)

Do NOT show the old Energy meter.

---

# 39. HEALTH SYSTEM

Normal gameplay: **obstacle hit → lose 1 heart.**
During Signal Burst: **obstacle hit → no health loss.**

The existing 3-heart system should remain. Do not unnecessarily change the health mechanics.

---

# 40. CHARACTER POWER STATE

During Signal Burst, improve the existing selected character visual: stronger glow, energy trail, signal ring, brighter outline, running streak, subtle particles.

The character must remain clearly visible. Do not replace the selected character with another character.

---

# 41. UPDATE HOW TO PLAY

Update the existing tutorial to remove the Energy-meter instructions. Explain:

* **RUN** — keep moving forward.
* **JUMP** — jump over obstacles and collect elevated coins.
* **COINS** — collect coins to increase your score.
* **SPEED** — the game gradually becomes faster as your score increases.
* **RANDOM POWER-UP** — reach score milestones for a chance to receive **⚡ SIGNAL BURST**.
* **SIGNAL BURST** — 5 seconds of 🛡 Invincibility and 🧲 Coin Magnet.

Keep the explanation short and immediately understandable.

---

# 42. FINAL GAMEPLAY LOOP

**RUN → JUMP → DODGE → COLLECT COINS → SCORE INCREASES GRADUALLY → GAME SPEED GRADUALLY INCREASES → REACH 500-POINT MILESTONE → RANDOM POWER-UP CHECK → IF SUCCESSFUL, SIGNAL BURST APPEARS → JUMP + COLLECT SIGNAL BURST → ⚡ SIGNAL BURST ACTIVATES → 🛡 INVINCIBLE + 🧲 COIN MAGNET FOR 5 SECONDS → SIGNAL BURST ENDS → NORMAL GAMEPLAY RESUMES → CONTINUE RUNNING → HIGH SCORE**

---

# 43. RESTART BEHAVIOR

When the player selects **PLAY AGAIN**, reset all gameplay state: score, speed, jump state, vertical velocity, health, obstacles, coins, power-ups, Signal Burst, countdown, milestone tracking, temporary effects, collision states.

The new run must always begin at **SCORE 0**, **SPEED ×1.0**, with comfortable starting conditions.

---

# 44. PAUSE BEHAVIOR

When paused: gameplay movement stops, score stops, speed progression stops, countdown timers stop, Signal Burst timer stops, coin magnet movement stops, obstacle movement stops.

When resumed: everything continues from the exact previous state. Do not accidentally reset or reduce the running speed.

---

# 45. GAME OVER BEHAVIOR

When all three hearts are lost: gameplay stops, score stops, speed stops, active power-up stops, no new power-up can appear, no new milestone can trigger.

Show the actual final score. Preserve the existing Game Over screen and navigation.

---

# 46. HIGH SCORE

The High Score screen should use the actual final score from the run. Do not use a separate fake score calculation. Make sure the highest score persists correctly within the existing prototype behavior.

---

# 47. EXISTING GAME STRUCTURE MUST REMAIN

Do NOT remove: Main Menu, Character Select, LOU, DASH, NOVA, Environment Select, How to Play, High Score, Settings, Pause, Game Over, existing environments, existing navigation, existing UI structure.

Only modify what is necessary to improve the gameplay.

---

# 48. DO NOT OVERCOMPLICATE THE GAME

LouDash is a simple endless runner. Do NOT add multiplayer, inventory, missions, classes, RPG systems, weapons, shops, complicated abilities, unnecessary currencies, or unnecessary progression trees.

Keep the gameplay simple: **RUN. JUMP. DODGE. COLLECT. SURVIVE. POWER UP.**

---

# 49. FINAL GAMEPLAY QUALITY REQUIREMENTS

After implementation, test the gameplay carefully and verify:

**Speed** — starting speed is comfortable; no random slowdown; speed never decreases during a run; tier transitions ramp smoothly rather than snapping instantly (Section 6); displayed speed matches actual speed.

**Score** — starts at 0; increases gradually; coins give +10; 500 is not reached immediately; displayed score is readable; milestones use the actual authoritative score.

**Jump** — responsive; smooth takeoff/apex/landing; moderate height; horizontal distance is ~40–60% better; no teleporting.

**Coins** — reachable; forgiving pickup radius; readable patterns; most are LOW/MID; HIGH is occasional; none overlap obstacles.

**Obstacles** — fair reaction time; no unavoidable combinations; spacing stays fair as speed increases.

**Power-ups** — old Energy meter fully removed; milestones every 500 score; each milestone's random check fires only once; power-ups are not guaranteed (~50% default); reachable locations; forgiving collection hitbox.

**Signal Burst** — activates only after physical collection; lasts exactly 5 seconds; invincibility and coin magnet both work; countdown and HUD indicator use consistent formatting; health doesn't decrease during the effect; base speed is never altered by Signal Burst.

**Reset / Pause / Game Over** — Play Again fully resets all state listed in Section 43; pause freezes all timers and movement and resumes exactly where it left off; game over stops all systems and shows the accurate final score.

---

# 50. FINAL PRIORITY ORDER

If there is any conflict between visual polish and gameplay quality, **gameplay quality always wins.** Prioritize in this order:

1. Consistent starting speed
2. No random or unexplained slowdown
3. Correct and readable score progression
4. Smooth, moderate jump
5. 40–60% longer horizontal jump travel
6. Reliable coin collection
7. Reliable power-up collection
8. Fair obstacle and coin generation
9. Gradual, smooth speed progression
10. Random 500-point milestone power-ups (~50% chance)
11. 5-second Signal Burst
12. Invincibility + coin magnet
13. HUD and popup feedback
14. Visual polish

---

# FINAL INSTRUCTION

Do not simply make LouDash faster. Do not simply make the jump higher. Do not simply add more visual effects.

The goal is to make LouDash **more controllable, more predictable, more fair, more responsive, more rewarding.**

The player should always understand: How fast am I going? Where am I jumping? Can I reach that coin? Can I reach that power-up? Why did the game become faster? How long does my power-up last?

The final gameplay should feel like a polished but simple student-level endless runner:

**RUN. JUMP. SURVIVE.**
