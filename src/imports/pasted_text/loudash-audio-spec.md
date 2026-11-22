# LOUDASH — COMPLETE MUSIC + SOUND FX INTEGRATION

You are revising the **existing LouDash game prototype**.

## 🚨 CRITICAL INSTRUCTION

**DO NOT rebuild the game.**

**DO NOT redesign the game.**

**DO NOT modify the current gameplay mechanics.**

The purpose of this revision is ONLY to add a complete, suitable **background music + sound effects system** to the existing LouDash game.

First inspect the existing implementation and identify the current gameplay events, buttons, screens, and game states so the audio can connect to them correctly.

---

# 1. PRESERVE THE EXISTING GAME EXACTLY

Keep the current:

* Main Menu
* Character Selection
* Place/Environment Selection
* LOU
* DASH
* NOVA
* Gameplay
* Score system
* Health system
* Jump system
* Coin system
* Obstacle system
* Difficulty progression
* Speed progression
* Signal Burst power-up
* 5-second Signal Burst duration
* Invincibility
* Coin magnet
* Pause
* Game Over
* High Score
* How to Play
* Settings
* Navigation
* Existing UI
* Existing visual style
* Existing layouts
* Existing interactions

**Do not change how these systems work.**

Only connect appropriate audio feedback to them.

---

# 2. AUDIO STYLE

The overall LouDash audio style should be:

**FUN + ENERGETIC + ARCADE + LIGHT FUTURISTIC + CLEAN**

The game is a simple endless runner, so the audio should feel exciting but not overwhelming.

Avoid:

* dark horror music
* overly dramatic orchestral music
* aggressive heavy metal
* distracting vocals
* copyrighted/popular commercial songs
* excessive sound effects
* sounds that overpower gameplay

The audio should feel appropriate for a student-made arcade endless runner.

---

# 3. BACKGROUND MUSIC

Add suitable background music for the gameplay.

The music should be:

* upbeat
* energetic
* playful
* arcade-inspired
* lightly futuristic
* motivating
* suitable for continuous running
* seamless when looping
* not too loud

The music should support the feeling of:

**RUN → JUMP → DODGE → COLLECT → SURVIVE**

Do not make the music so intense that it becomes tiring after several minutes.

---

# 4. MAIN MENU MUSIC

If appropriate, use a separate short menu music track or a calmer version of the gameplay music.

The Main Menu music should feel:

* welcoming
* energetic
* clean
* game-like

It should not sound more intense than the actual gameplay.

When the player enters gameplay, transition smoothly to the gameplay music.

---

# 5. GAMEPLAY MUSIC

When the player presses:

**▶ PLAY**

and gameplay begins:

Start the gameplay music.

The music should loop continuously during the run.

It must not restart every time the player:

* jumps
* collects a coin
* hits an obstacle
* reaches a milestone
* changes difficulty
* activates Signal Burst

It should remain a continuous gameplay track.

---

# 6. DIFFICULTY AUDIO

The existing difficulty progression must remain unchanged.

Do NOT modify difficulty mechanics.

However, audio may provide subtle feedback when difficulty increases.

When the player reaches a new difficulty stage, play a short:

**⚡ SPEED-UP / ACCELERATION SFX**

and use the existing visual notification if already present.

For example:

**⚡ SPEED UP!**

The sound should communicate:

**"The game is getting faster."**

Do not change the actual speed because of the audio.

---

# 7. OPTIONAL MUSIC INTENSITY

If the existing implementation can safely support it, the background music may become **slightly more energetic** at higher difficulty levels.

For example:

### Beginner

Normal gameplay music.

### Normal/Hard

Slightly stronger rhythm or intensity.

### Expert/Extreme

More energetic version.

However:

**DO NOT change the actual gameplay speed, physics, score, obstacles, or difficulty because of the music.**

If dynamic music would complicate the existing implementation, keep one stable looping gameplay track instead.

Stable audio is better than introducing bugs.

---

# 8. JUMP SOUND EFFECT

When the player performs a jump:

Play a short:

**WHOOSH / JUMP**

sound.

The sound should:

* start immediately when the jump begins
* be short
* feel responsive
* not be overly loud
* not overlap excessively if the player jumps repeatedly

Do NOT change jump physics.

This is audio feedback only.

---

# 9. COIN COLLECTION SOUND

When the player collects a coin:

Play a short:

**COIN / CHIME**

sound.

The sound should be:

* bright
* satisfying
* quick
* recognizable

The sound should communicate:

**"Coin successfully collected."**

If multiple coins are collected rapidly, prevent the sounds from becoming an unpleasant wall of repeated audio.

Use a short sound and/or controlled audio variation.

Do NOT change the coin score.

Keep the existing:

**+10 SCORE**

behavior.

---

# 10. OBSTACLE COLLISION SOUND

When the player is hit by an obstacle during normal gameplay:

Play a short:

**IMPACT / HIT**

sound.

It should communicate that the player was hit.

Do NOT change:

* collision detection
* obstacle behavior
* health system
* damage amount

Keep the existing health mechanics exactly as they are.

---

# 11. HEART LOST SOUND

When the player loses one heart:

Play a short warning/impact sound.

It should be slightly more noticeable than a normal obstacle collision.

The purpose is to communicate:

**❤️ Health decreased**

Do not make it excessively loud.

---

# 12. SIGNAL BURST POWER-UP SOUND

When the player physically collects the:

**⚡ SIGNAL BURST**

power-up:

Play a distinctive and exciting power-up sound.

The sound should feel:

* energetic
* electric
* futuristic
* rewarding

It should clearly sound different from a normal coin.

This is one of the most important sounds in the game.

---

# 13. SIGNAL BURST ACTIVATION

After the player collects the Signal Burst:

Play a short activation effect synchronized with the existing:

**⚡ SIGNAL BURST**

popup.

The audio should support:

**INVINCIBLE + COIN MAGNET**

Do NOT change the existing 5-second duration.

The power-up must still last exactly:

**5 SECONDS**

---

# 14. SIGNAL BURST ACTIVE SOUND

While Signal Burst is active, optionally use a very subtle looping:

**ENERGY / SHIELD / ELECTRONIC**

sound.

It should be quiet.

It should communicate:

**"The power-up is currently active."**

Do not let it overpower:

* background music
* coin sounds
* jump sounds
* obstacle sounds
* countdown

Stop the looping Signal Burst sound immediately when the 5-second effect ends.

---

# 15. COIN MAGNET SOUND

While Signal Burst's coin magnet is active:

Use a subtle electronic/magnetic audio effect.

When coins are pulled toward the player, the effect can include a very short:

**electronic pull / shimmer**

sound.

Do NOT play an extremely loud sound for every single magnetized coin.

The effect should communicate:

**🧲 MAGNET ACTIVE**

without becoming repetitive.

---

# 16. INVINCIBILITY SOUND

When Signal Burst is active, the player is protected from normal obstacle damage.

Use a subtle shield/energy ambience to reinforce:

**🛡 INVINCIBLE**

Do not modify collision behavior.

Do not allow the audio effect to change health.

---

# 17. SIGNAL BURST COUNTDOWN SOUNDS

Use short, clean countdown sounds for:

**5**

**4**

**3**

**2**

**1**

The countdown sound should be noticeable but not annoying.

Use a slightly stronger final sound when:

**SIGNAL BURST COMPLETE**

appears.

Keep the existing countdown timing and 5-second duration unchanged.

---

# 18. SPEED UP SOUND

When the player enters a new speed/difficulty tier:

Play a short:

**ACCELERATION / WHOOSH**

sound.

This should synchronize with the existing visual:

**⚡ SPEED UP!**

notification.

Do NOT play the sound continuously.

Only play it when the player actually reaches a new difficulty/speed stage.

---

# 19. MILESTONE SOUND

When the player reaches an eligible 500-point milestone:

**500**

**1,000**

**1,500**

**2,000**

etc.

A very short milestone/chime may play.

However:

**Do not automatically activate Signal Burst.**

The existing system remains:

**MILESTONE → RANDOM POWER-UP CHECK → POWER-UP MAY SPAWN → PLAYER COLLECTS IT → SIGNAL BURST ACTIVATES**

The milestone sound must not imply that a power-up was guaranteed.

---

# 20. GAME OVER SOUND

When the player reaches:

**0 HEARTS**

and Game Over occurs:

Play a short, recognizable:

**GAME OVER**

sound.

The sound should be:

* clear
* slightly dramatic
* short
* appropriate for an arcade game

Do not restart it repeatedly.

It should play once when Game Over is triggered.

---

# 21. MENU BUTTON SOUNDS

Add subtle UI click sounds to appropriate menu interactions.

For example:

* Play
* Characters
* Places
* How to Play
* High Score
* Settings
* Back
* Resume
* Play Again
* Character selection
* Place selection

The UI sound should be:

* very short
* subtle
* clean

Do not make every interaction loud.

---

# 22. CHARACTER
