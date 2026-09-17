import { Platform } from '../world/BiomeTypes';
import { Projectile } from './Projectile';

export type EnemyType =
  | 'grunt'
  | 'archer'
  | 'floater'
  | 'vanguard'
  | 'pyromancer'
  | 'berserker'
  | 'wraith'
  | 'spore_shroom'
  | 'royal_guard'
  | 'tide_lurker'
  | 'crystal_crawler'
  | 'steam_automaton'
  | 'magma_brute'
  | 'frost_yeti'
  | 'drowned_revenant'
  | 'aether_valkyrie'
  | 'void_weaver'
  | 'infernal_demon'
  | 'death_knight';

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

  // Pyromancer / Void Weaver specific
  public teleportCooldown: number = 0;
  public teleportFlashTimer: number = 0;

  // Berserker specific
  public isEnraged: boolean = false;

  // Unique Biome Foe State Timers
  public jumpTimer: number = 0;
  public steamTimer: number = 0;
  public soulRingTimer: number = 0;

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
    } else if (type === 'spore_shroom') {
      this.maxHealth = 3;
      this.width = 28;
      this.height = 34;
    } else if (type === 'royal_guard') {
      this.maxHealth = 3;
      this.width = 30;
      this.height = 44;
    } else if (type === 'tide_lurker') {
      this.maxHealth = 2;
      this.width = 28;
      this.height = 36;
    } else if (type === 'crystal_crawler') {
      this.maxHealth = 3;
      this.width = 34;
      this.height = 26;
    } else if (type === 'steam_automaton') {
      this.maxHealth = 4;
      this.width = 34;
      this.height = 44;
    } else if (type === 'magma_brute') {
      this.maxHealth = 5;
      this.width = 38;
      this.height = 40;
    } else if (type === 'frost_yeti') {
      this.maxHealth = 5;
      this.width = 38;
      this.height = 46;
    } else if (type === 'drowned_revenant') {
      this.maxHealth = 4;
      this.width = 30;
      this.height = 44;
    } else if (type === 'aether_valkyrie') {
      this.maxHealth = 5;
      this.width = 32;
      this.height = 44;
    } else if (type === 'void_weaver') {
      this.maxHealth = 5;
      this.width = 34;
      this.height = 42;
    } else if (type === 'infernal_demon') {
      this.maxHealth = 6;
      this.width = 40;
      this.height = 50;
    } else if (type === 'death_knight') {
      this.maxHealth = 6;
      this.width = 36;
      this.height = 48;
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
        const dx = p.x - this.x;
        const dy = p.y - this.y;
        const d = Math.hypot(dx, dy);

        // Prevent archers from targeting players directly underneath through multi-story floors
        if (this.type === 'archer' && Math.abs(dy) > 200 && Math.abs(dx) < 180) {
          continue;
        }

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
    } else if (this.type === 'aether_valkyrie') {
      // Celestial Valkyrie: Low-gravity flight, hovers above players, hurls radiant sun spears
      if (this.isAggro && this.targetPlayer) {
        this.facingLeft = this.targetPlayer.x < this.x;
        const dx = this.targetPlayer.x - this.x;
        const targetY = this.targetPlayer.y - 75;
        const dy = targetY - this.y;
        const dist = Math.hypot(dx, dy);

        if (dist > 35) {
          const speed = 125;
          this.vx = (dx / dist) * speed;
          this.vy = (dy / dist) * speed + Math.sin(this.animTimer * 4) * 20;
        } else {
          this.vx = Math.cos(this.animTimer * 2.5) * 30;
          this.vy = Math.sin(this.animTimer * 2.5) * 25;
        }

        // Celestial Spear Attack
        if (this.attackCooldown <= 0 && this.attackTelegraphTimer <= 0) {
          this.attackTelegraphTimer = 0.55;
        }

        if (this.attackTelegraphTimer > 0) {
          this.attackTelegraphTimer -= dt;
          this.vx *= 0.3;
          this.vy *= 0.3;
          if (this.attackTelegraphTimer <= 0) {
            this.attackCooldown = 2.8;
            const dirX = this.facingLeft ? -1 : 1;
            projectiles.push(new Projectile(
              this.x + dirX * 12,
              this.y - 10,
              dirX * 180,
              360,
              'celestial_spear',
              -1,
              1
            ));
          }
        }
      } else {
        this.vx = Math.cos(this.animTimer * 1.8) * 50;
        this.vy = Math.sin(this.animTimer * 2.4) * 30;
      }
    } else if (this.type === 'void_weaver') {
      // Void Weaver: Cosmic riftwalker, hovers in zero gravity, fires gravitational void orbs
      if (this.isAggro && this.targetPlayer) {
        this.facingLeft = this.targetPlayer.x < this.x;
        const dx = this.targetPlayer.x - this.x;
        const dy = (this.targetPlayer.y - 25) - this.y;
        const dist = Math.hypot(dx, dy);

        if (dist > 45) {
          const speed = 95;
          this.vx = (dx / dist) * speed;
          this.vy = (dy / dist) * speed + Math.sin(this.animTimer * 3) * 15;
        } else {
          this.vx = Math.cos(this.animTimer * 2) * 25;
          this.vy = Math.sin(this.animTimer * 2) * 25;
        }

        // Void Orb Singularity Attack
        if (this.attackCooldown <= 0 && this.attackTelegraphTimer <= 0) {
          this.attackTelegraphTimer = 0.6;
        }

        if (this.attackTelegraphTimer > 0) {
          this.attackTelegraphTimer -= dt;
          this.vx *= 0.35;
          this.vy *= 0.35;
          if (this.attackTelegraphTimer <= 0) {
            this.attackCooldown = 3.6;
            const dirX = this.facingLeft ? -1 : 1;
            projectiles.push(new Projectile(
              this.x + dirX * 16,
              this.y - 18,
              dirX * 130,
              -40,
              'void_orb',
              -1,
              1
            ));
          }
        }
      } else {
        this.vx = Math.cos(this.animTimer * 1.5) * 40;
        this.vy = Math.sin(this.animTimer * 2.0) * 25;
      }
    } else {
      // Ground enemies: Grunt, Archer, Vanguard, Pyromancer, Berserker
      const prevY = this.y;
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
              const targetDx = this.targetPlayer ? this.targetPlayer.x - (this.x + dirX * 18) : dirX * 100;
              const targetDy = this.targetPlayer ? (this.targetPlayer.y - 18) - (this.y - 18) : -50;
              const targetDist = Math.hypot(targetDx, targetDy) || 1;
              const arrowSpeed = 460;
              const arrowVx = (targetDx / targetDist) * arrowSpeed;
              const arrowVy = Math.max(-140, Math.min(180, (targetDy / targetDist) * arrowSpeed - 40));
              projectiles.push(new Projectile(
                this.x + dirX * 18,
                this.y - 18,
                arrowVx,
                arrowVy,
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
        } else if (this.type === 'spore_shroom') {
          // Spore Shroom: Woodland hopper that releases spore clouds
          this.jumpTimer = (this.jumpTimer || 0) + dt;
          if (this.jumpTimer > 1.3 && Math.abs(this.vy) < 20) {
            this.vy = -320;
            this.vx = dirX * 105;
            this.jumpTimer = 0;
          }

          if (nearestDist < 180 && this.attackCooldown <= 0 && this.attackTelegraphTimer <= 0) {
            this.attackTelegraphTimer = 0.45;
          }

          if (this.attackTelegraphTimer > 0) {
            this.attackTelegraphTimer -= dt;
            if (this.attackTelegraphTimer <= 0) {
              this.attackCooldown = 3.0;
              [-50, 0, 50].forEach(vxOffset => {
                projectiles.push(new Projectile(
                  this.x,
                  this.y - 20,
                  dirX * 80 + vxOffset,
                  -130,
                  'spore_cloud',
                  -1,
                  1
                ));
              });
            }
          }
        } else if (this.type === 'royal_guard') {
          // Royal Guard: Extended halberd thrust combo
          if (nearestDist < 78 && this.attackCooldown <= 0 && this.attackTelegraphTimer <= 0) {
            this.attackTelegraphTimer = 0.42;
            this.vx = 0;
          }

          if (this.attackTelegraphTimer > 0) {
            this.attackTelegraphTimer -= dt;
            this.vx = 0;
            if (this.attackTelegraphTimer <= 0) {
              this.isAttacking = true;
              this.attackSwingTimer = 0.30;
              this.attackCooldown = 2.2;
              this.vx = dirX * 220; // Lunging thrust
            }
          } else if (!this.isAttacking && this.hitCooldown <= 0.08) {
            this.vx = dirX * 90;
          }
        } else if (this.type === 'tide_lurker') {
          // Tide Lurker: Fast water skimmer, spits water orbs
          if (nearestDist < 100) {
            this.vx = -dirX * 110; // Back off
          } else if (nearestDist > 280) {
            this.vx = dirX * 130; // Approach
          } else {
            this.vx = 0;
            if (this.attackCooldown <= 0 && this.attackTelegraphTimer <= 0) {
              this.attackTelegraphTimer = 0.42;
            }
          }

          if (this.attackTelegraphTimer > 0) {
            this.attackTelegraphTimer -= dt;
            this.vx = 0;
            if (this.attackTelegraphTimer <= 0) {
              this.attackCooldown = 2.5;
              projectiles.push(new Projectile(
                this.x + dirX * 14,
                this.y - 18,
                dirX * 280,
                -250,
                'water_orb',
                -1,
                1
              ));
            }
          }
        } else if (this.type === 'crystal_crawler') {
          // Crystal Crawler: Armored quartz beetle, crystal needle bursts
          if (nearestDist < 240 && this.attackCooldown <= 0 && this.attackTelegraphTimer <= 0) {
            this.attackTelegraphTimer = 0.52;
            this.vx = 0;
          }

          if (this.attackTelegraphTimer > 0) {
            this.attackTelegraphTimer -= dt;
            this.vx = 0;
            if (this.attackTelegraphTimer <= 0) {
              this.attackCooldown = 3.2;
              [-60, 0, 60].forEach(vyOffset => {
                projectiles.push(new Projectile(
                  this.x + dirX * 14,
                  this.y - 14,
                  dirX * 360,
                  vyOffset,
                  'crystal_shard',
                  -1,
                  1
                ));
              });
            }
          } else if (this.hitCooldown <= 0.08) {
            this.vx = dirX * 65;
          }
        } else if (this.type === 'steam_automaton') {
          // Steam Automaton: Buzzsaw dash + periodic scalding steam puffs
          this.steamTimer = (this.steamTimer || 0) + dt;
          if (this.steamTimer > 3.6) {
            this.steamTimer = 0;
            projectiles.push(new Projectile(this.x, this.y - 20, dirX * 70, -20, 'steam_burst', -1, 1));
            projectiles.push(new Projectile(this.x, this.y - 20, -dirX * 70, -20, 'steam_burst', -1, 1));
          }

          if (nearestDist < 85 && this.attackCooldown <= 0 && this.attackTelegraphTimer <= 0) {
            this.attackTelegraphTimer = 0.36;
            this.vx = 0;
          }

          if (this.attackTelegraphTimer > 0) {
            this.attackTelegraphTimer -= dt;
            this.vx = 0;
            if (this.attackTelegraphTimer <= 0) {
              this.isAttacking = true;
              this.attackSwingTimer = 0.42;
              this.attackCooldown = 2.4;
              this.vx = dirX * 230; // Buzzsaw spin dash
            }
          } else if (!this.isAttacking && this.hitCooldown <= 0.08) {
            this.vx = dirX * 80;
          }
        } else if (this.type === 'magma_brute') {
          // Magma Brute: Charging headbutt + lobs molten magma blobs
          if (nearestDist >= 130 && this.attackCooldown <= 0 && this.attackTelegraphTimer <= 0) {
            this.attackTelegraphTimer = 0.48;
            this.vx = 0;
          } else if (nearestDist < 70 && this.attackCooldown <= 0 && this.attackTelegraphTimer <= 0) {
            this.attackTelegraphTimer = 0.35;
            this.vx = 0;
          }

          if (this.attackTelegraphTimer > 0) {
            this.attackTelegraphTimer -= dt;
            this.vx = 0;
            if (this.attackTelegraphTimer <= 0) {
              if (nearestDist >= 110) {
                // Heave magma blob
                this.attackCooldown = 3.0;
                projectiles.push(new Projectile(
                  this.x + dirX * 18,
                  this.y - 24,
                  dirX * 260,
                  -310,
                  'magma_blob',
                  -1,
                  1
                ));
              } else {
                // Charging headbutt
                this.isAttacking = true;
                this.attackSwingTimer = 0.32;
                this.attackCooldown = 2.2;
                this.vx = dirX * 250;
              }
            }
          } else if (!this.isAttacking && this.hitCooldown <= 0.08) {
            this.vx = dirX * 125;
          }
        } else if (this.type === 'frost_yeti') {
          // Frost Yeti: Ground slam + conical frost breath
          if (nearestDist >= 120 && this.attackCooldown <= 0 && this.attackTelegraphTimer <= 0) {
            this.attackTelegraphTimer = 0.52;
            this.vx = 0;
          } else if (nearestDist < 80 && this.attackCooldown <= 0 && this.attackTelegraphTimer <= 0) {
            this.attackTelegraphTimer = 0.40;
            this.vx = 0;
          }

          if (this.attackTelegraphTimer > 0) {
            this.attackTelegraphTimer -= dt;
            this.vx = 0;
            if (this.attackTelegraphTimer <= 0) {
              if (nearestDist >= 100) {
                // Frost breath spray
                this.attackCooldown = 3.2;
                [-45, 0, 45].forEach(vyOffset => {
                  projectiles.push(new Projectile(
                    this.x + dirX * 20,
                    this.y - 22,
                    dirX * 310,
                    vyOffset,
                    'frost_shard',
                    -1,
                    1
                  ));
                });
              } else {
                // Ground stomp
                this.isAttacking = true;
                this.attackSwingTimer = 0.36;
                this.attackCooldown = 2.4;
                this.vx = dirX * 120;
              }
            }
          } else if (!this.isAttacking && this.hitCooldown <= 0.08) {
            this.vx = dirX * 95;
          }
        } else if (this.type === 'drowned_revenant') {
          // Drowned Revenant: Heavy anchor cleave + necrotic dread soul cast
          if (nearestDist >= 140 && this.attackCooldown <= 0 && this.attackTelegraphTimer <= 0) {
            this.attackTelegraphTimer = 0.55;
            this.vx = 0;
          } else if (nearestDist < 75 && this.attackCooldown <= 0 && this.attackTelegraphTimer <= 0) {
            this.attackTelegraphTimer = 0.44;
            this.vx = 0;
          }

          if (this.attackTelegraphTimer > 0) {
            this.attackTelegraphTimer -= dt;
            this.vx = 0;
            if (this.attackTelegraphTimer <= 0) {
              if (nearestDist >= 120) {
                // Cast dread soul
                this.attackCooldown = 3.5;
                projectiles.push(new Projectile(
                  this.x + dirX * 16,
                  this.y - 26,
                  dirX * 140,
                  -40,
                  'dread_soul',
                  -1,
                  1
                ));
              } else {
                // Anchor sweep
                this.isAttacking = true;
                this.attackSwingTimer = 0.38;
                this.attackCooldown = 2.5;
                this.vx = dirX * 160;
              }
            }
          } else if (!this.isAttacking && this.hitCooldown <= 0.08) {
            this.vx = dirX * 70;
          }
        } else if (this.type === 'infernal_demon') {
          // Infernal Demon: Leap slam + hellfire wave cleave
          if (nearestDist < 260 && nearestDist > 100 && this.attackCooldown <= 0 && this.attackTelegraphTimer <= 0) {
            this.attackTelegraphTimer = 0.38;
            this.vx = 0;
          } else if (nearestDist <= 85 && this.attackCooldown <= 0 && this.attackTelegraphTimer <= 0) {
            this.attackTelegraphTimer = 0.35;
            this.vx = 0;
          }

          if (this.attackTelegraphTimer > 0) {
            this.attackTelegraphTimer -= dt;
            this.vx = 0;
            if (this.attackTelegraphTimer <= 0) {
              if (nearestDist > 90) {
                // High volcanic leap!
                this.vy = -440;
                this.vx = dirX * 240;
                this.attackCooldown = 3.2;
              } else {
                // Hellfire wave cleave
                this.isAttacking = true;
                this.attackSwingTimer = 0.35;
                this.attackCooldown = 2.4;
                this.vx = dirX * 180;
                projectiles.push(new Projectile(
                  this.x + dirX * 24,
                  this.y - 8,
                  dirX * 260,
                  0,
                  'hellfire_wave',
                  -1,
                  1
                ));
              }
            }
          } else if (!this.isAttacking && this.hitCooldown <= 0.08) {
            this.vx = dirX * 125;
          }
        } else if (this.type === 'death_knight') {
          // Death Knight: Juggernaut march, soul cleave, tormented soul vortex
          this.soulRingTimer = (this.soulRingTimer || 0) + dt;
          if (this.soulRingTimer > 4.2) {
            this.soulRingTimer = 0;
            projectiles.push(new Projectile(this.x, this.y - 24, 125, 0, 'dread_soul', -1, 1));
            projectiles.push(new Projectile(this.x, this.y - 24, -125, 0, 'dread_soul', -1, 1));
          }

          if (nearestDist < 82 && this.attackCooldown <= 0 && this.attackTelegraphTimer <= 0) {
            this.attackTelegraphTimer = 0.40;
            this.vx = 0;
          }

          if (this.attackTelegraphTimer > 0) {
            this.attackTelegraphTimer -= dt;
            this.vx = 0;
            if (this.attackTelegraphTimer <= 0) {
              this.isAttacking = true;
              this.attackSwingTimer = 0.40;
              this.attackCooldown = 2.2;
              this.vx = dirX * 200; // Heavy soul cleave
            }
          } else if (!this.isAttacking && this.hitCooldown <= 0.08) {
            this.vx = dirX * 85;
          }
        }
      } else {
        // Peaceful patrol
        this.attackTelegraphTimer = 0;
        this.isAttacking = false;
        if (this.hitCooldown <= 0.08) {
          const patrolSpeed = (this.type === 'vanguard' || this.type === 'crystal_crawler' || this.type === 'death_knight') ? 35 : 45;
          this.vx = this.patrolDir * patrolSpeed;
          this.facingLeft = this.patrolDir < 0;

          if (this.type === 'spore_shroom') {
            this.jumpTimer = (this.jumpTimer || 0) + dt;
            if (this.jumpTimer > 1.6 && Math.abs(this.vy) < 20) {
              this.vy = -260;
              this.jumpTimer = 0;
            }
          }
        }
        if (Math.random() < 0.008) this.patrolDir *= -1;
      }

      // Platform collisions for ground enemies
      const halfW = this.width * 0.5;
      for (let i = 0; i < platforms.length; i++) {
        const p = platforms[i];
        if (p.isCrumbled) continue;

        if (!p.oneWay) {
          // Solid boundary blocks & terrain platforms
          if (
            this.x + halfW > p.x && this.x - halfW < p.x + p.w &&
            this.y > p.y && this.y - this.height < p.y + p.h
          ) {
            if (this.vy >= 0 && prevY <= p.y + 12) {
              // Land on solid surface
              this.y = p.y;
              this.vy = 0;
            } else if (this.vy < 0 && (this.y - this.height) < (p.y + p.h) && (prevY - this.height) >= (p.y + p.h - 12)) {
              // Bonk underside of solid ceiling / block
              this.y = p.y + p.h + this.height;
              this.vy = Math.max(0, -this.vy * 0.2);
            }
          }
        } else {
          // One-way ledges: only land on top when falling downward from above
          if (
            this.x + halfW > p.x && this.x - halfW < p.x + p.w &&
            prevY <= p.y + 12 && this.y >= p.y && this.vy >= 0
          ) {
            this.y = p.y;
            this.vy = 0;
          }
        }
      }
    }

    // Position integration for all enemies
    this.x += this.vx * dt;
    this.y += this.vy * dt;

    // Hard World Bounds Clamping for ALL Enemies (Ground & Aerial)
    // The ceiling solid boundary block is at y = -20..20, so minimum playable Y is 24 + height
    const minEnemyY = 24 + this.height;
    if (this.y < minEnemyY) {
      this.y = minEnemyY;
      if (this.vy < 0) this.vy = Math.max(0, -this.vy * 0.2);
    }
    // Floor boundary (level height is 1800; floor platform at 1760..1820)
    if (this.y > 1760) {
      this.y = 1760;
      this.vy = 0;
    }
    // Lateral world boundaries (x = 24 to 3176)
    if (this.x < 24) {
      this.x = 24;
      this.vx = Math.max(0, this.vx);
    } else if (this.x > 3176) {
      this.x = 3176;
      this.vx = Math.min(0, this.vx);
    }
  }

  public takeDamage(amount: number, kbX: number = 0, kbY: number = -170): boolean {
    if (!this.isAlive || this.isDying) return false;

    // Hardened carapace / heavy armor knockback resistance
    if (this.type === 'crystal_crawler' || this.type === 'death_knight') {
      kbX *= 0.5;
    }

    // Void Weaver emergency dimensional rift
    if (this.type === 'void_weaver' && this.teleportCooldown <= 0) {
      this.teleportFlashTimer = 0.28;
      this.teleportCooldown = 4.2;
      this.x += (Math.random() > 0.5 ? 1 : -1) * 150;
      this.vy = -60;
    }

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
    } else if (this.type === 'royal_guard') {
      return {
        x: dir > 0 ? this.x : this.x - 64,
        y: this.y - 36,
        w: 64,
        h: 36
      };
    } else if (this.type === 'steam_automaton') {
      return {
        x: dir > 0 ? this.x : this.x - 52,
        y: this.y - 38,
        w: 52,
        h: 40
      };
    } else if (this.type === 'magma_brute') {
      return {
        x: dir > 0 ? this.x : this.x - 50,
        y: this.y - 36,
        w: 50,
        h: 38
      };
    } else if (this.type === 'frost_yeti') {
      return {
        x: dir > 0 ? this.x : this.x - 56,
        y: this.y - 42,
        w: 56,
        h: 42
      };
    } else if (this.type === 'drowned_revenant') {
      return {
        x: dir > 0 ? this.x : this.x - 60,
        y: this.y - 40,
        w: 60,
        h: 40
      };
    } else if (this.type === 'infernal_demon') {
      return {
        x: dir > 0 ? this.x : this.x - 66,
        y: this.y - 48,
        w: 66,
        h: 46
      };
    } else if (this.type === 'death_knight') {
      return {
        x: dir > 0 ? this.x : this.x - 68,
        y: this.y - 46,
        w: 68,
        h: 44
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
      const dy = Math.abs(this.targetPlayer.y - this.y);
      const dx = Math.abs(this.targetPlayer.x - this.x);
      if (dy < 240 || dx > 140) {
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
    } else if (this.type === 'spore_shroom') {
      // ==========================================
      // SPORE SHROOM (Verdant Canopy)
      // ==========================================
      const bounce = Math.abs(Math.sin(this.animTimer * 8)) * 3;
      // Stalk & root feet
      ctx.fillStyle = isFlashing ? '#ffffff' : '#d8f3dc';
      ctx.fillRect(-6, -18 - bounce, 12, 14);
      ctx.fillStyle = '#1b4332';
      ctx.fillRect(-7, -4, 5, 4);
      ctx.fillRect(2, -4, 5, 4);

      // Spotted Mushroom Cap
      ctx.fillStyle = isFlashing ? '#ffffff' : '#e63946';
      ctx.beginPath();
      ctx.ellipse(0, -22 - bounce, 15, 12, 0, Math.PI, 0);
      ctx.closePath();
      ctx.fill();

      // White Cap Polka Dots
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(-7, -26 - bounce, 2.5, 0, Math.PI * 2);
      ctx.arc(5, -28 - bounce, 3, 0, Math.PI * 2);
      ctx.arc(0, -22 - bounce, 2, 0, Math.PI * 2);
      ctx.fill();

      // Little Black Bead Eyes
      ctx.fillStyle = '#081c15';
      ctx.fillRect(2, -14 - bounce, 2.5, 3);
      ctx.fillRect(6, -14 - bounce, 2.5, 3);

      // Spore Puff Aura during telegraph
      if (this.attackTelegraphTimer > 0) {
        ctx.fillStyle = 'rgba(116, 198, 157, 0.6)';
        ctx.beginPath();
        ctx.arc(0, -32 - bounce, 8 + Math.sin(this.animTimer * 16) * 3, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (this.type === 'royal_guard') {
      // ==========================================
      // ROYAL HALBERDIER (Royal Courtyard)
      // ==========================================
      // Silver Torso & Red Tabard
      ctx.fillStyle = isFlashing ? '#ffffff' : '#94a3b8';
      ctx.fillRect(-7, -34, 14, 26);
      ctx.fillStyle = '#e63946'; // Red royal heraldry tabard
      ctx.fillRect(-4, -30, 8, 20);
      ctx.fillStyle = '#ffd166';
      ctx.fillRect(-1, -26, 2, 12);

      // Great Helm with Golden Lion Visor
      ctx.fillStyle = isFlashing ? '#ffffff' : '#cbd5e1';
      ctx.fillRect(-8, -42, 16, 11);
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(1, -38, 6, 2.5); // Visor slit

      // Red & Gold Feathered Plume
      ctx.fillStyle = '#e63946';
      ctx.beginPath();
      ctx.moveTo(-2, -42);
      ctx.lineTo(-8, -52);
      ctx.lineTo(4, -48);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#ffd166';
      ctx.fillRect(-3, -48, 2, 6);

      // Tall Halberd Polearm
      ctx.save();
      const thrustX = this.isAttacking ? 16 : (this.attackTelegraphTimer > 0 ? -4 : 0);
      ctx.translate(6 + thrustX, -24);
      if (this.attackTelegraphTimer > 0) ctx.rotate(-0.25);
      // Pole shaft
      ctx.fillStyle = '#78350f';
      ctx.fillRect(0, -28, 3, 44);
      // Crescent Axe & Spear Tip
      ctx.fillStyle = isFlashing ? '#ffffff' : '#f1f5f9';
      ctx.beginPath();
      ctx.moveTo(1.5, -38);
      ctx.lineTo(5, -28);
      ctx.lineTo(13, -24);
      ctx.lineTo(2, -22);
      ctx.lineTo(-8, -26);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      // Armored Sabaton Legs
      ctx.fillStyle = '#475569';
      ctx.fillRect(-6, -8 + Math.max(0, legBob), 5, 8);
      ctx.fillRect(1, -8 + Math.max(0, -legBob), 5, 8);
    } else if (this.type === 'tide_lurker') {
      // ==========================================
      // TIDE LURKER (Sunlit Aqueducts)
      // ==========================================
      // Slender Finned Aquatic Torso
      ctx.fillStyle = isFlashing ? '#ffffff' : '#0077b6';
      ctx.beginPath();
      ctx.ellipse(0, -20, 11, 15, 0, 0, Math.PI * 2);
      ctx.fill();

      // Translucent Dorsal Fin on Back
      ctx.fillStyle = 'rgba(72, 202, 228, 0.75)';
      ctx.beginPath();
      ctx.moveTo(-6, -30);
      ctx.lineTo(-16, -20);
      ctx.lineTo(-6, -10);
      ctx.closePath();
      ctx.fill();

      // Crest Head & Amphibious Eyes
      ctx.fillStyle = isFlashing ? '#ffffff' : '#023e8a';
      ctx.beginPath();
      ctx.arc(3, -28, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffd166';
      ctx.beginPath();
      ctx.arc(5, -29, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#03045e';
      ctx.fillRect(6, -30, 1.5, 3);

      // Spitting Inhale Bubble
      if (this.attackTelegraphTimer > 0) {
        ctx.fillStyle = 'rgba(144, 224, 239, 0.8)';
        ctx.beginPath();
        ctx.arc(12, -28, 6, 0, Math.PI * 2);
        ctx.fill();
      }

      // Webbed Finned Feet
      ctx.fillStyle = '#0096c7';
      ctx.fillRect(-5, -6 + Math.max(0, legBob), 4, 6);
      ctx.fillRect(1, -6 + Math.max(0, -legBob), 4, 6);
    } else if (this.type === 'crystal_crawler') {
      // ==========================================
      // CRYSTAL CRAWLER (Whispering Grottos)
      // ==========================================
      // Low armored beetle carapace
      ctx.fillStyle = isFlashing ? '#ffffff' : '#3c096c';
      ctx.beginPath();
      ctx.ellipse(0, -12, 16, 11, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#5a189a';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Glowing Quartz Crystal Spires on Back
      ctx.fillStyle = '#f72585';
      ctx.beginPath();
      ctx.moveTo(-5, -18);
      ctx.lineTo(0, -32);
      ctx.lineTo(5, -18);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#7209b7';
      ctx.beginPath();
      ctx.moveTo(-11, -16);
      ctx.lineTo(-9, -26);
      ctx.lineTo(-4, -16);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#4cc9f0';
      ctx.beginPath();
      ctx.moveTo(3, -16);
      ctx.lineTo(8, -25);
      ctx.lineTo(11, -16);
      ctx.closePath();
      ctx.fill();

      // Scuttling Beetle Legs
      ctx.strokeStyle = '#240046';
      ctx.lineWidth = 2;
      const legStep = Math.sin(this.animTimer * 16) * 4;
      ctx.beginPath();
      ctx.moveTo(-10, -4); ctx.lineTo(-14, 0 + legStep);
      ctx.moveTo(0, -4); ctx.lineTo(-2, 0 - legStep);
      ctx.moveTo(10, -4); ctx.lineTo(14, 0 + legStep);
      ctx.stroke();
    } else if (this.type === 'steam_automaton') {
      // ==========================================
      // CLOCKWORK SENTRY (Clockwork Foundry)
      // ==========================================
      // Heavy Brass Riveted Boiler Body
      ctx.fillStyle = isFlashing ? '#ffffff' : '#b45309';
      ctx.fillRect(-10, -36, 20, 28);
      ctx.strokeStyle = '#d97706';
      ctx.lineWidth = 2;
      ctx.strokeRect(-10, -36, 20, 28);

      // Glowing Furnace Belly
      ctx.fillStyle = '#ffbe0b';
      ctx.fillRect(-5, -22, 10, 8);
      ctx.fillStyle = '#ef476f';
      ctx.fillRect(-3, -20, 6, 4);

      // Iron Exhaust Chimney on Back
      ctx.fillStyle = '#475569';
      ctx.fillRect(-12, -42, 5, 12);
      // Steam Motes
      ctx.fillStyle = 'rgba(241, 245, 249, 0.6)';
      ctx.beginPath();
      ctx.arc(-10, -46 + Math.sin(this.animTimer * 10) * 2, 3, 0, Math.PI * 2);
      ctx.fill();

      // Whirring Buzzsaw Blade Arm
      ctx.save();
      const sawX = this.isAttacking ? 18 : 10;
      ctx.translate(sawX, -22);
      const sawSpin = this.animTimer * 25;
      ctx.rotate(sawSpin);
      ctx.fillStyle = isFlashing ? '#ffffff' : '#94a3b8';
      ctx.beginPath();
      ctx.arc(0, 0, 11, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#f8fafc';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.restore();

      // Mechanical Piston Legs
      ctx.fillStyle = '#334155';
      ctx.fillRect(-7, -8 + Math.max(0, legBob), 5, 8);
      ctx.fillRect(2, -8 + Math.max(0, -legBob), 5, 8);
    } else if (this.type === 'magma_brute') {
      // ==========================================
      // MAGMA BRUTE (Molten Caverns)
      // ==========================================
      // Cracked Volcanic Basalt Torso
      ctx.fillStyle = isFlashing ? '#ffffff' : '#1c1917';
      ctx.beginPath();
      ctx.ellipse(0, -20, 16, 14, 0, 0, Math.PI * 2);
      ctx.fill();

      // Churning Lava Veins
      ctx.strokeStyle = '#fb5607';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-10, -22); ctx.lineTo(-2, -16); ctx.lineTo(6, -24);
      ctx.moveTo(-6, -14); ctx.lineTo(2, -18); ctx.lineTo(10, -14);
      ctx.stroke();

      // Horned Molten Head
      ctx.fillStyle = '#0c0a09';
      ctx.fillRect(6, -28, 10, 10);
      // Fiery Horns
      ctx.fillStyle = '#ff0054';
      ctx.beginPath();
      ctx.moveTo(8, -28); ctx.lineTo(14, -38); ctx.lineTo(12, -28);
      ctx.closePath();
      ctx.fill();

      // Glowing Eyes
      ctx.fillStyle = '#ffbe0b';
      ctx.fillRect(10, -25, 3, 2.5);

      // Heavy Basalt Pillars Legs
      ctx.fillStyle = '#292524';
      ctx.fillRect(-8, -8 + Math.max(0, legBob), 7, 8);
      ctx.fillRect(1, -8 + Math.max(0, -legBob), 7, 8);
    } else if (this.type === 'frost_yeti') {
      // ==========================================
      // FROST YETI (Frostpeak Summit)
      // ==========================================
      // Heavy White Shaggy Fur Body
      ctx.fillStyle = isFlashing ? '#ffffff' : '#f1f5f9';
      ctx.beginPath();
      ctx.ellipse(0, -24, 17, 18, 0, 0, Math.PI * 2);
      ctx.fill();

      // Blue Frostbitten Face
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(4, -32, 9, 8);
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(8, -30, 2.5, 2.5); // Black eye

      // Curved Frosted Ice Horns
      ctx.fillStyle = '#e0f2fe';
      ctx.strokeStyle = '#0284c7';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(4, -34); ctx.lineTo(10, -44); ctx.lineTo(14, -32);
      ctx.stroke();

      // Heavy Claws
      ctx.save();
      const slamY = this.isAttacking ? 8 : 0;
      ctx.translate(12, -16 + slamY);
      ctx.fillStyle = '#0284c7';
      ctx.fillRect(0, 0, 8, 8);
      ctx.restore();

      // Shaggy Fur Legs
      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(-8, -8 + Math.max(0, legBob), 7, 8);
      ctx.fillRect(1, -8 + Math.max(0, -legBob), 7, 8);
    } else if (this.type === 'drowned_revenant') {
      // ==========================================
      // DROWNED REVENANT (Sunken Catacombs)
      // ==========================================
      // Waterlogged Bandage Shroud
      ctx.fillStyle = isFlashing ? '#ffffff' : '#1e293b';
      ctx.fillRect(-7, -34, 14, 26);
      ctx.strokeStyle = '#065f46'; // Dripping seaweed wraps
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(-7, -30); ctx.lineTo(7, -24);
      ctx.moveTo(-7, -20); ctx.lineTo(7, -14);
      ctx.stroke();

      // Mummy Cranium & Seaweed Hood
      ctx.fillStyle = '#064e3b';
      ctx.beginPath();
      ctx.arc(0, -38, 8, 0, Math.PI * 2);
      ctx.fill();
      // Glowing Cyan Eye
      ctx.fillStyle = '#2ec4b6';
      ctx.beginPath();
      ctx.arc(3, -38, 3, 0, Math.PI * 2);
      ctx.fill();

      // Heavy Corroded Iron Anchor
      ctx.save();
      const anchorAngle = this.isAttacking ? 0.8 : -0.3;
      ctx.translate(8, -20);
      ctx.rotate(anchorAngle);
      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.moveTo(0, -18); ctx.lineTo(0, 14);
      ctx.arc(0, 8, 10, 0, Math.PI);
      ctx.stroke();
      ctx.restore();

      // Shrouded Feet
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(-6, -8 + Math.max(0, legBob), 5, 8);
      ctx.fillRect(1, -8 + Math.max(0, -legBob), 5, 8);
    } else if (this.type === 'aether_valkyrie') {
      // ==========================================
      // AETHER VALKYRIE (Celestial Spires)
      // ==========================================
      // Radiant Spread Angelic Wings
      ctx.fillStyle = 'rgba(254, 240, 138, 0.75)';
      const wingFlap = Math.sin(this.animTimer * 8) * 6;
      ctx.beginPath();
      ctx.moveTo(-4, -26); ctx.lineTo(-24, -38 + wingFlap); ctx.lineTo(-14, -16);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(4, -26); ctx.lineTo(24, -38 + wingFlap); ctx.lineTo(14, -16);
      ctx.closePath();
      ctx.fill();

      // Golden Sun Plate Torso
      ctx.fillStyle = isFlashing ? '#ffffff' : '#ffd166';
      ctx.fillRect(-6, -34, 12, 24);
      ctx.strokeStyle = '#d97706';
      ctx.lineWidth = 1.2;
      ctx.strokeRect(-6, -34, 12, 24);

      // Winged Tiara Helmet
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(-7, -42, 14, 9);
      ctx.fillStyle = '#38bdf8'; // Radiant visor
      ctx.fillRect(1, -38, 4, 3);

      // Radiant Sun Spear
      ctx.save();
      ctx.translate(8, -24);
      ctx.rotate(0.3);
      ctx.strokeStyle = '#ffd166';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(-10, -22); ctx.lineTo(14, 16);
      ctx.stroke();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(14, 16, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    } else if (this.type === 'void_weaver') {
      // ==========================================
      // VOID WEAVER (Astral Void)
      // ==========================================
      // Deep Cosmic Silhouette with Pulsing Core
      ctx.fillStyle = isFlashing ? '#ffffff' : '#090514';
      ctx.beginPath();
      ctx.arc(0, -22, 14, 0, Math.PI * 2);
      ctx.fill();

      // Glowing Cosmic Nebula Core
      ctx.fillStyle = '#a855f7';
      ctx.beginPath();
      ctx.arc(0, -22, 7 + Math.sin(this.animTimer * 6) * 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(0, -22, 3, 0, Math.PI * 2);
      ctx.fill();

      // Undulating Shadow Tentacles
      ctx.strokeStyle = '#7e22ce';
      ctx.lineWidth = 2.5;
      for (let t = -2; t <= 2; t++) {
        if (t === 0) continue;
        const wave = Math.sin(this.animTimer * 5 + t) * 6;
        ctx.beginPath();
        ctx.moveTo(t * 4, -12);
        ctx.quadraticCurveTo(t * 8 + wave, -2, t * 5, 8);
        ctx.stroke();
      }

      // Alien Multi-Eyes
      ctx.fillStyle = '#f43f5e';
      ctx.fillRect(-4, -28, 2, 2);
      ctx.fillRect(2, -28, 2, 2);
      ctx.fillRect(5, -24, 2, 2);
    } else if (this.type === 'infernal_demon') {
      // ==========================================
      // INFERNAL FIEND (Infernal Core)
      // ==========================================
      // Crimson Muscular Torso
      ctx.fillStyle = isFlashing ? '#ffffff' : '#991b1b';
      ctx.fillRect(-10, -40, 20, 30);

      // Horned Demonic Skull
      ctx.fillStyle = '#7f1d1d';
      ctx.fillRect(-8, -48, 16, 10);
      // Obsidian Horns
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.moveTo(-6, -48); ctx.lineTo(-14, -60); ctx.lineTo(-2, -48);
      ctx.moveTo(6, -48); ctx.lineTo(14, -60); ctx.lineTo(2, -48);
      ctx.fill();

      // Burning Magma Bat Wings
      ctx.fillStyle = 'rgba(239, 68, 68, 0.6)';
      ctx.beginPath();
      ctx.moveTo(-8, -36); ctx.lineTo(-28, -50); ctx.lineTo(-20, -24);
      ctx.closePath();
      ctx.fill();

      // Flaming Claymore
      ctx.save();
      ctx.translate(10, -26);
      ctx.rotate(this.isAttacking ? 0.7 : -0.2);
      ctx.fillStyle = '#450a0a';
      ctx.fillRect(0, -10, 4, 32);
      // Flaming blade aura
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(2, -12); ctx.lineTo(2, 24);
      ctx.stroke();
      ctx.restore();

      // Heavy Cloven Hoof Legs
      ctx.fillStyle = '#450a0a';
      ctx.fillRect(-8, -10 + Math.max(0, legBob), 6, 10);
      ctx.fillRect(2, -10 + Math.max(0, -legBob), 6, 10);
    } else if (this.type === 'death_knight') {
      // ==========================================
      // DREAD REAVER (Cursed Necropolis)
      // ==========================================
      // Gothic Blackened Spiked Armor
      ctx.fillStyle = isFlashing ? '#ffffff' : '#0f172a';
      ctx.fillRect(-9, -40, 18, 30);
      ctx.strokeStyle = '#065f46';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(-9, -40, 18, 30);

      // Tattered Shroud Cape
      ctx.fillStyle = '#064e3b';
      ctx.beginPath();
      ctx.moveTo(-9, -38);
      ctx.lineTo(-18, -12 + Math.sin(this.animTimer * 5) * 3);
      ctx.lineTo(-9, -14);
      ctx.closePath();
      ctx.fill();

      // Skeletal Visor with Green Soul Flame
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(-8, -48, 16, 10);
      ctx.fillStyle = '#10b981'; // Necrotic eye flame
      ctx.beginPath();
      ctx.arc(3, -44, 2.5, 0, Math.PI * 2);
      ctx.arc(-2, -44, 2, 0, Math.PI * 2);
      ctx.fill();

      // Runic Greatsword
      ctx.save();
      ctx.translate(8, -26);
      ctx.rotate(this.isAttacking ? 0.75 : -0.3);
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(0, -16, 4, 38);
      // Emerald Soul Runes
      ctx.fillStyle = '#34d399';
      ctx.fillRect(1, -8, 2, 3);
      ctx.fillRect(1, 0, 2, 3);
      ctx.fillRect(1, 8, 2, 3);
      ctx.restore();

      // Armored Sabatons
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(-7, -10 + Math.max(0, legBob), 6, 10);
      ctx.fillRect(1, -10 + Math.max(0, -legBob), 6, 10);
    }

    ctx.restore();
  }
}
