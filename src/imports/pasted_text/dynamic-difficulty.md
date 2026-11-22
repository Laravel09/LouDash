# DYNAMIC DIFFICULTY & PROGRESSIVE GAME COMPLEXITY

Add a proper **dynamic difficulty progression system** to LouDash.

The game should become gradually more challenging as the player's score increases.

The relationship should be:

**HIGHER SCORE → HIGHER DIFFICULTY → MORE COMPLEX OBSTACLES → MORE OBSTACLE VARIETY → FASTER RUN SPEED**

The difficulty must increase progressively, not suddenly.

---

## 1. DIFFICULTY SHOULD BE SCORE-BASED

Use the actual displayed score as the primary difficulty progression value.

Do not make difficulty increase randomly.

The player should be able to feel that:

**"The longer I survive and the higher my score becomes, the harder the game gets."**

---

## 2. DIFFICULTY LEVELS

Use progressive difficulty stages.

### 🟢 LEVEL 1 — 0–499 SCORE

**BEGINNER**

Gameplay should be comfortable.

Use:

* low obstacle frequency
* mostly simple obstacles
* generous spacing
* simple coin patterns
* comfortable reaction time
* starting speed around ×1.0

The purpose is to let the player learn the game.

---

### 🟡 LEVEL 2 — 500–999 SCORE

**EASY**

Slightly increase:

* obstacle frequency
* obstacle variety
* coin pattern complexity
* movement speed

Introduce more combinations of the existing obstacles.

Maintain reasonable spacing.

Target speed:

**×1.1**

---

### 🟠 LEVEL 3 — 1,000–1,499 SCORE

**NORMAL**

Increase:

* obstacle frequency
* obstacle variety
* obstacle combinations
* coin placement variety
* required jump timing

Introduce additional combinations such as:

**Obstacle → Coin Group**

**Obstacle → Obstacle**

**Low Obstacle → Higher Coin**

Target speed:

**×1.2**

The player should clearly feel that the game has become more challenging.

---

### 🔴 LEVEL 4 — 1,500–1,999 SCORE

**HARD**

Increase:

* number of obstacles
* obstacle variety
* obstacle combinations
* pattern complexity
* speed

Introduce more frequent obstacle sequences.

Target speed:

**×1.3**

However, every sequence must remain realistically survivable.

---

### 🔥 LEVEL 5 — 2,000–2,499 SCORE

**VERY HARD**

The game should now feel significantly more challenging.

Increase:

* obstacle frequency
* obstacle combinations
* different obstacle types
* coin-pattern complexity
* reaction requirements
* running speed

Target speed:

**×1.4**

Do not create impossible obstacle sequences.

---

### ⚡ LEVEL 6 — 2,500–2,999 SCORE

**EXPERT**

Increase the complexity further.

Use:

* more frequent obstacles
* more combinations
* less empty running space
* more varied patterns
* faster movement
* more demanding but still readable jumps

Target speed:

**×1.5**

The player should feel that surviving for a long time is becoming an achievement.

---

### 💀 LEVEL 7 — 3,000+ SCORE

**EXTREME**

This is the high-score/endurance phase.

Use:

* maximum reasonable obstacle variety
* frequent obstacle patterns
* more complex combinations
* faster run speed
* challenging coin patterns
* shorter but still fair reaction windows

Target speed:

**×1.6**

Optionally allow the late game to gradually approach:

**×1.7 maximum**

Do not make the game unfair simply to increase difficulty.

---

# 3. INCREASE OBSTACLE FREQUENCY

As difficulty increases, increase how frequently obstacles appear.

Example progression:

### 0–499

Mostly:

**1 obstacle → safe space → 1 obstacle**

### 500–999

Occasionally:

**1 obstacle → 1 obstacle**

### 1,000–1,499

More frequent:

**1 obstacle → 1 obstacle → safe space**

### 1,500–1,999

Introduce more sequences:

**Obstacle → Obstacle → Coin Pattern**

### 2,000–2,499

Use more varied combinations:

**Obstacle → Obstacle → Obstacle**

or:

**Coin Pattern → Obstacle → Obstacle**

### 2,500–2,999

Increase density while maintaining reaction time.

### 3,000+

Use the highest reasonable obstacle density.

Do NOT continuously spawn obstacles without giving the player enough time to react.

---

# 4. INCREASE OBSTACLE VARIETY

Use the existing obstacle types and make them appear progressively more often.

For example:

* Barrier
* Rock
* Roadblock
* Other already-existing obstacle types in the prototype

Early game:

Use mostly simple/common obstacles.

Later game:

Mix different obstacle types together.

Example:

**Barrier → Rock → Roadblock**

or:

**Rock → Barrier → Rock**

The goal is to make the player recognize different situations rather than repeatedly seeing the same obstacle.

Do NOT add unnecessary complicated mechanics.

---

# 5. INTRODUCE OBSTACLE COMBINATIONS GRADUALLY

Do not immediately use complex combinations.

Early:

**ONE OBSTACLE**

Later:

**TWO OBSTACLES**

Later:

**MULTIPLE OBSTACLES**

Eventually:

**MIXED OBSTACLE PATTERNS**

This creates a natural learning curve.

---

# 6. OBSTACLE SPACING MUST REMAIN FAIR

Even at high difficulty:

**DO NOT CREATE IMPOSSIBLE PATTERNS.**

Always give the player:

* enough reaction time
* enough jump distance
* enough landing space
* a readable obstacle path

Do not generate:

* unavoidable obstacles
* obstacles directly on top of each other
* impossible consecutive jumps
* obstacles with no reaction window
* patterns that require perfect pixel timing

Difficulty should come from:

**FASTER DECISIONS + MORE VARIETY + MORE COMPLEXITY**

not from unfairness.

---

# 7. DIFFICULTY SHOULD ALSO AFFECT COIN PATTERNS

As difficulty increases, coin patterns may become slightly more challenging.

Early:

**LOW → LOW → LOW**

Later:

**LOW → MID → LOW**

Then:

**LOW → MID → HIGH → MID**

Eventually:

**LOW → HIGH → LOW**

However, coins must remain reasonably reachable using the improved jump system.

Coins should never be used to trick the player into an unavoidable obstacle.

---

# 8. DIFFICULTY SHOULD AFFECT RUN SPEED

The running speed must directly reflect the current difficulty level.

Use:

| Score       | Difficulty |         Speed |
| ----------- | ---------- | ------------: |
| 0–499       | Beginner   |          ×1.0 |
| 500–999     | Easy       |          ×1.1 |
| 1,000–1,499 | Normal     |          ×1.2 |
| 1,500–1,999 | Hard       |          ×1.3 |
| 2,000–2,499 | Very Hard  |          ×1.4 |
| 2,500–2,999 | Expert     |          ×1.5 |
| 3,000+      | Extreme    | ×1.6–×1.7 max |

The speed should increase smoothly when entering a new difficulty stage.

**Never decrease speed during the run.**

---

# 9. DISPLAY THE CURRENT DIFFICULTY

If it fits naturally into the existing HUD, display a small difficulty indicator.

Examples:

**BEGINNER**

**EASY**

**NORMAL**

**HARD**

**VERY HARD**

**EXPERT**

**EXTREME**

When the player enters a new difficulty level, briefly display:

## ⚠️ DIFFICULTY INCREASED

### HARD

Then return to the normal gameplay HUD.

The notification must:

* be brief
* not pause gameplay
* not cover the character
* not block obstacles
* not interfere with controls

---

# 10. SPEED + DIFFICULTY FEEDBACK

When difficulty increases, provide subtle feedback:

**⚡ SPEED UP!**

**DIFFICULTY: HARD**

The player should understand that the increased speed is intentional.

Do not make the player think the game randomly slowed down or sped up.

---

# 11. DO NOT MAKE DIFFICULTY RANDOM

Randomness may still be used for:

* obstacle selection
* coin placement
* Signal Burst power-up opportunities

But the **overall difficulty level must be deterministic based on score.**

Example:

**Score 1,200 = NORMAL**

Even if the individual obstacle pattern is randomly selected, the overall difficulty remains NORMAL.

---

# 12. PRESERVE FAIRNESS AT HIGH SPEED

As speed increases, the game must automatically account for the reduced reaction time.

Do not simply increase speed while leaving obstacle spawning completely unchanged.

Adjust:

* obstacle spacing
* obstacle patterns
* spawn timing
* coin placement
* jump requirements

so the game remains playable.

The goal is:

**HIGHER SCORE = MORE CHALLENGING**

not:

**HIGHER SCORE = UNPLAYABLE**

---

# 13. FINAL DIFFICULTY EXPERIENCE

The player should experience the game approximately like this:

### START

**"This is easy. I'm learning."**

↓

### 500

**"It's getting a little faster."**

↓

### 1,000

**"There are more obstacles now."**

↓

### 1,500

**"I need to pay more attention."**

↓

### 2,000

**"The patterns are getting harder."**

↓

### 2,500

**"I need good timing now."**

↓

### 3,000+

**"This is difficult. How long can I survive?"**

That feeling of increasing challenge is essential to the endless-runner experience.

---

# 14. IMPORTANT BALANCE RULE

Never increase all difficulty variables aggressively at the same time.

Do NOT simultaneously:

* drastically increase speed
* drastically increase obstacle frequency
* drastically reduce spacing
* drastically increase jump difficulty

Instead, increase difficulty progressively.

The player should have time to adapt.

---

# 15. FINAL RELATIONSHIP

The final LouDash progression should follow:

**SCORE**

↓

**DIFFICULTY LEVEL**

↓

**OBSTACLE FREQUENCY**

↓

**OBSTACLE VARIETY**

↓

**OBSTACLE COMPLEXITY**

↓

**COIN PATTERN COMPLEXITY**

↓

**RUN SPEED**

↓

**PLAYER CHALLENGE**

All of these should work together as one coherent difficulty system.

The player should always feel that their higher score is what caused the game to become more challenging.

Do not introduce random unexplained difficulty changes.
