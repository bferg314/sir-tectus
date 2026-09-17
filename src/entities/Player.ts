import { PlayerInputState } from '../core/InputManager';
import { Platform } from '../world/BiomeTypes';
import { Projectile } from './Projectile';

export abstract class Player {
  public index: number; // 0, 1, 2, 3
  public name: string;
  public color: string;
  public isCpu: boolean = false;

  // Spatial & Physics
  public x: number = 0;
  public y: number = 0;
  public vx: number = 0;
  public vy: number = 0;
  public width: number = 26;
  public height: number = 42;
  public facingLeft: boolean = false;
  public isGrounded: boolean = false;

  // Jump configuration
  public maxJumps: number = 2;
  public jumpsRemaining: number = 2;
  private dropThroughTimer: number = 0;
  private coyoteTimer: number = 0;
  private jumpBufferTimer: number = 0;

  // Dash & Movement
  public isDashing: boolean = false;
  protected dashCooldown: number = 0;
  protected dashDuration: number = 0;
  public isInvulnerable: boolean = false;
  protected invulnerableTimer: number = 0;

  // Health & Revive state
  public maxHealth: number = 3;
  public health: number = 3;
  public isAlive: boolean = true;
  public isInBubble: boolean = false;
  public bubbleStrikesRemaining: number = 1;
  public deathCount: number = 0;

  // Melee Sword Attack
  public isAttacking: boolean = false;
  public isDownThrusting: boolean = false;
  public attackTimer: number = 0;
  public attackCooldown: number = 0;
  public comboStep: number = 0;

  // Bow Attack
  public isDrawingBow: boolean = false;
  public bowDrawCharge: number = 0; // 0 to 1.0
  public quiverAmmo: number = 3;
  public maxQuiverAmmo: number = 3;
  private ammoRegenTimer: number = 0;

  // Carrying the Golden Sandwich
  public isCarryingSandwich: boolean = false;

  // Visuals & Animations
  public squashX: number = 1.0;
  public squashY: number = 1.0;
  public hitFlashTimer: number = 0;
  public animTimer: number = 0;
  public capeNodes: { x: number; y: number; oldX: number; oldY: number }[] = [];
  public capeTrimColor: string = '#ffd166';

  constructor(index: number, name: string, color: string, isCpu: boolean = false) {
    this.index = index;
    this.name = name;
    this.color = color;
    this.isCpu = isCpu;

    // Heraldic cape hem trim colors
    if (color === '#ff9e00') this.capeTrimColor = '#ffea00'; // Sir Bareti
    else if (color === '#2ec4b6') this.capeTrimColor = '#4cc9f0'; // Sir Fluctus
    else if (color === '#7209b7' || color === '#a855f7') this.capeTrimColor = '#e2e8f0'; // Sir Morgani (Silver trim)
    else this.capeTrimColor = '#ffd166'; // Sir Tectus & default gold
  }

  public reset(spawnX: number, spawnY: number): void {
    this.x = spawnX;
    this.y = spawnY;
    this.vx = 0;
    this.vy = 0;
    this.health = this.maxHealth;
    this.isAlive = true;
    this.isInBubble = false;
    this.bubbleStrikesRemaining = 1;
    this.jumpsRemaining = this.maxJumps;
    this.quiverAmmo = this.maxQuiverAmmo;
    this.isAttacking = false;
    this.isDrawingBow = false;
    this.bowDrawCharge = 0;
    this.isDashing = false;
    this.dashCooldown = 0;
    this.isCarryingSandwich = false;

    this.capeNodes = [];
    for (let i = 0; i < 8; i++) {
      const ny = spawnY - 24 + i * 3.5;
      this.capeNodes.push({ x: spawnX, y: ny, oldX: spawnX, oldY: ny });
    }
  }

  public updateBase(
    dt: number,
    input: PlayerInputState,
    platforms: Platform[],
    projectiles: Projectile[],
    allPlayers: Player[],
    teamPurse: { coins: number }
  ): void {
    this.animTimer += dt;

    if (this.hitFlashTimer > 0) this.hitFlashTimer -= dt;
    if (this.invulnerableTimer > 0) {
      this.invulnerableTimer -= dt;
      if (this.invulnerableTimer <= 0) this.isInvulnerable = false;
    } else if (!this.isDashing) {
      this.isInvulnerable = false;
    }

    // Ammo regeneration (1 arrow every 4.5s)
    if (this.quiverAmmo < this.maxQuiverAmmo) {
      this.ammoRegenTimer += dt;
      if (this.ammoRegenTimer >= 4.5) {
        this.quiverAmmo++;
        this.ammoRegenTimer = 0;
      }
    }

    // 1. SOUL BUBBLE REVIVE STATE
    if (this.isInBubble) {
      this.updateSoulBubble(dt, allPlayers, teamPurse);
      return;
    }

    // 2. Dash Timer
    if (this.dashCooldown > 0) this.dashCooldown -= dt;
    if (this.isDashing) {
      this.dashDuration -= dt;
      if (this.dashDuration <= 0) {
        this.isDashing = false;
        if (this.invulnerableTimer <= 0) {
          this.isInvulnerable = false;
        }
      }
    }

    // 3. Drop-through timer
    if (this.dropThroughTimer > 0) this.dropThroughTimer -= dt;
    if (input.dropThrough) {
      this.dropThroughTimer = 0.28;
    }

    // 4. Horizontal Movement
    if (!this.isDashing) {
      const moveSpeed = 310;
      if (Math.abs(input.moveX) > 0.15) {
        this.vx = input.moveX * moveSpeed;
        this.facingLeft = input.moveX < 0;
      } else {
        this.vx *= this.isGrounded ? 0.78 : 0.92;
        if (Math.abs(this.vx) < 8) this.vx = 0;
      }
    }

    // 5. Jump Handling with Coyote Time & Jump Buffering
    if (this.isGrounded) {
      this.coyoteTimer = 0.12;
    } else if (this.coyoteTimer > 0) {
      this.coyoteTimer -= dt;
    }

    if (input.jumpPressed && !input.dropThrough) {
      this.jumpBufferTimer = 0.14;
    } else if (this.jumpBufferTimer > 0) {
      this.jumpBufferTimer -= dt;
    }

    // Execute grounded or buffered jump
    if (this.jumpBufferTimer > 0 && !input.dropThrough) {
      if (this.isGrounded || this.coyoteTimer > 0) {
        this.vy = -585;
        this.jumpsRemaining = this.maxJumps - 1;
        this.isGrounded = false;
        this.coyoteTimer = 0;
        this.jumpBufferTimer = 0;
        this.squashX = 0.72;
        this.squashY = 1.38;
      } else if (input.jumpPressed && this.jumpsRemaining > 0) {
        // Air / Double Jump
        this.vy = -585;
        this.jumpsRemaining--;
        this.isGrounded = false;
        this.jumpBufferTimer = 0;
        this.squashX = 0.75;
        this.squashY = 1.35;
      }
    }

    // Variable jump height cut (holding jump gives max height, tapping gives short hop)
    if (!input.jump && this.vy < -220) {
      this.vy = -220;
    }

    // Gravity
    if (!this.isDashing) {
      let grav = 1280;
      if (this.isCpu && input.jump && this.vy < 0) {
        grav = 1040; // Floatier, smoother upward arc for companion bot!
      }
      this.vy += grav * dt;
      if (this.vy > 850) this.vy = 850;
    }

    // 6. Platform Collisions
    this.handlePlatformCollisions(dt, platforms);

    // 7. Melee Sword Attack
    if (this.attackCooldown > 0) this.attackCooldown -= dt;
    if (input.attackPressed && this.attackCooldown <= 0 && !this.isDrawingBow) {
      this.isAttacking = true;
      this.attackTimer = 0.22;
      this.attackCooldown = 0.3;
      this.comboStep = (this.comboStep % 3) + 1;
      this.isDownThrusting = !this.isGrounded && input.moveY > 0.4;
      if (this.isDownThrusting) {
        this.vy = Math.max(this.vy, 460); // Fast fall plunge
      }
    }
    if (this.isAttacking) {
      this.attackTimer -= dt;
      if (this.attackTimer <= 0) {
        this.isAttacking = false;
        this.isDownThrusting = false;
      }
    }

    // 8. Bow Secondary Attack
    if (input.aimBow && this.quiverAmmo > 0) {
      this.isDrawingBow = true;
      this.bowDrawCharge = Math.min(1.0, this.bowDrawCharge + dt * 2.2);
    } else if (input.shootArrow && this.isDrawingBow) {
      // Fire arrow!
      if (this.quiverAmmo > 0) {
        this.quiverAmmo--;
        const arrowDir = this.facingLeft ? -1 : 1;
        const arrowSpeed = 500 + this.bowDrawCharge * 400;
        projectiles.push(new Projectile(
          this.x + arrowDir * 20,
          this.y - 12,
          arrowDir * arrowSpeed,
          -60 - this.bowDrawCharge * 40,
          'arrow',
          this.index,
          1
        ));
      }
      this.isDrawingBow = false;
      this.bowDrawCharge = 0;
    }

    // Squash and stretch return to 1
    this.squashX += (1.0 - this.squashX) * 12 * dt;
    this.squashY += (1.0 - this.squashY) * 12 * dt;

    // Update Cloth Cape Nodes
    this.updateCape(dt);
  }

  private handlePlatformCollisions(dt: number, platforms: Platform[]): void {
    const prevY = this.y;
    this.x += this.vx * dt;
    this.y += this.vy * dt;

    this.isGrounded = false;
    const halfW = this.width * 0.5;

    for (let i = 0; i < platforms.length; i++) {
      const p = platforms[i];
      if (p.isCrumbled) continue;

      // One-way ledges
      if (p.oneWay) {
        if (this.dropThroughTimer > 0) continue;
        if (
          this.x + halfW > p.x && this.x - halfW < p.x + p.w &&
          prevY <= p.y + 10 && this.y >= p.y && this.vy >= 0
        ) {
          this.y = p.y;
          this.vy = 0;
          this.isGrounded = true;
          this.jumpsRemaining = this.maxJumps;
          if (p.bouncy) {
            this.vy = -680 * p.bouncy;
            this.isGrounded = false;
          }
          if (p.conveyor) {
            this.vx += p.conveyor;
          }
        }
      } else {
        // Solid blocks
        if (
          this.x + halfW > p.x && this.x - halfW < p.x + p.w &&
          this.y > p.y && this.y - this.height < p.y + p.h
        ) {
          // Check collision from top
          if (prevY <= p.y + 12 && this.vy >= 0) {
            this.y = p.y;
            this.vy = 0;
            this.isGrounded = true;
            this.jumpsRemaining = this.maxJumps;
            if (p.bouncy) {
              this.vy = -680 * p.bouncy;
              this.isGrounded = false;
            }
            if (p.conveyor) {
              this.vx += p.conveyor;
            }
          } else if (this.y - this.height < p.y + p.h && prevY - this.height >= p.y + p.h - 12 && this.vy < 0) {
            // Hit ceiling
            this.y = p.y + p.h + this.height;
            this.vy = 0;
          } else {
            // Horizontal wall push
            if (this.x < p.x + p.w * 0.5) {
              this.x = p.x - halfW;
            } else {
              this.x = p.x + p.w + halfW;
            }
            this.vx = 0;
          }
        }
      }
    }
  }

  private updateSoulBubble(dt: number, allPlayers: Player[], teamPurse: { coins: number }): void {
    // Float toward living teammates
    const living = allPlayers.filter(p => p.isAlive && !p.isInBubble);
    if (living.length > 0) {
      const target = living[0];
      const dx = target.x - this.x;
      const dy = target.y - 40 - this.y;
      const dist = Math.hypot(dx, dy);
      if (dist > 20) {
        this.x += (dx / dist) * 110 * dt;
        this.y += (dy / dist) * 110 * dt;
      }
    } else {
      // Bob in place if all downed
      this.y += Math.sin(this.animTimer * 2) * 15 * dt;
    }
  }

  public takeDamage(amount: number): boolean {
    if (this.isInvulnerable || !this.isAlive || this.isInBubble) return false;

    this.health -= amount;
    this.hitFlashTimer = 0.2;
    this.isInvulnerable = true;
    this.invulnerableTimer = 1.2;

    if (this.health <= 0) {
      this.health = 0;
      this.deathCount++;
      this.isInBubble = true;
      this.isCarryingSandwich = false; // Drops sandwich!
      return true; // Downed!
    }
    return false;
  }

  public strikeBubble(teamPurse: { coins: number }): boolean {
    if (!this.isInBubble) return false;

    // Escalating revive cost: 1st death free (0 coins), 2nd death 1 coin, 3rd death 2 coins, 4th+ 3 coins
    const cost = Math.max(0, this.deathCount - 1);

    if (teamPurse.coins >= cost) {
      teamPurse.coins -= cost;
      this.popBubble();
      return true;
    } else {
      // Out of coins: Stone bubble requires 3 hits
      this.bubbleStrikesRemaining--;
      if (this.bubbleStrikesRemaining <= 0) {
        this.popBubble();
        return true;
      }
    }
    return false;
  }

  private popBubble(): void {
    this.isInBubble = false;
    this.health = 1; // Revives with 1 heart
    this.isInvulnerable = true;
    this.invulnerableTimer = 2.0; // Grace invulnerability
    this.bubbleStrikesRemaining = 3;
    this.vy = -340;
  }

  private updateCape(dt: number): void {
    if (this.capeNodes.length < 3) return;

    // Collar anchor point on knight's shoulder
    const collarX = this.x + (this.facingLeft ? 5 : -5);
    const collarY = this.y - 24;

    this.capeNodes[0].x = collarX;
    this.capeNodes[0].y = collarY;
    this.capeNodes[0].oldX = collarX;
    this.capeNodes[0].oldY = collarY;

    // Secondary collar joint
    const shoulderBack = (this.facingLeft ? 8 : -8);
    this.capeNodes[1].x = collarX + shoulderBack * 0.4;
    this.capeNodes[1].y = collarY + 3;

    // Clamp physics time step for stability
    const stepDt = Math.min(0.033, dt);

    // Verlet integration on nodes 2..7
    for (let i = 2; i < this.capeNodes.length; i++) {
      const node = this.capeNodes[i];
      const vx = (node.x - node.oldX) * 0.88; // Aerodynamic damping
      const vy = (node.y - node.oldY) * 0.88;
      node.oldX = node.x;
      node.oldY = node.y;

      // Air resistance pushes cape opposing movement
      let dragX = -this.vx * 0.0028;
      let dragY = -this.vy * 0.0015;

      // Air dash flare: stretch dramatically backward and horizontally
      if (this.isDashing) {
        dragX = (this.facingLeft ? 1 : -1) * 3.8;
        dragY = -0.6;
      }

      // High-frequency natural wind flutter ripple
      const flutter = Math.sin(this.animTimer * 12 + i * 0.9) * 0.85;
      const gravity = 240 * stepDt;

      node.x += vx + (dragX + flutter) * 60 * stepDt;
      node.y += vy + (gravity + dragY) * 60 * stepDt;
    }

    // Solve distance constraints (3 relaxation passes)
    const targetSegLen = 3.8;
    for (let iter = 0; iter < 3; iter++) {
      for (let i = 1; i < this.capeNodes.length; i++) {
        const p1 = this.capeNodes[i - 1];
        const p2 = this.capeNodes[i];
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        const dist = Math.hypot(dx, dy);
        if (dist > 0.001) {
          const diff = (dist - targetSegLen) / dist;
          if (i <= 2) {
            p2.x -= dx * diff;
            p2.y -= dy * diff;
          } else {
            p1.x += dx * diff * 0.25;
            p1.y += dy * diff * 0.25;
            p2.x -= dx * diff * 0.75;
            p2.y -= dy * diff * 0.75;
          }
        }
      }
    }
  }

  public render(ctx: CanvasRenderingContext2D): void {
    if (!this.isAlive) return;

    // 1. Soul Bubble Rendering
    if (this.isInBubble) {
      ctx.save();
      ctx.translate(this.x, this.y - 20);

      // Bubble Shimmer Glow
      const pulse = Math.sin(this.animTimer * 5) * 0.15 + 0.85;
      ctx.fillStyle = `rgba(239, 71, 111, ${pulse * 0.35})`;
      ctx.strokeStyle = '#ef476f';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(0, 0, 26, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Downed Knight Inside
      ctx.fillStyle = this.color;
      ctx.fillRect(-6, -8, 12, 16);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 9px "Press Start 2P"';
      ctx.textAlign = 'center';
      ctx.fillText('REVIVE!', 0, -32);

      ctx.restore();
      return;
    }

    // 2. Physics-Simulated Billowing Cloth Cape (World space)
    if (this.capeNodes.length >= 3) {
      ctx.save();

      // Generate left and right ribbon edges from spine nodes
      const leftEdge: { x: number; y: number }[] = [];
      const rightEdge: { x: number; y: number }[] = [];
      const totalNodes = this.capeNodes.length;

      for (let i = 0; i < totalNodes; i++) {
        const curr = this.capeNodes[i];
        let tx = 0;
        let ty = 1;
        if (i < totalNodes - 1) {
          tx = this.capeNodes[i + 1].x - curr.x;
          ty = this.capeNodes[i + 1].y - curr.y;
        } else {
          tx = curr.x - this.capeNodes[i - 1].x;
          ty = curr.y - this.capeNodes[i - 1].y;
        }
        const len = Math.hypot(tx, ty) || 1;
        const nx = -ty / len;
        const ny = tx / len;

        // Cape widens from 6px at shoulder to 18px at hem
        const widthProgress = i / (totalNodes - 1);
        const halfWidth = 3 + widthProgress * 6.5;

        leftEdge.push({ x: curr.x + nx * halfWidth, y: curr.y + ny * halfWidth });
        rightEdge.push({ x: curr.x - nx * halfWidth, y: curr.y - ny * halfWidth });
      }

      // Draw the contoured cloth polygon
      ctx.beginPath();
      ctx.moveTo(leftEdge[0].x, leftEdge[0].y);
      for (let i = 1; i < leftEdge.length; i++) {
        ctx.lineTo(leftEdge[i].x, leftEdge[i].y);
      }
      ctx.lineTo(rightEdge[rightEdge.length - 1].x, rightEdge[rightEdge.length - 1].y);
      for (let i = rightEdge.length - 1; i >= 0; i--) {
        ctx.lineTo(rightEdge[i].x, rightEdge[i].y);
      }
      ctx.closePath();

      // Shaded heraldic cloth gradient
      const topNode = this.capeNodes[0];
      const botNode = this.capeNodes[totalNodes - 1];
      const capeGrad = ctx.createLinearGradient(topNode.x, topNode.y, botNode.x, botNode.y);
      capeGrad.addColorStop(0, this.color);
      capeGrad.addColorStop(0.7, this.color);
      capeGrad.addColorStop(1, '#0f172a'); // darker fold shadow towards hem

      ctx.fillStyle = capeGrad;
      ctx.fill();

      // Cape edge stroke
      ctx.strokeStyle = 'rgba(15, 23, 42, 0.4)';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Golden Embroidered Hem Trim
      const lastIdx = totalNodes - 1;
      ctx.strokeStyle = this.capeTrimColor;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(leftEdge[lastIdx].x, leftEdge[lastIdx].y);
      ctx.lineTo(this.capeNodes[lastIdx].x, this.capeNodes[lastIdx].y);
      ctx.lineTo(rightEdge[lastIdx].x, rightEdge[lastIdx].y);
      ctx.stroke();

      ctx.restore();
    }

    // 3. Body Transform with Squash & Stretch
    ctx.save();
    ctx.translate(this.x, this.y);

    if (this.isInvulnerable) {
      // Smooth ethereal shimmer instead of jarring on/off strobe
      ctx.globalAlpha = 0.55 + Math.sin(this.animTimer * 12) * 0.35;
    }

    const flip = this.facingLeft ? -1 : 1;
    ctx.scale(flip * this.squashX, this.squashY);

    // Armor Body & Tunic
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(-10, -32, 20, 26);
    ctx.fillStyle = this.color;
    ctx.fillRect(-7, -30, 14, 22);

    // Helmet & Visor
    ctx.fillStyle = '#475569';
    ctx.beginPath();
    ctx.arc(0, -36, 9, 0, Math.PI * 2);
    ctx.fill();

    // Visor Eyes
    ctx.fillStyle = this.hitFlashTimer > 0 ? '#ff0054' : '#ffd166';
    ctx.fillRect(2, -38, 5, 3);

    // Melee Sword Slash Swing
    if (this.isAttacking) {
      ctx.save();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3;
      ctx.shadowColor = '#ffd166';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      if (this.isDownThrusting) {
        ctx.arc(0, 10, 26, 0, Math.PI);
      } else {
        ctx.arc(14, -20, 28, -Math.PI * 0.45, Math.PI * 0.45);
      }
      ctx.stroke();
      ctx.restore();
    }

    // Bow Drawing Tension & Trajectory Guide
    if (this.isDrawingBow) {
      ctx.strokeStyle = '#92400e';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(14, -18, 14, -Math.PI * 0.3, Math.PI * 0.3);
      ctx.stroke();
    }

    ctx.restore();

    // Bow Trajectory Arc in World Coordinates
    if (this.isDrawingBow) {
      ctx.save();
      ctx.fillStyle = '#ffd166';
      const arrowDir = this.facingLeft ? -1 : 1;
      const speed = 500 + this.bowDrawCharge * 400;
      const startX = this.x + arrowDir * 20;
      const startY = this.y - 14;
      const vy0 = -60 - this.bowDrawCharge * 40;
      for (let t = 0.05; t <= 0.45; t += 0.065) {
        const px = startX + arrowDir * speed * t;
        const py = startY + vy0 * t + 0.5 * 420 * t * t;
        ctx.beginPath();
        ctx.arc(px, py, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    // 4. Overhead Player Indicator (P1, P2, etc.)
    ctx.save();
    ctx.translate(this.x, this.y - 48);
    ctx.fillStyle = this.color;
    ctx.font = 'bold 8px "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`P${this.index + 1}`, 0, 0);

    ctx.beginPath();
    ctx.moveTo(-3, 2);
    ctx.lineTo(3, 2);
    ctx.lineTo(0, 5);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  public getMeleeHitbox(): { x: number; y: number; w: number; h: number; isDownThrust: boolean } | null {
    if (!this.isAttacking) return null;
    if (this.isDownThrusting) {
      return {
        x: this.x - 24,
        y: this.y - 6,
        w: 48,
        h: 38,
        isDownThrust: true
      };
    }
    const reachDir = this.facingLeft ? -1 : 1;
    return {
      x: reachDir > 0 ? this.x - 12 : this.x - 52,
      y: this.y - 36,
      w: 64,
      h: 40,
      isDownThrust: false
    };
  }

  public abstract performAbility(
    dt: number,
    input: PlayerInputState,
    projectiles: Projectile[]
  ): void;
}
