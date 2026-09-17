import { Platform } from '../world/BiomeTypes';

export type ProjectileType = 'arrow' | 'shield_boomerang' | 'fireball' | 'thrown_sword' | 'enemy_bullet' | 'firebomb' | 'void_skull';

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
    }

    this.x += this.vx * dt;
    this.y += this.vy * dt;

    // Check collision against platforms (void skull is spectral and phases through walls)
    if (!this.isReturning && this.type !== 'void_skull') {
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
          } else if (this.type === 'firebomb') {
            this.isAlive = false;
            this.hasExploded = true;
          } else if (this.type === 'enemy_bullet') {
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
    }

    ctx.restore();
  }
}
