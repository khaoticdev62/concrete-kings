# The Block Remembers — adapting the CARD RPG PRD to Concrete Kings

**Source:** `CARD RPG.md`, a 76-section PRD for a generic social card RPG.

**Scope decision.** The PRD is not implementable as written in one pass, and it says so
itself: §57 (MVP), §71 Risk 6 ("Build the card → consequence → callback loop first") and
§75 Phase 1 all name the same small core. So this implements that core and nothing else.

**What Concrete Kings already has**, and therefore what this does NOT rebuild: cards and
prompts (`cards.js`, 1137 lines), judging (`chooseWinner`), RPG stats (Trust/Heat/Rep/Cash),
character creation with attributes and origins, XP and levels (`player-progression.js`),
quests, districts and travel, four NPCs, five mini-games, a shop, weather, and a receipts
system. Mapped onto the PRD that is §6–13, §31–33, §41 and most of Phase 2 — already built.

**What it does not have** is the thing the PRD calls the differentiator (§73: *"your dumbest
card plays become permanent parts of the story"*): the game currently forgets every card the
moment the round ends. A crowned card awards a point and vanishes. Nothing accumulates,
nothing recurs, nothing is referenced later. That gap is §16 Canon, §17 Canon Memory,
§28 Running Jokes, §42 Chronicle, §53 Callbacks and §62–63 the event ledger — and it is what
this spec covers.

---

## 1. Naming: canon becomes "the block remembers"

The PRD's vocabulary is generic ("canon database", "running jokes", "the raccoon kingdom").
Concrete Kings already has a voice, so the systems adopt it:

| PRD | Here |
|---|---|
| Canon event | **Receipt** — the game already has `ReceiptSystem`, and a receipt is exactly "a thing that happened and can be held against you" |
| Running joke | **Block legend** — a motif the block has started repeating |
| Canon database | **The Ledger** |
| Campaign chronicle (§42) | **THE BLOCK REMEMBERS** screen |
| Reputation list (§24) | The existing TRUST / HEAT / REP / CASH, not seven new scores |

Reusing `ReceiptSystem` rather than adding a parallel "canon" concept is the main
adaptation: two systems that both mean "permanent record of a thing you did" would compete.

## 2. Cards have no tags, so tags are inferred

§8 and §45 assume cards carry metadata. Concrete Kings' cards are plain strings — 1137 lines
of them, generated from `CONCRETE-KINGS-CARD-DATABASE.md`. Retagging by hand is not viable
and would drift from the generator on the next run.

Instead a keyword lexicon infers tags from card text at resolution time. The lexicon is
small, explicit and district-agnostic, and covers the four axes the game already tracks:

- `heat` — police, warrant, cuffs, snitch, evidence, corner
- `cash` — rent, money, cash, work, hustle, bag
- `trust` — family, mama, cousin, church, block, neighbour
- `disrespect` — words that cost REP when they land on you

A card matching nothing is untagged and scores on humour alone. That is the honest default:
most white cards are jokes, not crimes.

## 3. Motifs and promotion

Every crowned card's significant words become motifs (stopwords stripped, 4+ letters). Motif
counts accumulate across the session. Thresholds, deliberately low because a session is
7 points not 40 rounds:

| Mentions | Tier | Effect |
|---:|---|---|
| 2 | `KNOWN` | Named in the chronicle |
| 3 | `LEGEND` | Becomes a callback candidate; playing into it pays REP |
| 5 | `INSTITUTION` | Permanent block fixture; appears in the ending |

§28's raccoon example scaled to a card game: three mentions of "pigeon" makes the pigeon a
block legend, five makes it an institution.

## 4. Callbacks

§53. When a black card is dealt, the engine looks for a promoted motif whose text appears in
the new prompt. If one matches, the round is flagged as a callback: the prompt is annotated
("THE BLOCK REMEMBERS: the pigeon"), and a player whose winning card contains that motif
earns a REP bonus. This is the mechanism that makes a round-three joke pay off at round ten.

## 5. Determinism

§64. No `Math.random` in the engine. Motif extraction and promotion are pure functions of the
crowned-card history, so two clients replaying the same rounds produce the same ledger — which
matters because the game has an online mode and the ledger will eventually need to sync.

§21's boundary is respected by construction: this is all deterministic engine, no AI. The AI
layer the PRD describes (§20 Mode C, §22) would narrate this ledger, never own it.

## 6. Explicitly out of scope

Named so nobody has to guess whether they were missed: AI game master (§20–22), factions
(§25), inventory from cards (§26), quest generation (§27), card evolution into new cards
(§29), hidden objectives (§13), death modes (§36), solo AI party members (§37), modding
(§48), UGC (§47), monetisation (§68). Several of these depend on the ledger existing first,
which is the argument for building it first.

## 7. Files

- `src/pixel_engine/canon-engine.js` — new. Ledger, motif tracking, tag inference, callbacks,
  chronicle rendering data. Pure logic, no DOM, dual export.
- `index.html` — record on `chooseWinner`, check for callbacks on `nextBlack`, a chronicle
  screen, and the callback banner on the table.
- `test/canon-engine.test.js` — new.

## 8. Success criterion

The PRD's own (§58): a joke becomes an RPG consequence. Concretely, playable and observable
in one session — play a card mentioning the same thing three times and the block starts
naming it back at you, then pays you for it.
