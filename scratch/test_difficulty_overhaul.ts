import { BIOMES } from '../src/world/BiomeRegistry';
import { DungeonGenerator } from '../src/world/DungeonGenerator';
import { Enemy } from '../src/entities/Enemy';
import { Projectile } from '../src/entities/Projectile';

console.log('--- STARTING DIFFICULTY OVERHAUL VALIDATION ---');

// 1. Test Biome Tier Assignment
const easyBiome = BIOMES['verdant-canopy'];
const mediumBiome = BIOMES['clockwork-foundry'];
const hardBiome = BIOMES['infernal-core'];

console.log(`Easy Biome Tier: ${easyBiome.tier}`);
console.log(`Medium Biome Tier: ${mediumBiome.tier}`);
console.log(`Hard Biome Tier: ${hardBiome.tier}`);

if (easyBiome.tier !== 'easy' || mediumBiome.tier !== 'medium' || hardBiome.tier !== 'hard') {
  throw new Error('Biome tiers are incorrectly assigned!');
}

// 2. Test Generation Across 50 Dungeons for Each Tier
const testTier = (biome: any, tierName: string) => {
  let totalEnemyCount = 0;
  const enemyCounts: Record<string, number> = {};
  const hazardCounts: Record<string, number> = {};
  let totalPlatWidth = 0;
  let platCount = 0;
  let crumbleCount = 0;

  for (let i = 0; i < 50; i++) {
    const level = DungeonGenerator.generate(biome, 1);
    
    // Check enemies
    level.enemySpawns.forEach(e => {
      totalEnemyCount++;
      enemyCounts[e.type] = (enemyCounts[e.type] || 0) + 1;
    });

    // Check hazards
    level.hazards.forEach(h => {
      hazardCounts[h.type] = (hazardCounts[h.type] || 0) + 1;
    });

    // Check platforms (ignore outer boundary walls)
    level.platforms.forEach(p => {
      if (p.w < 600 && p.h <= 30) {
        totalPlatWidth += p.w;
        platCount++;
        if (p.crumble) crumbleCount++;
      }
    });

    // Check hazard support
    for (const h of level.hazards) {
      if (h.type === 'spikes' || h.type === 'lava' || h.type === 'fire_vent') {
        const hasDirectSupport = level.platforms.some(p =>
          p.x <= h.x + 8 && (p.x + p.w) >= (h.x + h.w - 8) &&
          Math.abs(p.y - (h.y + h.h)) <= 6
        );
        if (!hasDirectSupport) {
          throw new Error(`Hazard at (${h.x}, ${h.y}) lacks solid platform foundation!`);
        }
      }
    }
  }

  const avgPlatWidth = platCount > 0 ? (totalPlatWidth / platCount).toFixed(1) : '0';
  console.log(`\n[${tierName.toUpperCase()} TIER STATS - 50 RUNS]`);
  console.log(`Avg Platform Width: ${avgPlatWidth}px (Total Checked: ${platCount})`);
  console.log(`Crumble Platforms: ${crumbleCount}`);
  console.log(`Enemies Spawned:`, enemyCounts);
  console.log(`Hazards Spawned:`, hazardCounts);

  return { avgPlatWidth: parseFloat(avgPlatWidth), enemyCounts, hazardCounts, crumbleCount };
};

const easyStats = testTier(easyBiome, 'Easy');
const mediumStats = testTier(mediumBiome, 'Medium');
const hardStats = testTier(hardBiome, 'Hard');

// Verifications
console.log('\n--- VERIFYING DIFFICULTY PROGRESSION ---');

// Platform widths must tighten as difficulty increases
console.log(`Width comparison: Easy (${easyStats.avgPlatWidth}px) > Medium (${mediumStats.avgPlatWidth}px) > Hard (${hardStats.avgPlatWidth}px)`);
if (easyStats.avgPlatWidth <= mediumStats.avgPlatWidth || mediumStats.avgPlatWidth <= hardStats.avgPlatWidth) {
  throw new Error('Platform widths do not properly scale down with difficulty!');
}

// Enemy presence verification
if (easyStats.enemyCounts['berserker'] || easyStats.enemyCounts['wraith']) {
  throw new Error('Hard enemies spawned in Easy tier!');
}
if (!mediumStats.enemyCounts['vanguard'] || !mediumStats.enemyCounts['pyromancer']) {
  throw new Error('Medium tier failed to spawn Vanguard or Pyromancer!');
}
if (!hardStats.enemyCounts['berserker'] || !hardStats.enemyCounts['wraith']) {
  throw new Error('Hard tier failed to spawn Berserker or Wraith!');
}
if (!mediumStats.hazardCounts['fire_vent']) {
  throw new Error('Medium tier failed to spawn fire_vent hazards!');
}
if (!hardStats.hazardCounts['blade_trap']) {
  throw new Error('Hard tier failed to spawn blade_trap hazards!');
}

// 3. Test Vanguard Frontal Shield Block Logic
console.log('\n--- TESTING VANGUARD SHIELD MECHANICS ---');
const vanguard = new Enemy(200, 300, 'vanguard');
vanguard.facingLeft = true; // Faces left (towards x < 200)

// Attack from front (x = 150)
const blockedFront = vanguard.isFrontalShieldBlock(150, false);
console.log(`Vanguard facing left: Frontal hit blocked? ${blockedFront} (Expected: true)`);
if (!blockedFront) throw new Error('Vanguard failed to block frontal hit!');

// Attack from rear (x = 250)
const blockedRear = vanguard.isFrontalShieldBlock(250, false);
console.log(`Vanguard facing left: Rear hit blocked? ${blockedRear} (Expected: false)`);
if (blockedRear) throw new Error('Vanguard blocked rear hit when it should not!');

// Pogo down-thrust from front
const blockedPogo = vanguard.isFrontalShieldBlock(150, true);
console.log(`Vanguard facing left: Pogo down-thrust blocked? ${blockedPogo} (Expected: false)`);
if (blockedPogo) throw new Error('Vanguard blocked down-thrust pogo!');

// 4. Test Berserker Enrage Mechanic
console.log('\n--- TESTING BERSERKER ENRAGE MECHANICS ---');
const berserker = new Enemy(100, 300, 'berserker');
console.log(`Berserker initial HP: ${berserker.health}/${berserker.maxHealth}, Enraged? ${berserker.isEnraged}`);
berserker.takeDamage(4); // Drop to 2 HP
console.log(`Berserker after 4 damage: HP: ${berserker.health}, Enraged? ${berserker.isEnraged} (Expected: true)`);
if (!berserker.isEnraged) throw new Error('Berserker failed to enrage at <= 2 HP!');

// 5. Test Projectile Types
console.log('\n--- TESTING PROJECTILES ---');
const firebomb = new Projectile(100, 100, 100, -100, 'firebomb', -1, 1);
const voidSkull = new Projectile(100, 100, 100, 0, 'void_skull', -1, 1);
console.log(`Firebomb explosion radius: ${firebomb.explosionRadius}`);
console.log(`Void skull destructible: ${voidSkull.isDestructible}`);
if (firebomb.explosionRadius !== 65 || !voidSkull.isDestructible) {
  throw new Error('Projectile properties invalid!');
}

console.log('\n>>> ALL 5 DIFFICULTY OVERHAUL VALIDATION TESTS PASSED SUCCESSFULLY! <<<');
