# LOUDASH — SCORE & COIN COUNTER SYSTEM FIX

You are revising the **existing LouDash game prototype**.

## 🚨 CRITICAL — DO NOT REBUILD THE GAME

Do **NOT** rebuild LouDash from scratch.

Do **NOT** redesign the existing game.

Do **NOT** change the existing:

* gameplay mechanics
* jump physics
* running speed system
* difficulty progression
* obstacles
* characters
* environments
* health system
* Signal Burst
* power-up system
* navigation
* menus
* music
* sound effects

This revision is specifically for fixing the **Score and Coin counting system, HUD presentation, and end-of-run score summary**.

---

# 1. FIX THE CONFUSION BETWEEN SCORE AND COINS

There are currently two concepts that are confusing the player.

Separate them clearly:

### SCORE

The player's **current Run Score**.

### COINS

The number of individual coins the player has collected during the current run.

Do NOT treat "Coins" as another type of score.

Use these exact labels:

**SCORE**

and

**COINS**

Do not use:

* Coin Score
* Coin Points
* Total Score for Coins
* Coin Score Counter

The player should immediately understand:

**SCORE = how well I am doing in this run**

**COINS = how many coins I collected**

---

# 2. CURRENT RUN SCORE

The main gameplay score should be called:

# SCORE

This is the player's **Run Score**.

It represents the score accumulated during the current run.

Use the existing score progression system, but make sure it is displayed clearly and increases in a controlled, readable way.

Example:

**SCORE**

**120**

then:

**121**

then:

**122**

and so on.

Do NOT allow the score to suddenly jump by huge amounts during normal running.

---

# 3. COIN COUNTER

Create a completely separate:

# 🪙 COINS

counter.

This represents the **number of coins physically collected during the current run**.

Every individual coin collected must increase the counter by exactly:

**+1**

Example:

```text
COINS 0

Collect 1 coin
→ COINS 1

Collect another coin
→ COINS 2

Collect another coin
→ COINS 3

Collect another coin
→ COINS 4
```

Never skip numbers.

Never count one coin as multiple coins.

Never increase the coin counter simply because the player is near a coin.

Only increase it when the coin is actually collected.

---

# 4. ONE COIN = ONE COIN COUNT

This is extremely important.

Each physical coin entity should be counted exactly once.

When a coin is collected:

```text
coin.collected = true
```

Then:

```text
coinsCollected += 1
```

The same coin must never increment the counter again.

Prevent:

* duplicate collision events
* multiple counts from one coin
* counting a coin every frame
* counting magnetized coins repeatedly
* counting the same coin after it disappears

A coin should follow:

**SPAWN → AVAILABLE → COLLECTED → COUNT +1 → REMOVE**

Once collected, it cannot be counted again.

---

# 5. COIN SCORE REWARD

Keep the existing concept that collecting a coin contributes to the player's Score.

Each normal coin should provide:

**+10 SCORE**

AND:

**+1 COIN**

These are two separate results.

Example:

Before collection:

```text
SCORE 120
COINS 7
```

Player collects exactly one coin:

```text
SCORE 130
COINS 8
```

The coin counter increases by **1**.

The Run Score increases by **10**.

Do not confuse the two numbers.

---

# 6. COIN COLLECTION FEEDBACK

When a coin is collected, provide immediate visual feedback.

Briefly display:

**+10**

near the collected coin.

This means:

**+10 SCORE**

Do NOT display "+10" as if ten coins were collected.

The HUD should continue showing:

**🪙 COINS 8**

The floating "+10" should disappear automatically.

---

# 7. COIN COLLECTION ANIMATION

When the player collects a coin:

1. Coin reaches the player's collection area.
2. Coin disappears/animates into the player.
3. Coin counter increases by exactly +1.
4. Score increases by exactly +10.
5. Brief "+10" feedback appears.
6. Coin collection sound plays once.
7. Coin entity is permanently marked collected/removed.

The animation must not delay the counter update.

The player should immediately see that the coin was successfully collected.

---

# 8. SIGNAL BURST + COIN COUNTING

The existing Signal Burst power-up includes:

**🧲 COIN MAGNET**

During Signal Burst, coins attracted toward the player must still follow exactly the same counting rules.

If the magnet collects one coin:

**COINS +1**

**SCORE +10**

If it collects five coins:

**COINS +5**

**SCORE +50**

Do NOT create a different coin-counting system for the magnet.

The magnet only changes **how the coin reaches the player**.

It does NOT change what a collected coin means.

---

# 9. SIGNAL BURST MULTIPLIER

If the existing Signal Burst system currently uses a score multiplier, preserve that existing behavior if it is already implemented.

However, the:

**COINS**

counter must ALWAYS count physical coins individually.

For example, even if a Signal Burst multiplier causes a coin to award more Score:

```text
COINS +1
```

must still remain exactly one collected coin.

Do NOT make:

**COINS +2**

just because the score multiplier is ×2.

The multiplier affects SCORE, not the number of physical coins collected.

---

# 10. GAMEPLAY HUD LAYOUT

Reorganize the existing gameplay HUD so the two values are visually separated.

Use this hierarchy:

### TOP-LEFT

**❤️ ❤️ ❤️**

**🪙 COINS 12**

### TOP-CENTER

**SCORE**

**1,250**

### TOP-RIGHT

**SPEED ×1.2**

If Signal Burst is active, place its existing indicator underneath or near the speed indicator without covering gameplay.

---

# 11. SCORE MUST BE THE MOST PROMINENT NUMBER

The Score is the primary gameplay statistic.

Make:

**SCORE**

and its number slightly more prominent than:

**COINS**

The player should immediately recognize Score as the main objective.

Example:

```text
❤️ ❤️ ❤️       SCORE             SPEED ×1.2
🪙 COINS 12     1,250
```

Do not make COINS visually compete with SCORE.

---

# 12. DO NOT PUT BOTH VALUES TOGETHER

Avoid confusing layouts such as:

```text
SCORE: 1250 / 120 COINS
```

or:

```text
1250 + 120
```

or:

```text
COIN SCORE: 1200
```

The two values must remain clearly separated.

Use:

**SCORE 1,250**

and:

**🪙 COINS 12**

---

# 13. SCORE PROGRESSION

The Run Score should continue to increase gradually according to the existing score system.

Do NOT make the score increase once per animation frame at an excessive rate.

Use controlled running progress.

The score should feel like a gradual measurement of the player's performance.

For example:

```text
SCORE 101
SCORE 102
SCORE 103
SCORE 104
```

rather than:

```text
SCORE 101
SCORE 150
SCORE 230
SCORE 400
```

within a few seconds.

---

# 14. COINS MUST NOT CONTROL THE COIN COUNTER THROUGH SCORE

Do NOT calculate:

```text
coins = score / 10
```

The Coin counter must be based on **actual collected coin entities**.

For example:

The player may have:

**SCORE 850**

and:

**COINS 23**

That is completely valid.

Do not assume the two values must mathematically match.

---

# 15. MILESTONES MUST USE SCORE

Keep the existing milestone system based on:

**SCORE**

not:

**COINS**

Examples:

**500 SCORE**

**1,000 SCORE**

**1,500 SCORE**

**2,000 SCORE**

etc.

The Signal Burst milestone system must continue using the actual Run Score.

Do NOT trigger milestones based on the number of coins.

---

# 16. DIFFICULTY MUST USE SCORE

Keep the existing difficulty progression based on:

**SCORE → DIFFICULTY → SPEED**

Do NOT use the coin counter to determine difficulty.

The number of coins collected should not directly increase:

* speed
* obstacle frequency
* difficulty
* jump difficulty

Coins contribute to Score, but the separate COINS counter itself is only a collection statistic.

---

# 17. GAME OVER SUMMARY

Improve the existing Game Over screen to clearly separate the player's run statistics.

Display:

# GAME OVER

### RUN SCORE

**1,250**

### COINS COLLECTED

**87**

### HIGH SCORE

**3,420**

Use these labels exactly or with very minor visual variations.

The purpose is to clearly tell the player:

**Run Score = score achieved in this run**

**Coins Collected = number of coins physically collected**

**High Score = best Run Score achieved**

---

# 18. DO NOT CALL COINS "HIGH SCORE"

The High Score should ALWAYS refer to the best:

**RUN SCORE**

Never the number of coins collected.

For example:

```text
RUN SCORE
1,250

COINS COLLECTED
87

HIGH SCORE
3,420
```

This is the correct hierarchy.

---

# 19. HIGH SCORE LOGIC

When the current Run Score exceeds the previous High Score:

update:

**HIGH SCORE**

The High Score should be based on:

**Run Score only**

not:

* total coins
* coin count
* Signal Burst count
* milestones

Do not change the existing High Score screen's overall design unless necessary.

---

# 20. RESET THE COIN COUNTER FOR EACH NEW RUN

When the player starts a completely new run:

```text
SCORE = 0
COINS = 0
```

Then:

* Score starts increasing through normal gameplay.
* Coins start counting from zero.

Example:

### New Run

**SCORE 0**

**COINS 0**

Collect one coin:

**SCORE 10**

**COINS 1**

Collect another:

**SCORE 20**

**COINS 2**

---

# 21. PAUSE BEHAVIOR

When the game is paused:

* Score stops increasing.
* Coin count stops changing.
* No coins should be collected.
* No coin should be counted.
* No duplicate collection events should occur.

When resumed:

everything continues normally.

---

# 22. GAME OVER BEHAVIOR

When Game Over occurs:

* freeze the final Run Score
* freeze the final Coin count
* prevent further coin collection
* prevent further score changes
* show the final statistics

Example:

```text
GAME OVER

RUN SCORE
1,847

COINS COLLECTED
64

HIGH SCORE
2,950
```

Do not allow the Score or Coin counter to continue changing after Game Over.

---

# 23. PLAY AGAIN BEHAVIOR

When the player selects:

**PLAY AGAIN**

start a completely fresh run.

Reset:

**SCORE → 0**

**COINS → 0**

**HEALTH → 3**

**SPEED → starting speed**

and reset the other existing gameplay states according to the current implementation.

Do NOT reset the saved High Score unless the existing game explicitly provides a reset-high-score function.

---

# 24. AUDIO FEEDBACK

Keep the existing audio system.

When one coin is collected:

play the coin collection sound **once**.

If five coins are collected individually:

the system may play five short collection sounds, but prevent excessive overlapping or audio spam.

The sound must correspond to actual collection events.

Do not play a coin sound merely because a coin is visible.

Do not play a coin sound repeatedly while a coin is being magnetized.

---

# 25. IMPORTANT RELATIONSHIP

The final data relationship should be:

```text
RUN SCORE
     ↑
     │
Running Progress
     │
     └── Coin Collection
              │
              └── +10 SCORE
              
COINS
  ↑
  │
Actual Physical Coins Collected
  │
  └── +1 per coin
```

In simple terms:

**ONE COIN COLLECTED**

→ **COINS +1**

→ **SCORE +10**

The two values are related, but they are NOT the same statistic.

---

# 26. EXAMPLE TEST

Perform this exact test:

### Start

```text
SCORE 0
COINS 0
```

### Collect first coin

```text
SCORE 10
COINS 1
```

### Collect second coin

```text
SCORE 20
COINS 2
```

### Collect third coin

```text
SCORE 30
COINS 3
```

### Run for a while without collecting a coin

The Run Score may continue increasing gradually:

```text
SCORE 31
SCORE 32
SCORE 33
...
```

but:

```text
COINS 3
```

must remain unchanged.

### Collect another coin

```text
SCORE +10
COINS +1
```

Therefore:

```text
SCORE 43
COINS 4
```

This demonstrates that the systems are separate and working correctly.

---

# 27. FINAL UI EXAMPLE

The final gameplay HUD should approximately communicate:

```text
┌──────────────────────────────────────────────────────────┐
│ ❤️ ❤️ ❤️     SCORE                 SPEED ×1.2           │
│ 🪙 COINS 12   1,250                                     │
│                                                          │
│                                                          │
│                       🪙                                 │
│            🪙                    🪙                       │
│                   🏃                                     │
│                                                          │
│──────────────────────────────────────────────────────────│
└──────────────────────────────────────────────────────────┘
```

Keep the existing LouDash visual style.

Do not copy this ASCII layout literally if it conflicts with the current design; use it as a structural reference.

---

# 28. FINAL TESTING CHECKLIST

Before finishing, verify:

### SCORE

* [ ] Score starts at 0.
* [ ] Score increases gradually.
* [ ] Score is an integer.
* [ ] Score is clearly labeled SCORE.
* [ ] Score is the primary run statistic.
* [ ] Coin collection adds the correct Score amount.
* [ ] Score does not suddenly jump without reason.
* [ ] Score stops at Game Over.
* [ ] Score resets on a new run.
* [ ] Milestones use Score.
* [ ] Difficulty uses Score.
* [ ] High Score uses Run Score.

### COINS

* [ ] Coin counter starts at 0.
* [ ] Every physical coin counts exactly once.
* [ ] One coin = +1 COINS.
* [ ] Same coin cannot be counted twice.
* [ ] Magnetized coins count exactly once.
* [ ] Coins do not increase simply because they are nearby.
* [ ] Coin counter is independent from Score.
* [ ] Coin counter stops at Game Over.
* [ ] Coin counter resets on a new run.

### HUD

* [ ] SCORE is at the top-center.
* [ ] COINS is at the top-left underneath health.
* [ ] SPEED remains at the top-right.
* [ ] The two statistics are visually distinct.
* [ ] No confusing "Coin Score" label remains.
* [ ] No old/conflicting score display remains.

### GAME OVER

* [ ] Run Score is shown.
* [ ] Coins Collected is shown.
* [ ] High Score is shown.
* [ ] The three values are clearly different.

### SIGNAL BURST

* [ ] Magnetized coins count normally.
* [ ] Each coin counts once.
* [ ] Coin count remains independent from any Score multiplier.
* [ ] Signal Burst does not create duplicate coin counts.

---

# FINAL RULE

The player must be able to understand the HUD within one second:

**🪙 COINS = HOW MANY COINS I COLLECTED**

**SCORE = HOW WELL I PERFORMED IN THIS RUN**

**HIGH SCORE = MY BEST RUN SCORE**

Never confuse these three concepts.

Do not change the existing LouDash gameplay.

Only fix and clarify the Score + Coin counting system and its presentation.
