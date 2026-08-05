# Concrete Kings - Card Design & Animation System
## Production-Ready Visual Language

---

# PART 1: RESEARCH & STRATEGY

## 1.1 What Makes CAH's Design Work (And How We Differ)

**CAH's Design DNA:**
- Minimalist black/white contrast
- Helvetica Neue Bold (Swiss, neutral, authoritative)
- Pitch black cards, aged paper white cards
- Flat typography, no ornamentation
- Logo as brand mark
- Satirical, anti-design ethos

**Why We Can't Copy It:**
- CAH's design IS the joke—deliberately corporate/minimalist
- Black culture has rich visual traditions we should honor, not reject
- Our game has narrative depth, character progression, and cultural specificity
- Flat black/white loses the warmth and humanity of Black cultural aesthetics

---

## 1.2 Our Design Philosophy: " Griot Modernism "

**Core Principle:** Blend traditional Black visual culture with modern UI/UX best practices.

**Three Pillars:**

### 1. Cultural Warmth
- Earth tones, golds, warm oranges (not sterile black/white)
- Typography with soul (not neutral Swiss)
- Iconography drawn from Black cultural lexicon
- Texture and depth (not flat minimalism)

### 2. Digital Craftsmanship
- Smooth 60fps animations using CSS transforms + JS orchestration
- Spring physics for card interactions
- Staggered reveals for narrative pacing
- Haptic-feeling micro-interactions

### 3. Narrative Layering
- Cards tell stories visually, not just textually
- State changes reflect story beats
- Animations reinforce game mechanics
- Visual hierarchy guides player attention

---

## 1.3 Visual Differentiation from CAH

| Element | CAH | Concrete Kings |
|---------|-----|---------------|
| **Color Palette** | Pure black (#000), aged white (#ebe4d8) | Warm black (#1a1a1a), cream (#f3e7cf), orange (#ff6b35), gold (#f7c948) |
| **Typography** | Helvetica Neue Bold (neutral) | Plus Jakarta Sans + Space Grotesk (modern, warm, geometric) |
| **Card Feel** | Flat, corporate, minimal | Textured, dimensional, ceremonial |
| **Iconography** | None (typography-only) | Cultural emoji system (✂️ 🏪 🌳 👑 📜) |
| **Animation** | None (static cards) | Spring physics, staggered reveals, state transitions |
| **States** | None (no gameplay states) | Selected, active, cipher, receipt, hostile, alliance |
| **Narrative** | None (pure comedy) | Receipts, character arcs, story threads |
| **Cultural** | None (universal satire) | Deep Black cultural specificity |

---

# PART 2: TYPOGRAPHY SYSTEM

## 2.1 Font Stack

**Primary: Plus Jakarta Sans**
- Modern geometric sans with warm personality
- Excellent legibility at small sizes
- Strong character without being distracting
- Variable font for smooth weight transitions

**Secondary: Space Grotesk**
- Technical, contemporary feel
- Used for stats, numbers, metadata
- Creates visual contrast with primary

**Display: Unbounded**
- Rounded, friendly display font
- Used for titles, headers, brand moments
- approachable but authoritative

**Monospace: JetBrains Mono**
- For receipts, codes, data
- Technical precision for narrative documents

## 2.2 Typography Scale

```
Hero:     48px / Unbounded Black  / Tracking: -1px
H1:       32px / Plus Jakarta 800 / Tracking: -0.5px
H2:       24px / Plus Jakarta 700 / Tracking: 0
H3:       18px / Plus Jakarta 600 / Tracking: 0.5px
Body:     15px / Plus Jakarta 400 / Line-height: 1.6
Caption:  12px / Space Grotesk 500 / Uppercase / Tracking: 1.5px
Micro:    10px / JetBrains Mono 400 / Uppercase / Tracking: 2px
```

## 2.3 Typography Usage Rules

**Black Cards:**
- Prompt: H2, Bold, Cream color
- Type label: Micro, Uppercase, Orange, letter-spaced
- Footer: Caption, muted

**White Cards:**
- Text: Body, Bold, Black
- Type label: Micro, Uppercase, Brown, letter-spaced

**Receipts:**
- Title: H3, Italic, Black
- Text: Body, Regular, Black
- Footer: Micro, Uppercase, Gold

**Cipher:**
- Symbol: Hero, centered
- Label: H2, Bold, centered
- Description: Body, Regular, centered

---

# PART 3: COLOR SYSTEM

## 3.1 Primary Palette

```css
--c-black: #1a1a1a;        /* Deep warm black - not pure #000 */
--c-black-soft: #2b1d0e;   /* Warm brown-black for gradients */
--c-orange: #ff6b35;       /* Brand orange - energetic, warm */
--c-orange-deep: #e04b00;  /* Darker orange for hover states */
--c-cream: #f3e7cf;        /* Warm cream - not sterile white */
--c-cream-light: #fff7e6;  /* Light cream for white cards */
--c-cream-mid: #ffe3b3;    /* Mid cream for gradients */
--c-gold: #f7c948;         /* Gold for receipts, achievements */
```

## 3.2 Semantic Palette

```css
--c-green: #4caf50;        /* Success, alliance, origin */
--c-green-light: #e8f5e9;  /* Light green backgrounds */
--c-red: #ff4444;          /* Danger, beef, betrayal */
--c-red-light: #ffebee;    /* Light red backgrounds */
--c-blue: #2196f3;         /* Hustle, information */
--c-blue-light: #e3f2fd;   /* Light blue backgrounds */
--c-purple: #9c27b0;       /* Cipher, mystery */
--c-purple-light: #f3e5f5; /* Light purple backgrounds */
```

## 3.3 Color Usage Rules

**Black Cards:** Always dark gradient (never flat black)
**White Cards:** Always warm cream gradient (never pure white)
**Selected State:** Orange outline + glow
**Receipts:** Gold border + seal
**Cipher:** Purple with active orange state
**Origin:** Green with growth connotations
**Hustle:** Blue with power indicators
**Hostile/Beef:** Red accents
**Alliance:** Green accents

---

# PART 4: CARD ANATOMY

## 4.1 Standard Card Structure

```
┌─────────────────────────────┐
│ [Accent Bar - 4px]          │ ← Visual category indicator
│                             │
│  [Icon - 32-64px]           │ ← Cultural/contextual emoji
│  [Type Label - Micro]       │ ← "SCENARIO · CIPHER"
│                             │
│  [Prompt/Text - H2/Body]    │ ← Primary content
│  [Blank underline]          │ ← Interactive element
│                             │
│  [Footer - Caption]         │ ← Metadata
└─────────────────────────────┘
```

**Layers:**
1. **Accent Bar:** 4px top border, 30% opacity of category color
2. **Icon:** Centered or top-left, 32-64px based on card type
3. **Type Label:** Micro text, uppercase, letter-spaced, colored
4. **Primary Content:** Largest text, bold, high contrast
5. **Secondary Content:** Body text, regular weight
6. **Footer:** Smallest text, uppercase, muted
7. **Badge/Seal:** Absolute positioned status indicator (optional)

---

## 4.2 Card Dimensions

**Desktop:**
- Standard: 260px × 380px
- Tight (hand): 180px × 260px
- Receipt: 240px × 340px (rotated -1deg)
- Cipher: 220px × 220px (square)

**Mobile:**
- Standard: 200px × 290px
- Hand: 140px × 200px
- Receipt: 180px × 260px
- Cipher: 160px × 160px

**Aspect Ratios:**
- Standard: 2:3 (classic card ratio)
- Receipt: 7:10 (document feel)
- Cipher: 1:1 (ceremonial square)

---

# PART 5: ANIMATION SYSTEM

## 5.1 Animation Principles

**1. Spring Physics**
- Cards don't move linearly—they spring into place
- Overshoot and settle creates tactile feel
- Duration: 300-500ms for card movements

**2. Staggered Reveals**
- Cards deal one-by-one with 50ms delay between each
- Creates anticipation and narrative pacing
- Winner card celebrates with multi-stage animation

**3. State-Driven**
- Every state change has an animation
- Selection, hover, active, victory, defeat all feel distinct
- Animations communicate state, not just decoration

**4. Cultural Choreography**
- Cipher spin: 3 full rotations before settling
- Cookout formation: cards orbit center point
- Receipt award: scroll unrolls from top
- Victory: cards cascade down like confetti

---

## 5.2 Card Deal Animation

**Trigger:** New round starts  
**Duration:** 800ms total  
**Easing:** Spring (overshoot 1.2x)  

**Sequence:**
```
1. Deck glows orange (100ms)
2. Card 1 slides from deck to hand position (300ms)
3. Card 2 follows 50ms later (300ms)
4. Card 3 follows 50ms later (300ms)
5. ...continue for all cards
6. Final card lands with bounce (100ms)
```

**CSS:**
```css
@keyframes dealCard {
  from {
    transform: translateY(-200px) rotate(-10deg) scale(0.8);
    opacity: 0;
  }
  to {
    transform: translateY(0) rotate(0) scale(1);
    opacity: 1;
  }
}

.card-deal {
  animation: dealCard 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
}
```

---

## 5.3 Card Selection Animation

**Trigger:** Player clicks card  
**Duration:** 200ms  
**Easing:** Ease-out  

**States:**
- **Default:** Flat, no outline
- **Hover:** Lift 4px, enhanced shadow
- **Selected:** Lift 8px, orange outline 4px, orange glow
- **Active/Submitted:** Pulse 3x, then dim

```css
.card {
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 0 rgba(0,0,0,0.2);
}

.card.selected {
  transform: translateY(-8px);
  outline: 4px solid #ff6b35;
  box-shadow: 0 8px 0 rgba(0,0,0,0.2), 0 0 0 8px rgba(255,107,53,0.3);
}
```

---

## 5.4 Card Submission Animation

**Trigger:** Player submits card  
**Duration:** 600ms  
**Easing:** Ease-in-out  

**Sequence:**
```
1. Selected card glows brighter (100ms)
2. Card lifts 20px (200ms)
3. Card flips 180° showing back (300ms)
4. Card shrinks and flies to center (300ms)
5. Fades out at destination (200ms)
```

```css
@keyframes submitCard {
  0% {
    transform: translateY(0) rotate(0) scale(1);
    opacity: 1;
  }
  30% {
    transform: translateY(-20px) rotate(0) scale(1.05);
    opacity: 1;
  }
  60% {
    transform: translateY(-20px) rotate(180deg) scale(1.05);
    opacity: 1;
  }
  100% {
    transform: translateY(0) rotate(180deg) scale(0.5);
    opacity: 0;
  }
}

.card-submit {
  animation: submitCard 0.6s cubic-bezier(0.4, 0, 0.2, 1) forwards;
}
```

---

## 5.5 Cipher Spin Animation

**Trigger:** O.G. clicks cipher wheel  
**Duration:** 1200ms  
**Easing:** Ease-out (deceleration)  

**Sequence:**
```
1. Wheel spins 3 full rotations (900ms)
2. Decelerates smoothly (300ms)
3. Landing symbol bounces (100ms)
4. Effect text types in (300ms)
5. Screen flash (100ms)
6. Cards redistribute (400ms)
```

```css
@keyframes cipherSpin {
  from { transform: rotate(0deg); }
  to { transform: rotate(1080deg); } /* 3 full rotations */
}

.cipher-spin {
  animation: cipherSpin 0.9s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

@keyframes cipherLand {
  0% { transform: scale(1); }
  50% { transform: scale(1.3); }
  100% { transform: scale(1); }
}

.cipher-land {
  animation: cipherLand 0.2s ease-out;
}
```

---

## 5.6 Receipt Award Animation

**Trigger:** Winner receives receipt  
**Duration:** 1500ms  
**Easing:** Sequence of easings  

**Sequence:**
```
1. Receipt scroll image slides down from top (400ms)
2. Wax seal drops onto scroll (200ms)
3. Scroll unfurls from top to bottom (600ms)
4. Text types in character by character (400ms)
5. Golden glow pulses (300ms)
```

```css
@keyframes receiptDrop {
  from {
    transform: translateY(-300px) rotate(-5deg);
    opacity: 0;
  }
  60% {
    transform: translateY(10px) rotate(1deg);
    opacity: 1;
  }
  100% {
    transform: translateY(0) rotate(0);
    opacity: 1;
  }
}

@keyframes sealDrop {
  from {
    transform: translateY(-100px) scale(0);
  }
  60% {
    transform: translateY(5px) scale(1.2);
  }
  100% {
    transform: translateY(0) scale(1);
  }
}

@keyframes unfurl {
  from {
    clip-path: inset(0 0 100% 0);
  }
  to {
    clip-path: inset(0 0 0 0);
  }
}

.receipt-drop { animation: receiptDrop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1); }
.seal-drop { animation: sealDrop 0.2s cubic-bezier(0.34, 1.56, 0.64, 1) 0.4s both; }
.receipt-unfurl { animation: unfurl 0.6s ease-out 0.6s both; }
```

---

## 5.7 Cookout Formation Animation

**Trigger:** 2+ players form alliance  
**Duration:** 1000ms  
**Easing:** Spring  

**Sequence:**
```
1. Player cards orbit toward center (600ms)
2. Cards stack with overlap (200ms)
3. Cookout banner expands from center (300ms)
4. Green glow pulses around alliance (400ms)
5. Member names type in (300ms)
```

```css
@keyframes orbitIn {
  from {
    transform: translate(var(--start-x), var(--start-y)) rotate(0deg);
    opacity: 0;
  }
  to {
    transform: translate(0, 0) rotate(-5deg);
    opacity: 1;
  }
}

@keyframes cookoutExpand {
  from {
    transform: scale(0);
    opacity: 0;
  }
  60% {
    transform: scale(1.1);
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}
```

---

## 5.8 Victory Cascade

**Trigger:** Winner announced  
**Duration:** 2000ms  
**Easing:** Staggered  

**Sequence:**
```
1. Winner card lifts to center (400ms)
2. Crown icon bounces in (300ms)
3. Confetti-like cards rain down (1000ms)
4. Stat bars fill sequentially (600ms)
5. "Next Round" button fades in (300ms)
```

```css
@keyframes crownBounce {
  0%, 100% { transform: translateY(0) scale(1); }
  50% { transform: translateY(-30px) scale(1.2); }
  70% { transform: translateY(10px) scale(0.9); }
}

@keyframes confettiFall {
  to {
    transform: translateY(100vh) rotate(720deg);
    opacity: 0;
  }
}

@keyframes statFill {
  from { width: 0%; }
  to { width: var(--target-width); }
}
```

---

## 5.9 Transition Animations

**Screen Transitions:**
```css
@keyframes slideInRight {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

@keyframes slideOutLeft {
  from {
    transform: translateX(0);
    opacity: 1;
  }
  to {
    transform: translateX(-100%);
    opacity: 0;
  }
}

.screen-enter {
  animation: slideInRight 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.screen-exit {
  animation: slideOutLeft 0.3s ease-in;
}
```

**Card Flip (for secret reveals):**
```css
@keyframes cardFlip {
  from {
    transform: rotateY(0deg);
  }
  to {
    transform: rotateY(180deg);
  }
}

.card-flip {
  animation: cardFlip 0.6s ease-in-out;
  backface-visibility: hidden;
}
```

---

# PART 6: STATE TRANSITIONS

## 6.1 Card State Machine

```
DEFAULT ──hover──> HOVERED
HOVERED ──leave──> DEFAULT
DEFAULT ──select──> SELECTED
SELECTED ──deselect──> DEFAULT
SELECTED ──submit──> SUBMITTED
SUBMITTED ──animate──> HIDDEN
DEFAULT ──lock──> DISABLED
DISABLED ──unlock──> DEFAULT
```

**State Visual Specifications:**

| State | Outline | Shadow | Transform | Opacity | Filter |
|-------|---------|--------|-----------|---------|--------|
| Default | None | Medium | None | 1.0 | None |
| Hovered | None | Large | translateY(-4px) | 1.0 | None |
| Selected | 4px orange | Large + glow | translateY(-8px) | 1.0 | None |
| Submitted | None | None | translateY(-20px) | 0.5 | Blur 2px |
| Disabled | 2px gray | Small | None | 0.4 | Grayscale 40% |
| Active | 4px orange | Large + glow | translateY(-8px) | 1.0 | None |

---

## 6.2 Animation Timing Matrix

| Interaction | Duration | Easing | Delay | Stagger |
|-------------|----------|--------|-------|---------|
| Hover enter | 200ms | Ease-out | 0ms | N/A |
| Hover leave | 150ms | Ease-in | 0ms | N/A |
| Click select | 200ms | Ease-out | 0ms | N/A |
| Card deal | 400ms | Spring | 50ms/card | Yes |
| Card submit | 600ms | Ease-in-out | 0ms | N/A |
| Cipher spin | 1200ms | Ease-out | 0ms | N/A |
| Receipt award | 1500ms | Sequence | 0ms | N/A |
| Cookout form | 1000ms | Spring | 100ms | Yes |
| Victory | 2000ms | Staggered | 0ms | Yes |
| Screen transition | 400ms | Ease | 0ms | N/A |
| Stat change | 400ms | Ease-out | 100ms | Yes |

---

# PART 7: MICRO-INTERACTIONS

## 7.1 Button Interactions

**Primary Button (Orange):**
- Hover: Darken 10%, lift 2px
- Active: Press down 2px, darken 20%
- Disabled: 50% opacity, grayscale
- Loading: Spinner replaces text

```css
.btn-primary {
  background: #ff6b35;
  transition: all 0.15s ease;
}

.btn-primary:hover:not(:disabled) {
  background: #e55a2b;
  transform: translateY(-2px);
  box-shadow: 0 4px 0 rgba(0,0,0,0.2);
}

.btn-primary:active:not(:disabled) {
  transform: translateY(0);
  box-shadow: 0 2px 0 rgba(0,0,0,0.2);
}
```

**Secondary Button (Outline):**
- Hover: Fill with orange, text white
- Active: Invert colors

## 7.2 Card Interactions

**Magnetic Hover:**
- Card moves slightly toward cursor
- Creates "attraction" feeling
- Distance: max 8px

```javascript
card.addEventListener('mousemove', (e) => {
  const rect = card.getBoundingClientRect();
  const x = e.clientX - rect.left - rect.width / 2;
  const y = e.clientY - rect.top - rect.height / 2;
  
  card.style.transform = `
    translateY(-4px)
    translate(${x * 0.1}px, ${y * 0.1}px)
  `;
});
```

**Selection Ripple:**
- Orange ring expands from click point
- Confirms selection visually

```css
@keyframes selectRipple {
  from {
    transform: scale(0.8);
    opacity: 1;
  }
  to {
    transform: scale(1.2);
    opacity: 0;
  }
}

.card::after {
  content: '';
  position: absolute;
  inset: -8px;
  border: 4px solid #ff6b35;
  border-radius: 16px;
  opacity: 0;
}

.card.selected::after {
  animation: selectRipple 0.3s ease-out;
}
```

## 7.3 Stat Bar Animations

**Stat Change:**
- Bar fills from left to right
- Number counts up/down
- Color flashes green (positive) or red (negative)

```css
@keyframes statFill {
  from { width: 0; }
  to { width: var(--target); }
}

@keyframes statCount {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.stat-fill {
  animation: statFill 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}

.stat-value {
  animation: statCount 0.3s ease-out 0.3s both;
}
```

## 7.4 Dice/Cipher Interactions

**Roll Animation:**
- Cipher wheel spins rapidly (300ms)
- Symbols blur into streak
- Decelerates with bounce
- Landing symbol scales up

**Shake Effect (for veto):**
```css
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
  20%, 40%, 60%, 80% { transform: translateX(5px); }
}

.shake {
  animation: shake 0.5s ease-in-out;
}
```

---

# PART 8: CARD VARIANT SPECIFICATIONS

## 8.1 Black Cards (Scenarios)

**Visual Treatment:**
- Background: Linear gradient #2a2a2a → #1a1a1a
- Text: Cream (#f3e7cf)
- Border: 2px solid #3a3a3a
- Shadow: 6px offset, 25% opacity black
- Top accent: 4px orange bar

**Typography:**
- Type label: Micro, uppercase, orange, 3px letter-spacing
- Prompt: H2, bold, cream, 1.3 line-height
- Footer: Caption, uppercase, muted, 1px letter-spacing

**Special Variants:**
- **Dice:** Orange dice badge top-right
- **Receipt:** Gold border, scroll seal, italic title
- **Cipher:** Purple background, centered layout

---

## 8.2 White Cards (Responses)

**Visual Treatment:**
- Background: Linear gradient #fff7e6 → #ffe3b3
- Text: Black (#1a1a1a)
- Border: 2px solid #e0d4b0
- Shadow: 4px offset, 15% opacity black
- Top accent: 4px orange bar

**Typography:**
- Type label: Micro, uppercase, brown, 2px letter-spacing
- Text: Body, bold, black, 1.4 line-height
- Footer: Caption, uppercase, muted

**Special Variants:**
- **Selected:** 4px orange outline + glow, lift -8px
- **Hustle:** Blue border, blue gradient background
- **Disabled:** 40% opacity, grayscale filter

---

## 8.3 Receipt Cards

**Visual Treatment:**
- Background: Linear gradient #fff8e1 → #ffecb3
- Text: Black (#1a1a1a)
- Border: 3px solid gold (#f7c948)
- Shadow: 4px offset, 20% opacity black
- Rotation: -1deg (organic feel)
- Seal: 48px circle, gold, top-right

**Typography:**
- Type label: Micro, uppercase, dark gold, 3px letter-spacing
- Title: H3, italic, black, bold
- Text: Body, regular, black, 1.5 line-height
- Footer: Micro, uppercase, dark gold, dashed border-top

**Special Variants:**
- **Resolved:** Green border, checkmark seal, +2 Reputation text
- **Active:** Gold border, scroll seal, trigger countdown

---

## 8.4 Cipher Cards

**Visual Treatment:**
- Background: Linear gradient #f3e5f5 → #e1bee7
- Text: Black (#1a1a1a)
- Border: 3px solid purple (#9c27b0)
- Shadow: 4px offset, 20% opacity black
- Layout: Centered, square (1:1 ratio)
- Symbol: 64px emoji, centered

**Typography:**
- Symbol: Hero, 64px, centered
- Label: H2, bold, uppercase, 2px letter-spacing
- Description: Body, regular, centered, 1.5 line-height

**Special Variants:**
- **Active:** Orange border, orange glow, bounce animation
- **Used:** Grayscale, 50% opacity

---

## 8.5 Origin Cards

**Visual Treatment:**
- Background: Linear gradient #e8f5e9 → #c8e6c9
- Text: Black (#1a1a1a)
- Border: 2px solid green (#4caf50)
- Shadow: 4px offset, 15% opacity black
- Layout: Centered, vertical

**Typography:**
- Icon: 48px, centered
- Type label: Micro, uppercase, green, 2px letter-spacing
- Title: H3, bold, centered
- Text: Body, regular, centered, 1.5 line-height
- Bonuses: Caption, semibold, green background box

---

## 8.6 Hustle Cards

**Visual Treatment:**
- Background: Linear gradient #e3f2fd → #bbdefb
- Text: Black (#1a1a1a)
- Border: 3px solid blue (#2196f3)
- Shadow: 4px offset, 20% opacity black
- Layout: Centered, vertical

**Typography:**
- Icon: 40px, centered
- Type label: Micro, uppercase, blue, 3px letter-spacing
- Title: H2, bold, centered
- Text: Body, semibold, centered
- Power box: Caption, bold, white background, blue border

---

# PART 9: IMPLEMENTATION GUIDE

## 9.1 CSS Architecture

```css
/* 1. Design Tokens */
:root { /* colors, typography, spacing */ }

/* 2. Base Styles */
* { box-sizing, margins, etc }

/* 3. Card Base */
.card { /* shared card styles */ }

/* 4. Card Variants */
.card-black { /* dark theme */ }
.card-white { /* light theme */ }
.card-receipt { /* gold theme */ }
.card-cipher { /* purple theme */ }
.card-origin { /* green theme */ }
.card-hustle { /* blue theme */ }

/* 5. Card States */
.card.selected { /* orange outline */ }
.card.disabled { /* muted */ }
.card.active { /* glow */ }

/* 6. Animations */
@keyframes dealCard { }
@keyframes submitCard { }
@keyframes cipherSpin { }
@keyframes receiptDrop { }
@keyframes victoryCascade { }

/* 7. Utilities */
.anim-stagger { }
.anim-spring { }
```

## 9.2 JavaScript Animation Controller

```javascript
class CardAnimator {
  constructor() {
    this.queue = [];
    this.playing = false;
  }

  async playSequence(animations) {
    this.playing = true;
    for (const anim of animations) {
      await this.play(anim);
    }
    this.playing = false;
  }

  async play(animation) {
    return new Promise(resolve => {
      const card = animation.target;
      card.style.animation = animation.keyframes;
      card.style.animationDuration = animation.duration;
      card.style.animationTimingFunction = animation.easing;
      card.style.animationDelay = animation.delay;
      
      card.addEventListener('animationend', resolve, { once: true });
    });
  }

  stagger(cards, animation, staggerDelay = 50) {
    return cards.map((card, i) => ({
      ...animation,
      target: card,
      delay: `${i * staggerDelay}ms`
    }));
  }
}
```

## 9.3 Performance Optimization

**GPU Acceleration:**
```css
.card {
  will-change: transform, opacity;
  transform: translateZ(0); /* Force GPU layer */
}
```

**Reduced Motion:**
```css
@media (prefers-reduced-motion: reduce) {
  .card {
    animation: none !important;
    transition: none !important;
  }
}
```

**Frame Budget:**
- Target: 60fps (16.67ms per frame)
- Card deal: 4 cards @ 50ms stagger = 200ms total
- Cipher spin: 900ms (54 frames @ 60fps)
- Victory: 2000ms (120 frames)

---

## 9.4 Accessibility

**Keyboard Navigation:**
- Cards: Tab + Enter/Space to select
- Buttons: Tab + Enter/Space to activate
- Cipher: Space to spin, R to re-roll

**Screen Readers:**
```html
<div class="card" role="button" tabindex="0" 
     aria-label="Response card: a community land trust proposal">
  <!-- card content -->
</div>
```

**Reduced Motion:**
- Detect `prefers-reduced-motion`
- Replace spring animations with fades
- Disable particle effects

**Color Contrast:**
- All text: WCAG AA minimum (4.5:1)
- Cream on black: 12.5:1 ✓
- Black on cream: 12.5:1 ✓
- Orange on cream: 4.8:1 ✓

---

# PART 10: NEXT STEPS

## Immediate (This Week)
1. ✅ Design system document complete
2. Build interactive HTML demo with all animations
3. Review with stakeholders
4. Choose animation library (GSAP vs Anime.js vs CSS)

## Short Term (2 Weeks)
1. Implement card component library in React/Vue
2. Add spring physics for all card interactions
3. Build cipher wheel component with spin animation
4. Create receipt scroll animation

## Medium Term (1 Month)
1. Full animation system integration
2. Performance testing on mobile devices
3. Accessibility audit
4. Sound design integration (optional)

## Long Term (2 Months)
1. 3D card tilt on hover (optional premium feature)
2. Particle effects for victories
3. Screen reader narration
4. haptic feedback API integration

---

*Document Version: 1.0*  
*Created: 2026-08-04*  
*Status: Ready for Implementation*
