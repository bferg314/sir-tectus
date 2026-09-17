# Sir Tectus & The Golden Sandwich

> **A 1–4 Player Side-Scrolling Local Co-op Roguelike Adventure**  
> Built with TypeScript, HTML5 Canvas 2D, and procedural dungeon generation.

---

## 🥪 Overview

In the forgotten depths of ancient sanctuaries lies the ultimate culinary relic: **The Golden Sandwich**. Four legendary knights—**Sir Tectus**, **Sir Bareti**, **Sir Fluctus**, and **Sir Morgani**—must delve through perilous, procedurally generated biomes, collect sacred coins, survive deadly traps, battle mythical monsters, and extract the sandwich back to the surface.

Play **solo with AI companion bots**, **up to 4-player local co-op**, or any combination thereof.

---

## ⚔️ The Knights

Every knight features distinct armor, a flowing signature cape, unique mobility, and a signature special ability. Any player can select any knight slot, and selections are remembered across runs and restarts.

| Knight | Color & Cape | Mobility | Signature Ability | Role |
| :--- | :--- | :--- | :--- | :--- |
| **Sir Tectus** | Emerald Green & Gold | Double Jump | **Aegis Shield & Boomerang**<br>• Hold Ability to raise shield and reflect projectiles (arrows, void skulls, firebombs).<br>• Tap Ability to throw shield as a returning boomerang that cleaves foes. | Defensive Vanguard & Crowd Control |
| **Sir Bareti** | Ruby Crimson & Ember | Triple Jump | **Blazing Fireball**<br>• Casts high-velocity fire magic that explodes on contact and ignites enemies with lingering burn damage. | Aerial Agility & Ranged Burst |
| **Sir Fluctus** | Deep Azure & Cobalt | Fluid Double Jump & Air Dash | **Tidal Slide & Water Surge**<br>• Creates a surging water slide to blitz through hazards and bowl through enemy ranks with heavy knockback. | High-Speed Initiator & Skirmisher |
| **Sir Morgani** | Regal Violet & Amethyst | Double Jump | **Piercing Flying Blade**<br>• Hurls heavy spinning greatswords that pierce through multiple enemies in a straight line. | Heavy DPS & Armor Piercer |

### Universal Combat Mechanics
- **Melee Slash**: Rapid sword strikes with directional aiming.
- **Down-Thrust Pogo**: Hold Down in mid-air to plunge downward with your blade, bouncing harmlessly off enemy heads, hazards, and spikes while dealing damage.
- **Archery (Secondary)**: Every knight carries a precision bow with aimable arrows.
- **Revival Bubbles**: When a knight falls in battle, they float into an ethereal rescue bubble. Living allies (or companion bots) can touch the bubble to pop it and restore their fallen comrade with 1 HP.
- **Hit Feedback**: Visual floating damage hearts, screen trauma shake, invulnerability frames, and distinct audio impact cues.

---

## 🗺️ Roguelike Progression (5-Stage Run)

Each run spans **5 procedurally generated stages**. To open the gate to the next stage, the knights must explore the dungeon and collect all **12 Ancient Coins**. At the exit portal, players choose their next destination from randomly offered biomes:

```
[Stage 1: Easy Biome] 
       ↓
[Stage 2: Easy or Medium Biome] 
       ↓
[Stage 3: Medium or Hard Biome] 
       ↓
[Stage 4: Hard Biome] ── (Must find the Golden Coin of Sandwich)
       ↓
[Stage 5: The Golden Vault] ── (Ancient Vending Machine dispenses The Golden Sandwich)
```

- **Relics & Chests**: Open treasure chests throughout each biome to acquire passive roguelike perks (increased movement speed, bonus attack power, quiver expansions, health boosts, and magnet coins).
- **The Golden Coin of Sandwich**: Hidden in Stage 4; required to power the ancient vending machine in Stage 5.
- **The Golden Sandwich**: In Stage 5, the machine drops the sandwich! The knights must escort and carry the sandwich to the extraction gate to claim victory.

---

## 🌿 The 12 Biomes

The world features 12 procedurally generated biomes across three difficulty tiers, each with bespoke atmospheric lighting, particle weather systems, custom platforms, and background parallax:

### 🟢 Easy Biomes (Tier 1)
- **Crypt of the Forgotten**: Ancient mossy flagstones, flickering torch sconces, and floating dust motes.
- **Verdant Meadow**: Sunny forest grottos, overgrown flowerbeds, floating pollen spores, and gentle platforms.
- **Sunken Grotto**: Luminescent blue sea caves, rising air bubbles, and teal algae ledges.
- **Whispering Woods**: Ancient autumnal groves, drifting amber leaves, and soft earthen tree roots.

### 🟡 Medium Biomes (Tier 2)
- **Clockwork Foundry**: Industrial brass gears, steam vents, conveyor belts, and iron grating.
- **Fungal Cavern**: Bioluminescent violet mushrooms, glowing spores, and bouncing toadstool caps.
- **Overgrown Bastion**: Crumbled castle ramparts overrun by thorny vines, crumbling brickwork, and ivy.
- **Cursed Marsh**: Murky swamp waters, poison-mist particles, and unstable bog foundations.

### 🔴 Hard Biomes (Tier 3)
- **Molten Forge**: Blazing lava pools, raining magma embers, volcanic basalt rock, and extreme heat.
- **Abyssal Core**: Void-touched obsidian spires, purple rifts, hovering abyss particles, and chasm leaps.
- **Glacial Spire**: Slippery ice sheets, biting snowfall blizzards, and sheer frozen stalactites.
- **Dread Citadel**: Gothic black marble architecture, blood-red moonlit arches, and swinging pendulum traps.

---

## 👹 Bestiary & Bosses

### Standard Foes
- **Grunt**: Ground patrol brawler equipped with a rusty broadsword.
- **Archer**: Ranged marksman that tracks knight positions and fires parabolic arrows from elevated perches.
- **Floater**: Hovering ethereal squid that bobs through the air and charges when knights draw near.

### Specialized Medium & Hard Foes
- **Vanguard** *(Medium+)*: Heavy tower-shield knight. **Blocks all frontal sword slashes, arrows, and boomerang strikes**. Knights must flank from behind or down-thrust from above. Unleashes a heavy shield bash lunge.
- **Pyromancer** *(Medium+)*: Arcane fire cultist wielding a magma staff. Lobs arcing **Firebombs** that detonate on impact. Emergency-teleports away in a cloud of brimstone when rushed in close quarters.
- **Berserker** *(Hard)*: Dual-cleaver executioner that charges at high speed and unleashes a lethal 360° whirlwind strike. Upon reaching $\le 2$ HP, triggers **Blood Rage** ($+35\%$ speed and glowing red rage trails).
- **Wraith** *(Hard)*: Ghostly phantom that phases through solid terrain and platform walls. Fires homing **Void Skulls** that seek out knights (skulls can be parried and destroyed with any sword slash).

### The Secret Ancient One: Lord Crustifer
- Awakening deep in the Abyss if the true path is taken, **Lord Crustifer** is a colossal multi-phase boss capable of raining down abyssal fire, summoning minions, and crushing knights who dare disturb the deepest sanctuary.

---

## ⚙️ Traps & Environmental Hazards

- **Floor Spikes**: Lethal spikes anchored strictly to solid platform surfaces (no floating spikes).
- **Boiling Lava Pits**: Instantly damages and knocks knights skyward with burning embers.
- **Rhythmic Fire Vents** *(Medium & Hard)*: Floor grates cycling through Dormant $\rightarrow$ Warning (sputtering smoke and sparks for 0.55s) $\rightarrow$ Active (roaring 85px fire column for 1.25s).
- **Swinging Pendulum Blades** *(Hard)*: Heavy iron guillotine blades sweeping back and forth across chasm gaps.
- **Crumbling Platforms** *(Medium & Hard)*: Platforms that tremble with red stress fractures upon contact before crumbling into dust (reforming after 3.5 seconds).
- **Conveyor Belts**: Mechanical conveyor ledges that accelerate movement with or against the player.

---

## 🏆 Endings & Secrets

### 1. Standard Victory
- Reach Stage 5, insert the sandwich coin, retrieve the Golden Sandwich, and extract through the portal.
- Unlocks persistent lifetime records, best run time tracking, and unseals the secret True Ending pathway.

### 2. Secret True Ending
- **Hidden from First-Time Players**: The title screen does not spoil the secret ending until after you have beaten the game once.
- **The Awakening**: After your first victory, the title screen displays `⚡ SECRET TRUE ENDING OPENED`.
- **The Holy Golden Condiment**: In Stages 3 or 4 of future runs, search for the hidden pedestal chamber housing the sacred condiment.
- **The Encounter**: If all 4 knights survive to the end or present the Holy Condiment at the Golden Vault altar, the gates to the abyss unlock and **Lord Crustifer** awakens.
- **Reward**: Defeating Lord Crustifer unlocks the **Golden Knight Skins** and the true victory epilogue.

---

## 🤖 Companion Bot AI

When playing with fewer than 4 human players, intelligent companion bots can fill empty slots:
- **Natural Platforming**: Calculates jump arcs, variable jump heights, and double-jumps with human-like pacing (no erratic bouncing).
- **Combat Assistance**: Engages enemies with sword slashes and bow shots, flanks behind Vanguard shields, and stays near teammates.
- **Hazard Awareness**: Detects warning embers on Fire Vents and immediately steers/leaps clear before ignition.
- **Active Medic**: Prioritizes reaching and popping revival bubbles whenever an ally knight is downed.

---

## 🎮 Controls

The game supports full keyboard/mouse navigation and up to 4 simultaneous gamepads (Xbox, PlayStation, Switch Pro, generic USB) with haptic rumble feedback and automatic button glyph detection.

### Keyboard & Mouse (Player 1 Default)
| Action | Key |
| :--- | :--- |
| **Move Left / Right** | `A` / `D` or `Left` / `Right` |
| **Crouch / Drop Down / Aim Down** | `S` or `Down` |
| **Look Up / Aim Up** | `W` or `Up` |
| **Jump / Double Jump** | `Space` |
| **Melee Attack (Sword)** | `F` or `Left Click` |
| **Ranged Attack (Bow)** | `G` or `Right Click` |
| **Signature Ability** | `E` |
| **Air Dash / Slide** | `Left Shift` |
| **Pause / Menu** | `Escape` |

### Gamepad (Players 1–4)
| Action | Xbox | PlayStation | Switch |
| :--- | :--- | :--- | :--- |
| **Movement** | Left Stick / D-Pad | Left Stick / D-Pad | Left Stick / D-Pad |
| **Jump** | `A` | `✕` | `B` |
| **Melee Attack** | `X` | `◻` | `Y` |
| **Ranged Attack** | `B` | `◯` | `A` |
| **Signature Ability** | `Y` | `△` | `X` |
| **Air Dash / Slide** | `Right Trigger` / `RB` | `R2` / `R1` | `ZR` / `R` |
| **Pause / Menu** | `Start` | `Options` | `+` |

*Gamepad menus can be navigated entirely using the D-Pad or Left Stick with `A` (Submit) and `B` (Back).*

---

## 🛠️ Development & Building

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- `npm`

### Installation
```bash
git clone https://github.com/your-username/sir-tectus.git
cd sir-tectus
npm install
```

### Run Locally (Dev Server)
```bash
npm run dev
```
Open your browser at `http://localhost:5173/`.

### Production Build
```bash
npm run build
```
Compiles TypeScript and bundles production assets via Vite into `/dist`.

### Electron Desktop Launcher
To run as a desktop application:
```bash
npx electron .
```

---

## 📁 Project Architecture

```
sir-tectus/
├── index.html                   # HTML entry point with retro canvas UI styling
├── package.json                 # Project dependencies and build scripts
├── tsconfig.json                # TypeScript compiler configuration
├── vite.config.ts               # Vite configuration
├── electron/
│   ├── main.cjs                 # Electron window and hardware controller lifecycle
│   └── preload.cjs              # Electron security bridge
├── scratch/                     # Automated test suites & dungeon reachability simulations
│   ├── test_difficulty_overhaul.ts
│   ├── test_bot_jumping.ts
│   └── reachability_test.cjs
└── src/
    ├── main.ts                  # Application entry point
    ├── style.css                # Global CSS tokens, fonts, and dark-fantasy UI theme
    ├── core/
    │   ├── Game.ts              # Master game coordinator, state machine & stage flow
    │   ├── GameLoop.ts          # Fixed-timestep physics (60Hz) with delta rendering
    │   ├── Camera.ts            # Smooth follow camera with trauma-based screen shake
    │   ├── InputManager.ts      # Keyboard, mouse, and 4-slot gamepad polling
    │   ├── SoundEngine.ts       # Procedural sound effects via Web Audio API
    │   ├── ParticleSystem.ts    # Weather, embers, blood, dust, and magic particles
    │   └── SaveManager.ts       # LocalStorage persistence for victories and unlocks
    ├── entities/
    │   ├── Player.ts            # Base Knight physics, state machine, and bot AI logic
    │   ├── knights/             # Concrete knight classes with unique abilities
    │   │   ├── SirTectus.ts
    │   │   ├── SirBareti.ts
    │   │   ├── SirFluctus.ts
    │   │   └── SirMorgani.ts
    │   ├── Enemy.ts             # AI state machine, behaviors, and enemy variants
    │   ├── Boss.ts              # Multi-phase boss mechanics (Lord Crustifer)
    │   ├── Projectile.ts        # Arrows, boomerangs, firebombs, and homing skulls
    │   ├── Coin.ts              # Coins, sandwich coins, and holy condiments
    │   └── GoldenSandwich.ts    # The Golden Sandwich item physics and extraction
    ├── roguelike/
    │   ├── RunManager.ts        # Stage counter, biome progression, and ending rules
    │   └── RelicRegistry.ts     # Roguelike perk definitions and item pool
    ├── ui/
    │   ├── UIManager.ts         # Lobby, title screen, biome picker, victory screens
    │   ├── HUD.ts               # In-game health hearts, coin counters, and timer
    │   └── GamepadNavigator.ts  # Gamepad-first UI menu focus navigation
    └── world/
        ├── BiomeTypes.ts        # Biome configurations, color palettes, and tile themes
        ├── BiomeRegistry.ts     # The 12 biome definitions across Easy/Medium/Hard
        ├── DungeonGenerator.ts  # Procedural level generator with reachability validation
        └── WorldRenderer.ts     # Canvas 2D background, lighting, and tile rendering
```

---

## 📜 License

Created with ❤️ for **Sir Tectus and the Golden Sandwich**. All rights reserved.
