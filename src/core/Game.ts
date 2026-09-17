import { GameLoop } from './GameLoop';
import { Camera } from './Camera';
import { InputManager } from './InputManager';
import { SoundEngine } from './SoundEngine';
import { ParticleSystem } from './ParticleSystem';
import { SaveManager } from './SaveManager';
import { DungeonGenerator, DungeonLevel } from '../world/DungeonGenerator';
import { WorldRenderer } from '../world/WorldRenderer';
import { RunManager } from '../roguelike/RunManager';
import { HUD } from '../ui/HUD';
import { UIManager } from '../ui/UIManager';
import { GamepadNavigator } from '../ui/GamepadNavigator';

import { Player } from '../entities/Player';
import { SirTectus } from '../entities/knights/SirTectus';
import { SirBareti } from '../entities/knights/SirBareti';
import { SirFluctus } from '../entities/knights/SirFluctus';
import { SirMorgani } from '../entities/knights/SirMorgani';
import { Projectile } from '../entities/Projectile';
import { Coin } from '../entities/Coin';
import { GoldenSandwich } from '../entities/GoldenSandwich';
import { Enemy } from '../entities/Enemy';
import { Boss } from '../entities/Boss';
import { BiomeConfig } from '../world/BiomeTypes';
import { Relic } from '../roguelike/RelicRegistry';

export type GameState =
  | 'title'
  | 'lobby'
  | 'playing'
  | 'paused'
  | 'portal_choice'
  | 'campfire'
  | 'boss_battle'
  | 'victory'
  | 'true_ending'
  | 'game_over';

export class Game {
  public canvas: HTMLCanvasElement;
  public ctx: CanvasRenderingContext2D;

  public loop: GameLoop;
  public camera: Camera;
  public input: InputManager;
  public sound: SoundEngine;
  public particles: ParticleSystem;
  public worldRenderer: WorldRenderer;
  public runManager: RunManager;
  public hud: HUD;
  public ui: UIManager;
  public gpNav: GamepadNavigator;

  public state: GameState = 'title';
  public currentLevel: DungeonLevel | null = null;
  public players: Player[] = [];
  public projectiles: Projectile[] = [];
  public coins: Coin[] = [];
  public enemies: Enemy[] = [];
  public sandwich: GoldenSandwich | null = null;
  public boss: Boss | null = null;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;

    this.camera = new Camera();
    this.input = new InputManager();
    this.sound = new SoundEngine();
    this.particles = new ParticleSystem();
    this.worldRenderer = new WorldRenderer();
    this.runManager = new RunManager();
    this.hud = new HUD();
    this.ui = new UIManager(this);
    this.gpNav = new GamepadNavigator();

    SaveManager.load();

    this.loop = new GameLoop(
      (dt) => this.update(dt),
      () => this.render()
    );

    this.initControls();
    (window as any).game = this;
    this.ui.showTitleScreen();
    this.loop.start();
  }

  private initControls(): void {
    // Keyboard shortcuts: F for fullscreen, M for mute, Esc/P for pause
    window.addEventListener('keydown', (e: KeyboardEvent) => {
      const active = document.activeElement;
      if (active && active.tagName === 'INPUT') return;

      if (e.code === 'KeyF' && !e.ctrlKey && !e.altKey && !e.metaKey) {
        this.input.toggleFullscreen();
      } else if (e.code === 'KeyM') {
        const muted = this.sound.toggleMute();
        this.hud.showToast(muted ? '🔇 AUDIO MUTED' : '🔊 AUDIO UNMUTED', 1500);
      } else if (e.key === 'Escape' || e.key === 'p' || e.key === 'P' || e.code === 'KeyP' || e.code === 'Escape') {
        if (this.state === 'playing' || this.state === 'boss_battle') {
          this.pauseGame();
        } else if (this.state === 'paused') {
          this.resumeGame();
        }
      }
    });

    document.getElementById('btn-hud-pause')?.addEventListener('click', () => {
      if (this.state === 'playing' || this.state === 'boss_battle') {
        this.pauseGame();
      } else if (this.state === 'paused') {
        this.resumeGame();
      }
    });

    // Sound effects on controller menu navigation
    this.gpNav.setOnNavigate(() => {
      this.sound.playSwordSwing(2.8);
    });
  }

  public pauseGame(): void {
    if (this.state !== 'playing' && this.state !== 'boss_battle') return;
    this.state = 'paused';
    this.hud.hide();
    this.ui.showPauseMenu(
      () => this.resumeGame(),
      () => this.ui.showOptionsMenu(true),
      () => this.abandonRun()
    );
  }

  public resumeGame(): void {
    if (this.state !== 'paused') return;
    this.state = 'playing';
    this.ui.clear();
    this.hud.show();
    this.gpNav.enabled = false;
    (document.activeElement as HTMLElement)?.blur();
  }

  public abandonRun(): void {
    this.state = 'title';
    this.hud.hide();
    this.players = [];
    this.enemies = [];
    this.projectiles = [];
    this.coins = [];
    this.sandwich = null;
    this.boss = null;
    this.ui.showTitleScreen();
  }

  public startRun(slots: { num: number; name: string; active: boolean; isCpu: boolean }[]): void {
    this.runManager.startNewRun();
    this.players = [];

    slots.forEach((s, idx) => {
      if (!s.active) return;
      let knight: Player;
      if (s.name.includes('Tectus')) knight = new SirTectus(idx, s.isCpu);
      else if (s.name.includes('Bareti')) knight = new SirBareti(idx, s.isCpu);
      else if (s.name.includes('Fluctus')) knight = new SirFluctus(idx, s.isCpu);
      else knight = new SirMorgani(idx, s.isCpu);

      this.players.push(knight);
    });

    this.loadLevel();
  }

  private loadLevel(): void {
    const isMap5 = this.runManager.currentStage === 5;
    const allowSecrets = SaveManager.isTrueEndingUnlocked;

    this.currentLevel = DungeonGenerator.generate(
      this.runManager.currentBiome,
      this.runManager.currentStage,
      allowSecrets
    );

    const testExit = typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('exit');
    const startX = testExit ? this.currentLevel.exitPoint.x - 180 : this.currentLevel.spawnPoint.x;
    const startY = testExit ? this.currentLevel.exitPoint.y + 40 : this.currentLevel.spawnPoint.y;

    this.camera.setBounds(0, 0, this.currentLevel.width, this.currentLevel.height);
    this.camera.reset(startX, startY);

    // Reset players at spawn point
    this.players.forEach((p, idx) => {
      p.reset(startX + idx * 32, startY);
    });

    // Spawn 12 Coins
    this.coins = [];
    this.currentLevel.coinSpawns.forEach(pos => {
      this.coins.push(new Coin(pos.x, pos.y, 'standard'));
    });

    // Map 4: Coin of Sandwich
    if (this.currentLevel.sandwichCoinSpawn) {
      this.coins.push(new Coin(
        this.currentLevel.sandwichCoinSpawn.x,
        this.currentLevel.sandwichCoinSpawn.y,
        'sandwich_coin'
      ));
    }

    // True Ending: Holy Condiment
    if (this.currentLevel.condimentSpawn) {
      this.coins.push(new Coin(
        this.currentLevel.condimentSpawn.x,
        this.currentLevel.condimentSpawn.y,
        'holy_condiment'
      ));
    }

    // Map 5: The Golden Sandwich Item
    if (isMap5) {
      this.sandwich = new GoldenSandwich(this.currentLevel.vendingMachinePos!.x, this.currentLevel.vendingMachinePos!.y);
      this.sandwich.dispense(this.currentLevel.vendingMachinePos!.x, this.currentLevel.vendingMachinePos!.y - 20);
      this.sound.playVendingMachine();
      this.sound.playSandwichFanfare();
      this.hud.showToast('INSERTED COIN! THE GOLDEN SANDWICH HAS DROPPED! EXTRACT IT!', 4500);
    } else {
      this.sandwich = null;
    }

    // Spawn enemies
    this.enemies = [];
    this.currentLevel.enemySpawns.forEach(e => {
      this.enemies.push(new Enemy(e.x, e.y, e.type));
    });

    this.projectiles = [];
    this.boss = null;
    this.state = 'playing';
    this.gpNav.enabled = false;
    (document.activeElement as HTMLElement)?.blur();
    this.hud.show();
    this.hud.update(this.runManager, this.players);
  }

  private update(dt: number): void {
    this.input.update();
    this.gpNav.update(dt);
    this.particles.update(dt);
    this.worldRenderer.update(dt);

    if (this.state === 'paused') {
      const p0 = this.input.getPlayerInput(0);
      if (p0.pausePressed) {
        this.resumeGame();
      }
      this.input.postUpdate();
      return;
    }

    if (this.state === 'playing' || this.state === 'boss_battle') {
      const p0 = this.input.getPlayerInput(0);
      if (p0.pausePressed) {
        this.pauseGame();
        this.input.postUpdate();
        return;
      }
      this.updateGameplay(dt);
    }

    this.input.postUpdate();
  }

  private updateGameplay(dt: number): void {
    if (!this.currentLevel) return;

    const purseWrapper = {
      get coins() { return this.ref.totalPurseCoins; },
      set coins(v: number) { this.ref.totalPurseCoins = v; },
      ref: this.runManager
    };

    // 1. Update Players
    for (let i = 0; i < this.players.length; i++) {
      const p = this.players[i];
      if (!p.isAlive) continue;

      let input = this.input.getPlayerInput(p.index);

      // Simple AI bot companion logic if CPU
      if (p.isCpu) {
        input = this.getBotInput(p);
      }

      p.updateBase(dt, input, this.currentLevel.platforms, this.projectiles, this.players, purseWrapper);
      p.performAbility(dt, input, this.projectiles);

      // Sandwich carry sync
      if (this.sandwich && this.sandwich.carrierIndex === p.index) {
        p.isCarryingSandwich = true;
        if (input.tossPressed) {
          this.sandwich.toss(p.facingLeft);
          p.isCarryingSandwich = false;
        }
      } else {
        p.isCarryingSandwich = false;
      }

      // Check Melee Sword Strikes & Pogo Attacks against Enemies & Boss
      if (p.isAttacking) {
        const hitbox = p.getMeleeHitbox();
        if (hitbox) {
          // Check Enemies
          for (let eIdx = 0; eIdx < this.enemies.length; eIdx++) {
            const e = this.enemies[eIdx];
            if (e.isAlive && e.hitCooldown <= 0) {
              const enemyLeft = e.x - e.width * 0.5;
              const enemyRight = e.x + e.width * 0.5;
              const enemyTop = e.y - e.height;
              const enemyBottom = e.y;

              // AABB collision check
              if (
                hitbox.x < enemyRight &&
                hitbox.x + hitbox.w > enemyLeft &&
                hitbox.y < enemyBottom &&
                hitbox.y + hitbox.h > enemyTop
              ) {
                // Check if Vanguard's frontal shield blocks the strike
                if (e.isFrontalShieldBlock(p.x, hitbox.isDownThrust)) {
                  this.sound.playParrySuccess();
                  this.particles.emitSparks(e.x, e.y - 18, '#ffd166', 14);
                  this.particles.emitCombatText(e.x, e.y - 32, 'SHIELD BLOCK!', '#ffd166', 14);
                  p.vx = (p.facingLeft ? 1 : -1) * 220;
                  return;
                }

                const kbDir = p.facingLeft ? -1 : 1;
                const kbX = hitbox.isDownThrust ? 0 : kbDir * 320;
                const kbY = hitbox.isDownThrust ? -240 : -180;
                const killed = e.takeDamage(1, kbX, kbY);

                this.sound.playSwordSwing(1.3);
                this.sound.playEnemyDamage();
                this.camera.addTrauma(killed ? 0.35 : 0.2);
                this.particles.emitSlashSparks(e.x, e.y - 18, p.facingLeft);
                this.particles.emitCombatText(e.x, e.y - 32, killed ? 'SLAY!' : 'HIT! -1', killed ? '#ef476f' : '#ffd166', 15);

                // Down-thrust Pogo Jump Bounce!
                if (hitbox.isDownThrust) {
                  p.vy = -560;
                  p.jumpsRemaining = 1;
                  this.sound.playPogoBounce();
                  this.particles.emitRing(p.x, p.y, '#2ec4b6', 36);
                  this.particles.emitCombatText(p.x, p.y - 20, 'POGO!', '#2ec4b6', 16);
                }

                // Dropped loot on kill
                if (killed) {
                  this.sound.playEnemyDeath();
                  this.particles.emitDeathPoof(e.x, e.y - 18, '#ef476f');
                  if (Math.random() < 0.65) {
                    this.coins.push(new Coin(e.x, e.y - 20, 'standard'));
                    this.particles.emitCoinShine(e.x, e.y - 20);
                  }
                }
              }
            }
          }

          // Check if attack strikes destructible projectiles (e.g. Void Skull)
          this.projectiles.forEach(proj => {
            if (proj.isAlive && proj.isDestructible) {
              const d = Math.hypot(proj.x - (hitbox.x + hitbox.w * 0.5), proj.y - (hitbox.y + hitbox.h * 0.5));
              if (d < 38) {
                proj.isAlive = false;
                this.sound.playArrowHit();
                this.particles.emitDeathPoof(proj.x, proj.y, '#a855f7');
                this.particles.emitCombatText(proj.x, proj.y - 20, 'PARRY!', '#06b6d4', 13);
              }
            }
          });

          // Check Boss (Lord Crustifer)
          if (this.boss && this.boss.isAlive) {
            const bossLeft = this.boss.x - this.boss.width * 0.5;
            const bossRight = this.boss.x + this.boss.width * 0.5;
            const bossTop = this.boss.y - this.boss.height;
            const bossBottom = this.boss.y;

            if (
              hitbox.x < bossRight &&
              hitbox.x + hitbox.w > bossLeft &&
              hitbox.y < bossBottom &&
              hitbox.y + hitbox.h > bossTop
            ) {
              const slain = this.boss.takeDamage(1);
              this.sound.playEnemyDamage();
              this.camera.addTrauma(slain ? 0.8 : 0.25);
              this.particles.emitSparks(this.boss.x, this.boss.y - 50, '#ffbe0b', 16);
              this.particles.emitCombatText(this.boss.x, this.boss.y - 90, '-1 HP', '#ffd166', 16);

              if (hitbox.isDownThrust) {
                p.vy = -580;
                p.jumpsRemaining = 1;
                this.sound.playPogoBounce();
                this.particles.emitRing(p.x, p.y, '#ffd166', 45);
              }

              if (slain) {
                this.triggerTrueEnding();
              }
            }
          }
        }

        // Check Revives: Sword strike hits teammate's soul bubble!
        this.players.forEach(teammate => {
          if (teammate.isInBubble) {
            const d = Math.hypot(teammate.x - p.x, teammate.y - p.y);
            if (d < 68) {
              const revived = teammate.strikeBubble(purseWrapper);
              if (revived) {
                this.sound.playRevive();
                this.particles.emitRing(teammate.x, teammate.y, '#06d6a0', 32);
                this.hud.showToast(`${teammate.name} REVIVED!`, 2000);
              }
            }
          }
        });
      }

      // Check Sir Tectus Shield Bash (reflect stance knocks enemies back)
      if ((p as any).isReflecting) {
        this.enemies.forEach(e => {
          if (e.isAlive && Math.hypot(e.x - p.x, e.y - p.y) < 45 && e.hitCooldown <= 0) {
            const bashDir = p.facingLeft ? -1 : 1;
            const killed = e.takeDamage(1, bashDir * 380, -180);
            this.sound.playParrySuccess();
            this.particles.emitSparks(e.x, e.y - 18, '#ffd166', 14);
            this.particles.emitCombatText(e.x, e.y - 30, 'SHIELD BASH!', '#ffd166', 14);
            if (killed) {
              this.sound.playEnemyDeath();
              this.particles.emitDeathPoof(e.x, e.y - 18, '#ffd166');
            }
          }
        });
      }

      // Check Sir Fluctus Water Slide Collision (rams enemies)
      if ((p as any).isWaterSliding) {
        this.enemies.forEach(e => {
          if (e.isAlive && Math.hypot(e.x - p.x, e.y - p.y) < 45 && e.hitCooldown <= 0) {
            const slideDir = p.facingLeft ? -1 : 1;
            const killed = e.takeDamage(1, slideDir * 460, -220);
            this.sound.playWaterSlide();
            this.particles.emitWaterSplash(e.x, e.y - 10, 10);
            this.particles.emitCombatText(e.x, e.y - 30, 'SURF RAM!', '#2ec4b6', 14);
            if (killed) {
              this.sound.playEnemyDeath();
              this.particles.emitDeathPoof(e.x, e.y - 18, '#2ec4b6');
            }
          }
        });
      }

      // Hazard collisions (Spikes, Lava, Fire Vents, Blade Traps)
      this.currentLevel.hazards.forEach(h => {
        if (h.type === 'fire_vent') {
          // Only damages when fire column is active
          if (h.state === 'active') {
            const flameH = h.flameHeight || 85;
            if (
              p.x + p.width * 0.4 > h.x && p.x - p.width * 0.4 < h.x + h.w &&
              p.y > h.y - flameH && p.y - p.height < h.y + h.h
            ) {
              const bounceX = p.x < h.x + h.w * 0.5 ? -180 : 180;
              this.damagePlayer(p, h.damage, bounceX, -340);
              this.particles.emitFire(p.x, p.y - 20, 10);
            }
          }
        } else if (h.type === 'blade_trap') {
          // Pendulum blade contact
          const anchorX = h.anchorX ?? (h.x + h.w * 0.5);
          const anchorY = h.anchorY ?? (h.y - 120);
          const len = h.length ?? 120;
          const bladeX = anchorX + Math.sin(h.angle ?? 0) * len;
          const bladeY = anchorY + Math.cos(h.angle ?? 0) * len;
          const dBlade = Math.hypot(bladeX - p.x, bladeY - (p.y - 20));
          if (dBlade < 30) {
            const swingDir = Math.cos(h.timer ?? 0) >= 0 ? 1 : -1;
            this.damagePlayer(p, h.damage, swingDir * 320, -260);
            this.sound.playSwordSwing(0.8);
            this.particles.emitSlashSparks(bladeX, bladeY, swingDir < 0);
          }
        } else {
          // Spikes / Lava floor hazards
          if (
            p.x + p.width * 0.5 > h.x && p.x - p.width * 0.5 < h.x + h.w &&
            p.y > h.y && p.y - p.height < h.y + h.h
          ) {
            const bounceX = p.x < h.x + h.w * 0.5 ? -150 : 150;
            this.damagePlayer(p, h.damage, bounceX, -380);
          }
        }
      });
    }

    // Update Dynamic Hazard Cycles & Crumbling Platforms
    this.currentLevel.hazards.forEach(h => {
      if (h.type === 'fire_vent') {
        h.timer = (h.timer ?? 0) - dt;
        if (h.timer <= 0) {
          if (h.state === 'dormant' || !h.state) {
            h.state = 'warning';
            h.timer = 0.55;
          } else if (h.state === 'warning') {
            h.state = 'active';
            h.timer = 1.25;
            this.sound.playFireball();
          } else {
            h.state = 'dormant';
            h.timer = (h.cycleTime || 3.2) - 1.8;
          }
        }
      } else if (h.type === 'blade_trap') {
        h.timer = (h.timer ?? 0) + dt * (h.swingSpeed ?? 2.2);
        h.angle = Math.sin(h.timer) * 0.92;
      }
    });

    // Update Crumbling Platforms
    for (let pi = 0; pi < this.currentLevel.platforms.length; pi++) {
      const plat = this.currentLevel.platforms[pi];
      if (plat.crumble) {
        if (plat.crumbleState !== 'shaking' && !plat.isCrumbled) {
          const isSteppedOn = this.players.some(p =>
            p.isAlive && !p.isInBubble && p.isGrounded &&
            p.x >= plat.x - 8 && p.x <= plat.x + plat.w + 8 &&
            Math.abs(p.y - plat.y) <= 4
          );
          if (isSteppedOn) {
            plat.crumbleState = 'shaking';
            plat.crumbleTimer = plat.crumbleTimer || 0.65;
          }
        } else if (plat.crumbleState === 'shaking') {
          plat.crumbleTimer = (plat.crumbleTimer || 0.65) - dt;
          plat.shakeOffset = (Math.random() - 0.5) * 6;
          if (plat.crumbleTimer <= 0) {
            plat.crumbleState = 'broken';
            plat.isCrumbled = true;
            plat.crumbleCooldown = 3.5;
            plat.shakeOffset = 0;
            this.sound.playPogoBounce();
            this.particles.emitDeathPoof(plat.x + plat.w * 0.5, plat.y + 10, '#64748b');
          }
        } else if (plat.isCrumbled) {
          plat.crumbleCooldown = (plat.crumbleCooldown || 3.5) - dt;
          if (plat.crumbleCooldown <= 0) {
            plat.isCrumbled = false;
            plat.crumbleState = 'idle';
            plat.crumbleTimer = 0.65;
            plat.shakeOffset = 0;
            this.particles.emitSparks(plat.x + plat.w * 0.5, plat.y, '#94a3b8', 8);
          }
        }
      }
    }

    // 2. Update Projectiles
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const proj = this.projectiles[i];
      const returnTarget = proj.ownerIndex >= 0 ? this.players[proj.ownerIndex] : undefined;

      // Find nearest living player for homing projectiles
      let nearestPlayer: Player | null = null;
      let minDist = 9999;
      for (let pIdx = 0; pIdx < this.players.length; pIdx++) {
        const pl = this.players[pIdx];
        if (pl.isAlive && !pl.isInBubble) {
          const dist = Math.hypot(pl.x - proj.x, (pl.y - 18) - proj.y);
          if (dist < minDist) {
            minDist = dist;
            nearestPlayer = pl;
          }
        }
      }

      proj.update(dt, this.currentLevel.platforms, returnTarget, nearestPlayer);

      // Check if projectile exploded on impact (e.g. Pyromancer firebomb)
      if (proj.hasExploded) {
        this.sound.playFireball();
        this.particles.emitFire(proj.x, proj.y, 22);
        this.players.forEach(p => {
          if (p.isAlive && !p.isInBubble && Math.hypot(p.x - proj.x, (p.y - 18) - proj.y) < (proj.explosionRadius || 65)) {
            const kbX = p.x >= proj.x ? 240 : -240;
            this.damagePlayer(p, 1, kbX, -220);
          }
        });
        this.projectiles.splice(i, 1);
        continue;
      }

      if (!proj.isAlive) {
        this.projectiles.splice(i, 1);
        continue;
      }

      // Hit enemies
      if (proj.ownerIndex >= 0) {
        // Sir Tectus Boomerang gathers coins along its flight path!
        if (proj.type === 'shield_boomerang') {
          this.coins.forEach(c => {
            if (!c.isCollected && Math.hypot(proj.x - c.x, proj.y - c.y) < 38) {
              if (c.type === 'standard') {
                this.runManager.collectCoin();
                this.sound.playCoinCollect(this.runManager.coinsCollectedThisStage);
                this.particles.emitCoinShine(c.x, c.y);
                c.isCollected = true;
                if (this.runManager.isGateUnlocked) {
                  this.sound.playGateUnlock();
                  this.hud.showToast('12 COINS COLLECTED! THE GOLDEN GATE IS UNSEALED!', 4000);
                  const gate = this.currentLevel!.props.find(pr => pr.type === 'gate');
                  if (gate) gate.active = true;
                }
              }
            }
          });
        }

        this.enemies.forEach(e => {
          if (e.isAlive && e.hitCooldown <= 0) {
            const d = Math.hypot(proj.x - e.x, proj.y - (e.y - 18));
            if (d < 28) {
              // Check Vanguard frontal shield deflection
              if (e.isFrontalShieldBlock(proj.x, false)) {
                this.sound.playParrySuccess();
                this.particles.emitSparks(e.x, e.y - 18, '#ffd166', 12);
                this.particles.emitCombatText(e.x, e.y - 32, 'DEFLECT!', '#ffd166', 14);
                if (proj.type === 'arrow') {
                  proj.vx = -proj.vx * 0.4;
                  proj.vy = -140;
                  proj.ownerIndex = -1;
                } else if (proj.type === 'shield_boomerang') {
                  proj.vx = -proj.vx * 0.8;
                  proj.vy = -proj.vy * 0.8;
                  proj.isReturning = true;
                } else if (proj.type === 'fireball') {
                  this.sound.playFireball();
                  this.particles.emitFire(proj.x, proj.y, 16);
                  proj.isAlive = false;
                } else {
                  proj.isAlive = false;
                }
                return;
              }

              const kbDir = proj.vx >= 0 ? 1 : -1;
              const killed = e.takeDamage(proj.damage, kbDir * 280, -180);
              this.sound.playArrowHit();
              this.sound.playEnemyDamage();
              this.particles.emitSparks(e.x, e.y - 18, '#ffd166', 10);
              this.particles.emitCombatText(e.x, e.y - 32, killed ? 'SLAY!' : `-${proj.damage}`, killed ? '#ef476f' : '#ffd166', 14);

              // Sir Bareti Fireball Explosive AoE
              if (proj.type === 'fireball') {
                this.sound.playFireball();
                this.particles.emitFire(proj.x, proj.y, 16);
                this.enemies.forEach(otherE => {
                  if (otherE !== e && otherE.isAlive && Math.hypot(otherE.x - proj.x, otherE.y - proj.y) < 60) {
                    otherE.takeDamage(1, kbDir * 200, -160);
                    this.particles.emitCombatText(otherE.x, otherE.y - 30, 'BURN -1', '#ff5400', 13);
                  }
                });
              }

              // Drop loot on kill
              if (killed) {
                this.sound.playEnemyDeath();
                this.particles.emitDeathPoof(e.x, e.y - 18, '#ffd166');
                if (Math.random() < 0.65) {
                  this.coins.push(new Coin(e.x, e.y - 20, 'standard'));
                  this.particles.emitCoinShine(e.x, e.y - 20);
                }
              }

              if (proj.type !== 'thrown_sword' && proj.type !== 'shield_boomerang') {
                proj.isAlive = false;
              }
            }
          }
        });

        // Hit Boss
        if (this.boss && this.boss.isAlive) {
          const d = Math.hypot(proj.x - this.boss.x, proj.y - (this.boss.y - 50));
          if (d < 65) {
            const slain = this.boss.takeDamage(proj.damage);
            this.sound.playEnemyDamage();
            this.particles.emitSparks(this.boss.x, this.boss.y - 50, '#ffbe0b', 12);
            if (proj.type !== 'thrown_sword' && proj.type !== 'shield_boomerang') {
              proj.isAlive = false;
            }
            if (slain) {
              this.triggerTrueEnding();
            }
          }
        }
      } else {
        // Enemy projectile hits players
        this.players.forEach(p => {
          if (p.isAlive && !p.isInBubble) {
            const d = Math.hypot(proj.x - p.x, proj.y - (p.y - 20));
            if (d < 24) {
              // Sir Tectus Shield Stance reflects enemy projectiles back!
              if ((p as any).isReflecting) {
                proj.ownerIndex = p.index;
                proj.vx = (p.facingLeft ? -1 : 1) * Math.abs(proj.vx) * 1.5;
                proj.vy = -60;
                proj.damage = 2; // Reflected bonus damage!
                this.sound.playParrySuccess();
                this.particles.emitRing(p.x, p.y - 20, '#ffd166', 36);
                this.particles.emitCombatText(p.x, p.y - 32, 'REFLECT!', '#ffd166', 15);
                return;
              }

              // Firebomb explodes on impact
              if (proj.type === 'firebomb') {
                this.sound.playFireball();
                this.particles.emitFire(proj.x, proj.y, 20);
              }

              const kbX = proj.vx >= 0 ? 180 : -180;
              this.damagePlayer(p, proj.damage, kbX, -200);
              proj.isAlive = false;
            }
          }
        });
      }
    }

    // 3. Update Enemies
    for (let i = 0; i < this.enemies.length; i++) {
      const e = this.enemies[i];
      e.update(dt, this.currentLevel.platforms, this.players, this.projectiles);

      // Melee attack players
      if (e.isAlive && !e.isDying) {
        const meleeHit = e.getMeleeHitbox();
        if (meleeHit) {
          this.players.forEach(p => {
            if (p.isAlive && !p.isInBubble) {
              const pLeft = p.x - p.width * 0.5;
              const pRight = p.x + p.width * 0.5;
              const pTop = p.y - p.height;
              const pBottom = p.y;

              if (
                meleeHit.x < pRight &&
                meleeHit.x + meleeHit.w > pLeft &&
                meleeHit.y < pBottom &&
                meleeHit.y + meleeHit.h > pTop
              ) {
                let kbX = e.facingLeft ? -220 : 220;
                let kbY = -220;
                let dmg = 1;

                if (e.type === 'vanguard') {
                  // Heavy shield bash lunge
                  kbX = (e.facingLeft ? -1 : 1) * 350;
                  kbY = -250;
                } else if (e.type === 'berserker') {
                  // Whirlwind cyclone push
                  kbX = (p.x >= e.x ? 1 : -1) * 270;
                  kbY = -210;
                }

                this.damagePlayer(p, dmg, kbX, kbY);
              }
            }
          });
        }

        // Floater and Wraith contact swoop
        if (e.type === 'floater' || e.type === 'wraith') {
          this.players.forEach(p => {
            if (p.isAlive && !p.isInBubble) {
              const d = Math.hypot(e.x - p.x, e.y - (p.y - 18));
              if (d < 24) {
                const kbX = e.vx >= 0 ? 160 : -160;
                this.damagePlayer(p, 1, kbX, -200);
              }
            }
          });
        }
      }
    }

    // 4. Update Coins & Collection
    const livingKnights = this.players.filter(p => p.isAlive && !p.isInBubble);
    this.coins.forEach(c => {
      c.update(dt, livingKnights, 75);

      livingKnights.forEach(p => {
        if (c.checkCollection(p.x, p.y - 20, 22)) {
          if (c.type === 'standard') {
            this.runManager.collectCoin();
            this.sound.playCoinCollect(this.runManager.coinsCollectedThisStage);
            this.particles.emitCoinShine(c.x, c.y);

            if (this.runManager.isGateUnlocked) {
              this.sound.playGateUnlock();
              this.hud.showToast('12 COINS COLLECTED! THE GOLDEN GATE IS UNSEALED!', 4000);
              // Unlock gate prop
              const gate = this.currentLevel!.props.find(pr => pr.type === 'gate');
              if (gate) gate.active = true;
            }
          } else if (c.type === 'sandwich_coin') {
            this.runManager.hasCoinOfSandwich = true;
            this.sound.playSandwichFanfare();
            this.particles.emitRing(c.x, c.y, '#ffd166', 45);
            this.hud.showToast('OBTAINED THE COIN OF SANDWICH! TAKE IT TO MAP 5!', 4000);
          } else if (c.type === 'holy_condiment') {
            this.runManager.hasHolyCondiment = true;
            this.sound.playSandwichFanfare();
            this.particles.emitRing(c.x, c.y, '#ffd166', 45);
            this.hud.showToast('FOUND THE HOLY GOLDEN CONDIMENT! LORD CRUSTIFER STIRS!', 4000);
          }
        }
      });
    });

    // 5. Update Golden Sandwich (Map 5)
    if (this.sandwich) {
      this.sandwich.update(dt, this.currentLevel.platforms, this.players);

      // Check Extraction Altar arrival with the sandwich
      const altar = this.currentLevel.extractionAltarPos;
      if (altar && this.sandwich.carrierIndex >= 0) {
        const carrier = this.players[this.sandwich.carrierIndex];
        const dist = Math.hypot(carrier.x - altar.x, carrier.y - altar.y);
        if (dist < 80) {
          this.handleExtractionAltarReach();
        }
      }
    }

    // 6. Check Exit Gate (Maps 1-4)
    if (this.runManager.currentStage < 5 && this.runManager.isGateUnlocked) {
      const exit = this.currentLevel.exitPoint;
      const anyNear = this.players.some(p => p.isAlive && !p.isInBubble && Math.hypot(p.x - exit.x, p.y - exit.y) < 60);
      if (anyNear) {
        this.openBranchingPortals();
      }
    }

    // 7. Boss Update (Lord Crustifer)
    if (this.boss && this.boss.isAlive) {
      this.boss.update(dt, this.players, this.projectiles);
    }

    // 8. Check Wipe (All players in bubble)
    const allTrapped = this.players.every(p => p.isInBubble || !p.isAlive);
    if (allTrapped && this.players.length > 0) {
      this.state = 'game_over';
      this.hud.hide();
      this.ui.showGameOver(this.runManager.currentStage);
    }

    // 9. Camera update
    this.camera.update(dt, this.players);
    this.hud.update(this.runManager, this.players);
  }

  private handleExtractionAltarReach(): void {
    const allAlive = this.players.every(p => p.isAlive && !p.isInBubble);
    const triggerTrueBoss = this.runManager.checkTrueEndingCondition(allAlive);

    if (triggerTrueBoss && !this.boss) {
      // Trigger Lord Crustifer secret boss fight!
      this.state = 'boss_battle';
      this.sound.playGateUnlock();
      this.camera.addTrauma(0.8);
      this.boss = new Boss(this.currentLevel!.extractionAltarPos!.x, this.currentLevel!.extractionAltarPos!.y - 80);
      this.hud.showToast('LORD CRUSTIFER AWAKENS! DEFEAT HIM FOR THE TRUE ENDING!', 5000);
    } else if (!this.boss) {
      // Standard Victory!
      this.triggerStandardVictory();
    }
  }

  private openBranchingPortals(): void {
    this.state = 'portal_choice';
    this.hud.hide();
    const portalOptions = this.runManager.getBranchingPortalOptions();

    this.ui.showBranchingPortals(portalOptions, (chosenBiome: BiomeConfig) => {
      // Enter Campfire
      this.openCampfireShop(chosenBiome);
    });
  }

  private openCampfireShop(nextBiome: BiomeConfig): void {
    this.state = 'campfire';
    this.ui.showCampfireShop(
      this.runManager.totalPurseCoins,
      (relic: Relic) => {
        if (this.runManager.totalPurseCoins >= relic.cost) {
          this.runManager.totalPurseCoins -= relic.cost;
          this.runManager.activeRelics.add(relic.id);
          this.sound.playSandwichFanfare();
          this.hud.showToast(`ACQUIRED ${relic.name.toUpperCase()}!`, 2500);

          if (relic.id === 'heart-container') {
            this.players.forEach(p => {
              p.maxHealth++;
              p.health = p.maxHealth;
            });
          }
          return true;
        }
        return false;
      },
      () => {
        this.runManager.advanceToBiome(nextBiome);
        this.loadLevel();
      }
    );
  }

  private triggerStandardVictory(): void {
    this.state = 'victory';
    this.hud.hide();
    const time = this.runManager.getElapsedTimeSeconds();
    SaveManager.recordStandardVictory(time, this.runManager.totalCoinsGatheredLifetimeRun);
    this.sound.playSandwichFanfare();
    this.ui.showStandardVictory(time, this.runManager.totalCoinsGatheredLifetimeRun);
  }

  private triggerTrueEnding(): void {
    this.state = 'true_ending';
    this.hud.hide();
    const time = this.runManager.getElapsedTimeSeconds();
    SaveManager.recordTrueEnding(time, this.runManager.totalCoinsGatheredLifetimeRun);
    this.sound.playSandwichFanfare();
    this.ui.showTrueEnding(time, this.runManager.totalCoinsGatheredLifetimeRun);
  }

  private damagePlayer(p: Player, amount: number, knockbackX: number = 0, knockbackY: number = -240): boolean {
    if (p.isInvulnerable || !p.isAlive || p.isInBubble) return false;

    const downed = p.takeDamage(amount);
    this.sound.playHit(downed);
    this.camera.addTrauma(downed ? 0.65 : 0.35);
    this.worldRenderer.triggerDamageFlash();
    this.particles.emitBrokenHeart(p.x, p.y - 25);
    this.particles.emitCombatText(p.x, p.y - 35, '-1 ❤️', '#ef476f', 16);
    this.particles.emitRing(p.x, p.y - 20, '#ef476f', 36);

    if (knockbackX !== 0 || knockbackY !== 0) {
      p.vx = knockbackX;
      p.vy = knockbackY;
    }
    return true;
  }

  private getBotInput(bot: Player) {
    const input = {
      moveX: 0,
      moveY: 0,
      jump: false,
      jumpPressed: false,
      attack: false,
      attackPressed: false,
      aimBow: false,
      aimBowPressed: false,
      shootArrow: false,
      ability: false,
      abilityPressed: false,
      dash: false,
      dashPressed: false,
      dropThrough: false,
      pausePressed: false,
      tossPressed: false
    };

    if (!bot.isAlive || bot.isInBubble) return input;

    // Track persistent bot navigation & jump timing states on instance
    const botData = bot as any;
    if (botData.botStuckTimer === undefined) botData.botStuckTimer = 0;
    if (botData.botAbilityCooldown === undefined) botData.botAbilityCooldown = 0;
    if (botData.jumpHoldTimer === undefined) botData.jumpHoldTimer = 0;
    if (botData.airTime === undefined) botData.airTime = 0;
    if (botData.doubleJumpDelay === undefined) botData.doubleJumpDelay = 0;
    if (botData.jumpCooldown === undefined) botData.jumpCooldown = 0;
    if (botData.groundedTimer === undefined) botData.groundedTimer = 0;
    if (botData.bouncerCooldown === undefined) botData.bouncerCooldown = 0;

    const dtEst = 0.016;
    if (botData.botAbilityCooldown > 0) botData.botAbilityCooldown -= dtEst;
    if (botData.jumpCooldown > 0) botData.jumpCooldown -= dtEst;
    if (botData.doubleJumpDelay > 0) botData.doubleJumpDelay -= dtEst;
    if (botData.bouncerCooldown > 0) botData.bouncerCooldown -= dtEst;

    // Sustained jump hold: Keeps jump button held through the ascent for a long, slow, high arc!
    if (botData.jumpHoldTimer > 0) {
      botData.jumpHoldTimer -= dtEst;
      input.jump = true;
    }

    // 1. EMERGENCY REVIVE PRIORITY: Check for any ally in a soul bubble
    const bubbleAlly = this.players.find(p => p !== bot && p.isInBubble);

    // Determine primary target: Bubble Ally (Emergency) or Living Leader
    let targetX = bot.x;
    let targetY = bot.y;
    let isReviving = false;
    let leader = this.players.find(p => !p.isCpu && p.isAlive && !p.isInBubble);
    if (!leader) {
      // If human is down or all humans are down, follow any living teammate
      leader = this.players.find(p => p !== bot && p.isAlive && !p.isInBubble);
    }

    if (bubbleAlly) {
      isReviving = true;
      targetX = bubbleAlly.x;
      targetY = bubbleAlly.y;
    } else if (leader) {
      // 2. TACTICAL SPACING: Give the player plenty of room!
      // Keep a staggered flanking offset (90-120px) so the bot doesn't crowd or block vision
      const flankSide = (bot.index % 2 === 0) ? -1 : 1;
      const flankOffset = flankSide * (90 + (bot.index * 15));
      targetX = leader.x + flankOffset;

      // Track the leader's actual grounded platform height!
      // When the leader hops/jumps in place, do NOT mirror their jump into the sky!
      if (leader.isGrounded || botData.leaderGroundedY === undefined) {
        botData.leaderGroundedY = leader.y;
      }
      targetY = botData.leaderGroundedY;
    }

    const dx = targetX - bot.x;
    const dy = targetY - bot.y;

    // 3. HORIZONTAL NAVIGATION (Smooth, Natural Companion Pacing - Never Rushing)
    const distToTarget = Math.abs(dx);
    if (distToTarget > 32) {
      const dir = dx > 0 ? 1 : -1;
      if (isReviving) {
        // Emergency: Full speed to revive fallen ally
        input.moveX = dir;
      } else if (distToTarget > 220) {
        // Far behind: Gentle brisk jog to catch up smoothly
        input.moveX = dir * 0.85;
      } else if (distToTarget > 90) {
        // Normal companion pace
        input.moveX = dir * 0.68;
      } else {
        // Close range: Relaxed companion stroll alongside player (smooth, no sudden sprinting)
        input.moveX = dir * 0.52;
      }
    } else if (!isReviving && leader) {
      // If player approaches too closely (<45px), gently step aside to yield space
      const playerDist = Math.abs(leader.x - bot.x);
      if (playerDist < 45) {
        input.moveX = (bot.x > leader.x) ? 0.45 : -0.45;
      }
    }

    // 4. VERTICAL CLIMBING & JUMP LOGIC (Poised, Purposeful, Long Slow Arcs - Never Bouncing)
    if (bot.isGrounded) {
      botData.airTime = 0;
      botData.doubleJumpDelay = 0;
      botData.groundedTimer += dtEst;

      // Only jump if target platform is genuinely elevated (dy < -55; or dy < -35 for soul bubble revive)
      const needsVerticalClimb = isReviving ? (dy < -35) : (dy < -55);

      // Must be horizontally close enough to make meaningful progress toward the ledge
      const inClimbRange = Math.abs(dx) < 180 || isReviving;

      // Grounded settle delay: Bot must have both feet planted for at least 0.75s (0.25s for emergency revive)
      // This prevents the bot from constantly bouncing upon landing!
      const settledOnGround = botData.groundedTimer >= (isReviving ? 0.25 : 0.75);

      if (needsVerticalClimb && inClimbRange && settledOnGround && botData.jumpCooldown <= 0) {
        input.jump = true;
        input.jumpPressed = true;
        botData.jumpHoldTimer = 0.42; // Retain the long, slow, graceful rise that looks great!
        botData.doubleJumpDelay = 0.42; // Apex delay before double jump is considered
        botData.jumpCooldown = 1.2; // Dialed back: Generous rest cooldown so bot strolls naturally
        botData.groundedTimer = 0;
      }

      // If near a bouncy launchpad, path onto it only when a massive vertical launch is genuinely required
      if (this.currentLevel && dy < -80 && botData.bouncerCooldown <= 0) {
        const nearBouncer = this.currentLevel.platforms.find(plat => 
          plat.bouncy && Math.abs((plat.x + plat.w * 0.5) - bot.x) < 70 && Math.abs(plat.y - bot.y) < 40
        );
        if (nearBouncer) {
          input.moveX = (nearBouncer.x + nearBouncer.w * 0.5) > bot.x ? 0.65 : -0.65;
        }
      }
    } else {
      // In air: reset ground timer and track airborne time
      botData.groundedTimer = 0;
      botData.airTime += dtEst;

      // If launched by a bouncy launchpad, activate cooldown so bot doesn't steer back into a bounce trap
      if (bot.vy < -550) {
        botData.bouncerCooldown = 2.0;
      }

      // Double Jump logic: smooth, deliberate second jump ONLY when genuinely needed
      // (High cliffs dy < -90, wide horizontal chasm gap, or emergency soul bubble rescue)
      const needsHighDoubleJump = dy < -90 || (isReviving && dy < -50);
      const needsChasmDoubleJump = Math.abs(dx) > 130 && dy < -30;

      if (
        bot.jumpsRemaining > 0 &&
        botData.doubleJumpDelay <= 0 &&
        botData.airTime >= 0.38 &&
        bot.vy > -50 && bot.vy < 140 &&
        (needsHighDoubleJump || needsChasmDoubleJump)
      ) {
        input.jump = true;
        input.jumpPressed = true;
        botData.jumpHoldTimer = 0.40; // Hold double jump for smooth apex extension
        botData.doubleJumpDelay = 999; // Prevent multi-triggering
      }
    }

    // Drop through one-way floors when target is significantly below
    if (dy > 65) {
      input.moveY = 1;
      input.dropThrough = true;
    }

    // 5. ANTI-STUCK CLAMBERING: Detect horizontal blockage against step/ledge
    if (Math.abs(input.moveX) > 0.1 && bot.isGrounded && Math.abs(bot.vx) < 16) {
      botData.botStuckTimer += dtEst;
      if (botData.botStuckTimer > 0.8 && botData.jumpCooldown <= 0 && botData.groundedTimer >= 0.6) {
        input.jump = true;
        input.jumpPressed = true;
        botData.jumpHoldTimer = 0.38;
        botData.jumpCooldown = 1.6; // generous cooldown so it doesn't repeatedly jump into a wall
        botData.botStuckTimer = 0;
        botData.groundedTimer = 0;
      }
    } else {
      botData.botStuckTimer = 0;
    }

    // 6. REVIVE STRIKE: Slash soul bubble when in proximity
    if (isReviving && bubbleAlly) {
      const bubbleDist = Math.hypot(bubbleAlly.x - bot.x, bubbleAlly.y - (bot.y - 18));
      if (bubbleDist < 75) {
        input.attack = true;
        input.attackPressed = true;
      }
    }

    // 7. COMBAT & SELF DEFENSE
    // Melee attack nearest living enemy within sword reach
    const meleeEnemy = this.enemies.find(e => e.isAlive && Math.hypot(e.x - bot.x, e.y - bot.y) < 72);
    if (meleeEnemy) {
      if (!isReviving) {
        input.moveX = meleeEnemy.x > bot.x ? 0.8 : -0.8;
      }
      input.attack = true;
      input.attackPressed = true;

      // Tactical flanking: If facing a Vanguard's tower shield, try to jump/dodge behind him
      if (meleeEnemy.type === 'vanguard' && (meleeEnemy as any).isShieldGuarding) {
        const vanguardFacesBot = meleeEnemy.facingLeft ? (bot.x < meleeEnemy.x) : (bot.x > meleeEnemy.x);
        if (vanguardFacesBot) {
          input.moveX = meleeEnemy.facingLeft ? 0.9 : -0.9;
          if (bot.isGrounded && botData.jumpCooldown <= 0) {
            input.jump = true;
            input.jumpPressed = true;
            botData.jumpHoldTimer = 0.38;
          }
        }
      }
    }

    // Cast signature knight ability against distant enemies (80-220px)
    if (!isReviving && botData.botAbilityCooldown <= 0) {
      const rangedEnemy = this.enemies.find(e => e.isAlive && Math.hypot(e.x - bot.x, e.y - bot.y) >= 80 && Math.hypot(e.x - bot.x, e.y - bot.y) < 220);
      if (rangedEnemy) {
        input.moveX = rangedEnemy.x > bot.x ? 0.7 : -0.7;
        input.ability = true;
        input.abilityPressed = true;
        botData.botAbilityCooldown = 2.4;
      }
    }

    // 8. HAZARD EVASION: Scurry away from warning or active fire vents
    if (this.currentLevel) {
      const ventDanger = this.currentLevel.hazards.find(h =>
        h.type === 'fire_vent' && (h.state === 'warning' || h.state === 'active') &&
        bot.x >= h.x - 24 && bot.x <= h.x + h.w + 24 &&
        Math.abs(bot.y - h.y) < 55
      );
      if (ventDanger) {
        const escapeDir = bot.x > (ventDanger.x + ventDanger.w * 0.5) ? 1 : -1;
        input.moveX = escapeDir;
        if (bot.isGrounded && botData.jumpCooldown <= 0) {
          input.jump = true;
          input.jumpPressed = true;
          botData.jumpHoldTimer = 0.35;
          botData.jumpCooldown = 1.0;
        }
      }
    }

    return input;
  }

  private render(): void {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    if (this.currentLevel && (this.state === 'playing' || this.state === 'boss_battle')) {
      this.camera.applyTransform(this.ctx);

      // World, Props, Platforms & Hazards
      this.worldRenderer.render(this.ctx, this.currentLevel, this.camera);

      // Coins
      this.coins.forEach(c => c.render(this.ctx));

      // Golden Sandwich
      if (this.sandwich) this.sandwich.render(this.ctx);

      // Enemies
      this.enemies.forEach(e => e.render(this.ctx));

      // Boss
      if (this.boss) this.boss.render(this.ctx);

      // Players
      this.players.forEach(p => p.render(this.ctx));

      // Projectiles
      this.projectiles.forEach(pr => pr.render(this.ctx));

      // Particles
      this.particles.render(this.ctx);

      this.camera.resetTransform(this.ctx);
    }
  }
}
