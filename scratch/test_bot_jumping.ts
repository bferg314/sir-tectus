// Mock browser environment for Node.js execution
(global as any).window = {
  addEventListener: () => {},
  removeEventListener: () => {},
  location: { search: '' }
};
(global as any).document = {
  getElementById: () => null,
  querySelectorAll: () => [],
  activeElement: null
};
(global as any).localStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {}
};
(global as any).requestAnimationFrame = (cb: any) => setTimeout(cb, 16);
(global as any).cancelAnimationFrame = (id: any) => clearTimeout(id);

import { Game } from '../src/core/Game';
import { SirTectus } from '../src/entities/knights/SirTectus';
import { SirFluctus } from '../src/entities/knights/SirFluctus';

console.log('=== VERIFYING BOT JUMP DIAL-BACK & BOUNCE SUPPRESSION ===\n');

// Mock canvas and 2D context
const mockCtx = {
  clearRect: () => {},
  save: () => {},
  restore: () => {},
  translate: () => {},
  rotate: () => {},
  scale: () => {},
  beginPath: () => {},
  moveTo: () => {},
  lineTo: () => {},
  stroke: () => {},
  fill: () => {},
  arc: () => {},
  ellipse: () => {},
  fillRect: () => {},
  strokeRect: () => {},
  roundRect: () => {},
  fillText: () => {},
  createLinearGradient: () => ({ addColorStop: () => {} })
} as any;

const mockCanvas = {
  getContext: () => mockCtx,
  width: 1280,
  height: 720,
  addEventListener: () => {}
} as any;

const game = new Game(mockCanvas);

// Setup human player (Sir Tectus, index 0) and bot player (Sir Fluctus, index 1, isCpu = true)
const human = new SirTectus(0, false);
const bot = new SirFluctus(1, true);
human.x = 200;
human.y = 400;
human.isGrounded = true;
human.isAlive = true;

bot.x = 300;
bot.y = 400;
bot.isGrounded = true;
bot.isAlive = true;

game.players = [human, bot];

const getBotInput = (game as any).getBotInput.bind(game);

// SCENARIO 1: Human is standing on the same ground and jumps into the air
console.log('--- Test 1: Human jumps up in place on same floor ---');
let botJumpCount = 0;
// 60 ticks of human airborne jump (y moves from 400 up to 250 and back)
for (let i = 0; i < 60; i++) {
  human.isGrounded = false;
  human.y = 400 - Math.sin((i / 60) * Math.PI) * 150; // human jumps up 150px
  const inp = getBotInput(bot);
  if (inp.jumpPressed) {
    botJumpCount++;
  }
}
human.isGrounded = true;
human.y = 400;

console.log(`Bot jumps while human was jumping in place: ${botJumpCount} (Expected: 0)`);
if (botJumpCount !== 0) {
  throw new Error(`Bot mirrored human jump when it should stay grounded! Jump count: ${botJumpCount}`);
}
console.log('✓ PASS: Bot stays calmly grounded and does NOT bounce when player jumps.\n');

// SCENARIO 2: Human is standing on a platform 90px higher (climb needed)
console.log('--- Test 2: Human is on higher platform (dy = -90px) ---');
human.y = 310;
human.isGrounded = true; // Human landed on upper platform
bot.x = 240; // in horizontal climb range (dx = -40)
bot.y = 400;
bot.isGrounded = true;

let totalBotJumps = 0;
let airborneFrames = 0;
let landings = 0;

// Simulate 300 ticks (~5 seconds of game time)
for (let tick = 0; tick < 300; tick++) {
  const inp = getBotInput(bot);
  if (inp.jumpPressed) {
    totalBotJumps++;
  }
  
  // Simulate jump physics response
  if (inp.jumpPressed && bot.isGrounded) {
    bot.isGrounded = false;
    bot.vy = -585;
    airborneFrames = 45; // ~0.72 seconds in air
  } else if (!bot.isGrounded) {
    airborneFrames--;
    if (airborneFrames <= 0) {
      bot.isGrounded = true;
      bot.vy = 0;
      landings++;
    }
  }
}

console.log(`Over 5 seconds with target above:`);
console.log(`- Landings: ${landings}`);
console.log(`- Total jumps triggered: ${totalBotJumps}`);
// Previously: In 5 seconds, bot would jump 8-10 times (bouncing immediately on every landing)
// Now: Bot should jump deliberately with grounded rest pause, between 2 and 4 times max!
if (totalBotJumps > 5) {
  throw new Error(`Bot is still jumping too frequently! Total jumps: ${totalBotJumps}`);
}
console.log('✓ PASS: Bot jumps are well-spaced and dialled back. No rapid pogo-bouncing!\n');

// SCENARIO 3: Double jump behavior check
console.log('--- Test 3: Double jump trigger verification ---');
// When dy is small (-30px), bot should NOT trigger double jump
bot.isGrounded = false;
bot.vy = 50; // near apex
(bot as any).airTime = 0.40;
(bot as any).doubleJumpDelay = 0;
bot.jumpsRemaining = 1;
human.y = 370; // dy = -30px (small ledge)
human.isGrounded = true;

const inpSmallLedge = getBotInput(bot);
console.log(`Double jump on small -30px ledge: ${inpSmallLedge.jumpPressed} (Expected: false)`);
if (inpSmallLedge.jumpPressed) {
  throw new Error('Bot triggered double jump for a minor height difference!');
}

// When dy is deep (-110px high cliff), bot SHOULD trigger double jump
human.y = 290; // dy = -110px
const inpTallCliff = getBotInput(bot);
console.log(`Double jump on tall -110px cliff: ${inpTallCliff.jumpPressed} (Expected: true)`);
if (!inpTallCliff.jumpPressed) {
  throw new Error('Bot failed to trigger double jump for a tall cliff!');
}
console.log('✓ PASS: Double jump is reserved for tall cliffs and does not spam on normal heights.\n');

console.log('=== ALL BOT JUMP DIAL-BACK TESTS PASSED! ===');
