# World State & Storylets
## Persistent world mutations, reactive encounters, real-world block dynamics

### Real-World Inspiration
- Block control: real informal block presidents, street organizations, and neighborhood governance
- Barbershop state: real small business cycles, gentrification pressure, police harassment
- Bodega state: real immigrant entrepreneurship, informal credit systems, community hubs
- Kid state: real child witnesses to urban violence, protective custody, witness intimidation
- Rumors: real gossip networks in Black neighborhoods: barbershops, churches, cookouts, social media

### World State Trackers
- blockControl: player|ray|jada|marquez|chen|contested
- barbershopState: open|closed|raided|front|gentrified
- barState: normal|shut_down|jada_owned
- bodegaState: normal|intercepted|chen_gone|community-owned
- safehouseState: secure|compromised|burned
- precinctState: corrupt|exposed|reformed
- pipelineState: active|exposed|taken_over|destroyed
- kidState: safe|hidden|recruited|lost|witness
- rumorMeter: 0-10; drives emergent storylets
- gentrificationPressure: 0-10; if high, old heads get pushed out
- betrayalExposure: none|suspected|known|public
- receiptCount: 0-13; unlocks secret ending threshold
- decadeMode: 1980s|1990s|2000s|present; affects references and flavor

### Storylet Rules
- Evaluate 3-5 storylets per day transition
- Deterministic probability by world seed
- Triggered by location, heat band, flags, act, time
- No main-quest climax override
- May unlock side quests or modify existing ones

### Storylets
- Title: "The Stoop Talk"
  - Trigger: daytime, barbershopState=open
  - If rumorMeter >= 5: reveal secret about Chen's shipment
  - If kidState=witness: Kid overhears and tells you later
  - If Marquez trust >= 7: Marquez warns you to stop asking questions
  - Humor: Ray tries to sell you a hair growth tonic that is clearly just grease

- Title: "The Church Basement"
  - Trigger: Sunday morning, any state
  - If justicePath=active: pastor gives you moral cover
  - If powerPath=active: deacon tries to recruit you for the choir board
  - If Marquez trust <= 2: Marquez is there too; you both pretend not to see each other
  - Mature: the pastor knows everyone's business; sermon is clearly about you

- Title: "The Bodega Window"
  - Trigger: late night, bodegaState=open
  - If heat >= 7: Chen locks the door and talks through the window
  - If Jada trust >= 6: Jada is there; she and Chen have a quiet argument
  - If kidState=hidden: Kid is hiding behind the counter
  - Chaos: a random customer recognizes you; you have to buy something expensive to blend in

- Title: "The Block Party"
  - Trigger: weekend, heat < 5
  - Options: dance, roast battle, gamble, listen to old heads
  - If roast battle chosen: Jada roasts you publicly; Ray counters with a worse roast about you
  - Humor: The Kid wins the dance contest; nobody can believe it
  - Mature: Marquez shows up in plainclothes; he is not there to party

### Environmental Storytelling
- Graffiti evolves by act and decade; tags mutate as artists age
- Props carry lore fragments; bodega receipts, barbershop business cards, church bulletins
- Audio cues shift with heat/reputation; louder music = higher trust, silence = danger
- NPC schedules move by trust and time; Ray cuts hair, Jada counts cash, Marquez patrols, Chen stocks
- Silence in busy areas signals danger or opportunity

### Delayed Consequence Chains
- Immediate: same scene
- Short: next 1-2 days
- Medium: act transition
- Long: ending/epilogue only
- Example: Day 1 Marquez cash choice affects Day 2 bark, Act 2 pressure, Act 3 betrayer arc

### Decade-Specific World-State Flavor
- 1980s: payphones as communication hubs, VHS as record-keeping, arcades as gathering spots
- 1990s: beepers as status symbols, Blockbuster as social hub, cookouts as political events
- 2000s: Sidekicks as social portals, MySpace as reputation system, camera phones as evidence tools
- Present-day: TikTok as gossip amplifier, Cash App as economic power, drones as surveillance

### Pop Culture / Art Flavor
- Street art references: Basquiat-era SAMO tags in 1980s, mural culture in 1990s, sticker bombing in 2000s, QR code art present-day
- Music flavor: barbershop radio shifts by decade; Ray plays old soul, Jada plays current hits, Marquez plays drill, Chen plays salsa/reggaeton
- Fashion flavor: NPC outfits evolve with decades; 1980s Kangols, 1990s Timberlands, 2000s jerseys, present-day designer/streetwear mix
- Food flavor: barbershop offers coffee and peppermints; bodega offers chopped cheese, plantanos, hibiscus tea, vegan options

### Mature World-State Anchors
- Police encounters escalate with heat
- Domestic disputes can break out during storylets
- Money talks happen in public but consequences are private
- Sex and attraction happen in background; can become quest catalysts
- Language shifts by NPC mood, heat, trust, and decade reference
