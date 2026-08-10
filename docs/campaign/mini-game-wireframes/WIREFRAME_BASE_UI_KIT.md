# Mini-Game Base UI Kit
## Shared wireframe components for all mini-games

### Global Layout
- Top HUD bar: y=0, height=54, bg=#101116, border=#2d313d
- Bottom HUD bar: y=666, height=54, bg=#101116, border=#2d313d
- Play area: y=54 to y=666
- Header banner: x=20, y=16, w=1240, h=70, bg=#101116, border=#ffcd68
- Outcome overlay: centered 700x220, border=#ffcd68 or #f25438

### Typography
- Title: Press Start 2P, 18-20px, color=#ffcd68
- Subtitle/label: Press Start 2P, 10px, color=#8b95ab
- Body: VT323, 18-22px, color=#cbd5ed
- Prompt: Press Start 2P, 10-12px, color=#6fe8d8
- Warning: VT323, color=#f25438
- Success: VT323, color=#6fe8d8

### Common States
- lobby: show title, description, controls hint, [PRESS ENTER TO START]
- play: interactive gameplay, timer running, HUD active
- resolve: result calculated, outcome overlay pending
- reward: show success/failure text, [PRESS ENTER TO EXIT]

### Common Controls
- confirm: ENTER/SPACE/A
- cancel: B/ESC
- up/down/left/right: arrows/WASD
- action1: X
- action2: Y
- pause: P

### Common HUD Fields
- top: MINI GAME, NPC, LOCATION, TIME
- bottom: STATUS, DIFFICULTY

### Common Colors
- bg: #101116
- panel: #151821
- border: #2d313d
- accent gold: #ffcd68
- accent cyan: #6fe8d8
- accent blue: #85c4ff
- danger: #d9382f
- warning: #f25438
- text primary: #cbd5ed
- text secondary: #8b95ab
