# LOUDASH — EXISTING PROTOTYPE IMPROVEMENT PROMPT

You are improving an **existing Figma Make prototype** for a mobile landscape endless runner game called **LouDash**.

## IMPORTANT — IMPROVEMENT ONLY

**DO NOT rebuild the project from scratch.**

First, inspect the entire existing LouDash prototype, including its current screens, UI, gameplay states, interactions, character design, HUD, buttons, settings, power-up, and overall visual system.

Keep the existing concept and working structure, but **improve, refine, correct, and enhance the current prototype**.

Do not unnecessarily remove existing screens or interactions that are already working.

The goal is to make the existing prototype feel **more polished, consistent, visually appealing, understandable, and game-like**, while still keeping it simple enough for a student HCI/game prototype.

---

# 1. GAMEPLAY SPEED — IMPROVE THE RUNNING FEEL

The current gameplay should feel more natural.

The player should NOT start extremely slow and should NOT immediately start extremely fast.

### Starting speed

At the beginning of a run:

* Use a comfortable **normal running speed**.
* The character should clearly look like they are running.
* The speed should feel responsive but still give the player enough time to see obstacles.
* Avoid a slow, boring beginning.
* Avoid an unnecessarily difficult beginning.

### Progressive speed increase

As the player's score increases, gradually increase the running speed.

Use approximately this difficulty progression:

* **0–499 score:** Normal speed
* **500–999:** Slightly faster
* **1,000–1,499:** Medium speed
* **1,500–2,499:** Fast
* **2,500–3,499:** Very fast
* **3,500+:** Extreme/endgame speed

The speed increase must feel **gradual**, not like a sudden teleport from slow to extremely fast.

Do not make the acceleration so aggressive that the game becomes unfair.

---

# 2. CLEAR SPEED-UP FEEDBACK

The player should know when the game becomes faster.

Whenever the game reaches an important speed tier, show a short visual notification such as:

**"SPEED UP!"**

or

**"SPEED ×1.2"**

The notification should:

* appear briefly
* be visually noticeable
* not block gameplay
* disappear automatically
* feel like a game achievement rather than an error message

Also include a small, unobtrusive HUD indicator such as:

**SPEED ×1.0**

then:

**SPEED ×1.1**

**SPEED ×1.2**

**SPEED ×1.3**

etc.

Keep it small so the gameplay screen does not become cluttered.

---

# 3. IMPROVE THE JUMP

The existing jump currently feels too narrow/short.

Improve the jump so the character can clearly and comfortably jump over normal obstacles.

### Desired jump behavior

The jump should have:

* smoother takeoff
* slightly greater horizontal travel
* a natural upward arc
* enough height to clear obstacles
* smooth falling/landing
* no instant teleporting
* no extremely high or unrealistic jump

Increase the effective jump distance by approximately **30–50% from the current prototype**, but keep it balanced.

The player should feel that jumping is useful and responsive.

The jump should remain easy to understand:

**Jump → clear obstacle → land → continue running**

Do not make jumping unnecessarily complicated.

---

# 4. IMPROVE THE CHARACTER DESIGN

Improve the current player character so it feels like a recognizable mascot for LouDash.

The character should:

* look friendly
* look energetic
* clearly face the running direction
* have a readable silhouette
* have simple but polished details
* visually match the LouDash brand
* remain visible against the background

Improve the running animation/visual feedback if possible within the prototype.

The character should look like the **main identity of the game**, not a generic placeholder.

Do not make the character overly detailed or realistic.

Use a clean, modern casual-game style.

---

# 5. ADD THREE SELECTABLE CHARACTERS

Improve the prototype by introducing **three playable character choices**.

Do not make the characters unnecessarily complicated.

### Character 1 — LOU

Role:

**Balanced**

Suggested attributes:

* Speed: ★★★☆☆
* Jump: ★★★☆☆
* Power: ★★★☆☆

This should be the default/main character.

### Character 2 — DASH

Role:

**Speed Runner**

Suggested attributes:

* Speed: ★★★★★
* Jump: ★★☆☆☆
* Power: ★★★☆☆

Dash should feel slightly faster but have a weaker jump.

### Character 3 — NOVA

Role:

**Agile Runner**

Suggested attributes:

* Speed: ★★★☆☆
* Jump: ★★★★★
* Power: ★★★☆☆

Nova should have a slightly stronger jump.

### IMPORTANT

Keep the differences **small and balanced**.

Do not create complicated RPG statistics.

These are simple gameplay differences intended to make character selection interesting.

---

# 6. IMPROVE CHARACTER SELECTION

Add/improve a dedicated:

**CHARACTER SELECT**

screen.

The screen should contain:

* large character preview
* character name
* short role description
* simple stat indicators
* selected character highlight
* left/right character navigation if appropriate
* **SELECT** button
* **BACK** button

Example:

**LOU**

Balanced Runner

Speed ★★★☆☆
Jump ★★★☆☆
Power ★★★☆☆

[ SELECT ]

Make the selected character visually obvious.

Do not allow the UI to become crowded.

---

# 7. MAJOR POWER-UP / BUFF IMPROVEMENT

The current power-up/buff should feel **more unique and memorable**.

Do not make it feel like a generic "temporary shield."

The power-up should become one of the recognizable features of LouDash.

Keep the existing concept of a single major power-up, but improve its identity.

## POWER-UP NAME

Use:

# SIGNAL BURST

The idea is that LouDash's energy builds up while running until the player can release a powerful burst.

Make this visually recognizable through a consistent symbol/icon, for example:

**⚡**

combined with a simple circular burst/signal-wave motif.

---

# 8. SIGNAL BURST — HOW IT WORKS

The player collects **Energy** while running.

Energy fills the power meter.

Example:

**⚡ SIGNAL ENERGY**

`████████░░`

When the meter reaches 100%:

# SIGNAL BURST READY

The power button should become visually emphasized.

The player can activate the power.

---

# 9. MAKE SIGNAL BURST UNIQUE

When activated, Signal Burst should temporarily change the way the player feels and looks.

For approximately **5 seconds**, activate:

### 1. INVINCIBILITY

The player cannot lose health from normal obstacles.

### 2. SCORE BOOST

Score becomes:

**×2 SCORE**

### 3. COIN MAGNET

Nearby coins are automatically attracted toward the player.

### 4. SPEED SURGE

The player receives a temporary visual speed boost.

IMPORTANT:

The actual difficulty should NOT suddenly become unfair.

Instead, communicate the speed burst through:

* stronger running animation
* motion streaks
* speed lines
* brighter character outline
* environmental motion
* screen-edge effects
* energy trails

### 5. UNIQUE VISUAL IDENTITY

During Signal Burst, the character should have a recognizable:

* glowing energy outline
* circular signal-wave effect
* trailing energy streak
* subtle screen effect

Do NOT cover the entire screen with excessive effects.

The player must still clearly see:

* character
* obstacles
* coins
* gameplay area

---

# 10. SIGNAL BURST ACTIVATION FEEDBACK

When the player activates Signal Burst:

Briefly show:

# SIGNAL BURST!

Then transition into:

**⚡ SIGNAL BURST — 05**

**×2 SCORE**

**INVINCIBLE**

The timer should visibly count down:

05 → 04 → 03 → 02 → 01

When it reaches zero:

**SIGNAL BURST COMPLETE**

Then return to the normal gameplay state.

Reset the power meter.

---

# 11. MAKE THE POWER-UP FEEL LIKE A GAME MOMENT

Signal Burst should not simply be another HUD button.

It should feel like a **reward for surviving and collecting energy**.

The intended gameplay loop should feel like:

**RUN**

↓

**DODGE**

↓

**COLLECT COINS + ENERGY**

↓

**POWER METER FILLS**

↓

**SIGNAL BURST READY**

↓

**ACTIVATE**

↓

**BURST THROUGH OBSTACLES**

↓

**×2 SCORE + INVINCIBILITY + COIN MAGNET**

↓

**POWER ENDS**

↓

**CONTINUE RUNNING**

This should become one of the game's defining gameplay loops.

---

# 12. POWER-UP STATES

Create/refine these prototype states:

### Normal

`⚡ SIGNAL ENERGY 40%`

### Almost Ready

`⚡ SIGNAL ENERGY 80%`

### Ready

`⚡ SIGNAL BURST READY!`

with an emphasized activation button.

### Active

`⚡ SIGNAL BURST 04s`

`×2 SCORE`

`INVINCIBLE`

### Ending

Brief visual indication that the power is about to end.

### Complete

Return to normal energy meter.

These states should be visually consistent.

---

# 13. IMPROVE OBSTACLE DESIGN AND FAIRNESS

Keep obstacles simple but recognizable.

Examples:

* road barrier
* rock
* construction block
* traffic obstacle

Improve their visual clarity.

Every obstacle should be immediately understandable.

Avoid obstacles that blend into the background.

### IMPORTANT GAMEPLAY RULE

Never create an impossible obstacle combination.

The player must always have enough time to:

**SEE → THINK → REACT → JUMP/DODGE**

As the speed increases, obstacle spacing must remain fair.

Do not compensate for increased speed by simply placing obstacles extremely close together.

---

# 14. IMPROVE COINS AND ENERGY COLLECTIBLES

Coins should be visually different from Energy.

### Coins

Purpose:

Increase score.

Example:

**+10**

### Energy

Purpose:

Fill Signal Burst meter.

Use a distinct energy symbol.

Example:

**+ENERGY**

Energy should visually look more important than a normal coin but should not overpower the gameplay.

---

# 15. IMPROVE THE GAMEPLAY HUD

Keep the HUD simple.

Recommended layout:

### Top-left

❤️ ❤️ ❤️

Health

### Top-center/right

**SCORE**

**1,245**

### Small secondary indicator

**SPEED ×1.2**

### Bottom area

**⚡ SIGNAL ENERGY**

`███████░░░`

Keep the HUD away from the character and obstacle path.

Do not overload the screen with information.

---

# 16. IMPROVE HEALTH SYSTEM

Keep the simple 3-heart system.

Example:

❤️ ❤️ ❤️

One normal obstacle hit:

❤️ ❤️ 🖤

Two hits:

❤️ 🖤 🖤

Three hits:

**GAME OVER**

During Signal Burst:

**🛡 INVINCIBLE**

Normal obstacle collisions should not reduce health while the power-up is active.

---

# 17. ADD BETTER MILESTONE FEEDBACK

Add short positive feedback at important score milestones.

Examples:

At 500:

**500! KEEP RUNNING!**

At 1,000:

**SPEED UP!**

At 2,000:

**GREAT RUN!**

At 3,000:

**YOU'RE ON FIRE!**

Keep these messages brief.

They should disappear automatically and should not interrupt gameplay.

---

# 18. IMPROVE ENVIRONMENT PROGRESSION

If the existing prototype already has an environment, improve it so the game feels like it is progressing.

Possible progression:

### Early Run

**City**

### Mid Run

**Forest / Road**

### High Score

**Neon City**

The environments should remain visually consistent with the same game world.

Do not create completely separate games or complicated levels.

The environment should simply make longer runs feel more rewarding.

---

# 19. IMPROVE SETTINGS

Create a proper separate **SETTINGS** screen.

Do not place all settings directly on the main menu.

Use a clean card/list structure.

Include:

### AUDIO

Sound Effects
`ON / OFF`

Music
`ON / OFF`

### GAMEPLAY

Speed Indicator
`ON / OFF`

Tutorial Hints
`ON / OFF`

### ACCESSIBILITY

High Contrast
`ON / OFF`

### SYSTEM

Reset Settings

### Navigation

**BACK**

The settings screen should look like a real game settings page.

Keep it simple.

Do not add unnecessary settings.

---

# 20. IMPROVE MAIN MENU

The main menu should clearly prioritize:

**PLAY**

as the primary action.

Secondary options:

**CHARACTERS**

**HOW TO PLAY**

**HIGH SCORE**

**SETTINGS**

Make the hierarchy obvious.

The player should immediately understand what to press to start the game.

---

# 21. IMPROVE GAME OVER

The Game Over screen should clearly communicate the result.

Show:

# GAME OVER

**YOUR SCORE**

1,845

**BEST SCORE**

2,310

If the player beats the previous score:

# NEW HIGH SCORE!

Add:

**PLAY AGAIN**

**CHARACTERS**

**MAIN MENU**

Keep the layout clean.

---

# 22. IMPROVE HIGH SCORE SCREEN

Create/refine a simple High Score screen.

Show:

# HIGH SCORE

🏆 BEST RUN

**2,310**

Optionally show:

* Best Score
* Best Distance
* Longest Run

Do not create complicated leaderboards or multiplayer features.

---

# 23. IMPROVE HOW TO PLAY

Make the tutorial extremely easy to understand.

Show simple visual instructions:

**MOVE**

← →

**JUMP**

↑

**COLLECT**

🪙 Coins = Score

⚡ Energy = Signal Burst

**SIGNAL BURST**

Activate when ready for:

×2 SCORE
INVINCIBLE
COIN MAGNET

Keep this screen visually clean.

---

# 24. VISUAL DESIGN IMPROVEMENT

Improve the overall UI without completely changing the game's identity.

Use:

* strong visual hierarchy
* consistent spacing
* consistent button sizes
* consistent corner radius
* consistent icon style
* readable typography
* strong contrast
* clear interaction states
* polished cards and panels
* clean alignment

Avoid:

* excessive gradients
* excessive glassmorphism
* tiny text
* unnecessary decorations
* inconsistent icons
* cluttered HUD
* overlapping elements
* buttons that look inactive
* excessive animation that distracts from gameplay

The prototype should feel like a **modern casual arcade mobile game**.

---

# 25. LANDSCAPE MOBILE FORMAT

Keep the game in:

**844 × 390 landscape**

Every gameplay screen must clearly communicate landscape orientation.

Make sure:

* gameplay area is large
* controls are easy to reach
* HUD does not overlap gameplay
* character is clearly visible
* obstacles are clearly visible
* buttons are large enough
* nothing is clipped
* no important element touches the frame edge unnecessarily

---

# 26. INTERACTION AND PROTOTYPE STATES

Preserve existing working interactions and improve them where needed.

Ensure these flows work logically:

**Splash → Main Menu**

**Main Menu → Play**

**Main Menu → Characters**

**Main Menu → How to Play**

**Main Menu → High Score**

**Main Menu → Settings**

**Play → Gameplay**

**Gameplay → Pause**

**Pause → Resume**

**Pause → Restart**

**Pause → Main Menu**

**Gameplay → Game Over**

**Game Over → Play Again**

**Game Over → Main Menu**

**Character Select → Select Character → Gameplay**

**Settings → Change Setting → Back**

---

# 27. SIMULATED GAMEPLAY STATES

Since this is a Figma prototype rather than a full game engine, make the gameplay interaction feel believable through prototype states.

Include states such as:

1. Normal Running
2. Coin Collected
3. Energy Collected
4. Jumping
5. Obstacle Avoided
6. Player Hit
7. Speed Increased
8. Power Almost Ready
9. Signal Burst Ready
10. Signal Burst Activated
11. Signal Burst Active
12. Signal Burst Ending
13. Signal Burst Complete
14. Game Over

The transitions should make the prototype feel like an actual playable game demonstration.

---

# 28. DO NOT OVERCOMPLICATE THE GAME

Keep LouDash focused on:

**RUN → JUMP → DODGE → COLLECT → POWER UP → SPEED UP → SURVIVE**

Do NOT add:

* multiplayer
* inventory
* missions
* RPG classes
* weapons
* complicated upgrades
* complicated currency systems
* shops
* unnecessary menus
* complicated progression systems

The game should remain simple, understandable, and appropriate for an HCI school project.

---

# 29. FINAL QUALITY CHECK

Before finishing the revision, inspect the entire prototype again.

Check for:

* no overlapping UI
* no clipped elements
* no broken navigation
* no inconsistent buttons
* no inconsistent typography
* no confusing icons
* no unreadable text
* no impossible obstacle layouts
* no excessive HUD clutter
* no confusing power-up behavior
* no unclear character selection
* no unnecessary duplicate screens
* no awkward empty spaces
* no elements touching the screen edge
* consistent landscape orientation

Most importantly, verify that the gameplay communicates the intended progression:

**Normal Speed**

↓

**Gradually Faster**

↓

**Speed Feedback**

↓

**More Challenging Obstacles**

↓

**Energy Collection**

↓

**SIGNAL BURST**

↓

**Temporary Powerful Advantage**

↓

**Continue at Higher Difficulty**

↓

**High Score / Game Over**

---

# FINAL INSTRUCTION

Again, **this is an improvement task, NOT a complete rebuild**.

Inspect the existing LouDash prototype first.

Preserve useful existing screens, assets, interactions, and structure.

Then improve the current prototype specifically in these areas:

1. Better starting running speed
2. Gradual speed increase based on score
3. Clear speed-up feedback
4. Longer and smoother jumping
5. Better player character
6. Three selectable characters
7. Dedicated Character Select screen
8. Much more recognizable and unique **Signal Burst** power-up
9. Better power-up activation and visual feedback
10. Better HUD
11. Better obstacle fairness
12. Better coin and energy feedback
13. Better milestone feedback
14. Better environment progression
15. Proper separate Settings screen
16. Better Game Over and High Score screens
17. Better overall UI consistency
18. Better interaction and prototype states

The final result should feel like a **significantly improved version of the existing LouDash prototype**, not a completely different game.

Prioritize **gameplay clarity, responsiveness, visual hierarchy, fairness, and a memorable Signal Burst mechanic** over adding unnecessary features.
