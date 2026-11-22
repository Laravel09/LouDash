# LOUDASH — COMPLETE MOBILE GAME UI/UX + FUNCTIONAL PROTOTYPE PROMPT

You are creating a complete **mobile landscape game prototype** called:

# LOU DASH

Tagline:

**Run. Dodge. Survive.**

This is a **school project** for a simple but fun, interactive, visually attractive mobile game.

The goal is to create a polished **functional prototype in Figma Make**, not a static collection of screens.

---

# 1. IMPORTANT — INSPECT BEFORE BUILDING

Before creating or modifying anything:

1. Inspect the entire existing Figma Make project.
2. Check whether there are already screens, components, styles, assets, or prototype interactions.
3. Reuse useful existing structures where appropriate.
4. Do NOT unnecessarily rebuild duplicate components.
5. Maintain a consistent design system throughout the entire project.
6. If an existing design conflicts with this specification, prioritize this specification.
7. Keep the project organized and easy for a student to understand and present.

The final result should look like one coherent mobile game, not a collection of unrelated UI screens.

---

# 2. PLATFORM AND ORIENTATION

Create the game as a:

**Mobile landscape game**

Target frame:

**844 × 390 px**

All gameplay and game-related screens must use landscape orientation.

Do NOT create portrait gameplay screens.

The game should visually communicate horizontal forward movement:

**PLAYER → → → → →**

The character runs from left toward right while the environment and obstacles appear to move toward the player.

---

# 3. GAME CONCEPT

LouDash is a simple single-player endless runner.

The player controls a character running continuously through a stylized environment.

The player must:

* move left
* move right
* jump
* avoid obstacles
* collect coins
* collect energy
* activate a temporary power-up
* survive as long as possible
* achieve a high score

Keep the gameplay simple.

Do NOT add:

* multiplayer
* inventory
* RPG classes
* weapons
* complicated missions
* complicated skill trees
* shops
* complicated character customization
* complicated story systems

The game should be understandable within a few seconds.

---

# 4. CORE GAMEPLAY LOOP

The prototype must visually communicate this loop:

RUN
↓
DODGE
↓
COLLECT COINS
↓
COLLECT ENERGY
↓
FILL POWER METER
↓
ACTIVATE POWER
↓
SURVIVE
↓
GET HIGHER SCORE
↓
GAME OVER
↓
PLAY AGAIN

---

# 5. VISUAL DESIGN DIRECTION

Create a visually polished, modern casual arcade-game interface.

The visual style should feel:

* energetic
* clean
* modern
* fun
* slightly futuristic
* approachable
* polished
* student-project appropriate
* easy to understand

Avoid making it look like a corporate dashboard.

Avoid excessive visual effects.

Avoid excessive glassmorphism.

Avoid excessive gradients.

Avoid tiny text.

Avoid clutter.

The gameplay must always remain the visual priority.

---

# 6. COLOR SYSTEM

Use a dark, high-contrast arcade environment.

Primary visual foundation:

* deep navy / charcoal environment
* white or near-white interface text
* bright accent color for primary actions
* distinct health color
* distinct energy/power color
* subtle secondary accent color

Use color meaningfully:

PRIMARY ACTION:
Play, Activate, Resume, Restart

HEALTH:
Clearly distinguish remaining and lost health.

ENERGY:
Use a consistent bright energy treatment.

WARNING:
Use only when the player is in danger.

SUCCESS:
Use for achievements and high-score feedback.

Do not use many unrelated colors.

Maintain strong WCAG-style contrast and excellent readability.

---

# 7. TYPOGRAPHY

Use one primary display typeface and one readable interface typeface if available.

Game title:

* bold
* distinctive
* large
* memorable

Gameplay HUD:

* bold
* highly readable
* compact

Buttons:

* medium or semibold
* clear
* short labels

Body/instruction text:

* simple
* readable
* sufficient line spacing

Do not use decorative fonts for small text.

Do not make important information dependent on typography alone.

---

# 8. LOGO

Create a simple custom LouDash logo.

The logo should communicate:

* speed
* movement
* arcade gameplay

Possible visual direction:

A stylized letter:

**L**

combined with:

* speed line
* forward arrow
* motion element

Keep it simple enough to work as:

* splash logo
* app icon
* menu logo
* small HUD branding

Do not use a random stock logo.

Do not make the logo excessively complicated.

Create a reusable logo component.

---

# 9. DESIGN SYSTEM

Create a consistent component system.

Use reusable components for:

* Primary Button
* Secondary Button
* Icon Button
* Menu Button
* HUD Container
* Health Indicator
* Power Meter
* Score Display
* Coin Indicator
* Energy Indicator
* Obstacle
* Collectible
* Pause Modal
* Game Over Card
* Instruction Card
* Settings Row

Use consistent:

* spacing
* corner radius
* typography
* icon style
* button height
* shadows
* borders
* interaction states

Do not randomly change component styles between screens.

---

# 10. SCREEN 1 — SPLASH SCREEN

Create a polished splash screen.

Content:

LOUDASH logo

LOU DASH

**Run. Dodge. Survive.**

A subtle loading indicator.

The composition should be centered.

Use a simple background that establishes the game's visual identity.

Prototype behavior:

After a short simulated delay or interaction:

SPLASH
→ MAIN MENU

---

# 11. SCREEN 2 — MAIN MENU

Create the main menu.

Hierarchy:

LOUDASH LOGO

LOU DASH

Tagline:

**Run. Dodge. Survive.**

Primary button:

**PLAY**

Secondary buttons:

**HOW TO PLAY**

**HIGH SCORE**

**SETTINGS**

The PLAY button must be visually dominant.

Keep the menu spacious and uncluttered.

Prototype interactions:

PLAY
→ GAMEPLAY

HOW TO PLAY
→ HOW TO PLAY SCREEN

HIGH SCORE
→ HIGH SCORE SCREEN

SETTINGS
→ SETTINGS SCREEN

---

# 12. SCREEN 3 — HOW TO PLAY

Create a simple visual tutorial.

Show the player exactly how the game works.

Section:

MOVEMENT

Show:

← MOVE LEFT

MOVE RIGHT →

↑ JUMP

Section:

COLLECT

🪙 COIN
+10 SCORE

⚡ ENERGY
FILLS POWER METER

Section:

POWER

When the power meter reaches 100%:

**ACTIVATE SIGNAL BURST**

Explain:

* temporary invincibility
* 2× score
* stronger coin attraction
* lasts 5 seconds

Section:

OBSTACLES

Show simple visual examples:

BARRIER
ROCK
ROAD BLOCK

Explain:

**Avoid obstacles to keep your health.**

Include:

**BACK**

Back returns to MAIN MENU.

---

# 13. SCREEN 4 — GAMEPLAY

This is the most important screen.

Create a realistic-looking endless runner gameplay interface.

Landscape 844 × 390.

Top-left:

❤️ ❤️ ❤️

Top-center/right:

SCORE: 0000

Top-right:

⚡ POWER
[POWER METER]

Gameplay area:

* running character
* ground
* background
* coins
* energy collectibles
* obstacles

The character should visually face and move toward the right.

Create enough empty space so the player can clearly see upcoming obstacles.

Do not overcrowd the gameplay area.

---

# 14. GAME CHARACTER

Create a simple stylized runner character.

The character should be:

* clearly visible
* facing right
* visually distinct from the background
* simple enough to recreate in a game engine later

Do not make the character overly detailed.

Create visual states:

1. Running
2. Jumping
3. Hurt
4. Power Active

Use subtle animation or state changes where Figma Make supports them.

---

# 15. OBSTACLES

Create simple recognizable obstacles.

Obstacle 1:

**BARRIER**

The player must jump over it.

Obstacle 2:

**ROCK**

The player must jump over or move around it.

Obstacle 3:

**ROAD BLOCK**

The player must change position or jump.

Optional later obstacle:

**MOVING VEHICLE**

Only add this if it does not make the prototype unnecessarily complicated.

The obstacles must:

* be visually distinct
* have clear silhouettes
* contrast with the background
* be large enough to recognize quickly
* appear ahead of the player
* never blend into the environment

---

# 16. COINS

Create a collectible coin.

Coin behavior in the prototype:

When represented as collected:

* coin disappears
* score increases by +10
* subtle collection feedback appears

Example:

SCORE: 1250

becomes:

SCORE: 1260

Show a small:

**+10**

feedback animation if possible.

---

# 17. ENERGY COLLECTIBLE

Create an energy collectible represented by:

⚡

When collected:

The power meter increases.

Example:

POWER:

██████░░░░

becomes:

████████░░

When full:

POWER:

██████████

Show:

**POWER READY**

and enable:

**ACTIVATE**

---

# 18. POWER-UP — SIGNAL BURST

The game has ONE main power-up.

Name:

**SIGNAL BURST**

Do not create multiple complicated power systems.

Activation:

When POWER reaches 100%:

Show:

**⚡ SIGNAL BURST READY**

Button:

**ACTIVATE**

When activated:

Duration:

**5 seconds**

During the active state:

1. Player is visually invincible.
2. Obstacles cannot cause health loss.
3. Coins receive a stronger attraction effect.
4. Score multiplier becomes 2×.
5. Character receives a subtle glow/trail.
6. Power timer appears.

Display:

⚡ SIGNAL BURST

05

04

03

02

01

After the timer reaches zero:

* power ends
* visual effect disappears
* score multiplier returns to 1×
* power meter returns to empty
* gameplay returns to normal

Make the active state visually obvious without overwhelming the screen.

---

# 19. HEALTH SYSTEM

The player starts with:

❤️ ❤️ ❤️

When an obstacle collision occurs:

First hit:

❤️ ❤️ 🖤

Second hit:

❤️ 🖤 🖤

Third hit:

🖤 🖤 🖤

Then:

GAME OVER

During SIGNAL BURST:

Obstacle collisions do NOT reduce health.

---

# 20. SCORE SYSTEM

Starting score:

**0**

Coin:

**+10**

Normal survival:

Score gradually increases.

SIGNAL BURST:

**2× score multiplier**

Make the score highly visible but not distracting.

---

# 21. GAME DIFFICULTY

The game should gradually become harder.

Early gameplay:

* fewer obstacles
* larger gaps
* slower feeling

Later gameplay:

* more frequent obstacles
* shorter gaps
* faster environment
* more challenging combinations

Do not make the difficulty unfair.

The player should understand why they lost.

For Figma Make, simulate this progression through different gameplay states rather than attempting to build a full procedural game engine.

---

# 22. INTERACTIVE PROTOTYPE BEHAVIOR

This is extremely important.

Do NOT make this a static UI presentation.

Create functional prototype interactions wherever Figma Make supports them.

Required interactions:

SPLASH
→ MAIN MENU

MAIN MENU PLAY
→ GAMEPLAY

MAIN MENU HOW TO PLAY
→ HOW TO PLAY

MAIN MENU HIGH SCORE
→ HIGH SCORE

MAIN MENU SETTINGS
→ SETTINGS

HOW TO PLAY BACK
→ MAIN MENU

SETTINGS BACK
→ MAIN MENU

GAMEPLAY PAUSE
→ PAUSE OVERLAY

PAUSE RESUME
→ GAMEPLAY

PAUSE RESTART
→ GAMEPLAY INITIAL STATE

PAUSE MAIN MENU
→ MAIN MENU

GAME OVER PLAY AGAIN
→ GAMEPLAY INITIAL STATE

GAME OVER MAIN MENU
→ MAIN MENU

---

# 23. SIMULATED GAMEPLAY STATES

Create multiple gameplay states to demonstrate interaction.

At minimum:

GAMEPLAY — NORMAL

GAMEPLAY — COIN COLLECTED

GAMEPLAY — ENERGY COLLECTED

GAMEPLAY — POWER READY

GAMEPLAY — POWER ACTIVE

GAMEPLAY — PLAYER HIT

GAMEPLAY — GAME OVER

These states should feel like one continuous game.

Use prototype transitions to demonstrate them.

---

# 24. PAUSE OVERLAY

Create a pause button in the gameplay HUD.

When activated:

Show a centered pause panel.

Text:

**PAUSED**

Buttons:

RESUME

RESTART

SETTINGS

MAIN MENU

Dim the gameplay background behind the panel.

The pause interface must not completely hide the game context.

---

# 25. GAME OVER SCREEN

Create:

GAME OVER

Final Score

Example:

**2,450**

Best Score

Example:

**3,120**

If the current score beats the previous best:

Show:

**NEW HIGH SCORE!**

Buttons:

**PLAY AGAIN**

**MAIN MENU**

Use strong hierarchy.

The score should be the visual focus.

---

# 26. HIGH SCORE SCREEN

Create a simple high-score screen.

Title:

**HIGH SCORE**

Show:

BEST SCORE

**3,120**

Optionally show a small score history:

1. 3120
2. 2780
3. 2450

Do not create an online leaderboard.

This is a single-player school project.

Include:

**BACK**

---

# 27. SETTINGS SCREEN

Create a simple settings page.

Rows:

Sound — ON/OFF

Music — ON/OFF

Vibration — ON/OFF

Include:

**BACK**

Use clear toggles.

Do not add unnecessary settings.

---

# 28. ACCESSIBILITY AND VISIBILITY

This is a major requirement.

Prioritize effective visibility.

Important information must be immediately recognizable.

Requirements:

* strong contrast
* readable text
* large touch targets
* clear button hierarchy
* consistent icons
* sufficient spacing
* no overlapping UI
* no tiny labels
* no important information hidden behind decorative effects
* avoid relying on color alone to communicate state
* maintain clear visual distinction between gameplay and HUD

The game should still be understandable when viewed quickly.

---

# 29. RESPONSIVE / LAYOUT QUALITY

Keep every 844 × 390 screen inside its frame.

Do not allow:

* cropped elements
* black bars caused by incorrect frame sizing
* elements outside the frame
* overlapping labels
* clipped buttons
* inconsistent margins
* accidental portrait screens

Keep safe spacing around all important controls.

---

# 30. ANIMATION AND MICRO-INTERACTIONS

Use subtle animation where supported.

Examples:

PLAY button:

* slight press feedback

Coin:

* small collection animation

Score:

* brief +10 feedback

Energy:

* small pulse

Power ready:

* subtle glow/pulse

Power active:

* character trail/glow

Game over:

* controlled transition

Do NOT animate everything.

Animation should communicate state and improve feedback.

---

# 31. ICONS

Use one consistent icon family.

Do not mix unrelated icon styles.

Use recognizable icons for:

* pause
* settings
* sound
* music
* vibration
* back
* coin
* energy
* health
* play
* restart

Icons should have labels when the meaning may not be obvious.

---

# 32. COMPONENT ORGANIZATION

Organize the Figma file clearly.

Recommended pages:

PAGE 1:
**Design System**

PAGE 2:
**Screens**

PAGE 3:
**Gameplay States**

PAGE 4:
**Prototype Flow**

PAGE 5:
**Assets**

Keep components organized and named clearly.

---

# 33. DESIGN SYSTEM PAGE

Create a small visual design system showing:

COLOR TOKENS

TYPOGRAPHY

BUTTONS

ICONS

HUD COMPONENTS

GAME COMPONENTS

CARDS

STATES

This makes the project easier to explain during a school presentation.

---

# 34. PROTOTYPE FLOW PAGE

Create a simple visual flow:

SPLASH
↓
MAIN MENU
↓
PLAY
↓
GAMEPLAY
↓
PAUSE / GAME OVER
↓
RESTART
↓
GAMEPLAY

Also show:

MAIN MENU
→ HOW TO PLAY

MAIN MENU
→ HIGH SCORE

MAIN MENU
→ SETTINGS

This should make the application architecture easy to understand.

---

# 35. IMPORTANT LIMITATION — DO NOT PRETEND THIS IS A REAL GAME ENGINE

Figma Make should create a **functional interactive prototype**, not pretend that it is a complete production game engine.

Use simulated states and interactions to demonstrate:

* navigation
* button behavior
* gameplay states
* score changes
* health changes
* power activation
* game-over flow
* restart flow

Do not create fake claims that the Figma prototype contains real physics, real collision detection, procedural generation, or production-ready Android game code.

The eventual actual game can be implemented in Godot using this prototype as the UI/UX reference.

---

# 36. FINAL QUALITY CHECK

Before finishing, inspect the entire project.

Check:

✓ Landscape orientation

✓ 844 × 390 frames

✓ Consistent design system

✓ Clear visual hierarchy

✓ Strong contrast

✓ Beautiful but not cluttered UI

✓ Clear gameplay

✓ Character faces right

✓ Obstacles are obvious

✓ Coins are recognizable

✓ Energy is recognizable

✓ Power meter is easy to understand

✓ Signal Burst is clearly communicated

✓ Health system is visible

✓ Score is visible

✓ Pause works

✓ Game Over works

✓ Restart works

✓ Main Menu navigation works

✓ How to Play works

✓ High Score works

✓ Settings works

✓ Buttons have clear states

✓ No clipped elements

✓ No overlapping elements

✓ No unnecessary screens

✓ No unnecessary game mechanics

✓ Prototype feels like one complete game

Most importantly:

**The first-time viewer should understand how to play the game without needing a verbal explanation.**

The finished Figma Make project should feel like a polished, modern, simple mobile arcade game prototype that is realistic for a student to later implement in Godot.
