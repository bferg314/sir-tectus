import { Player } from '../Player';
import { PlayerInputState } from '../../core/InputManager';
import { Projectile } from '../Projectile';

export class SirTectus extends Player {
  public isReflecting: boolean = false;
  private boomerangCooldown: number = 0;
  private activeBoomerang: Projectile | null = null;

  constructor(index: number, isCpu: boolean = false) {
    super(index, 'Sir Tectus', '#e63946', isCpu);
    this.maxJumps = 2;
  }

  public performAbility(
    dt: number,
    input: PlayerInputState,
    projectiles: Projectile[]
  ): void {
    if (this.boomerangCooldown > 0) this.boomerangCooldown -= dt;

    // 1. Shield Stance / Reflect (Hold Ability) - Always available!
    if (input.ability) {
      this.isReflecting = true;
      this.vx *= 0.72; // Shield stance allows controlled movement

      // Reflect nearby enemy projectiles
      for (let i = 0; i < projectiles.length; i++) {
        const proj = projectiles[i];
        if (proj.ownerIndex === -1 && proj.isAlive && !proj.isStuck) {
          const d = Math.hypot(proj.x - this.x, proj.y - (this.y - 20));
          if (d < 48) {
            proj.ownerIndex = this.index;
            proj.vx = -proj.vx * 1.4;
            proj.vy = -proj.vy * 1.4;
            proj.damage = 2; // Reflected bonus damage!
          }
        }
      }
    } else {
      this.isReflecting = false;
    }

    // 2. Shield Boomerang Throw (Tap Ability or Attack while shielding)
    const wantsThrow = (input.abilityPressed && (!this.activeBoomerang || !this.activeBoomerang.isAlive)) ||
                       (this.isReflecting && input.attackPressed && (!this.activeBoomerang || !this.activeBoomerang.isAlive));

    if (wantsThrow && this.boomerangCooldown <= 0) {
      this.boomerangCooldown = 1.2;
      const dir = this.facingLeft ? -1 : 1;
      const boomerang = new Projectile(
        this.x + dir * 16,
        this.y - 20,
        dir * 560,
        -35,
        'shield_boomerang',
        this.index,
        2
      );
      this.activeBoomerang = boomerang;
      projectiles.push(boomerang);
    }

    // Clean up caught boomerang
    if (this.activeBoomerang && !this.activeBoomerang.isAlive) {
      this.activeBoomerang = null;
    }
  }

  public override render(ctx: CanvasRenderingContext2D): void {
    super.render(ctx);
    if (!this.isAlive || this.isInBubble) return;

    ctx.save();
    ctx.translate(this.x, this.y);

    const flip = this.facingLeft ? -1 : 1;
    ctx.scale(flip * this.squashX, this.squashY);

    // Render Ornate Shield Bubble if Reflecting
    if (this.isReflecting) {
      ctx.strokeStyle = '#ffd166';
      ctx.fillStyle = 'rgba(255, 209, 102, 0.25)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(14, -20, 26, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    } else if (!this.activeBoomerang) {
      // Kite Shield on Arm
      ctx.fillStyle = '#e63946';
      ctx.strokeStyle = '#ffd166';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(10, -30);
      ctx.lineTo(18, -26);
      ctx.lineTo(16, -12);
      ctx.lineTo(10, -8);
      ctx.lineTo(4, -12);
      ctx.lineTo(4, -26);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }

    ctx.restore();
  }
}
