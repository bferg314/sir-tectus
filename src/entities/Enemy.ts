import { Platform } from '../world/BiomeTypes';
import { Projectile } from './Projectile';

export type EnemyType = 'grunt' | 'archer' | 'floater' | 'vanguard' | 'pyromancer' | 'berserker' | 'wraith';

export class Enemy {
  public x: number;
  public y: number;
  public vx: number = 0;
  public vy: number = 0;
  public type: EnemyType;
  public health: number;
  public maxHealth: number;
  public isAlive: boolean = true;
  public isDying: boolean = false;
  public deathTimer: number = 0;
  public facingLeft: boolean = true;
  public width: number = 28;
  public height: number = 40;

  public hitCooldown: number = 0;
  public hitFlashTimer: number = 0;
  public attackCooldown: number = 0;
  public attackTelegraphTimer: number = 0;
  public isAttacking: boolean = false;
  public attackSwingTimer: number = 0;

  // Vanguard specific
  public isShieldGuarding: boolean = true;

  // Pyromancer specific
  public teleportCooldown: number = 0;
  public teleportFlashTimer: number = 0;

  // Berserker specific
  public isEnraged: boolean = false;

  private patrolDir: number = 1;
  private animTimer: number = 0;
  public isAggro: boolean = false;
  public targetPlayer: { x: number; y: number; isAlive: boolean } | null = null;

  constructor(x: number, y: number, type: EnemyType = 'grunt') {
    this.x = x;
    this.y = y;
    this.type = type;
    if (type === 'grunt') {
      this.maxHealth = 3;
    } else if (type === 'archer') {
      this.maxHealth = 2;
    } else if (type === 'floater') {
      this.maxHealth = 1;
    } else if (type === 'vanguard') {
      this.maxHealth = 5;
      this.width = 32;
    } else if (type === 'pyromancer') {
      this.maxHealth = 3;
    } else if (type === 'berserker') {
      this.maxHealth = 6;
      this.width = 32;
    } else if (type === 'wraith') {
      this.maxHealth = 3;
    } else {
      this.maxHealth = 2;
    }
    this.health = this.maxHealth;
    this.animTimer = Math.random() * 5;
    this.patrolDir = Math.random() > 0.5 ? 1 : -1;
  }

  public update(
    dt: number,
    platforms: Platform[],
    players: { x: number; y: number; isAlive: boolean; isInBubble?: boolean }[],
    projectiles: Projectile[]
  ): void {
    if (!this.isAlive) return;

    // Death dissolve animation timer
    if (this.isDying) {
      this.deathTimer -= dt;
      this.vy += 600 * dt;
      this.x += this.vx * dt;
      this.y += this.vy * dt;
      if (this.deathTimer <= 0) {
        this.isAlive = false;
      }
      return;
    }

    this.animTimer += dt;
    if (this.attackCooldown > 0) this.attackCooldown -= dt;
    if (this.hitCooldown > 0) this.hitCooldown -= dt;
    if (this.hitFlashTimer > 0) this.hitFlashTimer -= dt;
    if (this.teleportCooldown > 0) this.teleportCooldown -= dt;
    if (this.teleportFlashTimer > 0) this.teleportFlashTimer -= dt;

    // Smooth knockback decay
    if (this.hitCooldown > 0) {
      this.vx *= 0.88;
    }

    // Find nearest active living player
    let nearestDist = 9999;
    this.targetPlayer = null;
    for (let i = 0; i < players.length; i++) {
      const p = players[i];
      if (p.isAlive && !p.isInBubble) {
        const d = Math.hypot(p.x - this.x, p.y - this.y);
        if (d < nearestDist) {
          nearestDist = d;
          this.targetPlayer = p;
        }
      }
    }

    this.isAggro = !!this.targetPlayer && nearestDist < 440;

    // Handle Active Attacks & Telegraphing
    if (this.isAttacking) {
      this.attackSwingTimer -= dt;
      if (this.attackSwingTimer <= 0) {
        this.isAttacking = false;
      }
    }

    if (this.type === 'floater') {
      // Sinusoidal hover + swoop chase
      if (this.isAggro && this.targetPlayer) {
        this.facingLeft = this.targetPlayer.x < this.x;
        const dx = this.targetPlayer.x - this.x;
        const dy = (this.targetPlayer.y - 20) - this.y;
        const dist = Math.hypot(dx, dy);

        if (dist > 40) {
          const swoopSpeed = 110;
          this.vx = (dx / dist) * swoopSpeed;
          this.vy = (dy / dist) * swoopSpeed + Math.sin(this.animTimer * 5) * 25;
        }
      } else {
        this.vx = Math.cos(this.animTimer * 2) * 50;
        this.vy = Math.sin(this.animTimer * 3.5) * 35;
      }
    } else if (this.type === 'wraith') {
      // Spectral phantom: glides through walls, casts homing void skulls
      if (this.isAggro && this.targetPlayer) {
        this.facingLeft = this.targetPlayer.x < this.x;
        const dx = this.targetPlayer.x - this.x;
        const dy = (this.targetPlayer.y - 18) - this.y;
        const dist = Math.hypot(dx, dy);

        if (dist > 45) {
          const speed = 90;
          this.vx = (dx / dist) * speed;
          this.vy = (dy / dist) * speed + Math.sin(this.animTimer * 3) * 16;
        } else {
          this.vx = Math.cos(this.animTimer * 3) * 30;
          this.vy = Math.sin(this.animTimer * 3) * 30;
        }

        // Void skull channeling attack
        if (this.attackCooldown <= 0 && this.attackTelegraphTimer <= 0) {
          this.attackTelegraphTimer = 0.55;
        }

        if (this.attackTelegraphTimer > 0) {
          this.attackTelegraphTimer -= dt;
          this.vx *= 0.4;
          this.vy *= 0.4;
          if (this.attackTelegraphTimer <= 0) {
            this.attackCooldown = 3.2;
            const skullDir = this.facingLeft ? -1 : 1;
            projectiles.push(new Projectile(
              this.x + skullDir * 14,
              this.y - 16,
              skullDir * 150,
              -30,
              'void_skull',
              -1,
              1
            ));
          }
        }
      } else {
        this.vx = Math.cos(this.animTimer * 1.6) * 45;
        this.vy = Math.sin(this.animTimer * 2.2) * 28;
      }
    } else {
      // Ground enemies: Grunt, Archer, Vanguard, Pyromancer, Berserker
      this.vy += 880 * dt; // Gravity

      if (this.isAggro && this.targetPlayer) {
        this.facingLeft = this.targetPlayer.x < this.x;
        const dirX = this.facingLeft ? -1 : 1;

        if (this.type === 'grunt') {
          // Grunt: charges within melee range, winds up axe, swings!
          if (nearestDist < 58 && this.attackCooldown <= 0 && this.attackTelegraphTimer <= 0) {
            this.attackTelegraphTimer = 0.35;
            this.vx = 0;
          }

          if (this.attackTelegraphTimer > 0) {
            this.attackTelegraphTimer -= dt;
            this.vx = 0;
            if (this.attackTelegraphTimer <= 0) {
              this.isAttacking = true;
              this.attackSwingTimer = 0.25;
              this.attackCooldown = 1.8;
              this.vx = dirX * 180; // Short forward lunge
            }
          } else if (!this.isAttacking && this.hitCooldown <= 0.08) {
            this.vx = dirX * 115;
          }
        } else if (this.type === 'archer') {
          // Archer: maintains distance (140-360px), draws bow, fires
          if (nearestDist < 120) {
            this.vx = -dirX * 90;
          } else if (nearestDist > 340) {
            this.vx = dirX * 70;
          } else {
            this.vx = 0;
            if (this.attackCooldown <= 0 && this.attackTelegraphTimer <= 0) {
              this.attackTelegraphTimer = 0.55;
            }
          }

          if (this.attackTelegraphTimer > 0) {
            this.attackTelegraphTimer -= dt;
            this.vx = 0;
            if (this.attackTelegraphTimer <= 0) {
              this.attackCooldown = 2.4;
              projectiles.push(new Projectile(
                this.x + dirX * 18,
                this.y - 18,
                dirX * 460,
                -50,
                'arrow',
                -1,
                1
              ));
            }
          }
        } else if (this.type === 'vanguard') {
          // Vanguard: Heavy shield raised, steady march, shield bash
          this.isShieldGuarding = !this.isAttacking;
          if (nearestDist < 52 && this.attackCooldown <= 0 && this.attackTelegraphTimer <= 0) {
            this.attackTelegraphTimer = 0.38;
            this.vx = 0;
          }

          if (this.attackTelegraphTimer > 0) {
            this.attackTelegraphTimer -= dt;
            this.vx = 0;
            if (this.attackTelegraphTimer <= 0) {
              this.isAttacking = true;
              this.attackSwingTimer = 0.26;
              this.attackCooldown = 2.2;
              this.vx = dirX * 170; // Heavy shield bash lunge
            }
          } else if (!this.isAttacking && this.hitCooldown <= 0.08) {
            this.vx = dirX * 65; // Steady armored march
          }
        } else if (this.type === 'pyromancer') {
          // Pyromancer: Keeps distance, teleports when rushed, lobs firebombs
          if (nearestDist < 65 && this.teleportCooldown <= 0) {
            // Instant emergency teleport!
            this.teleportFlashTimer = 0.28;
            this.teleportCooldown = 4.2;
            this.x += -dirX * 180;
            this.vx = 0;
            this.vy = -120;
          } else if (nearestDist < 150) {
            this.vx = -dirX * 85; // Step back
          } else if (nearestDist > 330) {
            this.vx = dirX * 75; // Step forward
          } else {
            this.vx = 0;
            if (this.attackCooldown <= 0 && this.attackTelegraphTimer <= 0) {
              this.attackTelegraphTimer = 0.5;
            }
          }

          if (this.attackTelegraphTimer > 0) {
            this.attackTelegraphTimer -= dt;
            this.vx = 0;
            if (this.attackTelegraphTimer <= 0) {
              this.attackCooldown = 2.6;
              projectiles.push(new Projectile(
                this.x + dirX * 16,
                this.y - 22,
                dirX * 240,
                -270,
                'firebomb',
                -1,
                1
              ));
            }
          }
        } else if (this.type === 'berserker') {
          // Berserker: Aggressive sprint, enrages below 3 HP, 360 whirlwind attack
          this.isEnraged = this.health <= 2;
          const sprintSpeed = this.isEnraged ? 215 : 155;

          if (nearestDist < 62 && this.attackCooldown <= 0 && this.attackTelegraphTimer <= 0) {
            this.attackTelegraphTimer = 0.32;
            this.vx = 0;
          }

          if (this.attackTelegraphTimer > 0) {
            this.attackTelegraphTimer -= dt;
            this.vx = 0;
            if (this.attackTelegraphTimer <= 0) {
              this.isAttacking = true;
              this.attackSwingTimer = 0.42;
              this.attackCooldown = this.isEnraged ? 1.4 : 2.2;
              this.vx = dirX * 220; // Whirlwind rush!
            }
          } else if (!this.isAttacking && this.hitCooldown <= 0.08) {
            this.vx = dirX * sprintSpeed;
          }
        }
      } else {
        // Peaceful patrol
        this.attackTelegraphTimer = 0;
        this.isAttacking = false;
        if (this.hitCooldown <= 0.08) {
          const patrolSpeed = this.type === 'vanguard' ? 35 : 45;
          this.vx = this.patrolDir * patrolSpeed;
          this.facingLeft = this.patrolDir < 0;
        }
        if (Math.random() < 0.008) this.patrolDir *= -1;
      }

      // Platform collisions for ground enemies
      for (let i = 0; i < platforms.length; i++) {
        const p = platforms[i];
        if (p.isCrumbled) continue;
        if (
          this.x + this.width * 0.5 > p.x &&
          this.x - this.width * 0.5 < p.x + p.w &&
          this.y > p.y && this.y - this.height < p.y + p.h
        ) {
          if (this.vy > 0) {
            this.y = p.y;
            this.vy = 0;
          }
        }
      }
    }

    this.x += this.vx * dt;
    this.y += this.vy * dt;
  }

  public takeDamage(amount: number, kbX: number = 0, kbY: number = -170): boolean {
    if (!this.isAlive || this.isDying) return false;

    this.health -= amount;
    this.hitFlashTimer = 0.22;
    this.hitCooldown = 0.22;
    this.vx = kbX;
    this.vy = kbY;

    if (this.type === 'berserker' && this.health <= 2) {
      this.isEnraged = true;
    }

    // Interrupt attack windup when struck
    this.attackTelegraphTimer = 0;
    this.isAttacking = false;

    if (this.health <= 0) {
      this.health = 0;
      this.isDying = true;
      this.deathTimer = 0.25;
      this.vx = kbX * 1.2;
      this.vy = kbY * 1.2;
      return true; // Slayed!
    }
    return false;
  }

  public isFrontalShieldBlock(attackerX: number, isDownThrust: boolean): boolean {
    if (this.type !== 'vanguard' || !this.isAlive || this.isDying) return false;
    if (isDownThrust) return false; // Pogo jump plunge bypasses shield from above!
    if (this.hitCooldown > 0.08) return false; // Vanguard stunned during knockback
    // If vanguard faces left, attacker must be to the left to be blocked
    if (this.facingLeft && attackerX < this.x + 12) return true;
    // If vanguard faces right, attacker must be to the right to be blocked
    if (!this.facingLeft && attackerX > this.x - 12) return true;
    return false;
  }

  public getMeleeHitbox(): { x: number; y: number; w: number; h: number } | null {
    if (!this.isAttacking) return null;
    const dir = this.facingLeft ? -1 : 1;
    if (this.type === 'grunt') {
      return {
        x: dir > 0 ? this.x : this.x - 42,
        y: this.y - 36,
        w: 42,
        h: 38
      };
    } else if (this.type === 'vanguard') {
      return {
        x: dir > 0 ? this.x : this.x - 48,
        y: this.y - 38,
        w: 48,
        h: 40
      };
    } else if (this.type === 'berserker') {
      // 360 whirlwind covers full body perimeter
      return {
        x: this.x - 38,
        y: this.y - 40,
        w: 76,
        h: 42
      };
    }
    return null;
  }

  public render(ctx: CanvasRenderingContext2D): void {
    if (!this.isAlive) return;

    ctx.save();
    ctx.translate(this.x, this.y);

    // Dying dissolve scale & opacity
    if (this.isDying) {
      const dissolve = Math.max(0, this.deathTimer / 0.25);
      ctx.globalAlpha = dissolve;
      ctx.scale(dissolve, dissolve);
    }

    // Health Bar above enemy head
    if (!this.isDying) {
      const barW = 28;
      const barH = 4;
      const barY = -this.height - 12;

      // Dark background container
      ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
      ctx.fillRect(-barW * 0.5, barY, barW, barH);
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 1;
      ctx.strokeRect(-barW * 0.5, barY, barW, barH);

      // Health fill
      const hpPct = Math.max(0, this.health / this.maxHealth);
      ctx.fillStyle = hpPct > 0.5 ? '#06d6a0' : (hpPct > 0.25 ? '#ffd166' : '#ef476f');
      ctx.fillRect(-barW * 0.5 + 0.5, barY + 0.5, (barW - 1) * hpPct, barH - 1);

      // Alert Exclamation Icon if Aggro or Winding up
      if (this.isAggro) {
        const isTelegraphing = this.attackTelegraphTimer > 0;
        ctx.fillStyle = isTelegraphing ? '#ef476f' : '#ffbe0b';
        ctx.font = `bold ${isTelegraphing ? 13 : 11}px "Outfit", sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText('!', 0, barY - 4);
      }
    }

    // Archer aiming laser line telegraph
    if (this.type === 'archer' && this.attackTelegraphTimer > 0 && this.targetPlayer) {
      const dirX = this.facingLeft ? -1 : 1;
      ctx.save();
      ctx.strokeStyle = 'rgba(239, 71, 111, 0.65)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(dirX * 12, -18);
      ctx.lineTo(this.targetPlayer.x - this.x, (this.targetPlayer.y - 18) - this.y);
      ctx.stroke();
      ctx.restore();
    }

    // Hit Shake
    if (this.hitFlashTimer > 0) {
      ctx.translate((Math.random() - 0.5) * 4, 0);
    }

    // Direction flip
    const flip = this.facingLeft ? -1 : 1;
    ctx.scale(flip, 1);

    const isFlashing = this.hitFlashTimer > 0;
    const legBob = Math.sin(this.animTimer * 14) * 3;

    if (this.type === 'grunt') {
      // ==========================================
      // ARMORED ORC/GOBLIN GRUNT
      // ==========================================
      // Body & studded armor
      ctx.fillStyle = isFlashing ? '#ffffff' : '#1e3a1e'; // Dark green torso
      ctx.fillRect(-8, -32, 16, 24);

      // Iron Pauldrons / Breastplate
      ctx.fillStyle = isFlashing ? '#ff0054' : '#475569';
      ctx.fillRect(-10, -28, 20, 12);
      ctx.fillStyle = '#64748b';
      ctx.fillRect(-6, -26, 12, 8);

      // Horned Iron Helmet
      ctx.fillStyle = isFlashing ? '#ffffff' : '#334155';
      ctx.fillRect(-10, -38, 20, 10);
      // Horns
      ctx.fillStyle = '#f1f5f9';
      ctx.beginPath();
      ctx.moveTo(-10, -36);
      ctx.lineTo(-15, -44);
      ctx.lineTo(-7, -38);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(10, -36);
      ctx.lineTo(15, -44);
      ctx.lineTo(7, -38);
      ctx.closePath();
      ctx.fill();

      // Menacing Glowing Eyes
      ctx.fillStyle = isFlashing ? '#ffffff' : '#ef476f';
      ctx.fillRect(2, -33, 4, 3);

      // Battleaxe with dynamic swing angle!
      ctx.save();
      if (this.attackTelegraphTimer > 0) {
        // Raised high overhead
        ctx.translate(2, -32);
        ctx.rotate(-Math.PI * 0.45);
      } else if (this.isAttacking) {
        // Swung down in front
        ctx.translate(14, -14);
        ctx.rotate(Math.PI * 0.35);
      } else {
        // Idle bob
        ctx.translate(6, -24 + legBob * 0.5);
      }
      // Axe shaft
      ctx.fillStyle = '#78350f';
      ctx.fillRect(0, -6, 5, 26);
      // Double iron blades
      ctx.fillStyle = isFlashing ? '#ffffff' : '#94a3b8';
      ctx.beginPath();
      ctx.moveTo(3, -4);
      ctx.lineTo(15, -12);
      ctx.lineTo(15, 6);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(0, -4);
      ctx.lineTo(-8, -10);
      ctx.lineTo(-8, 4);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      // Running Legs & Iron Sabatons
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(-7, -8 + Math.max(0, legBob), 6, 8);
      ctx.fillRect(1, -8 + Math.max(0, -legBob), 6, 8);
    } else if (this.type === 'archer') {
      // ==========================================
      // SKELETAL HOODED ARCHER
      // ==========================================
      // Hooded cloak
      ctx.fillStyle = isFlashing ? '#ffffff' : '#334155';
      ctx.beginPath();
      ctx.moveTo(0, -38);
      ctx.lineTo(-10, -24);
      ctx.lineTo(10, -24);
      ctx.closePath();
      ctx.fill();

      // Skeleton Ribcage & Spine
      ctx.fillStyle = isFlashing ? '#ffffff' : '#e2e8f0';
      ctx.fillRect(-5, -28, 10, 20);
      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(-5, -22);
      ctx.lineTo(5, -22);
      ctx.moveTo(-5, -18);
      ctx.lineTo(5, -18);
      ctx.moveTo(-5, -14);
      ctx.lineTo(5, -14);
      ctx.stroke();

      // Glowing amethyst eye sockets
      ctx.fillStyle = isFlashing ? '#ffffff' : '#a855f7';
      ctx.fillRect(1, -30, 3, 3);

      // Quiver with fletched arrows on back
      ctx.fillStyle = '#78350f';
      ctx.fillRect(-9, -26, 4, 14);
      ctx.fillStyle = '#ef476f';
      ctx.fillRect(-9, -30, 2, 4);
      ctx.fillRect(-7, -31, 2, 5);

      // Recurve Bow & Nocked Arrow
      ctx.save();
      const drawTension = this.attackTelegraphTimer > 0 ? 6 : 0;
      ctx.strokeStyle = '#b45309';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.arc(8, -18, 14, -Math.PI * 0.38, Math.PI * 0.38);
      ctx.stroke();

      // Bowstring
      ctx.strokeStyle = '#f8fafc';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(17, -27);
      ctx.lineTo(8 - drawTension, -18);
      ctx.lineTo(17, -9);
      ctx.stroke();

      // Nocked arrow if aiming
      if (this.attackTelegraphTimer > 0) {
        ctx.strokeStyle = '#f8fafc';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(8 - drawTension, -18);
        ctx.lineTo(24, -18);
        ctx.stroke();
      }
      ctx.restore();

      // Bone Legs
      ctx.fillStyle = '#cbd5e1';
      ctx.fillRect(-5, -8 + Math.max(0, legBob), 4, 8);
      ctx.fillRect(1, -8 + Math.max(0, -legBob), 4, 8);
    } else if (this.type === 'floater') {
      // ==========================================
      // VOID BEHOLDER / BAT DEMON
      // ==========================================
      // Pulsing void body orb
      ctx.fillStyle = isFlashing ? '#ffffff' : '#6b21a8';
      ctx.beginPath();
      ctx.arc(0, -14, 13, 0, Math.PI * 2);
      ctx.fill();

      // Central glowing Eye & Pupil tracking player
      ctx.fillStyle = '#ffd166';
      ctx.beginPath();
      ctx.arc(3, -14, 6, 0, Math.PI * 2);
      ctx.fill();

      // Slit pupil
      ctx.fillStyle = '#000000';
      ctx.fillRect(3, -17, 2, 6);

      // Animated flapping leathery wings
      const wingFlap = Math.sin(this.animTimer * 12) * 10;
      ctx.fillStyle = isFlashing ? '#ffffff' : '#4c1d95';
      // Left/Back wing
      ctx.beginPath();
      ctx.moveTo(-6, -14);
      ctx.lineTo(-24, -20 + wingFlap);
      ctx.lineTo(-18, -8);
      ctx.closePath();
      ctx.fill();
      // Right/Front wing
      ctx.beginPath();
      ctx.moveTo(6, -14);
      ctx.lineTo(24, -20 + wingFlap);
      ctx.lineTo(18, -8);
      ctx.closePath();
      ctx.fill();

      // Floating shadow tendrils beneath
      const tendrilWave = Math.sin(this.animTimer * 8) * 3;
      ctx.strokeStyle = '#581c87';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-4, -2);
      ctx.lineTo(-6 + tendrilWave, 8);
      ctx.moveTo(4, -2);
      ctx.lineTo(6 - tendrilWave, 8);
      ctx.stroke();
    } else if (this.type === 'vanguard') {
      // ==========================================
      // VANGUARD SHIELD KNIGHT
      // ==========================================
      // Heavy Steel Sabatons & Greaves
      ctx.fillStyle = isFlashing ? '#ffffff' : '#1e293b';
      ctx.fillRect(-8, -8 + Math.max(0, legBob), 7, 8);
      ctx.fillRect(1, -8 + Math.max(0, -legBob), 7, 8);

      // Plate Torso & Gold Belt
      ctx.fillStyle = isFlashing ? '#ffffff' : '#334155';
      ctx.fillRect(-10, -32, 20, 24);
      ctx.fillStyle = '#64748b';
      ctx.fillRect(-8, -30, 16, 16);
      ctx.fillStyle = '#eab308'; // Gold belt
      ctx.fillRect(-9, -14, 18, 4);

      // Closed Horned Greathelm
      ctx.fillStyle = isFlashing ? '#ffffff' : '#1e293b';
      ctx.fillRect(-9, -40, 18, 12);
      ctx.fillStyle = '#475569';
      ctx.fillRect(-7, -39, 14, 10);
      // Horizontal slit visor with glowing eye
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(-1, -34, 10, 3);
      ctx.fillStyle = isFlashing ? '#ffffff' : '#ef4444';
      ctx.fillRect(3, -33, 4, 2);

      // Horned crest
      ctx.fillStyle = '#cbd5e1';
      ctx.beginPath();
      ctx.moveTo(-8, -38);
      ctx.lineTo(-13, -46);
      ctx.lineTo(-5, -40);
      ctx.closePath();
      ctx.fill();

      // Rear arm: Heavy Spiked Morningstar
      ctx.fillStyle = '#78350f';
      ctx.fillRect(-11, -26, 3, 14);
      ctx.fillStyle = '#475569';
      ctx.beginPath();
      ctx.arc(-10, -10, 5, 0, Math.PI * 2);
      ctx.fill();

      // Front arm: Massive Tower Kite Shield
      ctx.save();
      if (this.attackTelegraphTimer > 0) {
        // Pulled back preparing to ram!
        ctx.translate(-4, -2);
      } else if (this.isAttacking) {
        // Smashed forward with kinetic shockwave!
        ctx.translate(14, 0);
        ctx.strokeStyle = 'rgba(255, 209, 102, 0.7)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(12, -22, 18, -Math.PI * 0.4, Math.PI * 0.4);
        ctx.stroke();
      }
      // Tower Shield Body
      ctx.fillStyle = isFlashing ? '#ffffff' : '#1e293b';
      ctx.fillRect(5, -36, 12, 34);
      // Gilded Trim
      ctx.strokeStyle = '#eab308';
      ctx.lineWidth = 2;
      ctx.strokeRect(5, -36, 12, 34);
      // Central Gold Heraldic Boss & Cross
      ctx.fillStyle = '#eab308';
      ctx.fillRect(8, -28, 6, 18);
      ctx.fillRect(5, -23, 12, 6);
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(11, -20, 3.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    } else if (this.type === 'pyromancer') {
      // ==========================================
      // PYROMANCER FLAME CULTIST
      // ==========================================
      // Teleportation flash glow
      if (this.teleportFlashTimer > 0) {
        ctx.strokeStyle = '#ff5400';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, -20, 24 * (1 - this.teleportFlashTimer / 0.28), 0, Math.PI * 2);
        ctx.stroke();
      }

      // Tattered Crimson Robe
      ctx.fillStyle = isFlashing ? '#ffffff' : '#7f1d1d';
      ctx.beginPath();
      ctx.moveTo(0, -36);
      ctx.lineTo(-12, 0 + legBob * 0.5);
      ctx.lineTo(12, 0 - legBob * 0.5);
      ctx.closePath();
      ctx.fill();

      // Obsidian Under-mantle
      ctx.fillStyle = '#450a0a';
      ctx.fillRect(-6, -26, 12, 24);

      // Deep Shadow Cowl
      ctx.fillStyle = '#1c1917';
      ctx.beginPath();
      ctx.arc(0, -32, 9, 0, Math.PI * 2);
      ctx.fill();

      // Glowing Amber Eyes
      ctx.fillStyle = isFlashing ? '#ffffff' : '#f59e0b';
      ctx.fillRect(1, -33, 3, 2);
      ctx.fillRect(5, -33, 2, 2);

      // Gnarled Staff & Floating Blazing Orb
      ctx.save();
      const staffAngle = this.attackTelegraphTimer > 0 ? -0.4 : 0.15;
      ctx.translate(6, -18);
      ctx.rotate(staffAngle);

      // Staff Shaft
      ctx.fillStyle = '#78350f';
      ctx.fillRect(-2, -22, 4, 34);

      // Golden Staff Topper
      ctx.fillStyle = '#eab308';
      ctx.beginPath();
      ctx.arc(0, -22, 5, 0, Math.PI * 2);
      ctx.fill();

      // Floating Blazing Fireball Orb orbiting staff
      const flameOrbit = Math.sin(this.animTimer * 6) * 3;
      ctx.fillStyle = '#ffbe0b';
      ctx.beginPath();
      ctx.arc(0, -30 + flameOrbit, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fb5607';
      ctx.beginPath();
      ctx.arc(-1, -30 + flameOrbit, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    } else if (this.type === 'berserker') {
      // ==========================================
      // BERSERKER EXECUTIONER
      // ==========================================
      // Blood Rage Smoke Trail if Enraged
      if (this.isEnraged) {
        ctx.fillStyle = 'rgba(239, 68, 68, 0.35)';
        for (let s = 0; s < 3; s++) {
          const sx = (Math.random() - 0.5) * 20;
          const sy = -10 - Math.random() * 30;
          ctx.beginPath();
          ctx.arc(sx, sy, 4 + Math.random() * 4, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Armored Leg Greaves & Studded Kilt
      ctx.fillStyle = '#451a03';
      ctx.fillRect(-10, -14, 20, 8);
      ctx.fillStyle = isFlashing ? '#ffffff' : '#1e293b';
      ctx.fillRect(-8, -8 + Math.max(0, legBob), 6, 8);
      ctx.fillRect(2, -8 + Math.max(0, -legBob), 6, 8);

      // Muscular Tanned Torso with War Paint
      ctx.fillStyle = isFlashing ? '#ffffff' : '#92400e';
      ctx.fillRect(-10, -32, 20, 20);
      // Crimson Ritual War Paint
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(-6, -30, 4, 14);
      ctx.fillRect(2, -28, 4, 12);
      ctx.fillRect(-8, -22, 16, 3);

      // Spiked Skullcap Helmet
      ctx.fillStyle = isFlashing ? '#ffffff' : '#334155';
      ctx.fillRect(-9, -38, 18, 9);
      // Horns
      ctx.fillStyle = '#f1f5f9';
      ctx.beginPath();
      ctx.moveTo(-9, -36);
      ctx.lineTo(-16, -42);
      ctx.lineTo(-7, -38);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(9, -36);
      ctx.lineTo(16, -42);
      ctx.lineTo(7, -38);
      ctx.closePath();
      ctx.fill();

      // Crazed Burning Eyes
      ctx.fillStyle = isFlashing ? '#ffffff' : (this.isEnraged ? '#ff0054' : '#ef4444');
      ctx.fillRect(2, -34, 4, 3);

      // Dual Executioner Cleavers
      if (this.isAttacking) {
        // 360 Cyclone Whirlwind blur!
        ctx.save();
        ctx.strokeStyle = this.isEnraged ? 'rgba(255, 0, 84, 0.8)' : 'rgba(220, 38, 38, 0.7)';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(0, -20, 28, 0, Math.PI * 2);
        ctx.stroke();

        // Spinning Cleavers
        const spin = this.animTimer * 30;
        ctx.translate(0, -20);
        ctx.rotate(spin);
        ctx.fillStyle = '#e2e8f0';
        ctx.fillRect(-28, -4, 56, 8);
        ctx.fillStyle = '#991b1b';
        ctx.fillRect(-24, -3, 8, 6);
        ctx.fillRect(16, -3, 8, 6);
        ctx.restore();
      } else {
        // Normal dual-cleaver stance
        // Left Cleaver
        ctx.save();
        ctx.translate(-10, -22);
        ctx.rotate(-0.35);
        ctx.fillStyle = '#78350f';
        ctx.fillRect(-2, 0, 4, 10);
        ctx.fillStyle = '#cbd5e1';
        ctx.fillRect(-6, -14, 12, 16);
        ctx.fillStyle = '#991b1b'; // Blood stain
        ctx.fillRect(-4, -14, 8, 5);
        ctx.restore();

        // Right Cleaver
        ctx.save();
        ctx.translate(10, -22);
        ctx.rotate(this.attackTelegraphTimer > 0 ? -0.8 : 0.4);
        ctx.fillStyle = '#78350f';
        ctx.fillRect(-2, 0, 4, 10);
        ctx.fillStyle = '#cbd5e1';
        ctx.fillRect(-6, -14, 12, 16);
        ctx.fillStyle = '#991b1b';
        ctx.fillRect(-4, -14, 8, 5);
        ctx.restore();
      }
    } else if (this.type === 'wraith') {
      // ==========================================
      // SPECTRAL WRAITH
      // ==========================================
      // Spectral Bobbing Float
      const floatY = Math.sin(this.animTimer * 4) * 5;
      ctx.translate(0, floatY);

      // Translucent Phantom Aura
      ctx.fillStyle = 'rgba(88, 28, 135, 0.35)';
      ctx.beginPath();
      ctx.arc(0, -20, 22, 0, Math.PI * 2);
      ctx.fill();

      // Tattered Shroud & Flowing Tendrils
      ctx.fillStyle = isFlashing ? '#ffffff' : '#3b0764';
      ctx.beginPath();
      ctx.moveTo(0, -38);
      ctx.lineTo(-12, -8);
      ctx.lineTo(-6, 6 + Math.sin(this.animTimer * 6) * 4);
      ctx.lineTo(0, -2);
      ctx.lineTo(6, 6 + Math.sin(this.animTimer * 6 + 1) * 4);
      ctx.lineTo(12, -8);
      ctx.closePath();
      ctx.fill();

      // Skeletal Hooded Cowl
      ctx.fillStyle = '#1e1b4b';
      ctx.beginPath();
      ctx.arc(0, -32, 9, 0, Math.PI * 2);
      ctx.fill();

      // Pale Bone Skull
      ctx.fillStyle = isFlashing ? '#ffffff' : '#e2e8f0';
      ctx.beginPath();
      ctx.arc(2, -32, 6, 0, Math.PI * 2);
      ctx.fill();

      // Piercing Cyan Void Eye Sockets
      ctx.fillStyle = '#06b6d4';
      ctx.beginPath();
      ctx.arc(3, -33, 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(0, -33, 1.5, 0, Math.PI * 2);
      ctx.fill();

      // Channeled Void Skull Orb in Claws
      if (this.attackTelegraphTimer > 0) {
        ctx.fillStyle = 'rgba(168, 85, 247, 0.7)';
        ctx.beginPath();
        ctx.arc(10, -22, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#06b6d4';
        ctx.beginPath();
        ctx.arc(10, -22, 3.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.restore();
  }
}
