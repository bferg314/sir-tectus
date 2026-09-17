import { DungeonGenerator } from '../src/world/DungeonGenerator';
import { BIOMES } from '../src/world/BiomeRegistry';

console.log('Checking all enemy spawns across all biomes and stages...');
const lowYSpawns: any[] = [];

for (const b of Object.values(BIOMES)) {
  for (let stage = 1; stage <= 4; stage++) {
    for (let run = 0; run < 10; run++) {
      const level = DungeonGenerator.generate(b, stage);
      for (const e of level.enemySpawns) {
        if (e.y < 300) {
          lowYSpawns.push({ biome: b.id, stage, type: e.type, x: e.x, y: e.y });
        }
      }
    }
  }
}

console.log(`Found ${lowYSpawns.length} spawns with y < 300.`);
const groundLow = lowYSpawns.filter(s => s.type !== 'floater' && s.type !== 'wraith' && s.type !== 'aether_valkyrie' && s.type !== 'void_weaver');
console.log(`Found ${groundLow.length} ground spawns with y < 300:`);
console.log(groundLow.slice(0, 25));

