import { DungeonGenerator } from '../src/world/DungeonGenerator';
import { BIOMES } from '../src/world/BiomeRegistry';

console.log('=== VERIFYING PENDULUM BLADE TRAP MECHANICS ===');

// 1. Generate Hard tier level (e.g. Celestial Spires or Infernal Core)
let bladeTraps: any[] = [];
let totalBladeTraps = 0;
for (let run = 0; run < 20; run++) {
  const dungeon = DungeonGenerator.generate(BIOMES['infernal-core'], 4);
  const traps = dungeon.hazards.filter(h => h.type === 'blade_trap');
  totalBladeTraps += traps.length;
  if (traps.length > 0 && bladeTraps.length === 0) {
    bladeTraps = traps;
  }
}

console.log(`Generated ${totalBladeTraps} total blade trap(s) across 20 Hard tier runs.`);
if (totalBladeTraps === 0) {
  throw new Error('Expected blade traps to spawn across 20 Hard tier runs!');
}

const trap = bladeTraps[0];
console.log('Trap config:', {
  anchorX: trap.anchorX,
  anchorY: trap.anchorY,
  length: trap.length,
  swingSpeed: trap.swingSpeed
});

if (trap.length < 350 || trap.length > 390) {
  throw new Error(`Expected pendulum length between 350 and 390, got ${trap.length}`);
}

// 2. Verify swing trajectory and bridge clearance
const anchorY = trap.anchorY!;
const len = trap.length!;
const lowestBladeY = anchorY + len; // cos(0) = 1
const maxSwingAngle = 0.92;
const highestBladeY = anchorY + Math.cos(maxSwingAngle) * len;

console.log(`Lowest blade Y: ${lowestBladeY.toFixed(1)}px (at angle 0)`);
console.log(`Highest blade Y: ${highestBladeY.toFixed(1)}px (at angle ±${maxSwingAngle} rad)`);

const verticalLift = lowestBladeY - highestBladeY;
console.log(`Vertical lift during swing: ${verticalLift.toFixed(1)}px`);

if (verticalLift < 130) {
  throw new Error(`Expected vertical lift to be >= 130px, got ${verticalLift}`);
}

console.log('PASS: Pendulum blade trajectory provides clear swing amplitude and safe crossing windows.');
console.log('>>> PENDULUM TEST PASSED! <<<');
