import { Projectile } from './Projectile';
import { Enemy } from './Enemy';
import { SoundEngine } from '../core/SoundEngine';
import { ParticleSystem } from '../core/ParticleSystem';
import { Camera } from '../core/Camera';

export class Boss {
  public x: number;
  public y: number;
  public baseX: number;
  public baseY: number;
  public slamGroundY: number;
  public vx: number = 0;
  public vy: number = 0;

  public health: number = 40;
  public maxHealth: number = 40;
  public isAlive: boolean = true;
  public name: string = 'Lord Crustifer';
  public title: string = 'Sovereign of the Infinite Banquet';

  public animTimer: number = 0;
  public attackTimer: number = 0;
  public attackPhase: number = 1;
  public width: number = 110;
  public height: number = 130;
  public hitFlashTimer: number = 0;

  // Seismic Toaster Slam Mechanics
  public slamState: 'idle' | 'rising' | 'tracking' | 'plunging' | 'recovering' = 'idle';
  public slamTimer: number = 0;
  public slamCooldown: number = 5.0;
  public slamTargetX: number = 0;
  public minionSpawnCooldown: number = 4.0;
  public meteorRainTimer: number = 0;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
    this.baseX = x;
    this.baseY = y;
    this.slamGroundY = y;
    this.slamTargetX = x;
  }

  public update(
    dt: number,
    players: { x: number; y: number; isAlive: boolean; isInBubble?: boolean }[],
    projectiles: Projectile[],
    enemies?: Enemy[],
    sound?: SoundEngine,
    particles?: ParticleSystem,
    camera?: Camera
  ): void {
    if (!this.isAlive) return;

    this.animTimer += dt;
    this.attackTimer += dt;
    if (this.hitFlashTimer > 0) this.hitFlashTimer -= dt;

    // Determine current phase based on health thresholds
    if (this.health <= 14) {
      this.attackPhase = 3; // Desperation
    } else if (this.health <= 28) {
      this.attackPhase = 2; // Seismic Fury
    } else {
      this.attackPhase = 1; // Sovereign Monarch
    }

    const livingPlayers = players.filter(p => p.isAlive && !p.isInBubble);

    // --- SEISMIC TOASTER SLAM STATE MACHINE ---
    if (this.slamState !== 'idle') {
      this.updateSlamCycle(dt, livingPlayers, projectiles, sound, particles, camera);
      return;
    }

    // Normal Hovering & Gliding
    if (this.slamState === 'idle') {
      const glideSpeed = this.attackPhase === 3 ? 2.4 : (this.attackPhase === 2 ? 1.8 : 1.2);
      const glideRadius = this.attackPhase === 3 ? 190 : 140;
      this.x = this.baseX + Math.sin(this.animTimer * glideSpeed) * glideRadius;
      this.y = this.baseY + Math.sin(this.animTimer * 2.8) * 22;

      // Phase 2 & 3: Check Toaster Slam trigger
      if (this.attackPhase >= 2) {
        this.slamCooldown -= dt;
        if (this.slamCooldown <= 0 && livingPlayers.length > 0) {
          this.initiateToasterSlam(livingPlayers);
          return;
        }
      }

      // Phase 1 & 2: Minion Spawns (Crumb Imps)
      if (this.attackPhase <= 2 && enemies) {
        this.minionSpawnCooldown -= dt;
        const currentMinions = enemies.filter(e => e.isAlive).length;
        if (this.minionSpawnCooldown <= 0 && currentMinions < 3) {
          this.minionSpawnCooldown = this.attackPhase === 2 ? 10.0 : 8.0;
          this.spawnCrumbMinions(enemies, sound, particles);
        }
      }

      // Phase 3: Raining Abyssal Crouton Meteors
      if (this.attackPhase === 3) {
        this.meteorRainTimer += dt;
        if (this.meteorRainTimer >= 1.2) {
          this.meteorRainTimer = 0;
          this.spawnAbyssalMeteors(livingPlayers, projectiles);
        }
      }

      // Projectile attack routine
      const cooldown = this.attackPhase === 3 ? 1.2 : (this.attackPhase === 2 ? 1.8 : 2.4);
      if (this.attackTimer >= cooldown) {
        this.attackTimer = 0;
        this.executeRangedAttack(livingPlayers, projectiles);
      }
    }
  }

  private initiateToasterSlam(livingPlayers: { x: number; y: number }[]): void {
    this.slamState = 'rising';
    this.slamTimer = 0.55;
    this.vy = -750;
    const target = livingPlayers[Math.floor(Math.random() * livingPlayers.length)];
    this.slamTargetX = target ? target.x : this.baseX;
  }

  private updateSlamCycle(
    dt: number,
    livingPlayers: { x: number; y: number }[],
    projectiles: Projectile[],
    sound?: SoundEngine,
    particles?: ParticleSystem,
    camera?: Camera
  ): void {
    if (this.slamState === 'rising') {
      this.y += this.vy * dt;
      this.slamTimer -= dt;
      if (this.slamTimer <= 0) {
        this.slamState = 'tracking';
        this.slamTimer = 0.85; // Shadow tracks players for 0.85s
        this.y = this.baseY - 260;
      }
    } else if (this.slamState === 'tracking') {
      this.slamTimer -= dt;
      // Track nearest player horizontally
      if (livingPlayers.length > 0) {
        const target = livingPlayers[0];
        const dx = target.x - this.slamTargetX;
        this.slamTargetX += dx * 4.5 * dt;
      }
      this.x = this.slamTargetX;

      if (this.slamTimer <= 0) {
        this.slamState = 'plunging';
        this.vy = 1350;
      }
    } else if (this.slamState === 'plunging') {
      this.x = this.slamTargetX;
      this.y += this.vy * dt;

      // Slam impact on ground!
      if (this.y >= this.slamGroundY) {
        this.y = this.slamGroundY;
        this.slamState = 'recovering';
        this.slamTimer = 1.35; // Dazed / vulnerable window for knights!
        this.slamCooldown = this.attackPhase === 3 ? 4.2 : 6.0;

        sound?.playBossSlam();
        camera?.addTrauma(0.7);
        particles?.emitHardLandingBurst(this.x, this.y);
        particles?.emitFire(this.x, this.y, 25);
        particles?.emitCombatText(this.x, this.y - 70, '💥 SEISMIC TOASTER SLAM!', '#ef476f', 16);

        // Ground-running cheese waves traveling left and right!
        projectiles.push(new Projectile(
          this.x - 40,
          this.y - 12,
          -380,
          -40,
          'magma_blob',
          -1,
          1
        ));
        projectiles.push(new Projectile(
          this.x + 40,
          this.y - 12,
          380,
          -40,
          'magma_blob',
          -1,
          1
        ));
      }
    } else if (this.slamState === 'recovering') {
      this.slamTimer -= dt;
      // Shaking recovery
      this.x = this.slamTargetX + (Math.random() - 0.5) * 4;
      if (this.slamTimer <= 0) {
        this.slamState = 'idle';
        this.y = this.baseY;
      }
    }
  }

  private spawnCrumbMinions(enemies: Enemy[], sound?: SoundEngine, particles?: ParticleSystem): void {
    const leftSpawnX = this.x - 140;
    const rightSpawnX = this.x + 140;
    enemies.push(new Enemy(leftSpawnX, this.slamGroundY, 'grunt'));
    enemies.push(new Enemy(rightSpawnX, this.slamGroundY, 'grunt'));
    sound?.playEnemyDamage();
    particles?.emitDeathPoof(leftSpawnX, this.slamGroundY - 20, '#ffd166');
    particles?.emitDeathPoof(rightSpawnX, this.slamGroundY - 20, '#ffd166');
    particles?.emitCombatText(this.x, this.y - 85, '🍞 CRUMB IMPS SPAWNED!', '#ffd166', 13);
  }

  private spawnAbyssalMeteors(livingPlayers: { x: number; y: number }[], projectiles: Projectile[]): void {
    for (let i = 0; i < 2; i++) {
      const target = livingPlayers[Math.floor(Math.random() * livingPlayers.length)];
      const targetX = target ? target.x + (Math.random() - 0.5) * 160 : this.baseX + (Math.random() - 0.5) * 300;
      const meteorY = this.baseY - 320;
      projectiles.push(new Projectile(
        targetX,
        meteorY,
        (Math.random() - 0.5) * 80,
        420,
        'firebomb',
        -1,
        1
      ));
    }
  }

  private executeRangedAttack(living: { x: number; y: number }[], projectiles: Projectile[]): void {
    if (living.length === 0) return;

    const target = living[Math.floor(Math.random() * living.length)];
    const angle = Math.atan2((target.y - 20) - this.y, target.x - this.x);

    if (this.attackPhase === 1) {
      // 3-way Golden Sesame Spread
      for (let i = -1; i <= 1; i++) {
        const a = angle + i * 0.28;
        projectiles.push(new Projectile(
          this.x,
          this.y - 20,
          Math.cos(a) * 340,
          Math.sin(a) * 340,
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
          Math.cos(a) * 400,
          Math.sin(a) * 400,
          'firebomb',
          -1,
          1
        ));
      }
    } else {
      // 8-way Rapid Culinary Whirlwind Ring
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2 + this.animTimer * 1.5;
        projectiles.push(new Projectile(
          this.x,
          this.y - 20,
          Math.cos(a) * 290,
          Math.sin(a) * 290,
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
    this.hitFlashTimer = 0.22;
    if (this.health <= 0) {
      this.health = 0;
      this.isAlive = false;
      return true; // Boss slain!
    }
    return false;
  }

  public render(ctx: CanvasRenderingContext2D): void {
    if (!this.isAlive) return;

    // 1. Render Ground Shadow / Warning Decal during Toaster Slam
    if (this.slamState === 'tracking' || this.slamState === 'plunging') {
      ctx.save();
      const shadowPulse = Math.sin(performance.now() * 0.02) * 0.25 + 0.75;
      ctx.fillStyle = `rgba(239, 71, 111, ${shadowPulse * 0.45})`;
      ctx.strokeStyle = '#ef476f';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.ellipse(this.slamTargetX, this.slamGroundY, 60, 16, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#fff';
      ctx.font = 'bold 10px "Press Start 2P", monospace';
      ctx.textAlign = 'center';
      ctx.fillText('⚠️ SLAM DANGER!', this.slamTargetX, this.slamGroundY - 24);
      ctx.restore();
    }

    ctx.save();
    ctx.translate(this.x, this.y);

    if (this.hitFlashTimer > 0) {
      ctx.filter = 'brightness(2.2)';
    }

    // Aura Glow
    const auraColor = this.attackPhase === 3 ? 'rgba(255, 0, 84, 0.45)' : (this.attackPhase === 2 ? 'rgba(255, 120, 0, 0.35)' : 'rgba(255, 190, 11, 0.28)');
    ctx.fillStyle = auraColor;
    ctx.beginPath();
    ctx.arc(0, -this.height * 0.5, 95, 0, Math.PI * 2);
    ctx.fill();

    // Colossal Bread Crust Body
    ctx.fillStyle = '#8b5a2b';
    ctx.strokeStyle = this.attackPhase === 3 ? '#ff0054' : '#ffd166';
    ctx.lineWidth = 4.5;
    ctx.beginPath();
    ctx.roundRect(-this.width * 0.5, -this.height, this.width, this.height, 18);
    ctx.fill();
    ctx.stroke();

    // Molten Cheese Core (Bubbles dynamically)
    ctx.fillStyle = this.attackPhase === 3 ? '#ff5400' : '#ffbe0b';
    ctx.fillRect(-this.width * 0.4, -this.height * 0.65, this.width * 0.8, 30);
    const bubble1 = Math.sin(this.animTimer * 6) * 5;
    const bubble2 = Math.cos(this.animTimer * 8) * 4;
    ctx.beginPath();
    ctx.arc(-15 + bubble1, -this.height * 0.55, 6, 0, Math.PI * 2);
    ctx.arc(15 + bubble2, -this.height * 0.52, 7, 0, Math.PI * 2);
    ctx.fill();

    // Fiery Toasted Crown
    ctx.fillStyle = this.attackPhase === 3 ? '#ef4444' : '#ffd166';
    ctx.beginPath();
    ctx.moveTo(-40, -this.height);
    ctx.lineTo(-20, -this.height - 26);
    ctx.lineTo(0, -this.height - 12);
    ctx.lineTo(20, -this.height - 26);
    ctx.lineTo(40, -this.height);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Glowing Eyes
    const eyeColor = this.attackPhase === 3 ? '#ff0054' : (this.attackPhase === 2 ? '#ff9e00' : '#ffffff');
    ctx.fillStyle = eyeColor;
    ctx.fillRect(-24, -this.height * 0.8, 12, 10);
    ctx.fillRect(12, -this.height * 0.8, 12, 10);

    // Dazed Recovery Stars
    if (this.slamState === 'recovering') {
      ctx.fillStyle = '#ffd166';
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      const starRot = this.animTimer * 5;
      ctx.fillText('💫 DAZED! STRIKE NOW! 💫', 0, -this.height - 16);
    }

    ctx.restore();
  }
}
