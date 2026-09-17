import { BiomeConfig, Platform, HazardZone, InteractiveProp } from './BiomeTypes';
import { EnemyType } from '../entities/Enemy';

export interface DungeonLevel {
  biome: BiomeConfig;
  width: number;
  height: number;
  spawnPoint: { x: number; y: number };
  exitPoint: { x: number; y: number };
  platforms: Platform[];
  hazards: HazardZone[];
  props: InteractiveProp[];
  coinSpawns: { x: number; y: number }[];
  sandwichCoinSpawn?: { x: number; y: number };
  condimentSpawn?: { x: number; y: number };
  vendingMachinePos?: { x: number; y: number };
  extractionAltarPos?: { x: number; y: number };
  enemySpawns: { x: number; y: number; type: EnemyType }[];
}

export class DungeonGenerator {
  public static generate(
    biome: BiomeConfig,
    stageNumber: number,
    allowTrueEndingSecrets: boolean = false
  ): DungeonLevel {
    // Map dimensions: 4 rooms wide, 3 rooms tall (Room size = 800 x 600)
    const roomW = 800;
    const roomH = 600;
    const cols = 4;
    const rows = 3;
    const width = cols * roomW;
    const height = rows * roomH;

    const platforms: Platform[] = [];
    const hazards: HazardZone[] = [];
    const props: InteractiveProp[] = [];
    const coinSpawns: { x: number; y: number }[] = [];
    const enemySpawns: { x: number; y: number; type: 'grunt' | 'archer' | 'floater' }[] = [];

    // Outer level boundaries (Solid walls & ceiling/floor)
    platforms.push({ x: 0, y: height - 40, w: width, h: 60, color: biome.platformColor, borderColor: biome.platformBorder, material: biome.material });
    platforms.push({ x: 0, y: -20, w: width, h: 40, color: biome.platformColor, borderColor: biome.platformBorder, material: biome.material });
    platforms.push({ x: -20, y: 0, w: 40, h: height, color: biome.platformColor, borderColor: biome.platformBorder, material: biome.material });
    platforms.push({ x: width - 20, y: 0, w: 40, h: height, color: biome.platformColor, borderColor: biome.platformBorder, material: biome.material });

    // Spawn Point: Room (0, 2) [Bottom-Left]
    const spawnPoint = { x: 160, y: height - 120 };

    // Exit Point: Room (3, 0) [Top-Right] on dedicated Royal Dais for normal maps
    const exitPoint = { x: width - 210, y: 220 };

    let sandwichCoinSpawn: { x: number; y: number } | undefined;
    let condimentSpawn: { x: number; y: number } | undefined;
    let vendingMachinePos: { x: number; y: number } | undefined;
    let extractionAltarPos: { x: number; y: number } | undefined;

    // Special logic for Map 5 (The Golden Sandwich Sanctuary)
    if (stageNumber === 5) {
      vendingMachinePos = { x: 300, y: height - 140 };
      extractionAltarPos = { x: width - 280, y: height - 140 };
      exitPoint.x = width - 280;
      exitPoint.y = height - 140;

      props.push({
        id: 'vending-machine-1',
        type: 'vending_machine',
        x: vendingMachinePos.x,
        y: vendingMachinePos.y - 70,
        w: 80,
        h: 110,
        lightColor: '#ffbe0b',
        lightRadius: 120
      });

      props.push({
        id: 'golden-altar-1',
        type: 'golden_altar',
        x: extractionAltarPos.x,
        y: extractionAltarPos.y - 40,
        w: 120,
        h: 70,
        lightColor: '#ffd166',
        lightRadius: 150
      });
    }

    // Inter-Tier Mezzanine Floors (Tier dividers at y = 1200 and y = 600)
    // Provides solid footholds with wide climbing shafts connecting room rows
    for (let c = 0; c < cols; c++) {
      const rx = c * roomW;

      // Tier Divider between Row 2 & Row 1 (y = 1200)
      platforms.push({
        x: rx + 40,
        y: 1200,
        w: 260,
        h: 22,
        oneWay: true,
        color: biome.platformColor,
        borderColor: biome.platformBorder,
        material: biome.material
      });
      platforms.push({
        x: rx + 500,
        y: 1200,
        w: 260,
        h: 22,
        oneWay: true,
        color: biome.platformColor,
        borderColor: biome.platformBorder,
        material: biome.material
      });

      // Tier Divider between Row 1 & Row 0 (y = 600)
      platforms.push({
        x: rx + 40,
        y: 600,
        w: 260,
        h: 22,
        oneWay: true,
        color: biome.platformColor,
        borderColor: biome.platformBorder,
        material: biome.material
      });
      platforms.push({
        x: rx + 500,
        y: 600,
        w: 260,
        h: 22,
        oneWay: true,
        color: biome.platformColor,
        borderColor: biome.platformBorder,
        material: biome.material
      });
    }

    // Procedural Room Layout across 4x3 grid
    for (let c = 0; c < cols; c++) {
      for (let r = 0; r < rows; r++) {
        const rx = c * roomW;
        const ry = r * roomH;

        // Start room: Room (0, 2) [Bottom-Left]
        const isStartRoom = c === 0 && r === 2;
        // Exit room: Room (3, 0) [Top-Right], or Room (3, 2) on Map 5
        const isExitRoom = (c === 3 && r === 0) || (stageNumber === 5 && c === 3 && r === 2);

        // Generate interior room platforms with full vertical coverage
        this.generateRoomInterior(
          rx, ry, roomW, roomH, biome, isStartRoom, isExitRoom, stageNumber,
          platforms, hazards, props, coinSpawns, enemySpawns
        );
      }
    }

    // Ensure exactly 12 coins for Maps 1-4
    if (stageNumber < 5) {
      while (coinSpawns.length < 12) {
        // Pick valid platforms across all tiers
        const targetPlat = platforms[Math.floor(Math.random() * (platforms.length - 8)) + 8];
        if (targetPlat && targetPlat.w > 80 && !targetPlat.hazard) {
          coinSpawns.push({
            x: targetPlat.x + targetPlat.w * 0.5,
            y: targetPlat.y - 30
          });
        }
      }
      // Trim to exactly 12
      coinSpawns.splice(12);

      // Add the Golden Exit Gate Prop on top of the exit dais
      props.push({
        id: 'golden-gate-exit',
        type: 'gate',
        x: exitPoint.x,
        y: exitPoint.y - 60,
        w: 80,
        h: 120,
        lightColor: '#ffd166',
        lightRadius: 140,
        active: false // Unlocks when 12 coins collected
      });
    } else {
      // Map 5 has 0 regular coins required, it's the Golden Sandwich run!
      coinSpawns.length = 0;
    }

    // Map 4 Special Feature: The Coin of Sandwich
    if (stageNumber === 4) {
      sandwichCoinSpawn = { x: width * 0.5, y: 180 };
      props.push({
        id: 'sandwich-coin-pedestal',
        type: 'crystal',
        x: sandwichCoinSpawn.x,
        y: sandwichCoinSpawn.y + 35,
        lightColor: '#ffbe0b',
        lightRadius: 130
      });
    }

    // True Ending Secret Feature: Holy Golden Condiment Chamber
    if (allowTrueEndingSecrets && (stageNumber === 3 || stageNumber === 4)) {
      condimentSpawn = { x: 340, y: 160 };
      props.push({
        id: 'condiment-pedestal',
        type: 'crystal',
        x: condimentSpawn.x,
        y: condimentSpawn.y + 30,
        lightColor: '#ffd166',
        lightRadius: 110
      });
    }

    // Safety verification: Ensure 100% of hazards have a solid platform directly beneath them
    for (const h of hazards) {
      const hasDirectSupport = platforms.some(p =>
        p.x <= h.x + 8 && (p.x + p.w) >= (h.x + h.w - 8) &&
        Math.abs(p.y - (h.y + h.h)) <= 6
      );
      if (!hasDirectSupport) {
        platforms.push({
          x: h.x - 16,
          y: h.y + h.h,
          w: h.w + 32,
          h: 26,
          oneWay: false,
          color: biome.platformColor,
          borderColor: biome.platformBorder,
          material: biome.material
        });
      }
    }

    return {
      biome,
      width,
      height,
      spawnPoint,
      exitPoint,
      platforms,
      hazards,
      props,
      coinSpawns,
      sandwichCoinSpawn,
      condimentSpawn,
      vendingMachinePos,
      extractionAltarPos,
      enemySpawns
    };
  }

  private static generateRoomInterior(
    rx: number, ry: number, rw: number, rh: number,
    biome: BiomeConfig,
    isStart: boolean, isExit: boolean, stageNumber: number,
    platforms: Platform[],
    hazards: HazardZone[],
    props: InteractiveProp[],
    coinSpawns: { x: number; y: number }[],
    enemySpawns: { x: number; y: number; type: EnemyType }[]
  ): void {
    const tier = biome.tier; // 'easy' | 'medium' | 'hard'

    // Biome-specific traits
    const isIce = biome.material === 'ice';
    const isTech = biome.material === 'tech';
    const isForest = biome.ambientParticle === 'leaves';
    const isWater = biome.ambientParticle === 'bubbles';
    const isMolten = biome.ambientParticle === 'embers';

    // Tier-based platform sizing multipliers
    // Easy: 240-280px wide; Medium: 160-220px; Hard: 110-165px
    const widthScale = tier === 'hard' ? 0.62 : (tier === 'medium' ? 0.82 : 1.0);
    const scaleW = (baseW: number) => Math.max(110, Math.round(baseW * widthScale));

    // Dynamic enemy selector based on tier
    const pickEnemy = (preferRanged: boolean = false): EnemyType => {
      if (tier === 'hard') {
        const r = Math.random();
        if (r < 0.35) return 'berserker';
        if (r < 0.60) return 'wraith';
        if (r < 0.80) return 'pyromancer';
        return 'vanguard';
      } else if (tier === 'medium') {
        const r = Math.random();
        if (r < 0.35) return 'vanguard';
        if (r < 0.65) return 'pyromancer';
        if (r < 0.85) return 'archer';
        return 'grunt';
      } else {
        const r = Math.random();
        if (preferRanged) return r < 0.7 ? 'archer' : 'grunt';
        return r < 0.65 ? 'grunt' : (r < 0.85 ? 'archer' : 'floater');
      }
    };

    // Helper for crumbling platform assignment
    const shouldCrumble = (prob: number) => {
      if (tier === 'hard') return Math.random() < prob * 1.5;
      if (tier === 'medium') return Math.random() < prob;
      return false; // No crumbling platforms in Easy
    };

    // 1. START ROOM GUARANTEE (Room 0, 2)
    if (isStart) {
      // Clear, inviting ascending staircase starting right by the spawn point
      const p1: Platform = { x: rx + 60, y: ry + 510, w: 260, h: 22, oneWay: true, color: biome.platformColor, borderColor: biome.platformBorder, material: biome.material };
      const p2: Platform = { x: rx + 280, y: ry + 420, w: 260, h: 22, oneWay: true, bouncy: 1.65, color: biome.platformColor, borderColor: biome.platformBorder, material: biome.material };
      const p3: Platform = { x: rx + 500, y: ry + 330, w: 240, h: 22, oneWay: true, color: biome.platformColor, borderColor: biome.platformBorder, material: biome.material };
      const p4: Platform = { x: rx + 280, y: ry + 240, w: 260, h: 22, oneWay: true, color: biome.platformColor, borderColor: biome.platformBorder, material: biome.material };
      const p5: Platform = { x: rx + 60, y: ry + 150, w: 260, h: 22, oneWay: true, color: biome.platformColor, borderColor: biome.platformBorder, material: biome.material };
      const p6: Platform = { x: rx + 280, y: ry + 65, w: 260, h: 22, oneWay: true, color: biome.platformColor, borderColor: biome.platformBorder, material: biome.material };

      platforms.push(p1, p2, p3, p4, p5, p6);

      props.push({
        id: `torch-start-${rx}-${ry}-1`,
        type: 'torch',
        x: rx + 140,
        y: ry + 490,
        lightColor: '#ffd166',
        lightRadius: 100
      });
      props.push({
        id: `torch-start-${rx}-${ry}-2`,
        type: 'torch',
        x: rx + 380,
        y: ry + 220,
        lightColor: '#ffd166',
        lightRadius: 100
      });
      return;
    }

    // 2. EXIT ROOM GUARANTEE (Room 3, 0)
    if (isExit && stageNumber < 5) {
      // Majestic elevated Royal Dais supporting the Golden Exit Gate with inviolable clearance
      const exitDais: Platform = {
        x: rx + rw - 340,
        y: ry + 280,
        w: 260,
        h: 26,
        oneWay: false,
        color: biome.platformColor,
        borderColor: biome.platformBorder,
        material: biome.material
      };
      // Ascending stairs leading cleanly to the dais without cutting into the door frame
      const stair1: Platform = { x: rx + 50, y: ry + 510, w: 260, h: 22, oneWay: true, color: biome.platformColor, borderColor: biome.platformBorder, material: biome.material };
      const stair2: Platform = { x: rx + 260, y: ry + 420, w: 240, h: 22, oneWay: true, color: biome.platformColor, borderColor: biome.platformBorder, material: biome.material };
      const stair3: Platform = { x: rx + 90, y: ry + 330, w: 240, h: 22, oneWay: true, color: biome.platformColor, borderColor: biome.platformBorder, material: biome.material };
      const stair4: Platform = { x: rx + 250, y: ry + 325, w: 190, h: 22, oneWay: true, color: biome.platformColor, borderColor: biome.platformBorder, material: biome.material };
      const topBalcony: Platform = { x: rx + 120, y: ry + 130, w: 220, h: 22, oneWay: true, color: biome.platformColor, borderColor: biome.platformBorder, material: biome.material };
      const ceilingStep: Platform = { x: rx + 200, y: ry + 65, w: 180, h: 22, oneWay: true, color: biome.platformColor, borderColor: biome.platformBorder, material: biome.material };

      platforms.push(exitDais, stair1, stair2, stair3, stair4, topBalcony, ceilingStep);

      // Symmetrical torches flanking the gate on the dais wings
      props.push({
        id: `torch-exit-l`,
        type: 'torch',
        x: exitDais.x + 25,
        y: exitDais.y - 18,
        lightColor: '#ffd166',
        lightRadius: 120
      });
      props.push({
        id: `torch-exit-r`,
        type: 'torch',
        x: exitDais.x + exitDais.w - 25,
        y: exitDais.y - 18,
        lightColor: '#ffd166',
        lightRadius: 120
      });

      coinSpawns.push({ x: stair4.x + stair4.w * 0.5, y: stair4.y - 28 });
      enemySpawns.push({ x: stair2.x + 80, y: stair2.y - 30, type: pickEnemy(true) });
      return;
    }

    // 3. PROCEDURAL ROOM TEMPLATES (0: Terraced Stairway, 1: Chasm Bridge & Towers, 2: Vertical Shaft, 3: Arena Coliseum)
    const template = Math.floor(Math.random() * 4);

    if (template === 0) {
      // Terraced Grand Stairway
      const p1W = scaleW(250);
      const p2W = scaleW(250);
      const p3W = scaleW(250);
      const p4W = scaleW(250);
      const p5W = scaleW(250);
      const p6W = scaleW(260);

      const p1: Platform = { x: rx + 60, y: ry + 510, w: p1W, h: 22, oneWay: true, slippery: isIce, color: biome.platformColor, borderColor: biome.platformBorder, material: biome.material };
      const p2: Platform = { x: rx + 280, y: ry + 420, w: p2W, h: 22, oneWay: true, bouncy: isForest ? 1.6 : undefined, slippery: isIce, color: biome.platformColor, borderColor: biome.platformBorder, material: biome.material };
      const p3: Platform = { x: rx + 500, y: ry + 330, w: p3W, h: 22, oneWay: true, conveyor: isTech ? (Math.random() > 0.5 ? 60 : -60) : undefined, crumble: shouldCrumble(0.35), crumbleTimer: 0.65, slippery: isIce, color: biome.platformColor, borderColor: biome.platformBorder, material: biome.material };
      const p4: Platform = { x: rx + 280, y: ry + 240, w: p4W, h: 22, oneWay: true, slippery: isIce, color: biome.platformColor, borderColor: biome.platformBorder, material: biome.material };
      const p5: Platform = { x: rx + 60, y: ry + 150, w: p5W, h: 22, oneWay: true, crumble: shouldCrumble(0.3), crumbleTimer: 0.65, slippery: isIce, color: biome.platformColor, borderColor: biome.platformBorder, material: biome.material };
      const p6: Platform = { x: rx + 280, y: ry + 65, w: p6W, h: 22, oneWay: true, color: biome.platformColor, borderColor: biome.platformBorder, material: biome.material };

      platforms.push(p1, p2, p3, p4, p5, p6);

      coinSpawns.push({ x: p3.x + p3.w * 0.5, y: p3.y - 28 });
      coinSpawns.push({ x: p6.x + p6.w * 0.5, y: p6.y - 28 });
      enemySpawns.push({ x: p2.x + 60, y: p2.y - 30, type: pickEnemy() });
      if (tier === 'hard') {
        enemySpawns.push({ x: p4.x + 60, y: p4.y - 30, type: pickEnemy(true) });
      }

      props.push({
        id: `torch-${rx}-${ry}`,
        type: isWater || biome.material === 'crystal' ? 'crystal' : 'torch',
        x: rx + 140,
        y: ry + 490,
        lightColor: biome.lightColor,
        lightRadius: 90
      });
    } else if (template === 1) {
      // Chasm Bridge & Twin Watchtowers
      const lowerBridge: Platform = {
        x: rx + 160,
        y: ry + 490,
        w: rw - 320,
        h: 24,
        oneWay: true,
        slippery: isIce,
        color: biome.platformColor,
        borderColor: biome.platformBorder,
        material: biome.material
      };
      // Left Tower
      const tW = scaleW(180);
      const left1: Platform = { x: rx + 50, y: ry + 400, w: tW, h: 22, oneWay: true, color: biome.platformColor, borderColor: biome.platformBorder, material: biome.material };
      const left2: Platform = { x: rx + 50, y: ry + 275, w: tW, h: 22, oneWay: true, crumble: shouldCrumble(0.4), crumbleTimer: 0.65, color: biome.platformColor, borderColor: biome.platformBorder, material: biome.material };
      const left3: Platform = { x: rx + 50, y: ry + 155, w: tW, h: 22, oneWay: true, color: biome.platformColor, borderColor: biome.platformBorder, material: biome.material };
      // Right Tower
      const right1: Platform = { x: rx + rw - tW - 50, y: ry + 400, w: tW, h: 22, oneWay: true, color: biome.platformColor, borderColor: biome.platformBorder, material: biome.material };
      const right2: Platform = { x: rx + rw - tW - 50, y: ry + 275, w: tW, h: 22, oneWay: true, crumble: shouldCrumble(0.4), crumbleTimer: 0.65, color: biome.platformColor, borderColor: biome.platformBorder, material: biome.material };
      const right3: Platform = { x: rx + rw - tW - 50, y: ry + 155, w: tW, h: 22, oneWay: true, color: biome.platformColor, borderColor: biome.platformBorder, material: biome.material };
      // High Skyway
      const skyway: Platform = { x: rx + 200, y: ry + 65, w: 400, h: 24, oneWay: true, color: biome.platformColor, borderColor: biome.platformBorder, material: biome.material };

      platforms.push(lowerBridge, left1, left2, left3, right1, right2, right3, skyway);

      // Dedicated solid foundation bed for hazards
      const hazardW = Math.min(140, rw - 360);
      const hazardX = rx + (rw - hazardW) * 0.5;
      const hazardBedY = ry + rh - 28;

      const hazardBed: Platform = {
        x: hazardX - 16,
        y: hazardBedY,
        w: hazardW + 32,
        h: 28,
        oneWay: false,
        color: biome.platformColor,
        borderColor: biome.platformBorder,
        material: biome.material
      };
      platforms.push(hazardBed);

      if (tier === 'hard') {
        // Hard tier: Swinging pendulum guillotine over the chasm!
        hazards.push({
          x: hazardX,
          y: hazardBedY - 14,
          w: hazardW,
          h: 20,
          damage: 1,
          type: 'blade_trap',
          anchorX: rx + rw * 0.5,
          anchorY: ry + 160,
          length: 220,
          angle: 0,
          swingSpeed: 2.2
        });
      } else if (tier === 'medium') {
        // Medium tier: Timed rhythmic flame vent!
        hazards.push({
          x: hazardX,
          y: hazardBedY - 14,
          w: hazardW,
          h: 14,
          damage: 1,
          type: 'fire_vent',
          state: 'dormant',
          timer: Math.random() * 1.5,
          cycleTime: 3.3,
          flameHeight: 85
        });
      } else {
        // Easy tier: Standard spikes or lava
        hazards.push({
          x: hazardX,
          y: hazardBedY - 14,
          w: hazardW,
          h: 14,
          damage: 1,
          type: isMolten ? 'lava' : 'spikes'
        });
      }

      props.push({
        id: `hazard-warn-${rx}-${ry}`,
        type: 'torch',
        x: hazardX - 25,
        y: hazardBedY - 26,
        lightColor: '#ef476f',
        lightRadius: 80
      });

      coinSpawns.push({ x: skyway.x + skyway.w * 0.5, y: skyway.y - 28 });
      coinSpawns.push({ x: lowerBridge.x + lowerBridge.w * 0.5, y: lowerBridge.y - 28 });
      enemySpawns.push({ x: lowerBridge.x + 80, y: lowerBridge.y - 30, type: pickEnemy() });
      enemySpawns.push({ x: right2.x + 40, y: right2.y - 30, type: pickEnemy(true) });
    } else if (template === 2) {
      // Vertical Ascension Shaft with Bouncy Launchpad & Alternating Ledges
      const bouncer: Platform = {
        x: rx + 290,
        y: ry + 510,
        w: 220,
        h: 24,
        oneWay: true,
        bouncy: 1.65,
        color: biome.platformColor,
        borderColor: biome.platformBorder,
        material: biome.material
      };
      const sW = scaleW(220);
      const s1: Platform = { x: rx + 80, y: ry + 425, w: sW, h: 20, oneWay: true, color: biome.platformColor, borderColor: biome.platformBorder, material: biome.material };
      const s2: Platform = { x: rx + rw - sW - 80, y: ry + 340, w: sW, h: 20, oneWay: true, crumble: shouldCrumble(0.4), crumbleTimer: 0.65, color: biome.platformColor, borderColor: biome.platformBorder, material: biome.material };
      const s3: Platform = { x: rx + 80, y: ry + 255, w: sW, h: 20, oneWay: true, color: biome.platformColor, borderColor: biome.platformBorder, material: biome.material };
      const s4: Platform = { x: rx + rw - sW - 80, y: ry + 170, w: sW, h: 20, oneWay: true, crumble: shouldCrumble(0.4), crumbleTimer: 0.65, color: biome.platformColor, borderColor: biome.platformBorder, material: biome.material };
      const s5: Platform = { x: rx + 270, y: ry + 75, w: 260, h: 22, oneWay: true, bouncy: isForest ? 1.6 : undefined, color: biome.platformColor, borderColor: biome.platformBorder, material: biome.material };

      platforms.push(bouncer, s1, s2, s3, s4, s5);

      // In Hard tier, add a rhythmic fire vent on the side ledge
      if (tier === 'hard') {
        hazards.push({
          x: s1.x + 20,
          y: s1.y - 12,
          w: 50,
          h: 12,
          damage: 1,
          type: 'fire_vent',
          state: 'dormant',
          timer: 1.0,
          cycleTime: 3.0,
          flameHeight: 70
        });
      }

      coinSpawns.push({ x: s5.x + s5.w * 0.5, y: s5.y - 28 });
      coinSpawns.push({ x: s2.x + s2.w * 0.5, y: s2.y - 28 });
      enemySpawns.push({ x: s3.x + 50, y: s3.y - 30, type: pickEnemy() });
      enemySpawns.push({ x: rx + rw * 0.5, y: ry + 140, type: tier === 'hard' ? 'wraith' : (tier === 'medium' ? 'floater' : 'floater') });
    } else {
      // Arena Coliseum & Balcony Halls
      const lowW = scaleW(230);
      const midW = scaleW(210);
      const highW = scaleW(220);

      const lowL: Platform = { x: rx + 60, y: ry + 500, w: lowW, h: 22, oneWay: true, color: biome.platformColor, borderColor: biome.platformBorder, material: biome.material };
      const lowR: Platform = { x: rx + rw - lowW - 60, y: ry + 500, w: lowW, h: 22, oneWay: true, color: biome.platformColor, borderColor: biome.platformBorder, material: biome.material };
      const midL: Platform = { x: rx + 120, y: ry + 375, w: midW, h: 22, oneWay: true, color: biome.platformColor, borderColor: biome.platformBorder, material: biome.material };
      const midR: Platform = { x: rx + rw - midW - 120, y: ry + 375, w: midW, h: 22, oneWay: true, color: biome.platformColor, borderColor: biome.platformBorder, material: biome.material };
      const dais: Platform = { x: rx + 230, y: ry + 250, w: scaleW(340), h: 24, oneWay: true, crumble: shouldCrumble(0.5) || isIce, crumbleTimer: 0.65, color: biome.platformColor, borderColor: biome.platformBorder, material: biome.material };
      const highL: Platform = { x: rx + 80, y: ry + 145, w: highW, h: 22, oneWay: true, color: biome.platformColor, borderColor: biome.platformBorder, material: biome.material };
      const highR: Platform = { x: rx + rw - highW - 80, y: ry + 145, w: highW, h: 22, oneWay: true, color: biome.platformColor, borderColor: biome.platformBorder, material: biome.material };
      const topP: Platform = { x: rx + 270, y: ry + 65, w: 260, h: 22, oneWay: true, color: biome.platformColor, borderColor: biome.platformBorder, material: biome.material };

      platforms.push(lowL, lowR, midL, midR, dais, highL, highR, topP);

      // Traps in Coliseum
      if (tier === 'hard') {
        hazards.push({
          x: dais.x + dais.w * 0.5 - 25,
          y: dais.y - 12,
          w: 50,
          h: 12,
          damage: 1,
          type: 'fire_vent',
          state: 'dormant',
          timer: 0.5,
          cycleTime: 3.2,
          flameHeight: 75
        });
      }

      coinSpawns.push({ x: dais.x + dais.w * 0.5, y: dais.y - 28 });
      coinSpawns.push({ x: topP.x + topP.w * 0.5, y: topP.y - 28 });
      enemySpawns.push({ x: lowR.x + 50, y: lowR.y - 30, type: pickEnemy(true) });
      enemySpawns.push({ x: lowL.x + 50, y: lowL.y - 30, type: pickEnemy() });
      if (tier === 'hard') {
        enemySpawns.push({ x: dais.x + 40, y: dais.y - 30, type: 'berserker' });
      }

      props.push({
        id: `lan-${rx}-${ry}`,
        type: 'lantern',
        x: dais.x + dais.w * 0.5,
        y: dais.y - 20,
        lightColor: biome.lightColor,
        lightRadius: 100
      });
    }
  }
}

