import { Player } from '../../../entities/Player';
import { BotContext } from '../BotTypes';
import { BotSensory } from '../BotSensory';
import { PlayerInputState } from '../../InputManager';
import { Enemy } from '../../../entities/Enemy';
import { Boss } from '../../../entities/Boss';

export class CombatTactics {
  /**
   * Executes combat evaluation: Boss tactics, bow sniping, pogo down-thrusts, and melee kiting
   */
  public static execute(
    ctx: BotContext,
    input: PlayerInputState,
    isEmergencyRevive: boolean
  ): boolean {
    const { bot, memory, boss, enemies, projectiles, dt } = ctx;

    // 1. Lord Crustifer Boss Battle Mode
    if (boss && boss.isAlive) {
      this.executeBossTactics(ctx, input, boss);
      return true;
    }

    // 2. Kiting state: currently backstepping away from a telegraphed enemy strike
    if (memory.kitingTimer > 0) {
      memory.kitingTimer -= dt;
      input.moveX = memory.kitingDir * 0.9;
    }

    // 3. Down-Thrust / Pogo Jump on enemies directly below
    if (!bot.isGrounded && bot.vy > 50) {
      const belowEnemy = enemies.find(e =>
        e.isAlive &&
        Math.abs(e.x - bot.x) < 34 &&
        e.y > bot.y && (e.y - bot.y) < 65
      );
      if (belowEnemy) {
        input.moveY = 1;
        input.attack = true;
        input.attackPressed = true;
        return true;
      }
    }

    // 4. Melee Range Engagement (< 74px)
    const meleeEnemy = enemies.find(e => e.isAlive && Math.hypot(e.x - bot.x, e.y - bot.y) < 74);
    if (meleeEnemy) {
      // Check if enemy is telegraphing a heavy attack
      if (meleeEnemy.attackTelegraphTimer > 0 || (meleeEnemy.isAttacking && meleeEnemy.type === 'berserker')) {
        // Step back to evade the swing
        memory.kitingTimer = 0.32;
        memory.kitingDir = bot.x > meleeEnemy.x ? 1 : -1;
        input.moveX = memory.kitingDir * 0.9;
      } else {
        if (!isEmergencyRevive) {
          input.moveX = meleeEnemy.x > bot.x ? 0.75 : -0.75;
        }
        input.attack = true;
        input.attackPressed = true;

        // Tactical flanking behind Vanguard's frontal shield
        if (meleeEnemy.type === 'vanguard' && (meleeEnemy as any).isShieldGuarding) {
          const vanguardFacesBot = meleeEnemy.facingLeft ? (bot.x < meleeEnemy.x) : (bot.x > meleeEnemy.x);
          if (vanguardFacesBot) {
            input.moveX = meleeEnemy.facingLeft ? 0.9 : -0.9;
            if (bot.isGrounded && memory.jumpCooldown <= 0) {
              input.jump = true;
              input.jumpPressed = true;
              memory.jumpHoldTimer = 0.38;
            }
          }
        }
      }
      return true;
    }

    // 5. Parry incoming destructible projectiles with sword slash
    const incomingDestructibles = projectiles.find(p =>
      p.isAlive && p.isDestructible && p.ownerIndex === -1 &&
      Math.hypot(p.x - bot.x, p.y - (bot.y - 18)) < 42
    );
    if (incomingDestructibles) {
      input.attack = true;
      input.attackPressed = true;
    }

    // 6. Bow Sniping against flying or elevated foes (Floaters, Wraiths, Valkyries, distant Archers)
    if (!isEmergencyRevive && bot.quiverAmmo > 0) {
      const bowTarget = enemies.find(e => {
        if (!e.isAlive) return false;
        const d = Math.hypot(e.x - bot.x, e.y - bot.y);
        const isAerial = e.type === 'floater' || e.type === 'wraith' || e.type === 'aether_valkyrie';
        const isDistant = d >= 80 && d <= 260;
        return isAerial || isDistant;
      });

      if (bowTarget) {
        memory.bowAimTimer += dt;
        input.aimBow = true;
        input.moveX = bowTarget.x > bot.x ? 0.15 : -0.15; // Slow deliberate aim stance

        if (memory.bowAimTimer >= 0.38) {
          input.shootArrow = true;
          input.aimBow = false;
          memory.bowAimTimer = 0;
        }
        return true;
      } else {
        memory.bowAimTimer = 0;
      }
    }

    return false;
  }

  /**
   * Lord Crustifer Boss Fight Tactics
   */
  private static executeBossTactics(
    ctx: BotContext,
    input: PlayerInputState,
    boss: Boss
  ): void {
    const { bot, memory, projectiles, dt } = ctx;
    const dx = boss.x - bot.x;
    const dy = (boss.y - 40) - bot.y;
    const dist = Math.hypot(dx, dy);

    // Flanking safe distance (150-200px)
    const flankSide = bot.index % 2 === 0 ? -1 : 1;
    const desiredX = boss.x + flankSide * 160;

    // Move toward safe flanking position
    const flankDx = desiredX - bot.x;
    if (Math.abs(flankDx) > 30) {
      input.moveX = flankDx > 0 ? 0.75 : -0.75;
    }

    // Facing boss
    bot.facingLeft = boss.x < bot.x;

    // Down-thrust pogo jump if above boss
    if (!bot.isGrounded && bot.vy > 40 && Math.abs(boss.x - bot.x) < 55 && bot.y < boss.y - 30) {
      input.moveY = 1;
      input.attack = true;
      input.attackPressed = true;
      return;
    }

    // Melee attack if close during boss recovery
    if (dist < 85) {
      input.attack = true;
      input.attackPressed = true;
    }

    // Ranged Bow attack against boss
    if (bot.quiverAmmo > 0 && dist >= 85 && dist <= 280) {
      memory.bowAimTimer += dt;
      input.aimBow = true;
      if (memory.bowAimTimer >= 0.40) {
        input.shootArrow = true;
        input.aimBow = false;
        memory.bowAimTimer = 0;
      }
    }

    // Dodge incoming boss bullets (Sesame seeds / Toaster barrage)
    const incomingBossBullets = projectiles.find(p =>
      p.isAlive && p.ownerIndex === -1 &&
      Math.hypot(p.x - bot.x, p.y - (bot.y - 20)) < 75
    );
    if (incomingBossBullets && bot.isGrounded && memory.jumpCooldown <= 0) {
      input.jump = true;
      input.jumpPressed = true;
      memory.jumpHoldTimer = 0.35;
      memory.jumpCooldown = 0.8;
    }
  }
}
