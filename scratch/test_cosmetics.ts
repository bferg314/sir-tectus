import { ParticleSystem } from '../src/core/ParticleSystem';
import { SirTectus } from '../src/entities/knights/SirTectus';
import { SirBareti } from '../src/entities/knights/SirBareti';
import { SirFluctus } from '../src/entities/knights/SirFluctus';
import { SirMorgani } from '../src/entities/knights/SirMorgani';

console.log('=== VERIFYING COSMETIC DETAILS & POLISH SUITE ===');

// 1. Verify Particle System Emitters
const ps = new ParticleSystem();

ps.emitFootstepDust(100, 200, false);
ps.emitJumpAirRing(100, 200, '#ffd166');
ps.emitHardLandingBurst(100, 200);
ps.emitPogoShockwave(100, 200, '#2ec4b6');
ps.emitHitImpact(100, 200, false, '#ff0054');
ps.emitSunbeamAura(100, 200);

// Enemy shatters
ps.emitEnemyShatter(100, 200, 'steam_automaton');
ps.emitEnemyShatter(100, 200, 'death_knight');
ps.emitEnemyShatter(100, 200, 'frost_yeti');
ps.emitEnemyShatter(100, 200, 'infernal_demon');
ps.emitEnemyShatter(100, 200, 'spore_shroom');

// Update particles for a few frames
ps.update(0.016);
ps.update(0.016);

console.log('Particle System emitters initialized & updated successfully.');

// 2. Verify Knight Classes
const tectus = new SirTectus(0, false);
const bareti = new SirBareti(1, false);
const fluctus = new SirFluctus(2, false);
const morgani = new SirMorgani(3, false);

if (typeof tectus.footstepTimer !== 'number') throw new Error('Expected footstepTimer on SirTectus');
if (tectus.capeTrimColor !== '#ffd166') throw new Error('Expected golden cape trim for Sir Tectus');
if (bareti.capeTrimColor !== '#ffea00') throw new Error('Expected amber cape trim for Sir Bareti');
if (fluctus.capeTrimColor !== '#4cc9f0') throw new Error('Expected aquamarine cape trim for Sir Fluctus');
if (morgani.capeTrimColor !== '#e2e8f0') throw new Error('Expected silver cape trim for Sir Morgani');

console.log('PASS: All 4 knights configured with bespoke colors, heraldic trim, and locomotion timers.');
console.log('>>> ALL COSMETIC OVERHAUL VERIFICATION TESTS PASSED! <<<');
