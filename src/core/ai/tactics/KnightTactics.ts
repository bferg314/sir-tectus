import { Player } from '../../../entities/Player';
import { BotContext } from '../BotTypes';
import { BotSensory } from '../BotSensory';
import { PlayerInputState } from '../../InputManager';
import { SirTectus } from '../../../entities/knights/SirTectus';
import { SirBareti } from '../../../entities/knights/SirBareti';
import { SirFluctus } from '../../../entities/knights/SirFluctus';
import { SirMorgani } from '../../../entities/knights/SirMorgani';

export class KnightTactics {
  /**
   * Dispatches class-specific abilities for the current knight
   */
  public static execute(
    ctx: BotContext,
    input: PlayerInputState,
    targetX: number,
    targetY: number
  ): void {
    const { bot, memory, projectiles, dt } = ctx;

    if (memory.botAbilityCooldown > 0) {
      memory.botAbilityCooldown -= dt;
    }

    // 1. SIR TECTUS: Shield Reflect & Boomerang
    if (bot instanceof SirTectus) {
      const incomingProjectiles = BotSensory.getIncomingProjectiles(bot, projectiles, 95);
      if (incomingProjectiles.length > 0) {
        // Proactively raise Shield Stance to reflect incoming enemy bullets!
        input.ability = true;
        bot.facingLeft = incomingProjectiles[0].x < bot.x;
      } else if (memory.botAbilityCooldown <= 0) {
        // Throw Boomerang against distant enemies or boss
        const hasTarget = ctx.boss?.isAlive || ctx.enemies.some(e =>
          e.isAlive && Math.hypot(e.x - bot.x, e.y - bot.y) >= 75 && Math.hypot(e.x - bot.x, e.y - bot.y) < 220
        );
        if (hasTarget) {
          input.abilityPressed = true;
          memory.botAbilityCooldown = 1.6;
        }
      }
    }

    // 2. SIR BARETI: Pyromancy Fireball & Triple Jump
    else if (bot instanceof SirBareti) {
      // Third Jump for Bareti in air
      if (!bot.isGrounded && bot.jumpsRemaining > 0 && bot.vy > -20 && bot.vy < 150) {
        const dy = targetY - bot.y;
        if (dy < -70 || Math.abs(targetX - bot.x) > 140) {
          input.jump = true;
          input.jumpPressed = true;
          memory.jumpHoldTimer = 0.38;
        }
      }

      // Pyromancy Fireball shot
      if (memory.botAbilityCooldown <= 0) {
        const hasTarget = ctx.boss?.isAlive || ctx.enemies.some(e =>
          e.isAlive && Math.hypot(e.x - bot.x, e.y - bot.y) >= 70 && Math.hypot(e.x - bot.x, e.y - bot.y) < 230
        );
        if (hasTarget) {
          input.abilityPressed = true;
          memory.botAbilityCooldown = 1.1;
        }
      }
    }

    // 3. SIR FLUCTUS: Hydro Air Dash & Water Slide
    else if (bot instanceof SirFluctus) {
      // Hydro Air Dash to cross wide chasms or escape hazardous fire vents
      const dx = targetX - bot.x;
      const isOverHazard = BotSensory.isPointInHazard(bot.x, bot.y, ctx.hazards, 20);
      const isWideChasm = !bot.isGrounded && Math.abs(dx) > 130;

      if ((isWideChasm || isOverHazard) && !bot.isDashing && memory.dashCooldown <= 0) {
        input.dash = true;
        input.dashPressed = true;
        input.moveX = dx > 0 ? 1 : -1;
        memory.dashCooldown = 0.9;
      }

      // Water Slide Surfing into enemy packs
      if (bot.isGrounded && memory.botAbilityCooldown <= 0) {
        const enemyInSlideRange = ctx.enemies.some(e =>
          e.isAlive && Math.abs(e.y - bot.y) < 30 && Math.abs(e.x - bot.x) > 60 && Math.abs(e.x - bot.x) < 140
        );
        if (enemyInSlideRange) {
          input.abilityPressed = true;
          memory.botAbilityCooldown = 1.8;
        }
      }
    }

    // 4. SIR MORGANI: Piercing Sword Throw
    else if (bot instanceof SirMorgani) {
      if (memory.botAbilityCooldown <= 0) {
        const hasTarget = ctx.boss?.isAlive || ctx.enemies.some(e =>
          e.isAlive && Math.hypot(e.x - bot.x, e.y - bot.y) >= 75 && Math.hypot(e.x - bot.x, e.y - bot.y) < 240
        );
        if (hasTarget) {
          input.abilityPressed = true;
          memory.botAbilityCooldown = 1.3;
        }
      }
    }
  }
}
