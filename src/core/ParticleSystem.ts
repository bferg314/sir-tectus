export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  decay: number;
  gravity?: number;
  type?: 'circle' | 'spark' | 'ring' | 'bubble' | 'heart';
}

export interface CombatText {
  x: number;
  y: number;
  text: string;
  color: string;
  alpha: number;
  size: number;
}

export class ParticleSystem {
  private particles: Particle[] = [];
  private combatTexts: CombatText[] = [];
  private readonly maxParticles: number = 800;

  public update(dt: number): void {
    // Update particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (p.type === 'heart') {
        p.x += Math.sin(p.y * 0.1) * 14 * dt;
      }
      if (p.gravity) p.vy += p.gravity * dt;
      p.alpha -= p.decay * dt;

      if (p.alpha <= 0) {
        this.particles.splice(i, 1);
      }
    }

    // Update floating combat text
    for (let i = this.combatTexts.length - 1; i >= 0; i--) {
      const ct = this.combatTexts[i];
      ct.y -= 38 * dt;
      ct.alpha -= 1.6 * dt;
      if (ct.alpha <= 0) {
        this.combatTexts.splice(i, 1);
      }
    }
  }

  public render(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      ctx.globalAlpha = Math.max(0, Math.min(1, p.alpha));
      ctx.fillStyle = p.color;

      if (p.type === 'ring') {
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * (2.0 - p.alpha), 0, Math.PI * 2);
        ctx.stroke();
      } else if (p.type === 'spark') {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(Math.atan2(p.vy, p.vx));
        ctx.fillRect(-p.size * 1.5, -p.size * 0.5, p.size * 3, p.size);
        ctx.restore();
      } else if (p.type === 'bubble') {
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.stroke();
      } else if (p.type === 'heart') {
        ctx.font = `${Math.floor(p.size)}px "Outfit", sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('💔', p.x, p.y);
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Render Combat Texts with drop shadow
    for (let i = 0; i < this.combatTexts.length; i++) {
      const ct = this.combatTexts[i];
      ctx.globalAlpha = Math.max(0, Math.min(1, ct.alpha));
      ctx.font = `bold ${ct.size}px "Outfit", sans-serif`;
      ctx.textAlign = 'center';

      // Shadow
      ctx.fillStyle = '#000000';
      ctx.fillText(ct.text, ct.x + 1, ct.y + 1);

      // Main text
      ctx.fillStyle = ct.color;
      ctx.fillText(ct.text, ct.x, ct.y);
    }
    ctx.restore();
  }

  public emitSparks(x: number, y: number, color: string = '#ffd166', count: number = 8): void {
    for (let i = 0; i < count; i++) {
      if (this.particles.length >= this.maxParticles) break;
      const angle = Math.random() * Math.PI * 2;
      const speed = 60 + Math.random() * 180;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 1.5 + Math.random() * 2.5,
        color,
        alpha: 1.0,
        decay: 2.0 + Math.random() * 2.0,
        gravity: 280,
        type: 'spark'
      });
    }
  }

  public emitFire(x: number, y: number, count: number = 6): void {
    const colors = ['#ffbe0b', '#fb5607', '#ff006e', '#ffaa00'];
    for (let i = 0; i < count; i++) {
      if (this.particles.length >= this.maxParticles) break;
      this.particles.push({
        x: x + (Math.random() * 16 - 8),
        y: y + (Math.random() * 16 - 8),
        vx: (Math.random() - 0.5) * 40,
        vy: -40 - Math.random() * 70,
        size: 3 + Math.random() * 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: 0.9,
        decay: 1.8 + Math.random() * 1.5
      });
    }
  }

  public emitWaterSplash(x: number, y: number, count: number = 8): void {
    const colors = ['#4cc9f0', '#4895ef', '#a2d2ff', '#ffffff'];
    for (let i = 0; i < count; i++) {
      if (this.particles.length >= this.maxParticles) break;
      const angle = -Math.PI * 0.5 + (Math.random() - 0.5) * 1.2;
      const speed = 80 + Math.random() * 160;
      this.particles.push({
        x: x + (Math.random() * 12 - 6),
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 2 + Math.random() * 3,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: 0.85,
        decay: 2.2,
        gravity: 420
      });
    }
  }

  public emitCoinShine(x: number, y: number): void {
    for (let i = 0; i < 6; i++) {
      if (this.particles.length >= this.maxParticles) break;
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.random() * 14;
      this.particles.push({
        x: x + Math.cos(angle) * dist,
        y: y + Math.sin(angle) * dist,
        vx: 0,
        vy: -20 - Math.random() * 30,
        size: 1.5 + Math.random() * 2,
        color: '#ffbe0b',
        alpha: 1.0,
        decay: 2.2,
        type: 'spark'
      });
    }
  }

  public emitDeathPoof(x: number, y: number, color: string = '#cbd5e1', count: number = 18): void {
    // 1. Expanding shock ring
    this.emitRing(x, y, color, 42);
    // 2. Flying debris and smoke particles
    for (let i = 0; i < count; i++) {
      if (this.particles.length >= this.maxParticles) break;
      const angle = Math.random() * Math.PI * 2;
      const speed = 70 + Math.random() * 220;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 60,
        size: 2.5 + Math.random() * 4,
        color: i % 2 === 0 ? color : '#334155',
        alpha: 1.0,
        decay: 1.8 + Math.random() * 1.5,
        gravity: 420,
        type: i % 3 === 0 ? 'spark' : undefined
      });
    }
  }

  public emitSlashSparks(x: number, y: number, facingLeft: boolean): void {
    const baseAngle = facingLeft ? Math.PI : 0;
    for (let i = 0; i < 10; i++) {
      if (this.particles.length >= this.maxParticles) break;
      const spread = (Math.random() - 0.5) * 1.4;
      const speed = 120 + Math.random() * 240;
      this.particles.push({
        x,
        y,
        vx: Math.cos(baseAngle + spread) * speed,
        vy: Math.sin(baseAngle + spread) * speed - 40,
        size: 2 + Math.random() * 2.5,
        color: Math.random() > 0.4 ? '#ffffff' : '#ffd166',
        alpha: 1.0,
        decay: 3.2,
        gravity: 300,
        type: 'spark'
      });
    }
  }

  public emitRing(x: number, y: number, color: string = '#ffffff', size: number = 32): void {
    if (this.particles.length >= this.maxParticles) return;
    this.particles.push({
      x,
      y,
      vx: 0,
      vy: 0,
      size,
      color,
      alpha: 1.0,
      decay: 3.5,
      type: 'ring'
    });
  }

  public emitBubbleShimmer(x: number, y: number): void {
    if (this.particles.length >= this.maxParticles) return;
    this.particles.push({
      x: x + (Math.random() * 28 - 14),
      y: y + (Math.random() * 28 - 14),
      vx: (Math.random() - 0.5) * 15,
      vy: -10 - Math.random() * 20,
      size: 3 + Math.random() * 4,
      color: 'rgba(239, 71, 111, 0.7)',
      alpha: 0.8,
      decay: 1.2,
      type: 'bubble'
    });
  }

  public emitSandwichAura(x: number, y: number): void {
    if (this.particles.length >= this.maxParticles) return;
    this.particles.push({
      x: x + (Math.random() * 20 - 10),
      y: y + (Math.random() * 20 - 10),
      vx: (Math.random() - 0.5) * 25,
      vy: -20 - Math.random() * 30,
      size: 2.5 + Math.random() * 3,
      color: '#ffe66d',
      alpha: 0.9,
      decay: 1.5,
      type: 'spark'
    });
  }

  public emitBrokenHeart(x: number, y: number): void {
    if (this.particles.length >= this.maxParticles) return;
    this.particles.push({
      x,
      y,
      vx: (Math.random() - 0.5) * 16,
      vy: -75,
      size: 24,
      color: '#ef476f',
      alpha: 1.0,
      decay: 0.8, // ~1.25s duration
      gravity: -10, // gently drifts upward
      type: 'heart'
    });

    // Red shard sparks
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI * 2 * i) / 6;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * (50 + Math.random() * 40),
        vy: Math.sin(angle) * (50 + Math.random() * 40) - 30,
        size: 2.5 + Math.random() * 2,
        color: i % 2 === 0 ? '#ef476f' : '#ff4d6d',
        alpha: 1.0,
        decay: 1.6,
        gravity: 120,
        type: 'circle'
      });
    }
  }

  public emitCombatText(x: number, y: number, text: string, color: string = '#ffd166', size: number = 14): void {
    this.combatTexts.push({
      x: x + (Math.random() * 10 - 5),
      y,
      text,
      color,
      alpha: 1.0,
      size
    });
  }

  public clear(): void {
    this.particles = [];
    this.combatTexts = [];
  }
}
