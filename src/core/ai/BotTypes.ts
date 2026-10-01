import { Player } from '../../entities/Player';
import { Game } from '../Game';
import { DungeonLevel } from '../../world/DungeonGenerator';
import { Platform, HazardZone } from '../../world/BiomeTypes';
import { Enemy } from '../../entities/Enemy';
import { Boss } from '../../entities/Boss';
import { Coin } from '../../entities/Coin';
import { GoldenSandwich } from '../../entities/GoldenSandwich';
import { Projectile } from '../../entities/Projectile';
import { PlayerInputState } from '../InputManager';

export interface BotMemory {
  // Navigation & Jump state
  botStuckTimer: number;
  groundedTimer: number;
  jumpHoldTimer: number;
  jumpCooldown: number;
  doubleJumpDelay: number;
  airTime: number;
  bouncerCooldown: number;
  leaderGroundedY: number;

  // Ledge / Gap awareness
  ledgeWaitTimer: number;
  dropThroughCooldown: number;

  // Combat & Mobility state
  dashCooldown: number;
  botAbilityCooldown: number;
  bowAimTimer: number;
  kitingTimer: number;
  kitingDir: number;

  // Elastic Leash / Catchup
  separationTimer: number;
  lastSafeX: number;
  lastSafeY: number;

  // Multi-strike bubble tracking
  reviveStrikeTimer: number;

  // Current Target State
  currentTargetType: 'bubble' | 'boss' | 'sandwich' | 'coin' | 'enemy' | 'gate' | 'exit' | 'leader';
  targetX: number;
  targetY: number;
}

export interface BotContext {
  bot: Player;
  memory: BotMemory;
  game: Game;
  level: DungeonLevel | null;
  platforms: Platform[];
  hazards: HazardZone[];
  players: Player[];
  enemies: Enemy[];
  projectiles: Projectile[];
  coins: Coin[];
  sandwich: GoldenSandwich | null;
  boss: Boss | null;
  dt: number;
}

export function createDefaultBotInput(): PlayerInputState {
  return {
    moveX: 0,
    moveY: 0,
    jump: false,
    jumpPressed: false,
    attack: false,
    attackPressed: false,
    aimBow: false,
    aimBowPressed: false,
    shootArrow: false,
    ability: false,
    abilityPressed: false,
    dash: false,
    dashPressed: false,
    dropThrough: false,
    pausePressed: false,
    tossPressed: false
  };
}
