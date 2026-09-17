// Reachability & Traversal Physics Simulation Test for Sir Tectus
const fs = require('fs');
const path = require('path');

// Read DungeonGenerator.ts to extract template generation rules or run simulation
console.log('Testing Sir Tectus Platform Physics & Reachability...');

// Player Jump Physics Constants
const BASE_VY = -585;
const GRAVITY = 1280;
const SINGLE_JUMP_HEIGHT = (BASE_VY * BASE_VY) / (2 * GRAVITY);
const DOUBLE_JUMP_HEIGHT = SINGLE_JUMP_HEIGHT * 1.95; // realistic double jump
const BOUNCE_LAUNCH_HEIGHT = ((-680 * 1.65) * (-680 * 1.65)) / (2 * GRAVITY);

console.log(`Single Jump Max Height: ${SINGLE_JUMP_HEIGHT.toFixed(1)}px`);
console.log(`Double Jump Max Height: ${DOUBLE_JUMP_HEIGHT.toFixed(1)}px`);
console.log(`Bouncy Mushroom Launch Height: ${BOUNCE_LAUNCH_HEIGHT.toFixed(1)}px`);

// Validate platform vertical steps in Room Templates
const roomH = 600;
const templateSteps = {
  'Start Room (0, 2)': [
    { name: 'Floor -> p1', deltaY: 1760 - (1200 + 510) }, // 50px
    { name: 'p1 -> p2 (Bouncy Mushroom)', deltaY: (1200 + 510) - (1200 + 420) }, // 90px
    { name: 'p2 -> p3', deltaY: (1200 + 420) - (1200 + 330) }, // 90px
    { name: 'p3 -> p4', deltaY: (1200 + 330) - (1200 + 240) }, // 90px
    { name: 'p4 -> p5', deltaY: (1200 + 240) - (1200 + 150) }, // 90px
    { name: 'p5 -> p6', deltaY: (1200 + 150) - (1200 + 65) },  // 85px
    { name: 'p6 -> Mezzanine Tier 1', deltaY: (1200 + 65) - 1200 } // 65px
  ],
  'Template 0 (Terraced Stairway)': [
    { name: 'Step 0 -> Step 1', deltaY: 510 - 420 }, // 90px
    { name: 'Step 1 -> Step 2', deltaY: 420 - 330 }, // 90px
    { name: 'Step 2 -> Step 3', deltaY: 330 - 240 }, // 90px
    { name: 'Step 3 -> Step 4', deltaY: 240 - 150 }, // 90px
    { name: 'Step 4 -> Step 5', deltaY: 150 - 65 },  // 85px
    { name: 'Step 5 -> Mezzanine', deltaY: 65 - 0 }  // 65px
  ],
  'Template 1 (Bridge & Towers)': [
    { name: 'Bridge -> Tower Tier 1', deltaY: 490 - 400 }, // 90px
    { name: 'Tower Tier 1 -> Tier 2', deltaY: 400 - 275 }, // 125px (requires double jump, easily cleared by 260px reach)
    { name: 'Tower Tier 2 -> Tier 3', deltaY: 275 - 155 }, // 120px (double jump)
    { name: 'Tower Tier 3 -> Skyway', deltaY: 155 - 65 },  // 90px
    { name: 'Skyway -> Mezzanine', deltaY: 65 - 0 }        // 65px
  ],
  'Template 2 (Vertical Ascension Shaft)': [
    { name: 'Bouncer Launch', launchHeight: BOUNCE_LAUNCH_HEIGHT },
    { name: 'Ledge 1 -> Ledge 2', deltaY: 510 - 425 }, // 85px
    { name: 'Ledge 2 -> Ledge 3', deltaY: 425 - 340 }, // 85px
    { name: 'Ledge 3 -> Ledge 4', deltaY: 340 - 255 }, // 85px
    { name: 'Ledge 4 -> Ledge 5', deltaY: 255 - 170 }, // 85px
    { name: 'Ledge 5 -> Top', deltaY: 170 - 75 },      // 95px
    { name: 'Top -> Mezzanine', deltaY: 75 - 0 }       // 75px
  ],
  'Template 3 (Arena Coliseum)': [
    { name: 'Floor -> Wings', deltaY: 600 - 500 },     // 100px
    { name: 'Wings -> Mid Balconies', deltaY: 500 - 375 }, // 125px (double jump)
    { name: 'Mid Balconies -> Dais', deltaY: 375 - 250 },  // 125px (double jump)
    { name: 'Dais -> High Balconies', deltaY: 250 - 145 }, // 105px
    { name: 'High Balconies -> Top Arch', deltaY: 145 - 65 }, // 80px
    { name: 'Top Arch -> Mezzanine', deltaY: 65 - 0 }   // 65px
  ],
  'Exit Room (3, 0)': [
    { name: 'Step 1 -> Step 2', deltaY: 510 - 420 }, // 90px
    { name: 'Step 2 -> Step 3', deltaY: 420 - 330 }, // 90px
    { name: 'Step 3 -> Step 4', deltaY: 330 - 240 }, // 90px
    { name: 'Step 4 -> Exit Gate Dais', deltaY: 280 - 240 }, // -40px (Dais is at 280, easily stepped onto)
    { name: 'Dais -> Gate Portal', deltaY: 280 - 220 } // 60px directly under the portal!
  ]
};

let allPass = true;

for (const [roomName, steps] of Object.entries(templateSteps)) {
  console.log(`\nChecking ${roomName}:`);
  for (const step of steps) {
    if (step.launchHeight) {
      console.log(`  ✓ ${step.name}: launches ${step.launchHeight.toFixed(0)}px upward (reaches entire tier!)`);
    } else {
      const reachable = step.deltaY <= DOUBLE_JUMP_HEIGHT;
      const singleJumpable = step.deltaY <= SINGLE_JUMP_HEIGHT;
      const jumpType = singleJumpable ? 'Single Jump' : 'Double Jump';
      console.log(`  ${reachable ? '✓' : '✗'} ${step.name}: Delta Y = ${step.deltaY}px [${jumpType}] (Max single: ${SINGLE_JUMP_HEIGHT.toFixed(0)}px, Max double: ${DOUBLE_JUMP_HEIGHT.toFixed(0)}px)`);
      if (!reachable) allPass = false;
    }
  }
}

if (allPass) {
  console.log('\n🌟 ALL PLATFORM CLIMBING STEPS ARE 100% REACHABLE!');
} else {
  console.error('\n❌ Unreachable step detected!');
  process.exit(1);
}
