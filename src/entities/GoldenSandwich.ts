import { Platform } from '../world/BiomeTypes';

export class GoldenSandwich {
  public x: number;
  public y: number;
  public vx: number = 0;
  public vy: number = 0;
  public carrierIndex: number = -1; // -1 if on the ground, 0-3 if carried by a knight
  public isDispensed: boolean = false;
  public width: number = 32;
  public height: number = 24;
  private animTimer: number = 0;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  public dispense(x: number, y: number): void {
    this.x = x;
    this.y = y;
    this.vx = 80;
    this.vy = -180;
    this.carrierIndex = -1;
    this.isDispensed = true;
  }

  public update(dt: number, platforms: Platform[], carriers: { index: number; x: number; y: number; isAlive: boolean }[]): void {
    if (!this.isDispensed) return;
    this.animTimer += dt;

    if (this.carrierIndex >= 0) {
      // Find carrier
      const carrier = carriers.find(c => c.index === this.carrierIndex);
      if (carrier && carrier.isAlive) {
        // Follow carrier above head
        this.x = carrier.x;
        this.y = carrier.y - 34;
        this.vx = 0;
        this.vy = 0;
      } else {
        // Carrier died or disconnected: DROP SANDWICH!
        this.carrierIndex = -1;
        this.vy = -120;
        this.vx = (Math.random() - 0.5) * 60;
      }
    } else {
      // Free physics on ground
      this.vy += 650 * dt; // Gravity
      this.x += this.vx * dt;
      this.y += this.vy * dt;

      // Platform collisions
      for (let i = 0; i < platforms.length; i++) {
        const p = platforms[i];
        if (
          this.x >= p.x - 10 && this.x <= p.x + p.w + 10 &&
          this.y >= p.y - 12 && this.y <= p.y + p.h
        ) {
          if (this.vy > 0) {
            this.y = p.y - 10;
            this.vy = -this.vy * 0.4; // Small bounce
            if (Math.abs(this.vy) < 30) this.vy = 0;
            this.vx *= 0.85;
          }
        }
      }

      // Check pickup by any surviving player
      for (let i = 0; i < carriers.length; i++) {
        const c = carriers[i];
        if (c.isAlive) {
          const dist = Math.hypot(c.x - this.x, c.y - this.y);
          if (dist < 32) {
            this.carrierIndex = c.index;
            break;
          }
        }
      }
    }
  }

  public toss(facingLeft: boolean): void {
    if (this.carrierIndex < 0) return;
    this.carrierIndex = -1;
    this.vx = facingLeft ? -450 : 450;
    this.vy = -240;
  }

  public render(ctx: CanvasRenderingContext2D): void {
    if (!this.isDispensed) return;

    ctx.save();
    ctx.translate(this.x, this.y);

    // Radiant Golden Halo Aura
    const pulse = Math.sin(this.animTimer * 4) * 0.2 + 0.8;
    ctx.fillStyle = `rgba(255, 215, 0, ${pulse * 0.4})`;
    ctx.beginPath();
    ctx.arc(0, 0, 24, 0, Math.PI * 2);
    ctx.fill();

    // Ground Beacon if dropped
    if (this.carrierIndex < 0) {
      ctx.strokeStyle = `rgba(255, 190, 11, ${pulse})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, -60);
      ctx.lineTo(0, 10);
      ctx.stroke();

      ctx.fillStyle = '#fff';
      ctx.font = 'bold 10px "Outfit", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('GRAB SANDWICH!', 0, -65);
    }

    // Draw The Golden Sandwich!
    // Top Golden Crust
    ctx.fillStyle = '#d4a373';
    ctx.strokeStyle = '#ffd166';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(-14, -8, 28, 6, 2);
    ctx.fill();
    ctx.stroke();

    // Lettuce & Fillings
    ctx.fillStyle = '#52b788'; // Lettuce
    ctx.fillRect(-12, -2, 24, 3);
    ctx.fillStyle = '#e63946'; // Tomato
    ctx.fillRect(-10, 1, 20, 3);
    ctx.fillStyle = '#ffbe0b'; // Radiant Golden Cheese
    ctx.fillRect(-13, 3, 26, 3);

    // Bottom Golden Crust
    ctx.fillStyle = '#d4a373';
    ctx.beginPath();
    ctx.roundRect(-14, 6, 28, 6, 2);
    ctx.fill();
    ctx.stroke();

    ctx.restore();
  }
}
