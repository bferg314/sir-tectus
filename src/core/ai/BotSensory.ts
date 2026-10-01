import { Player } from '../../entities/Player';
import { Platform, HazardZone } from '../../world/BiomeTypes';
import { Projectile } from '../../entities/Projectile';
import { Enemy } from '../../entities/Enemy';
import { Coin } from '../../entities/Coin';

export class BotSensory {
  /**
   * Checks if a point in world space overlaps or is dangerously close to any hazard
   */
  public static isPointInHazard(
    x: number,
    y: number,
    hazards: HazardZone[],
    radius: number = 14
  ): boolean {
    for (let i = 0; i < hazards.length; i++) {
      const h = hazards[i];
      if (h.type === 'fire_vent') {
        if (h.state === 'warning' || h.state === 'active') {
          const flameH = h.flameHeight || 85;
          if (
            x + radius > h.x &&
            x - radius < h.x + h.w &&
            y > h.y - flameH &&
            y - 40 < h.y + h.h
          ) {
            return true;
          }
        }
      } else if (h.type === 'blade_trap') {
        const anchorX = h.anchorX ?? (h.x + h.w * 0.5);
        const anchorY = h.anchorY ?? (h.y - 120);
        const len = h.length ?? 120;
        const bladeX = anchorX + Math.sin(h.angle ?? 0) * len;
        const bladeY = anchorY + Math.cos(h.angle ?? 0) * len;
        if (Math.hypot(bladeX - x, bladeY - (y - 20)) < 55) {
          return true;
        }
      } else {
        // Spikes / Lava floor hazards
        if (
          x + radius > h.x &&
          x - radius < h.x + h.w &&
          y > h.y - 12 &&
          y - 40 < h.y + h.h + 8
        ) {
          return true;
        }
      }
    }
    return false;
  }

  /**
   * Finds the platform directly below the specified point
   */
  public static getPlatformBelow(
    x: number,
    y: number,
    platforms: Platform[],
    maxDrop: number = 70
  ): Platform | null {
    let bestPlat: Platform | null = null;
    let closestDist = maxDrop;

    for (let i = 0; i < platforms.length; i++) {
      const p = platforms[i];
      if (p.isCrumbled) continue;

      if (x >= p.x - 4 && x <= p.x + p.w + 4) {
        const dist = p.y - y;
        if (dist >= -4 && dist <= closestDist) {
          closestDist = dist;
          bestPlat = p;
        }
      }
    }
    return bestPlat;
  }

  /**
   * Checks whether the ground ahead of a footstep is a safe, solid landing
   */
  public static isFootstepSafe(
    x: number,
    y: number,
    platforms: Platform[],
    hazards: HazardZone[]
  ): boolean {
    if (this.isPointInHazard(x, y, hazards, 12)) return false;

    const plat = this.getPlatformBelow(x, y, platforms, 36);
    if (!plat) return false;
    if (plat.hazard || plat.isCrumbled) return false;

    // Check if the platform surface itself has a hazard on it
    if (this.isPointInHazard(x, plat.y - 4, hazards, 12)) return false;

    return true;
  }

  /**
   * Validates whether dropping through a one-way ledge leads to a safe landing
   */
  public static canSafelyDropThrough(
    botX: number,
    botY: number,
    platforms: Platform[],
    hazards: HazardZone[]
  ): boolean {
    // Project downward between 30px and 220px below bot
    let foundPlatform = false;
    let landingY = 0;

    for (let i = 0; i < platforms.length; i++) {
      const p = platforms[i];
      if (p.isCrumbled) continue;

      if (botX >= p.x + 8 && botX <= p.x + p.w - 8) {
        const dy = p.y - botY;
        if (dy > 20 && dy <= 220) {
          if (!foundPlatform || p.y < landingY) {
            landingY = p.y;
            foundPlatform = true;
          }
        }
      }
    }

    if (!foundPlatform) return false; // Pit or too far to drop safely

    // Ensure the landing spot is hazard-free
    if (this.isPointInHazard(botX, landingY - 8, hazards, 18)) {
      return false;
    }

    return true;
  }

  /**
   * Returns whether the bot is currently standing on a crumbling platform
   */
  public static getCrumblingPlatform(
    bot: Player,
    platforms: Platform[]
  ): Platform | null {
    if (!bot.isGrounded) return null;

    for (let i = 0; i < platforms.length; i++) {
      const p = platforms[i];
      if (
        p.crumble &&
        (p.crumbleState === 'shaking' || p.isCrumbled) &&
        bot.x >= p.x - 8 &&
        bot.x <= p.x + p.w + 8 &&
        Math.abs(bot.y - p.y) <= 8
      ) {
        return p;
      }
    }
    return null;
  }

  /**
   * Scans for incoming projectiles traveling toward the bot
   */
  public static getIncomingProjectiles(
    bot: Player,
    projectiles: Projectile[],
    range: number = 130
  ): Projectile[] {
    const threats: Projectile[] = [];
    const botCenterY = bot.y - 20;

    for (let i = 0; i < projectiles.length; i++) {
      const p = projectiles[i];
      if (p.ownerIndex >= 0 || !p.isAlive || p.isStuck) continue;

      const dist = Math.hypot(p.x - bot.x, p.y - botCenterY);
      if (dist < range) {
        // Check if projectile is moving closer to bot
        const dx = bot.x - p.x;
        const dy = botCenterY - p.y;
        const dot = dx * p.vx + dy * p.vy;
        if (dot > 0 || dist < 45) {
          threats.push(p);
        }
      }
    }
    return threats;
  }

  /**
   * Detects threatening nearby enemies (e.g. winding up attacks or heavy lunges)
   */
  public static getThreateningEnemies(
    bot: Player,
    enemies: Enemy[],
    range: number = 85
  ): Enemy[] {
    const threats: Enemy[] = [];
    for (let i = 0; i < enemies.length; i++) {
      const e = enemies[i];
      if (!e.isAlive || e.isDying) continue;

      const dist = Math.hypot(e.x - bot.x, e.y - bot.y);
      if (dist < range) {
        threats.push(e);
      }
    }
    return threats;
  }

  /**
   * Finds the nearest reachable coin that isn't on a hazard
   */
  public static findNearestReachableCoin(
    bot: Player,
    coins: Coin[],
    platforms: Platform[],
    hazards: HazardZone[],
    maxDist: number = 220
  ): Coin | null {
    let bestCoin: Coin | null = null;
    let minDist = maxDist;

    for (let i = 0; i < coins.length; i++) {
      const c = coins[i];
      if (c.isCollected || c.type !== 'standard') continue;

      const dist = Math.hypot(c.x - bot.x, c.y - bot.y);
      if (dist < minDist) {
        // Verify coin is not on spikes/lava
        if (!this.isPointInHazard(c.x, c.y, hazards, 16)) {
          minDist = dist;
          bestCoin = c;
        }
      }
    }
    return bestCoin;
  }
}
