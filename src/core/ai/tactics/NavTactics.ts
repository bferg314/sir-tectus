import { Player } from '../../../entities/Player';
import { BotContext } from '../BotTypes';
import { BotSensory } from '../BotSensory';
import { PlayerInputState } from '../../InputManager';

export class NavTactics {
  /**
   * Applies horizontal steering, cliff/gap sensing, vertical jump arcs, and anti-stuck clambering
   */
  public static execute(
    ctx: BotContext,
    input: PlayerInputState,
    targetX: number,
    targetY: number,
    isEmergency: boolean = false
  ): void {
    const { bot, memory, platforms, hazards, dt } = ctx;
    const dx = targetX - bot.x;
    const dy = targetY - bot.y;
    const distToTarget = Math.abs(dx);

    // 1. Sustained jump button hold for smooth high arcs
    if (memory.jumpHoldTimer > 0) {
      memory.jumpHoldTimer -= dt;
      input.jump = true;
    }

    // 2. Crumbling Platform Evasion
    const crumblingPlat = BotSensory.getCrumblingPlatform(bot, platforms);
    if (crumblingPlat) {
      // Platform is collapsing underfoot! Immediately leap to nearest safe foothold
      const escapeDir = bot.x > (crumblingPlat.x + crumblingPlat.w * 0.5) ? 1 : -1;
      input.moveX = escapeDir;
      if (bot.isGrounded) {
        input.jump = true;
        input.jumpPressed = true;
        memory.jumpHoldTimer = 0.38;
        memory.jumpCooldown = 0.8;
      }
      return;
    }

    // 3. Horizontal Steering
    let dir = 0;
    if (distToTarget > 28) {
      dir = dx > 0 ? 1 : -1;
      if (isEmergency) {
        input.moveX = dir; // Full speed for emergency revive or urgent objective
      } else if (distToTarget > 260) {
        input.moveX = dir * 0.88; // Catching up briskly
      } else if (distToTarget > 90) {
        input.moveX = dir * 0.68; // Standard companion pace
      } else {
        input.moveX = dir * 0.50; // Relaxed stroll alongside
      }
    } else if (!isEmergency && ctx.players.some(p => !p.isCpu && p.isAlive && Math.hypot(p.x - bot.x, p.y - bot.y) < 40)) {
      // Yield space if crowded against human player
      const leader = ctx.players.find(p => !p.isCpu && p.isAlive);
      if (leader) {
        input.moveX = (bot.x > leader.x) ? 0.45 : -0.45;
      }
    }

    // 4. Ledge & Hazard Safety Probes (When Grounded)
    if (bot.isGrounded && Math.abs(input.moveX) > 0.1) {
      const probeDist = 26;
      const aheadX = bot.x + dir * probeDist;
      const groundSafeAhead = BotSensory.isFootstepSafe(aheadX, bot.y, platforms, hazards);

      if (!groundSafeAhead) {
        // Approaching an edge, chasm, or floor hazard!
        const targetAcrossChasm = (dir > 0 && dx > 40) || (dir < 0 && dx < -40);
        const targetAbove = dy < -30;

        if (targetAcrossChasm || targetAbove) {
          // Intentional jump across gap or up to elevated ledge
          if (memory.jumpCooldown <= 0) {
            input.jump = true;
            input.jumpPressed = true;
            memory.jumpHoldTimer = 0.42;
            memory.jumpCooldown = 1.0;
            memory.groundedTimer = 0;
          }
        } else if (dy > 60 && BotSensory.canSafelyDropThrough(aheadX, bot.y, platforms, hazards)) {
          // Safe to step down onto lower platform
          // Continue with controlled pace
        } else {
          // Drop-off leads to spikes/lava or empty void: HALT AT THE LEDGE!
          input.moveX = 0;
          bot.vx *= 0.4;
        }
      }
    }

    // 5. Vertical Climbing & Jump Trigger
    if (bot.isGrounded) {
      memory.airTime = 0;
      memory.doubleJumpDelay = 0;
      memory.groundedTimer += dt;

      const needsVerticalClimb = isEmergency ? (dy < -35) : (dy < -55);
      const inClimbRange = Math.abs(dx) < 190 || isEmergency;
      const settledOnGround = memory.groundedTimer >= (isEmergency ? 0.22 : 0.72);

      if (needsVerticalClimb && inClimbRange && settledOnGround && memory.jumpCooldown <= 0) {
        input.jump = true;
        input.jumpPressed = true;
        memory.jumpHoldTimer = 0.42; // Retain high slow arc
        memory.doubleJumpDelay = 0.42; // Delay apex before second jump
        memory.jumpCooldown = 1.15; // Generous grounded rest cooldown
        memory.groundedTimer = 0;
      }

      // Near bouncy mushroom launchpad
      if (dy < -80 && memory.bouncerCooldown <= 0) {
        const nearBouncer = platforms.find(plat =>
          plat.bouncy && Math.abs((plat.x + plat.w * 0.5) - bot.x) < 70 && Math.abs(plat.y - bot.y) < 40
        );
        if (nearBouncer) {
          input.moveX = (nearBouncer.x + nearBouncer.w * 0.5) > bot.x ? 0.65 : -0.65;
        }
      }
    } else {
      // Airborne behavior
      memory.groundedTimer = 0;
      memory.airTime += dt;

      if (bot.vy < -550) {
        memory.bouncerCooldown = 2.0;
      }

      // Deliberate Double Jump
      const needsHighDoubleJump = dy < -90 || (isEmergency && dy < -50);
      const needsChasmDoubleJump = Math.abs(dx) > 130 && dy < -30;

      if (
        bot.jumpsRemaining > 0 &&
        memory.doubleJumpDelay <= 0 &&
        memory.airTime >= 0.38 &&
        bot.vy > -50 && bot.vy < 140 &&
        (needsHighDoubleJump || needsChasmDoubleJump)
      ) {
        input.jump = true;
        input.jumpPressed = true;
        memory.jumpHoldTimer = 0.40;
        memory.doubleJumpDelay = 999;
      }
    }

    // 6. Safe Drop-Through Logic
    if (dy > 65 && memory.dropThroughCooldown <= 0) {
      if (BotSensory.canSafelyDropThrough(bot.x, bot.y, platforms, hazards)) {
        input.moveY = 1;
        input.dropThrough = true;
        memory.dropThroughCooldown = 0.5;
      }
    }

    // 7. Anti-Stuck & Wall Clambering
    if (Math.abs(input.moveX) > 0.1 && bot.isGrounded && Math.abs(bot.vx) < 16) {
      memory.botStuckTimer += dt;
      if (memory.botStuckTimer > 0.65 && memory.jumpCooldown <= 0 && memory.groundedTimer >= 0.5) {
        input.jump = true;
        input.jumpPressed = true;
        memory.jumpHoldTimer = 0.38;
        memory.jumpCooldown = 1.4;
        memory.botStuckTimer = 0;
        memory.groundedTimer = 0;
      }
    } else {
      memory.botStuckTimer = 0;
    }

    // 8. Elastic Leash Catch-Up (Camera Protection)
    const livingHuman = ctx.players.find(p => !p.isCpu && p.isAlive && !p.isInBubble);
    if (livingHuman) {
      const distFromHuman = Math.hypot(livingHuman.x - bot.x, livingHuman.y - bot.y);
      if (distFromHuman > 550) {
        memory.separationTimer += dt;
        if (memory.separationTimer > 3.5) {
          // Safely tether bot near human player
          const safePlat = BotSensory.getPlatformBelow(livingHuman.x, livingHuman.y + 10, platforms, 100);
          const landX = safePlat ? Math.max(safePlat.x + 20, Math.min(safePlat.x + safePlat.w - 20, livingHuman.x - 60)) : livingHuman.x - 60;
          const landY = safePlat ? safePlat.y : livingHuman.y;

          bot.x = landX;
          bot.y = landY;
          bot.vx = 0;
          bot.vy = 0;
          memory.separationTimer = 0;
          ctx.game.particles.emitRing(bot.x, bot.y - 20, bot.color, 40);
        }
      } else {
        memory.separationTimer = 0;
      }
    }
  }
}
