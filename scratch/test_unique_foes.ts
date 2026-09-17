import { BIOMES } from '../src/world/BiomeRegistry';
import { DungeonGenerator } from '../src/world/DungeonGenerator';
import { Enemy, EnemyType } from '../src/entities/Enemy';
import { Projectile } from '../src/entities/Projectile';
import { Platform } from '../src/world/BiomeTypes';

console.log('=== TEST SUITE: 12 UNIQUE BIOME FOES ===\n');

// 1. Verify every biome has a uniqueEnemy configured
const biomeKeys = Object.keys(BIOMES).filter(k => k !== 'golden-sandwich-sanctuary');
console.log(`Verifying 12 Biomes Configuration (Total: ${biomeKeys.length})...`);
let missingUniqueCount = 0;
const uniqueEnemiesFound = new Set<string>();

biomeKeys.forEach(k => {
  const b = BIOMES[k];
  if (!b.uniqueEnemy) {
    console.error(`FAIL: Biome ${k} does not have a uniqueEnemy assigned!`);
    missingUniqueCount++;
  } else {
    uniqueEnemiesFound.add(b.uniqueEnemy);
  }
});

console.log(`Found ${uniqueEnemiesFound.size} unique foes across 12 biomes.`);
if (missingUniqueCount > 0 || uniqueEnemiesFound.size !== 12) {
  throw new Error(`Expected 12 unique foes, found ${uniqueEnemiesFound.size}`);
}
console.log('PASS: All 12 biomes have distinct unique enemies assigned.\n');

// 2. Generate 30 dungeons for each of the 12 biomes (360 total) and verify spawn presence
console.log('Testing Dungeon Generation Spawning across 360 runs (30 per biome)...');
biomeKeys.forEach(k => {
  const b = BIOMES[k];
  let spawnSuccessCount = 0;
  let totalUniqueEnemiesSpawned = 0;

  for (let i = 0; i < 30; i++) {
    const level = DungeonGenerator.generate(b, 2, false);
    const hasUnique = level.enemySpawns.some(e => e.type === b.uniqueEnemy);
    if (hasUnique) spawnSuccessCount++;
    totalUniqueEnemiesSpawned += level.enemySpawns.filter(e => e.type === b.uniqueEnemy).length;
  }

  console.log(`  [${b.name}] (${b.tier}) -> Unique Foe: "${b.uniqueEnemy}" present in ${spawnSuccessCount}/30 runs (${totalUniqueEnemiesSpawned} total spawned)`);
  if (spawnSuccessCount < 28) {
    throw new Error(`Spawn rate too low for ${b.name} (${spawnSuccessCount}/30)`);
  }
});
console.log('PASS: High-frequency spawn guarantee verified across all 12 biomes.\n');

// 3. Test physics, combat, and mechanics for all 12 enemy types
console.log('Testing Simulation, Attacks, and Physics for all 12 Unique Foes...');
const testPlatforms: Platform[] = [
  { x: 0, y: 300, w: 600, h: 20, oneWay: false }
];
const testPlayers = [
  { x: 250, y: 300, isAlive: true, isInBubble: false }
];

const uniqueFoeTypes: EnemyType[] = [
  'spore_shroom',
  'royal_guard',
  'tide_lurker',
  'crystal_crawler',
  'steam_automaton',
  'magma_brute',
  'frost_yeti',
  'drowned_revenant',
  'aether_valkyrie',
  'void_weaver',
  'infernal_demon',
  'death_knight'
];

uniqueFoeTypes.forEach(foeType => {
  const enemy = new Enemy(200, 290, foeType);
  const projectiles: Projectile[] = [];

  // Run 10 seconds of simulated gameplay
  const dt = 0.016;
  for (let step = 0; step < 600; step++) {
    enemy.update(dt, testPlatforms, testPlayers, projectiles);
  }

  console.log(`  - ${foeType}: HP ${enemy.health}/${enemy.maxHealth}, Projectiles Spawned: ${projectiles.length}, Hitbox: ${enemy.getMeleeHitbox() ? 'Active' : 'None/Idle'}`);

  // Test damage & knockback resistance
  const initialX = enemy.x;
  enemy.takeDamage(1, 100, -100);
  const movedX = Math.abs(enemy.x - initialX);

  if (foeType === 'crystal_crawler' || foeType === 'death_knight') {
    if (Math.abs(enemy.vx) > 55) {
      throw new Error(`Expected knockback resistance on ${foeType}, got vx=${enemy.vx}`);
    }
  }

  // Test slaying
  const killed = enemy.takeDamage(10, 0, 0);
  if (!killed || !enemy.isDying) {
    throw new Error(`Failed to slay ${foeType}`);
  }
});

console.log('\nPASS: All 12 unique enemy types simulated and verified successfully.');
console.log('>>> ALL 12 BIOME FOES TESTS PASSED! <<<\n');
