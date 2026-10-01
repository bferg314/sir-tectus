import { Player } from '../Player';
import { PlayerInputState } from '../../core/InputManager';
import { Projectile } from '../Projectile';

export class SirMorgani extends Player {
  private swordThrowCooldown: number = 0;

  constructor(index: number, isCpu: boolean = false) {
    super(index, 'Sir Morgani', '#7209b7', isCpu);
    this.maxJumps = 2;
  }

  public performAbility(
    dt: number,
    input: PlayerInputState,
    projectiles: Projectile[]
  ): void {
    if (this.swordThrowCooldown > 0) this.swordThrowCooldown -= dt;

    // 1. Morgani Shadow Blink (Dash Override)
    if (input.dashPressed && this.dashCooldown <= 0 && !this.isDashing) {
      this.isDashing = true;
      this.dashDuration = 0.22;
      this.dashCooldown = 0.75;
      const dir = this.facingLeft ? -1 : 1;
      this.vx = dir * 650;
      this.vy = Math.min(this.vy, 0); // Cancels downward momentum for clean aerial blink
      this.isInvulnerable = true;
      this.invulnerableTimer = 0.24;
      this.squashX = 1.45;
      this.squashY = 0.65;
    }

    // 2. Piercing Greatsword Throw (Ability Button)
    if (input.abilityPressed && this.swordThrowCooldown <= 0) {
      this.swordThrowCooldown = 0.85;
      const dir = this.facingLeft ? -1 : 1;
      projectiles.push(new Projectile(
        this.x + dir * 16,
        this.y - 18,
        dir * 600,
        -40,
        'thrown_sword',
        this.index,
        2
      ));
    }
  }

  public override render(ctx: CanvasRenderingContext2D): void {
    super.render(ctx);
    if (!this.isAlive || this.isInBubble) return;

    ctx.save();
    ctx.translate(this.x, this.y);

    const flip = this.facingLeft ? -1 : 1;
    ctx.scale(flip * this.squashX, this.squashY);

    // Twin scabbards on back
    ctx.fillStyle = '#b5179e';
    ctx.fillRect(-14, -30, 4, 18);
    ctx.fillRect(-11, -32, 4, 18);

    ctx.restore();
  }
}
