export type CoinType = 'standard' | 'sandwich_coin' | 'holy_condiment';

export class Coin {
  public x: number;
  public y: number;
  public baseY: number;
  public type: CoinType;
  public isCollected: boolean = false;
  private animTimer: number = 0;
  public radius: number = 12;

  constructor(x: number, y: number, type: CoinType = 'standard') {
    this.x = x;
    this.y = y;
    this.baseY = y;
    this.type = type;
    this.animTimer = Math.random() * Math.PI * 2;
    this.radius = type === 'sandwich_coin' ? 22 : (type === 'holy_condiment' ? 18 : 12);
  }

  public update(dt: number, playerPositions: { x: number; y: number }[], magnetRadius: number = 70): void {
    if (this.isCollected) return;

    this.animTimer += dt * 3.5;
    this.y = this.baseY + Math.sin(this.animTimer) * 5;

    // Magnetic pull toward nearest living player
    for (let i = 0; i < playerPositions.length; i++) {
      const p = playerPositions[i];
      const dx = p.x - this.x;
      const dy = p.y - this.y;
      const dist = Math.hypot(dx, dy);

      if (dist < magnetRadius && dist > 1) {
        const pullSpeed = (1 - dist / magnetRadius) * 220;
        this.x += (dx / dist) * pullSpeed * dt;
        this.baseY += (dy / dist) * pullSpeed * dt;
        break;
      }
    }
  }

  public checkCollection(px: number, py: number, pRadius: number = 24): boolean {
    if (this.isCollected) return false;
    const dist = Math.hypot(px - this.x, py - this.y);
    if (dist <= this.radius + pRadius) {
      this.isCollected = true;
      return true;
    }
    return false;
  }

  public render(ctx: CanvasRenderingContext2D): void {
    if (this.isCollected) return;

    ctx.save();
    ctx.translate(this.x, this.y);

    if (this.type === 'standard') {
      // 3D Spinning Ancient Gold Coin
      const spinScale = Math.cos(this.animTimer * 1.5);
      const absSpin = Math.abs(spinScale);

      // Gold Coin Shadow
      ctx.fillStyle = '#b7791f';
      ctx.beginPath();
      ctx.ellipse(0, 0, Math.max(1, 11 * absSpin), 11, 0, 0, Math.PI * 2);
      ctx.fill();

      // Front Face
      ctx.fillStyle = spinScale >= 0 ? '#ffbe0b' : '#f4a261';
      ctx.beginPath();
      ctx.ellipse(0, 0, Math.max(1, 9 * absSpin), 9, 0, 0, Math.PI * 2);
      ctx.fill();

      // Emblem Star
      if (absSpin > 0.4) {
        ctx.fillStyle = '#fff';
        ctx.fillRect(-1.5 * absSpin, -3, 3 * absSpin, 6);
      }
    } else if (this.type === 'sandwich_coin') {
      // Monumental Coin of Sandwich
      const spinScale = Math.cos(this.animTimer * 1.2);
      const absSpin = Math.abs(spinScale);

      // Outer golden aura
      ctx.fillStyle = 'rgba(255, 190, 11, 0.25)';
      ctx.beginPath();
      ctx.arc(0, 0, 32, 0, Math.PI * 2);
      ctx.fill();

      // Giant Coin Rim
      ctx.fillStyle = '#d4af37';
      ctx.beginPath();
      ctx.ellipse(0, 0, Math.max(2, 20 * absSpin), 20, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Sandwich Icon Engraving
      if (absSpin > 0.5) {
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🥪', 0, 0);
      }
    } else if (this.type === 'holy_condiment') {
      // The Holy Golden Condiment (Radiant Relic Jar)
      ctx.fillStyle = '#ffd166';
      ctx.beginPath();
      ctx.arc(0, 0, 14, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#fff';
      ctx.font = '16px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('✨', 0, 0);
    }

    ctx.restore();
  }
}
