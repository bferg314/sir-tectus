import { RunManager } from '../src/roguelike/RunManager';
import { BIOMES } from '../src/world/BiomeRegistry';

console.log('=== VERIFYING SINGLE GOLDEN VAULT PORTAL OPTION ===\n');

const rm = new RunManager();

// Test Stage 1: Should offer 2 choices
rm.currentStage = 1;
const stage1Portals = rm.getBranchingPortalOptions();
console.log('Stage 1 portal options count:', stage1Portals.length, '(Expected: 2)');
if (stage1Portals.length !== 2) throw new Error('Stage 1 must return 2 portal choices');

// Test Stage 2: Should offer 2 choices
rm.currentStage = 2;
const stage2Portals = rm.getBranchingPortalOptions();
console.log('Stage 2 portal options count:', stage2Portals.length, '(Expected: 2)');
if (stage2Portals.length !== 2) throw new Error('Stage 2 must return 2 portal choices');

// Test Stage 3: Should offer 2 choices
rm.currentStage = 3;
const stage3Portals = rm.getBranchingPortalOptions();
console.log('Stage 3 portal options count:', stage3Portals.length, '(Expected: 2)');
if (stage3Portals.length !== 2) throw new Error('Stage 3 must return 2 portal choices');

// Test Stage 4 (Gateway to Final Map 5 - The Golden Vault): Should offer EXACTLY 1 choice
rm.currentStage = 4;
const stage4Portals = rm.getBranchingPortalOptions();
console.log('Stage 4 portal options count:', stage4Portals.length, '(Expected: 1)');
console.log('Stage 4 portal name:', stage4Portals[0].name);
console.log('Stage 4 portal id:', stage4Portals[0].id);

if (stage4Portals.length !== 1) {
  throw new Error(`Expected exactly 1 Golden Vault portal option, but got ${stage4Portals.length}!`);
}

if (stage4Portals[0].id !== 'golden-sandwich-sanctuary') {
  throw new Error(`Expected 'golden-sandwich-sanctuary', but got ${stage4Portals[0].id}`);
}

console.log('\n✓ PASS: Stage 4 branches directly and exclusively to a single Golden Vault!\n');
console.log('=== TEST COMPLETED SUCCESSFULLY ===');
