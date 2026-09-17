import { Player } from '../Player';
import { PlayerInputState } from '../../core/InputManager';
import { Projectile } from '../Projectile';

export class SirFluctus extends Player {
  public isWaterSliding: boolean = false;
  private waterSlideDuration: number = 0;

  constructor(index: number, isCpu: boolean = false) {
    super(index, 'Sir Fluctus', '#2ec4b6', isCpu);
    this.maxJumps = 2;
  }

  public performAbility(
    dt: number,
    input: PlayerInputState,
    _projectiles: Projectile[]
  ): void {
    // 1. Hydro Air Dash (Dash Button)
    if (input.dashPressed && this.dashCooldown <= 0 && !this.isDashing) {
      this.isDashing = true;
      this.dashDuration = 0.22;
      this.dashCooldown = 0.8;
      const dir = this.facingLeft ? -1 : 1;
      this.vx = dir * 680;
      this.vy = 0; // Freeze vertical velocity during air dash
      this.isInvulnerable = true;
      this.invulnerableTimer = 0.22;
    }

    // 2. Water Slide Surfing (Ability Button)
    if (input.abilityPressed && !this.isWaterSliding && this.dashCooldown <= 0) {
      this.isWaterSliding = true;
      this.waterSlideDuration = 0.45;
      this.dashCooldown = 0.9;
      const dir = this.facingLeft ? -1 : 1;
      this.vx = dir * 720;
    }

    if (this.isWaterSliding) {
      this.waterSlideDuration -= dt;
      this.squashY = 0.6; // Flatten collision height to slide under low gaps
      if (this.waterSlideDuration <= 0) {
        this.isWaterSliding = false;
      }
    }
  }

  public override render(ctx: CanvasRenderingContext2D): void {
    super.render(ctx);
    if (!this.isAlive || this.isInBubble) return;

    ctx.save();
    ctx.translate(this.x, this.y);

    const flip = this.facingLeft ? -1 : 1;
    ctx.scale(flip * this.squashX, this.squashY);

    // Water wave surfing effect
    if (this.isWaterSliding || this.isDashing) {
      ctx.fillStyle = 'rgba(76, 201, 240, 0.65)';
      ctx.beginPath();
      ctx.ellipse(-8, 4, 28, 6, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }
}
