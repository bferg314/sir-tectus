import { Player } from '../Player';
import { PlayerInputState } from '../../core/InputManager';
import { Projectile } from '../Projectile';

export class SirBareti extends Player {
  private fireCooldown: number = 0;

  constructor(index: number, isCpu: boolean = false) {
    super(index, 'Sir Bareti', '#ff9e00', isCpu);
    this.maxJumps = 3; // Triple Jump!
  }

  public performAbility(
    dt: number,
    input: PlayerInputState,
    projectiles: Projectile[]
  ): void {
    if (this.fireCooldown > 0) this.fireCooldown -= dt;

    // Pyromancy Shot
    if (input.abilityPressed && this.fireCooldown <= 0) {
      this.fireCooldown = 0.85;
      const dir = this.facingLeft ? -1 : 1;
      projectiles.push(new Projectile(
        this.x + dir * 18,
        this.y - 18,
        dir * 460,
        -120,
        'fireball',
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

    // Fiery flaming mantle around neck
    ctx.fillStyle = '#ff5400';
    ctx.beginPath();
    ctx.moveTo(-10, -28);
    ctx.lineTo(0, -22);
    ctx.lineTo(10, -28);
    ctx.lineTo(8, -18);
    ctx.lineTo(-8, -18);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }
}
