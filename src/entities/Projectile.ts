import { Platform } from '../world/BiomeTypes';

export type ProjectileType =
  | 'arrow'
  | 'shield_boomerang'
  | 'fireball'
  | 'thrown_sword'
  | 'enemy_bullet'
  | 'firebomb'
  | 'void_skull'
  | 'spore_cloud'
  | 'water_orb'
  | 'crystal_shard'
  | 'steam_burst'
  | 'magma_blob'
  | 'frost_shard'
  | 'celestial_spear'
  | 'void_orb'
  | 'hellfire_wave'
  | 'dread_soul';

export class Projectile {
  public x: number;
  public y: number;
  public vx: number;
  public vy: number;
  public type: ProjectileType;
  public ownerIndex: number; // -1 for enemies, 0-3 for players
  public damage: number = 1;
  public isStuck: boolean = false;
  public isAlive: boolean = true;
  public lifeTimer: number = 10.0;
  public rotation: number = 0;
  public stickWallX: number = 0;
  public stickWallY: number = 0;
  public isDestructible: boolean = false;
  public hasExploded: boolean = false;
  public explosionRadius: number = 0;

  // Boomerang specific
  public boomerangTimer: number = 0;
  public isReturning: boolean = false;

  constructor(
    x: number, y: number,
    vx: number, vy: number,
    type: ProjectileType,
    ownerIndex: number,
    damage: number = 1
  ) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.type = type;
    this.ownerIndex = ownerIndex;
    this.damage = damage;
    this.rotation = Math.atan2(vy, vx);

    if (type === 'void_skull') {
      this.isDestructible = true;
      this.lifeTimer = 4.5;
    } else if (type === 'firebomb') {
      this.lifeTimer = 3.5;
      this.explosionRadius = 65;
    } else if (type === 'spore_cloud') {
      this.lifeTimer = 3.0;
    } else if (type === 'water_orb') {
      this.lifeTimer = 2.6;
    } else if (type === 'crystal_shard') {
      this.lifeTimer = 2.2;
    } else if (type === 'steam_burst') {
      this.lifeTimer = 0.55;
      this.damage = 1;
    } else if (type === 'magma_blob') {
      this.lifeTimer = 2.8;
      this.explosionRadius = 45;
    } else if (type === 'frost_shard') {
      this.lifeTimer = 2.2;
    } else if (type === 'celestial_spear') {
      this.lifeTimer = 2.5;
    } else if (type === 'void_orb') {
      this.isDestructible = true;
      this.lifeTimer = 3.6;
      this.explosionRadius = 55;
    } else if (type === 'hellfire_wave') {
      this.lifeTimer = 2.2;
    } else if (type === 'dread_soul') {
      this.isDestructible = true;
      this.lifeTimer = 3.2;
    }
  }

  public update(
    dt: number,
    platforms: Platform[],
    returnTarget?: { x: number; y: number },
    targetPlayer?: { x: number; y: number; isAlive: boolean } | null
  ): void {
    if (!this.isAlive) return;

    this.lifeTimer -= dt;
    if (this.lifeTimer <= 0) {
      if (this.type === 'firebomb') {
        this.hasExploded = true;
      }
      this.isAlive = false;
      return;
    }

    if (this.isStuck) return;

    // Type specific physics
    if (this.type === 'arrow') {
      this.vy += 420 * dt; // Gravity
      this.rotation = Math.atan2(this.vy, this.vx);
    } else if (this.type === 'shield_boomerang') {
      this.boomerangTimer += dt;
      this.rotation += 18 * dt; // Rapid spin

      if (this.boomerangTimer > 0.45 && returnTarget) {
        this.isReturning = true;
        const dx = returnTarget.x - this.x;
        const dy = returnTarget.y - this.y;
        const dist = Math.hypot(dx, dy);
        if (dist < 30) {
          this.isAlive = false; // Caught!
          return;
        }
        const speed = 650;
        this.vx = (dx / dist) * speed;
        this.vy = (dy / dist) * speed;
      }
    } else if (this.type === 'fireball') {
      this.vy += 180 * dt;
      this.rotation += 10 * dt;
    } else if (this.type === 'thrown_sword') {
      this.vy += 260 * dt;
      this.rotation += 14 * dt;
    } else if (this.type === 'firebomb') {
      this.vy += 440 * dt; // Gravity arc
      this.rotation += 8 * dt;
    } else if (this.type === 'void_skull') {
      // Homing turn towards player
      if (targetPlayer && targetPlayer.isAlive) {
        const targetAngle = Math.atan2((targetPlayer.y - 18) - this.y, targetPlayer.x - this.x);
        let angleDiff = targetAngle - this.rotation;
        while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
        this.rotation += Math.max(-2.8 * dt, Math.min(2.8 * dt, angleDiff));
      }
      const speed = 160;
      this.vx = Math.cos(this.rotation) * speed;
      this.vy = Math.sin(this.rotation) * speed;
    } else if (this.type === 'spore_cloud') {
      this.vx *= 0.98;
      this.vy = Math.sin(this.lifeTimer * 5) * 22;
      this.rotation += 2 * dt;
    } else if (this.type === 'water_orb') {
      this.vy += 340 * dt;
      this.rotation = Math.atan2(this.vy, this.vx);
    } else if (this.type === 'crystal_shard') {
      this.vy += 120 * dt;
      this.rotation = Math.atan2(this.vy, this.vx);
    } else if (this.type === 'steam_burst') {
      this.vx *= 0.88;
      this.vy *= 0.88;
      this.rotation += 4 * dt;
    } else if (this.type === 'magma_blob') {
      this.vy += 460 * dt;
      this.rotation += 10 * dt;
    } else if (this.type === 'frost_shard') {
      this.vy += 180 * dt;
      this.rotation = Math.atan2(this.vy, this.vx);
    } else if (this.type === 'celestial_spear') {
      this.vy += 380 * dt;
      this.rotation = Math.atan2(this.vy, this.vx);
    } else if (this.type === 'void_orb') {
      if (targetPlayer && targetPlayer.isAlive) {
        const targetAngle = Math.atan2((targetPlayer.y - 18) - this.y, targetPlayer.x - this.x);
        let angleDiff = targetAngle - this.rotation;
        while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
        this.rotation += Math.max(-1.8 * dt, Math.min(1.8 * dt, angleDiff));
      }
      const speed = 115;
      this.vx = Math.cos(this.rotation) * speed;
      this.vy = Math.sin(this.rotation) * speed;
    } else if (this.type === 'hellfire_wave') {
      this.rotation = this.vx >= 0 ? 0 : Math.PI;
    } else if (this.type === 'dread_soul') {
      this.rotation += 3.2 * dt;
      const speed = 125;
      this.vx = Math.cos(this.rotation) * speed;
      this.vy = Math.sin(this.rotation) * speed;
    }

    this.x += this.vx * dt;
    this.y += this.vy * dt;

    // Check collision against platforms (spectral and gaseous projectiles pass through walls)
    const phasesThroughWalls = this.type === 'void_skull' || this.type === 'void_orb' || this.type === 'dread_soul' || this.type === 'steam_burst';
    if (!this.isReturning && !phasesThroughWalls) {
      for (let i = 0; i < platforms.length; i++) {
        const p = platforms[i];
        if (p.oneWay) continue; // Pass through one-way ledges

        if (
          this.x >= p.x && this.x <= p.x + p.w &&
          this.y >= p.y && this.y <= p.y + p.h
        ) {
          if (this.type === 'arrow') {
            this.isStuck = true;
            this.vx = 0;
            this.vy = 0;
          } else if (this.type === 'shield_boomerang') {
            // Boomerang ricochets off walls
            this.vx = -this.vx * 0.8;
            this.vy = -this.vy * 0.8;
            this.isReturning = true;
          } else if (this.type === 'fireball') {
            // Explodes on impact
            this.isAlive = false;
          } else if (this.type === 'thrown_sword') {
            // Stays stuck in wall as a ledge!
            this.isStuck = true;
            this.vx = 0;
            this.vy = 0;
            this.rotation = this.vx >= 0 ? 0 : Math.PI;
          } else if (this.type === 'firebomb' || this.type === 'magma_blob') {
            this.isAlive = false;
            this.hasExploded = true;
          } else if (
            this.type === 'enemy_bullet' ||
            this.type === 'spore_cloud' ||
            this.type === 'water_orb' ||
            this.type === 'crystal_shard' ||
            this.type === 'frost_shard' ||
            this.type === 'celestial_spear'
          ) {
            this.isAlive = false;
          }
          break;
        }
      }
    }
  }

  public render(ctx: CanvasRenderingContext2D): void {
    if (!this.isAlive) return;

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotation);

    if (this.type === 'arrow') {
      // Wood shaft & fletching
      ctx.strokeStyle = '#d4a373';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-12, 0);
      ctx.lineTo(10, 0);
      ctx.stroke();

      // Steel arrowhead
      ctx.fillStyle = '#f8fafc';
      ctx.beginPath();
      ctx.moveTo(14, 0);
      ctx.lineTo(8, -3);
      ctx.lineTo(8, 3);
      ctx.closePath();
      ctx.fill();

      // Fletching
      ctx.fillStyle = '#ef476f';
      ctx.fillRect(-12, -3, 4, 6);
    } else if (this.type === 'shield_boomerang') {
      // Ornate crimson & gold kite shield
      ctx.fillStyle = '#e63946';
      ctx.strokeStyle = '#ffd166';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(0, -14);
      ctx.lineTo(12, -8);
      ctx.lineTo(8, 14);
      ctx.lineTo(0, 18);
      ctx.lineTo(-8, 14);
      ctx.lineTo(-12, -8);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Golden center emblem
      ctx.fillStyle = '#ffd166';
      ctx.beginPath();
      ctx.arc(0, 2, 4, 0, Math.PI * 2);
      ctx.fill();
    } else if (this.type === 'fireball') {
      // Fiery blazing orb
      ctx.fillStyle = '#ffbe0b';
      ctx.beginPath();
      ctx.arc(0, 0, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fb5607';
      ctx.beginPath();
      ctx.arc(-2, 0, 5, 0, Math.PI * 2);
      ctx.fill();
    } else if (this.type === 'thrown_sword') {
      // Sleek amethyst longsword
      ctx.fillStyle = '#7209b7';
      ctx.fillRect(-14, -2, 28, 4);
      ctx.fillStyle = '#ffd166';
      ctx.fillRect(-8, -6, 4, 12);
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(14, -2);
      ctx.lineTo(18, 0);
      ctx.lineTo(14, 2);
      ctx.closePath();
      ctx.fill();
    } else if (this.type === 'enemy_bullet') {
      ctx.fillStyle = '#ef476f';
      ctx.beginPath();
      ctx.arc(0, 0, 5, 0, Math.PI * 2);
      ctx.fill();
    } else if (this.type === 'firebomb') {
      // Dark iron flask
      ctx.fillStyle = '#2b2d42';
      ctx.beginPath();
      ctx.arc(0, 2, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#e63946';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Flask neck & glowing fuse
      ctx.fillStyle = '#6c757d';
      ctx.fillRect(-2, -8, 4, 4);

      // Sizzling fiery fuse spark
      ctx.fillStyle = '#ffbe0b';
      ctx.beginPath();
      ctx.arc(0, -9, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fb5607';
      ctx.beginPath();
      ctx.arc((Math.random() - 0.5) * 4, -11, 2, 0, Math.PI * 2);
      ctx.fill();
    } else if (this.type === 'void_skull') {
      // Spectral flame aura
      ctx.fillStyle = 'rgba(147, 51, 234, 0.45)';
      ctx.beginPath();
      ctx.arc(0, 0, 11, 0, Math.PI * 2);
      ctx.fill();

      // Ghostly bone cranium
      ctx.fillStyle = '#e0e7ff';
      ctx.beginPath();
      ctx.arc(2, -2, 7, 0, Math.PI * 2);
      ctx.fill();

      // Ethereal jaw
      ctx.fillRect(-2, 2, 7, 4);

      // Glowing void eyes
      ctx.fillStyle = '#06b6d4';
      ctx.beginPath();
      ctx.arc(3, -3, 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(0, -3, 1.5, 0, Math.PI * 2);
      ctx.fill();

      // Trailing spectral wisps
      ctx.strokeStyle = '#a855f7';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-6, 0);
      ctx.lineTo(-12, (Math.random() - 0.5) * 6);
      ctx.stroke();
    } else if (this.type === 'spore_cloud') {
      // Verdant spore puff
      ctx.fillStyle = 'rgba(116, 198, 157, 0.7)';
      ctx.beginPath();
      ctx.arc(0, 0, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#d8f3dc';
      ctx.beginPath();
      ctx.arc(-2, -2, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#52b788';
      ctx.beginPath();
      ctx.arc(3, 2, 3, 0, Math.PI * 2);
      ctx.fill();
    } else if (this.type === 'water_orb') {
      // Aqueduct water droplet
      ctx.fillStyle = 'rgba(76, 201, 240, 0.85)';
      ctx.beginPath();
      ctx.ellipse(0, 0, 9, 6, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(-3, -2, 2.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#4895ef';
      ctx.lineWidth = 1.2;
      ctx.stroke();
    } else if (this.type === 'crystal_shard') {
      // Grotto crystal spike
      ctx.fillStyle = '#f72585';
      ctx.beginPath();
      ctx.moveTo(12, 0);
      ctx.lineTo(2, -4);
      ctx.lineTo(-10, -2);
      ctx.lineTo(-8, 0);
      ctx.lineTo(-10, 2);
      ctx.lineTo(2, 4);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, -1, 6, 2);
    } else if (this.type === 'steam_burst') {
      // Foundry steam plume
      ctx.fillStyle = 'rgba(241, 245, 249, 0.65)';
      ctx.beginPath();
      ctx.arc(0, 0, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(203, 213, 225, 0.45)';
      ctx.beginPath();
      ctx.arc((Math.random() - 0.5) * 8, (Math.random() - 0.5) * 8, 10, 0, Math.PI * 2);
      ctx.fill();
    } else if (this.type === 'magma_blob') {
      // Molten caldera boulder
      ctx.fillStyle = '#d00000';
      ctx.beginPath();
      ctx.arc(0, 0, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffba08';
      ctx.beginPath();
      ctx.arc(-2, -2, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#370617';
      ctx.fillRect(1, 2, 4, 3);
    } else if (this.type === 'frost_shard') {
      // Frostpeak icicle spear
      ctx.fillStyle = '#e0f2fe';
      ctx.beginPath();
      ctx.moveTo(14, 0);
      ctx.lineTo(4, -4);
      ctx.lineTo(-12, -2);
      ctx.lineTo(-12, 2);
      ctx.lineTo(4, 4);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1.2;
      ctx.stroke();
    } else if (this.type === 'celestial_spear') {
      // Sunlit sky javelin
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.moveTo(18, 0);
      ctx.lineTo(6, -3);
      ctx.lineTo(-16, -1.5);
      ctx.lineTo(-16, 1.5);
      ctx.lineTo(6, 3);
      ctx.closePath();
      ctx.fill();
      // Glowing halo
      ctx.strokeStyle = 'rgba(250, 204, 21, 0.6)';
      ctx.lineWidth = 2.5;
      ctx.stroke();
    } else if (this.type === 'void_orb') {
      // Cosmic singularity
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(0, 0, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#c084fc';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(0, 0, 12, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = '#e879f9';
      ctx.beginPath();
      ctx.arc(0, 0, 4, 0, Math.PI * 2);
      ctx.fill();
    } else if (this.type === 'hellfire_wave') {
      // Roaring ground fire pillar
      ctx.fillStyle = '#ff0054';
      ctx.beginPath();
      ctx.moveTo(-10, 0);
      ctx.lineTo(-5, -24);
      ctx.lineTo(0, -12);
      ctx.lineTo(6, -28);
      ctx.lineTo(10, 0);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#ffd166';
      ctx.beginPath();
      ctx.moveTo(-6, 0);
      ctx.lineTo(-2, -18);
      ctx.lineTo(4, 0);
      ctx.closePath();
      ctx.fill();
    } else if (this.type === 'dread_soul') {
      // Necropolis torment soul
      ctx.fillStyle = 'rgba(6, 214, 160, 0.4)';
      ctx.beginPath();
      ctx.arc(0, 0, 11, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#a7f3d0';
      ctx.beginPath();
      ctx.arc(2, -2, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#064e3b';
      ctx.fillRect(2, -3, 2, 2);
      ctx.fillRect(5, -3, 2, 2);
    }

    ctx.restore();
  }
}
