# LOUDASH — MAIN MENU NAVIGATION & BUTTON BEHAVIOR FIX

Fix the existing **LouDash main menu navigation and screen/state behavior**.

## 🚨 IMPORTANT

Do NOT rebuild the application.

Do NOT change the existing gameplay mechanics, characters, environments, visual design, or game systems unless necessary to fix navigation.

The goal is specifically to make every Main Menu option perform **ONLY its intended purpose**.

---

# 1. MAIN MENU BUTTONS MUST HAVE SEPARATE PURPOSES

The Main Menu should have clearly separated options.

Each button must open its own appropriate screen.

### ▶ PLAY

**Purpose: START THE GAME ONLY**

When the player clicks:

**PLAY**

it should start the actual gameplay.

Only the Play button should start the game.

It should:

* start the running gameplay
* initialize the score
* initialize health
* initialize speed
* initialize obstacles
* initialize coins
* initialize difficulty
* begin the gameplay loop

---

# 2. CHARACTER BUTTON

### 👤 CHARACTERS

**Purpose: CHARACTER SELECTION ONLY**

When the player clicks:

**CHARACTERS**

open the Character Selection screen.

The player should be able to:

* view LOU
* view DASH
* view NOVA
* select one character
* see which character is currently selected
* confirm/change their selection
* return to the Main Menu

### 🚨 CRITICAL

Clicking a character must **NOT start the game**.

Clicking:

**LOU**

**DASH**

or

**NOVA**

must ONLY select that character.

It must NOT:

* start gameplay
* automatically press Play
* open the gameplay screen
* bypass the Main Menu
* automatically select a place
* automatically start running

The user should be able to select a character and remain inside the Character Selection screen.

---

# 3. PLACES BUTTON

### 🌍 PLACES

**Purpose: ENVIRONMENT/PLACE SELECTION ONLY**

When the player clicks:

**PLACES**

open the Place/Environment Selection screen.

The player should be able to:

* view available places/environments
* select a place
* see the currently selected place
* change the selected place
* return to the Main Menu

### 🚨 CRITICAL

Selecting a place must **NOT start the game**.

Clicking any place/environment must ONLY select that environment.

It must NOT:

* start gameplay
* automatically press Play
* open the running screen
* bypass the Main Menu
* automatically select a character
* start the game

The player should remain on the Places screen after selecting an environment.

---

# 4. HOW TO PLAY

### ❓ HOW TO PLAY

**Purpose: VIEW GAME INSTRUCTIONS ONLY**

Clicking:

**HOW TO PLAY**

must open the tutorial/instructions screen.

It should explain:

* Run
* Jump
* Dodge obstacles
* Collect coins
* Score progression
* Increasing difficulty
* Signal Burst
* Invincibility
* Coin Magnet
* 5-second power-up duration

It must NOT start the game.

The player should remain on the How to Play screen until they choose:

**BACK**

or another appropriate navigation option.

---

# 5. HIGH SCORE

### 🏆 HIGH SCORE

**Purpose: VIEW HIGH SCORE ONLY**

Clicking:

**HIGH SCORE**

must open the High Score screen.

It should display the player's highest score.

It must NOT:

* start a new game
* reset the score
* open Character Selection
* open Places
* open gameplay

Provide:

**BACK**

to return to the Main Menu.

---

# 6. SETTINGS

### ⚙ SETTINGS

**Purpose: GAME SETTINGS ONLY**

Clicking:

**SETTINGS**

must open the Settings screen.

Settings can contain the existing appropriate controls, such as:

* Music Volume
* Sound Effects Volume
* Mute Music
* Mute Sound Effects

Any existing LouDash settings should remain functional.

Settings must NOT start gameplay.

---

# 7. RUN HERE / START GAME BUTTON

There is currently a problem where selecting Characters or Places can cause a **"Run Here"** or similar action to automatically start gameplay.

Fix this behavior.

If a button says:

**RUN HERE**

or:

**START RUN**

it should only appear where it is intentionally needed.

If it exists on a Place Selection screen, clicking it must NOT bypass the intended menu flow unless it is explicitly designed as the final confirmation to start the game.

### RECOMMENDED BEHAVIOR

Character Selection:

**Select Character → Confirm/Back**

Place Selection:

**Select Place → Confirm/Back**

Main Menu:

**PLAY → Start Game**

The safest and clearest design is:

**Character selection does NOT start the game.**

**Place selection does NOT start the game.**

**Only PLAY starts the game.**

---

# 8. REQUIRED MENU FLOW

Implement the navigation flow as:

### MAIN MENU

↓

**CHARACTERS**

↓

Character Selection

↓

Select LOU / DASH / NOVA

↓

Remain on Character Selection

↓

**BACK**

↓

Main Menu

---

### MAIN MENU

↓

**PLACES**

↓

Place Selection

↓

Select Environment

↓

Remain on Place Selection

↓

**BACK**

↓

Main Menu

---

### MAIN MENU

↓

**HOW TO PLAY**

↓

Instructions

↓

**BACK**

↓

Main Menu

---

### MAIN MENU

↓

**HIGH SCORE**

↓

High Score

↓

**BACK**

↓

Main Menu

---

### MAIN MENU

↓

**SETTINGS**

↓

Settings

↓

**BACK**

↓

Main Menu

---

### MAIN MENU

↓

**PLAY**

↓

GAMEPLAY

---

# 9. CHARACTER + PLACE SELECTION MUST PERSIST

If the player selects:

**DASH**

then goes back to the Main Menu,

DASH should remain the selected character.

If the player selects:

**PLACE 2**

then goes back to the Main Menu,

Place 2 should remain the selected environment.

However, simply selecting either one must NOT start gameplay.

The selected values should only be used when the player eventually presses:

**PLAY**

---

# 10. PLAY BUTTON USES THE SELECTED OPTIONS

When the player has selected:

**Character: DASH**

and:

**Place: PLACE 2**

then presses:

**PLAY**

the game should start using:

**DASH + PLACE 2**

The Play button is therefore the actual transition from configuration to gameplay.

Flow:

**Select Character**

↓

**Select Place**

↓

**Return to Main Menu**

↓

**PLAY**

↓

**Start Game Using Selected Character + Selected Place**

---

# 11. PREVENT ACCIDENTAL GAME STARTS

This is extremely important.

No screen other than the intentional **PLAY / START GAME action** should accidentally start the gameplay loop.

Selecting:

* character
* place
* tutorial
* high score
* settings

must NEVER start the gameplay loop.

Do not call the game-start function from selection buttons.

Separate:

**SELECTION STATE**

from:

**GAMEPLAY START STATE**

---

# 12. FIX THE "CHARACTERS CHANGES INTO PLACES" BUG

There is currently a bug where clicking Characters, Places, or other options can cause the content to incorrectly change into the Places screen.

Fix the screen/state handling so each menu option has its own independent state.

For example:

```text
MAIN_MENU
CHARACTER_SELECT
PLACE_SELECT
HOW_TO_PLAY
HIGH_SCORE
SETTINGS
GAMEPLAY
PAUSE
GAME_OVER
```

Do not allow:

**CHARACTER_SELECT → PLACE_SELECT**

unless the user intentionally clicks:

**PLACES**

Do not allow unrelated buttons to change the current screen.

---

# 13. DO NOT SHARE INCORRECT SCREEN STATES

Make sure the application does not accidentally reuse the Places screen for:

* Character Selection
* How to Play
* High Score
* Settings
* Main Menu

Each screen should render its correct content.

When entering:

**CHARACTER_SELECT**

show Character Selection content.

When entering:

**PLACE_SELECT**

show Place Selection content.

When entering:

**HOW_TO_PLAY**

show tutorial content.

When entering:

**HIGH_SCORE**

show high-score content.

When entering:

**SETTINGS**

show settings content.

---

# 14. BACK BUTTON BEHAVIOR

Every secondary menu should have a clear:

**← BACK**

button.

Back should return to:

**MAIN MENU**

unless the existing design intentionally has another parent screen.

Back must NOT:

* start gameplay
* reset character selection
* reset place selection
* change the selected character
* change the selected place

---

# 15. SELECTION FEEDBACK

When selecting a character:

show a clear selected state.

For example:

**✓ SELECTED**

or a visible border/highlight.

When selecting a place:

show a clear selected state.

For example:

**✓ SELECTED**

The selected state should be visual feedback only.

It must NOT trigger gameplay.

---

# 16. DO NOT CHANGE GAMEPLAY LOGIC

This revision is specifically for navigation and menu behavior.

Do NOT remove or change:

* score system
* speed progression
* difficulty progression
* jump physics
* coin system
* obstacle system
* health system
* Signal Burst
* power-up system
* 5-second duration
* coin magnet
* invincibility

Those systems should remain intact.

Only fix their connection to the menu so they begin when the player intentionally presses:

**PLAY**

---

# 17. FINAL TESTING

After implementing the fix, test every button individually.

### MAIN MENU

**PLAY**
→ starts gameplay

**CHARACTERS**
→ opens Character Selection

**PLACES**
→ opens Place Selection

**HOW TO PLAY**
→ opens Tutorial

**HIGH SCORE**
→ opens High Score

**SETTINGS**
→ opens Settings

---

### CHARACTER SCREEN

**LOU**
→ selects LOU only

**DASH**
→ selects DASH only

**NOVA**
→ selects NOVA only

**BACK**
→ Main Menu

No character button should start gameplay.

---

### PLACE SCREEN

**PLACE**
→ selects place only

**BACK**
→ Main Menu

No place button should start gameplay.

---

### IMPORTANT FINAL RULE

The application must follow this principle:

**CHARACTERS = CHOOSE CHARACTER**

**PLACES = CHOOSE PLACE**

**HOW TO PLAY = LEARN**

**HIGH SCORE = VIEW SCORE**

**SETTINGS = CHANGE SETTINGS**

**PLAY = START GAME**

Nothing else should start the game.

Do not allow any menu-selection button to accidentally behave like the Play button.

The player must always intentionally press:

# ▶ PLAY

to begin the actual run.
