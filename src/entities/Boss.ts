import { Projectile } from './Projectile';

export class Boss {
  public x: number;
  public y: number;
  public health: number = 35;
  public maxHealth: number = 35;
  public isAlive: boolean = true;
  public name: string = 'Lord Crustifer';
  public title: string = 'Sovereign of the Infinite Banquet';

  private animTimer: number = 0;
  private attackTimer: number = 0;
  private attackPhase: number = 1;
  public width: number = 110;
  public height: number = 130;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  public update(dt: number, players: { x: number; y: number; isAlive: boolean }[], projectiles: Projectile[]): void {
    if (!this.isAlive) return;

    this.animTimer += dt;
    this.attackTimer += dt;

    // Determine current phase
    if (this.health <= 12) {
      this.attackPhase = 3;
    } else if (this.health <= 24) {
      this.attackPhase = 2;
    } else {
      this.attackPhase = 1;
    }

    // Hover floating motion
    this.y += Math.sin(this.animTimer * 2.5) * 18 * dt;

    // Attack routines
    const cooldown = this.attackPhase === 3 ? 1.4 : (this.attackPhase === 2 ? 2.0 : 2.6);
    if (this.attackTimer >= cooldown) {
      this.attackTimer = 0;
      this.executeAttack(players, projectiles);
    }
  }

  private executeAttack(players: { x: number; y: number; isAlive: boolean }[], projectiles: Projectile[]): void {
    const living = players.filter(p => p.isAlive);
    if (living.length === 0) return;

    const target = living[Math.floor(Math.random() * living.length)];
    const angle = Math.atan2(target.y - this.y, target.x - this.x);

    if (this.attackPhase === 1) {
      // 3-way Sesame projectile spread
      for (let i = -1; i <= 1; i++) {
        const a = angle + i * 0.28;
        projectiles.push(new Projectile(
          this.x,
          this.y - 20,
          Math.cos(a) * 320,
          Math.sin(a) * 320,
          'enemy_bullet',
          -1,
          1
        ));
      }
    } else if (this.attackPhase === 2) {
      // 5-way Fiery Toaster Barrage
      for (let i = -2; i <= 2; i++) {
        const a = angle + i * 0.22;
        projectiles.push(new Projectile(
          this.x,
          this.y - 20,
          Math.cos(a) * 380,
          Math.sin(a) * 380,
          'enemy_bullet',
          -1,
          1
        ));
      }
    } else {
      // Rapid culinary whirlwind ring
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2 + this.animTimer;
        projectiles.push(new Projectile(
          this.x,
          this.y - 20,
          Math.cos(a) * 260,
          Math.sin(a) * 260,
          'enemy_bullet',
          -1,
          1
        ));
      }
    }
  }

  public takeDamage(amount: number): boolean {
    if (!this.isAlive) return false;
    this.health -= amount;
    if (this.health <= 0) {
      this.isAlive = false;
      return true; // Boss slain!
    }
    return false;
  }

  public render(ctx: CanvasRenderingContext2D): void {
    if (!this.isAlive) return;

    ctx.save();
    ctx.translate(this.x, this.y);

    // Aura Glow
    const auraColor = this.attackPhase === 3 ? 'rgba(255, 0, 84, 0.4)' : 'rgba(255, 190, 11, 0.3)';
    ctx.fillStyle = auraColor;
    ctx.beginPath();
    ctx.arc(0, -this.height * 0.5, 90, 0, Math.PI * 2);
    ctx.fill();

    // Colossal Bread Crust Body
    ctx.fillStyle = '#8b5a2b';
    ctx.strokeStyle = '#ffd166';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.roundRect(-this.width * 0.5, -this.height, this.width, this.height, 16);
    ctx.fill();
    ctx.stroke();

    // Molten Cheese Core
    ctx.fillStyle = '#ffbe0b';
    ctx.fillRect(-this.width * 0.4, -this.height * 0.65, this.width * 0.8, 28);

    // Fiery Crown
    ctx.fillStyle = '#ffd166';
    ctx.beginPath();
    ctx.moveTo(-40, -this.height);
    ctx.lineTo(-20, -this.height - 24);
    ctx.lineTo(0, -this.height - 10);
    ctx.lineTo(20, -this.height - 24);
    ctx.lineTo(40, -this.height);
    ctx.closePath();
    ctx.fill();

    // Glowing Eyes
    const eyeColor = this.attackPhase === 3 ? '#ff0054' : '#ffffff';
    ctx.fillStyle = eyeColor;
    ctx.fillRect(-24, -this.height * 0.8, 12, 10);
    ctx.fillRect(12, -this.height * 0.8, 12, 10);

    // Giant Boss Health Bar above head
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(-90, -this.height - 48, 180, 14);
    ctx.strokeStyle = '#ffd166';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(-90, -this.height - 48, 180, 14);

    const hpPct = Math.max(0, this.health / this.maxHealth);
    ctx.fillStyle = this.attackPhase === 3 ? '#ef476f' : '#ffbe0b';
    ctx.fillRect(-88, -this.height - 46, 176 * hpPct, 10);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 10px "Cinzel", serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${this.name} (${this.health}/${this.maxHealth})`, 0, -this.height - 54);

    ctx.restore();
  }
}
