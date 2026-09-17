import { DungeonGenerator } from '../src/world/DungeonGenerator';
import { BIOMES } from '../src/world/BiomeRegistry';
import { SirTectus } from '../src/entities/knights/SirTectus';
import { SirBareti } from '../src/entities/knights/SirBareti';
import { SirFluctus } from '../src/entities/knights/SirFluctus';
import { SirMorgani } from '../src/entities/knights/SirMorgani';

console.log('================================================================');
console.log('RUNNING AUTOMATED VERIFICATION: WORLD BEAUTY, DOORS & CHARACTERS');
console.log('================================================================\n');

// 1. Test Exit Gate Clearance across all biomes
console.log('TEST 1: Verifying Exit Gate & Dais Clearance across all Biomes...');
const allBiomes = Object.values(BIOMES);

let levelsTested = 0;
let clearancePassed = 0;

for (const biome of allBiomes) {
  for (let stage = 1; stage <= 4; stage++) {
    for (let iter = 0; iter < 5; iter++) {
      levelsTested++;
      const level = DungeonGenerator.generate(biome, stage, false);
      const gate = level.props.find(p => p.type === 'gate');
      if (!gate) {
        throw new Error(`Stage ${stage} in ${biome.name} missing exit gate!`);
      }

      const gateW = gate.w || 80;
      const gateH = gate.h || 120;
      const gateLeft = gate.x - gateW * 0.5;
      const gateRight = gate.x + gateW * 0.5;
      const gateTop = gate.y;
      const gateBottom = gate.y + gateH;

      // Find the supporting exit dais
      const dais = level.platforms.find(p => 
        p.y >= gateBottom - 2 && 
        p.y <= gateBottom + 2 && 
        p.x <= gate.x && 
        p.x + p.w >= gate.x
      );

      if (!dais) {
        throw new Error(`Stage ${stage} in ${biome.name} gate does not have a supporting dais beneath it! Gate bottom: ${gateBottom}`);
      }

      // Check for any overlapping platform inside the door opening volume
      const overlappingPlats = level.platforms.filter(p => {
        if (p === dais) return false; // The dais beneath is the support
        // Check AABB intersection with the door opening volume:
        // [gateLeft, gateRight] x [gateTop + 2, gateBottom - 2]
        const pLeft = p.x;
        const pRight = p.x + p.w;
        const pTop = p.y;
        const pBottom = p.y + p.h;

        const xOverlap = pLeft < gateRight && pRight > gateLeft;
        const yOverlap = pTop < (gateBottom - 2) && pBottom > (gateTop + 2);
        return xOverlap && yOverlap;
      });

      if (overlappingPlats.length > 0) {
        throw new Error(`CRITICAL: Found ${overlappingPlats.length} platforms cutting through the exit door opening in ${biome.name} Stage ${stage}! Platform: ${JSON.stringify(overlappingPlats[0])}`);
      }

      // Check for any hazards inside the clearance zone
      const overlappingHazards = level.hazards.filter(h => {
        const hLeft = h.x;
        const hRight = h.x + h.w;
        const hTop = h.y;
        const hBottom = h.y + h.h;
        return (hLeft < gateRight + 50 && hRight > gateLeft - 50 && hTop < gateBottom + 50 && hBottom > gateTop - 20);
      });

      if (overlappingHazards.length > 0) {
        throw new Error(`Hazard overlaps exit door in ${biome.name} Stage ${stage}!`);
      }

      clearancePassed++;
    }
  }
}

console.log(`✓ Passed ${clearancePassed}/${levelsTested} level generation clearance tests. ZERO platform overlaps detected!\n`);

// 2. Test Character Selection & Subclasses in Player Slot 1
console.log('TEST 2: Verifying Universal Character Selection in Player 1 slot...');

const tectusP1 = new SirTectus(0, false);
console.log(`✓ Sir Tectus: name="${tectusP1.name}", color="${tectusP1.color}", maxJumps=${tectusP1.maxJumps}, trim="${tectusP1.capeTrimColor}"`);
if (tectusP1.name !== 'Sir Tectus' || tectusP1.index !== 0 || tectusP1.color !== '#e63946') {
  throw new Error('Sir Tectus failed slot 1 initialization');
}

const baretiP1 = new SirBareti(0, false);
console.log(`✓ Sir Bareti: name="${baretiP1.name}", color="${baretiP1.color}", maxJumps=${baretiP1.maxJumps}, trim="${baretiP1.capeTrimColor}"`);
if (baretiP1.name !== 'Sir Bareti' || baretiP1.index !== 0 || baretiP1.maxJumps !== 3) {
  throw new Error('Sir Bareti failed slot 1 initialization');
}

const fluctusP1 = new SirFluctus(0, false);
console.log(`✓ Sir Fluctus: name="${fluctusP1.name}", color="${fluctusP1.color}", maxJumps=${fluctusP1.maxJumps}, trim="${fluctusP1.capeTrimColor}"`);
if (fluctusP1.name !== 'Sir Fluctus' || fluctusP1.index !== 0 || fluctusP1.color !== '#2ec4b6') {
  throw new Error('Sir Fluctus failed slot 1 initialization');
}

const morganiP1 = new SirMorgani(0, false);
console.log(`✓ Sir Morgani: name="${morganiP1.name}", color="${morganiP1.color}", maxJumps=${morganiP1.maxJumps}, trim="${morganiP1.capeTrimColor}"`);
if (morganiP1.name !== 'Sir Morgani' || morganiP1.index !== 0 || (morganiP1.color !== '#7209b7' && morganiP1.color !== '#a855f7')) {
  throw new Error('Sir Morgani failed slot 1 initialization');
}

console.log('✓ Universal character selection verified for all 4 Sirs in Player 1 slot.\n');

// 3. Test Cape Physics & Numerical Stability
console.log('TEST 3: Verifying 8-node Verlet Cloth Simulation & numerical stability...');
const testKnights = [tectusP1, baretiP1, fluctusP1, morganiP1];

for (const knight of testKnights) {
  knight.reset(200, 300);
  if (knight.capeNodes.length !== 8) {
    throw new Error(`${knight.name} has ${knight.capeNodes.length} nodes, expected 8!`);
  }

  // Simulate 120 frames with varying movement and dashing
  for (let frame = 0; frame < 120; frame++) {
    knight.vx = Math.sin(frame * 0.1) * 350;
    knight.vy = Math.cos(frame * 0.1) * 400;
    knight.isDashing = (frame > 30 && frame < 50);

    // Call updateBase mock
    knight.updateBase(0.016, {
      left: false, right: false, up: false, down: false,
      jump: false, jumpPressed: false, attack: false, attackPressed: false,
      dash: false, dashPressed: false, bow: false, bowReleased: false,
      ability: false, abilityPressed: false, tossPressed: false,
      pausePressed: false
    }, [], [], [knight], { coins: 0 });

    for (let n = 0; n < knight.capeNodes.length; n++) {
      const node = knight.capeNodes[n];
      if (isNaN(node.x) || isNaN(node.y) || !isFinite(node.x) || !isFinite(node.y)) {
        throw new Error(`NaN or Infinite coordinate in ${knight.name} cape node ${n} at frame ${frame}!`);
      }
    }
  }
}
console.log('✓ Cape Verlet simulation verified: 8 nodes per knight with perfect numerical stability.\n');

console.log('================================================================');
console.log('ALL AUTOMATED TESTS PASSED SUCCESSFULLY! 100% GREEN');
console.log('================================================================');
