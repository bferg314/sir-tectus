import { DungeonLevel } from './DungeonGenerator';
import { Camera } from '../core/Camera';

export class WorldRenderer {
  private animTimer: number = 0;
  private damageFlashTimer: number = 0;

  public update(dt: number): void {
    this.animTimer += dt;
    if (this.damageFlashTimer > 0) {
      this.damageFlashTimer = Math.max(0, this.damageFlashTimer - dt);
    }
  }

  public triggerDamageFlash(): void {
    this.damageFlashTimer = 0.28;
  }

  public render(ctx: CanvasRenderingContext2D, level: DungeonLevel, camera: Camera): void {
    // 1. Biome-Specific Multi-Layered Parallax Sky & Backdrops
    this.renderParallaxBackground(ctx, level, camera);

    // 2. Interactive Props behind platforms (Torches, Crystals, Portals, Vending Machine)
    this.renderProps(ctx, level);

    // 3. Platforms with Rich Material Detailing & Hazard Zones
    this.renderPlatforms(ctx, level);
    this.renderHazards(ctx, level);

    // 4. Volumetric Light Halos & Ambient Glow
    this.renderLightingHalos(ctx, level);

    // 5. Ambient Weather & Atmospheric Particle Systems (All 9 types)
    this.renderAmbientWeather(ctx, level, camera);

    // 6. Camera Viewport Vignette
    this.renderVignette(ctx, camera);
  }

  // =========================================================================
  // PARALLAX BACKGROUNDS (Unique Identity for Every World)
  // =========================================================================
  private renderParallaxBackground(ctx: CanvasRenderingContext2D, level: DungeonLevel, camera: Camera): void {
    const biome = level.biome;
    const bg = biome.bgGradient;
    const t = this.animTimer;

    // Base sky gradient
    const skyGrad = ctx.createLinearGradient(0, 0, 0, level.height);
    skyGrad.addColorStop(0, bg[0]);
    skyGrad.addColorStop(1, bg[1]);
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, level.width, level.height);

    ctx.save();
    const camX = camera.x;

    switch (biome.id) {
      case 'verdant-canopy':
        // Ancient Forest: Gnarled giant tree silhouettes, canopy boughs, sunbeams
        this.renderForestBackdrop(ctx, level, camX, t);
        break;

      case 'royal-courtyard':
        // Castle Battlements: Gothic castle towers, heraldic banners, glowing moon
        this.renderCastleBackdrop(ctx, level, camX, t);
        break;

      case 'sunlit-aqueducts':
        // Ancient Aqueducts: Classical marble arches, distant waterfalls
        this.renderAqueductsBackdrop(ctx, level, camX, t);
        break;

      case 'whispering-grottos':
        // Crystal Cavern: Huge geode stalactites, glowing amethyst prisms, cavern mist
        this.renderCrystalCavernBackdrop(ctx, level, camX, t);
        break;

      case 'clockwork-foundry':
        // Steampunk Industrial: Rotating brass gears, smokestacks, steam pipes
        this.renderFoundryBackdrop(ctx, level, camX, t);
        break;

      case 'molten-caverns':
      case 'infernal-core':
        // Volcanic Caldera: Obsidian crags, subterranean lavafalls, heat shimmer
        this.renderVolcanoBackdrop(ctx, level, camX, t, biome.id === 'infernal-core');
        break;

      case 'frostpeak-summit':
        // Glacier Mountain: Jagged icy ridges, animated undulating Aurora Borealis
        this.renderGlacierBackdrop(ctx, level, camX, t);
        break;

      case 'sunken-catacombs':
        // Submerged Crypt: Sunken stone pillars, swaying kelp, caustic ripples
        this.renderSunkenBackdrop(ctx, level, camX, t);
        break;

      case 'celestial-spires':
        // Cloud Isles: Drifting cloud banks, floating pagodas, wind updraft spirals
        this.renderCelestialBackdrop(ctx, level, camX, t);
        break;

      case 'astral-void':
        // Cosmic Void: Nebula galaxy clouds, drifting crystal meteorites, starfield
        this.renderCosmicBackdrop(ctx, level, camX, t);
        break;

      case 'cursed-necropolis':
        // Haunted Tomb: Distant mausoleums, barren weeping willows, spectral mist
        this.renderNecropolisBackdrop(ctx, level, camX, t);
        break;

      case 'golden-sandwich-sanctuary':
      default:
        // The Golden Vault: Grand fluted gold columns, holy god rays, sandwich radiance
        this.renderVaultBackdrop(ctx, level, camX, t);
        break;
    }

    ctx.restore();
  }

  // --- Specific Biome Backdrop Implementations ---

  private renderForestBackdrop(ctx: CanvasRenderingContext2D, level: DungeonLevel, camX: number, t: number): void {
    // Distant tree trunks (0.2x parallax)
    ctx.fillStyle = 'rgba(5, 20, 13, 0.4)';
    const offset1 = camX * 0.2;
    for (let x = -100; x < level.width + 200; x += 220) {
      ctx.fillRect(x - offset1, level.height * 0.3, 45, level.height * 0.7);
      // Canopy branches
      ctx.beginPath();
      ctx.arc(x - offset1 + 22, level.height * 0.3, 75, 0, Math.PI * 2);
      ctx.fill();
    }

    // Mid-ground closer foliage (0.4x parallax)
    ctx.fillStyle = 'rgba(13, 40, 30, 0.55)';
    const offset2 = camX * 0.4;
    for (let x = -80; x < level.width + 200; x += 170) {
      ctx.fillRect(x - offset2, level.height * 0.45, 60, level.height * 0.55);
      ctx.beginPath();
      ctx.arc(x - offset2 + 30, level.height * 0.45, 90, 0, Math.PI * 2);
      ctx.fill();
    }

    // Soft god rays filtering from the top-left
    const rayGrad = ctx.createLinearGradient(0, 0, level.width * 0.6, level.height);
    rayGrad.addColorStop(0, 'rgba(116, 198, 157, 0.12)');
    rayGrad.addColorStop(0.5, 'rgba(116, 198, 157, 0.04)');
    rayGrad.addColorStop(1, 'rgba(116, 198, 157, 0)');
    ctx.fillStyle = rayGrad;
    ctx.fillRect(0, 0, level.width, level.height);
  }

  private renderCastleBackdrop(ctx: CanvasRenderingContext2D, level: DungeonLevel, camX: number, t: number): void {
    // Distant full moon
    const moonX = level.width * 0.75 - camX * 0.08;
    const moonY = 120;
    const moonGlow = ctx.createRadialGradient(moonX, moonY, 15, moonX, moonY, 120);
    moonGlow.addColorStop(0, 'rgba(255, 230, 160, 0.35)');
    moonGlow.addColorStop(1, 'rgba(255, 230, 160, 0)');
    ctx.fillStyle = moonGlow;
    ctx.beginPath();
    ctx.arc(moonX, moonY, 120, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#fffae0';
    ctx.beginPath();
    ctx.arc(moonX, moonY, 32, 0, Math.PI * 2);
    ctx.fill();

    // Distant castle towers and crenellated battlements (0.25x parallax)
    ctx.fillStyle = 'rgba(10, 15, 28, 0.5)';
    const offset1 = camX * 0.25;
    for (let x = -100; x < level.width + 200; x += 240) {
      // Tower shaft
      ctx.fillRect(x - offset1, level.height * 0.38, 70, level.height * 0.62);
      // Conical spire roof
      ctx.beginPath();
      ctx.moveTo(x - offset1, level.height * 0.38);
      ctx.lineTo(x - offset1 + 35, level.height * 0.26);
      ctx.lineTo(x - offset1 + 70, level.height * 0.38);
      ctx.closePath();
      ctx.fill();
    }

    // Closer battlements with fluttering pennants (0.45x parallax)
    ctx.fillStyle = 'rgba(22, 32, 53, 0.65)';
    const offset2 = camX * 0.45;
    for (let x = -60; x < level.width + 200; x += 180) {
      ctx.fillRect(x - offset2, level.height * 0.58, 90, level.height * 0.42);
      // Crenellations
      ctx.fillRect(x - offset2, level.height * 0.58 - 12, 22, 12);
      ctx.fillRect(x - offset2 + 34, level.height * 0.58 - 12, 22, 12);
      ctx.fillRect(x - offset2 + 68, level.height * 0.58 - 12, 22, 12);
      // Royal Flag
      const flagWave = Math.sin(t * 4 + x) * 6;
      ctx.strokeStyle = '#ffd166';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x - offset2 + 45, level.height * 0.58 - 12);
      ctx.lineTo(x - offset2 + 45, level.height * 0.58 - 36);
      ctx.stroke();
      ctx.fillStyle = '#e63946';
      ctx.beginPath();
      ctx.moveTo(x - offset2 + 45, level.height * 0.58 - 36);
      ctx.lineTo(x - offset2 + 65 + flagWave, level.height * 0.58 - 30);
      ctx.lineTo(x - offset2 + 45, level.height * 0.58 - 24);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = 'rgba(22, 32, 53, 0.65)';
    }
  }

  private renderAqueductsBackdrop(ctx: CanvasRenderingContext2D, level: DungeonLevel, camX: number, t: number): void {
    // Grand Roman Aqueduct Archways (0.3x parallax)
    ctx.fillStyle = 'rgba(14, 42, 63, 0.5)';
    const offset = camX * 0.3;
    for (let x = -100; x < level.width + 300; x += 220) {
      // Pillars
      ctx.fillRect(x - offset, level.height * 0.35, 30, level.height * 0.65);
      ctx.fillRect(x - offset + 150, level.height * 0.35, 30, level.height * 0.65);
      // Top arch bridge
      ctx.fillRect(x - offset, level.height * 0.32, 180, 25);
      // Curved arch span
      ctx.beginPath();
      ctx.arc(x - offset + 90, level.height * 0.45, 60, Math.PI, 0);
      ctx.fill();
    }

    // Distant animated waterfalls
    ctx.fillStyle = 'rgba(76, 201, 240, 0.3)';
    for (let x = 120; x < level.width; x += 450) {
      const wx = x - offset;
      const wave = Math.sin(t * 8 + x) * 2;
      ctx.fillRect(wx + 80 + wave, level.height * 0.34, 16, level.height * 0.4);
    }
  }

  private renderCrystalCavernBackdrop(ctx: CanvasRenderingContext2D, level: DungeonLevel, camX: number, t: number): void {
    // Giant glowing amethyst geode stalactites hanging from cavern roof (0.35x parallax)
    const offset = camX * 0.35;
    for (let x = -60; x < level.width + 200; x += 160) {
      const len = 120 + Math.sin(x * 0.05) * 60;
      const pulse = Math.sin(t * 3 + x) * 0.2 + 0.8;

      ctx.fillStyle = `rgba(48, 34, 77, ${0.6 * pulse})`;
      ctx.beginPath();
      ctx.moveTo(x - offset, 0);
      ctx.lineTo(x - offset + 25, len);
      ctx.lineTo(x - offset + 50, 0);
      ctx.closePath();
      ctx.fill();

      // Crystal facet highlight
      ctx.fillStyle = `rgba(181, 23, 158, ${0.4 * pulse})`;
      ctx.beginPath();
      ctx.moveTo(x - offset + 15, 0);
      ctx.lineTo(x - offset + 25, len);
      ctx.lineTo(x - offset + 35, 0);
      ctx.closePath();
      ctx.fill();
    }

    // Shimmering violet cavern fog across the lower third
    const fogGrad = ctx.createLinearGradient(0, level.height * 0.65, 0, level.height);
    fogGrad.addColorStop(0, 'rgba(181, 23, 158, 0)');
    fogGrad.addColorStop(1, 'rgba(83, 60, 133, 0.25)');
    ctx.fillStyle = fogGrad;
    ctx.fillRect(0, level.height * 0.65, level.width, level.height * 0.35);
  }

  private renderFoundryBackdrop(ctx: CanvasRenderingContext2D, level: DungeonLevel, camX: number, t: number): void {
    const offset = camX * 0.3;
    // Industrial smokestacks and pipes
    ctx.fillStyle = 'rgba(46, 31, 14, 0.6)';
    for (let x = -50; x < level.width + 200; x += 260) {
      ctx.fillRect(x - offset, level.height * 0.2, 40, level.height * 0.8);
      // Steam puff venting from stack top
      const steamY = level.height * 0.2 - ((t * 40 + x) % 80);
      const steamAlpha = Math.max(0, 1 - ((t * 40 + x) % 80) / 80) * 0.4;
      ctx.fillStyle = `rgba(255, 183, 3, ${steamAlpha})`;
      ctx.beginPath();
      ctx.arc(x - offset + 20, steamY, 18, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(46, 31, 14, 0.6)';
    }

    // Giant rotating brass cog silhouettes
    for (let x = 60; x < level.width + 100; x += 320) {
      const gx = x - offset;
      const gy = level.height * 0.45;
      const angle = t * 0.5 + (x % 3);

      ctx.save();
      ctx.translate(gx, gy);
      ctx.rotate(angle);
      ctx.fillStyle = 'rgba(77, 52, 25, 0.45)';
      ctx.beginPath();
      ctx.arc(0, 0, 70, 0, Math.PI * 2);
      ctx.fill();

      // Cog teeth
      for (let tooth = 0; tooth < 8; tooth++) {
        ctx.rotate(Math.PI / 4);
        ctx.fillRect(-12, -85, 24, 20);
      }
      // Center hole
      ctx.fillStyle = level.biome.bgColor;
      ctx.beginPath();
      ctx.arc(0, 0, 25, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  private renderVolcanoBackdrop(ctx: CanvasRenderingContext2D, level: DungeonLevel, camX: number, t: number, isInfernal: boolean): void {
    // Jagged basalt peaks and glowing red magma fissures
    const offset = camX * 0.35;
    ctx.fillStyle = isInfernal ? 'rgba(30, 6, 4, 0.7)' : 'rgba(46, 15, 12, 0.6)';

    ctx.beginPath();
    ctx.moveTo(0, level.height);
    for (let x = -100; x < level.width + 200; x += 120) {
      const peak = level.height * 0.5 + Math.sin(x * 0.008 + t * 0.2) * 80;
      ctx.lineTo(x - offset, peak);
    }
    ctx.lineTo(level.width + 200, level.height);
    ctx.closePath();
    ctx.fill();

    // Cascading subterranean lavafall
    const lavaX = level.width * 0.55 - offset;
    const lavaGlow = Math.sin(t * 6) * 0.15 + 0.85;
    ctx.fillStyle = `rgba(251, 86, 7, ${lavaGlow * 0.65})`;
    ctx.fillRect(lavaX, level.height * 0.35, 34, level.height * 0.65);
    ctx.fillStyle = `rgba(255, 190, 11, ${lavaGlow * 0.8})`;
    ctx.fillRect(lavaX + 8, level.height * 0.35, 18, level.height * 0.65);

    // Heat distortion haze at the bottom
    const magmaGrad = ctx.createLinearGradient(0, level.height - 180, 0, level.height);
    magmaGrad.addColorStop(0, 'rgba(251, 86, 7, 0)');
    magmaGrad.addColorStop(1, 'rgba(255, 0, 84, 0.3)');
    ctx.fillStyle = magmaGrad;
    ctx.fillRect(0, level.height - 180, level.width, 180);
  }

  private renderGlacierBackdrop(ctx: CanvasRenderingContext2D, level: DungeonLevel, camX: number, t: number): void {
    // Undulating vibrant Aurora Borealis across upper sky
    for (let ribbon = 0; ribbon < 3; ribbon++) {
      ctx.beginPath();
      ctx.moveTo(0, 0);
      for (let x = 0; x <= level.width; x += 80) {
        const waveY = 80 + ribbon * 40 + Math.sin(x * 0.004 + t * 1.5 + ribbon) * 45;
        ctx.lineTo(x, waveY);
      }
      ctx.strokeStyle = ribbon === 0 ? 'rgba(76, 201, 240, 0.25)' : ribbon === 1 ? 'rgba(162, 210, 255, 0.2)' : 'rgba(181, 23, 158, 0.18)';
      ctx.lineWidth = 36;
      ctx.stroke();
    }

    // Sharp jagged ice mountain peaks
    const offset = camX * 0.3;
    ctx.fillStyle = 'rgba(14, 36, 58, 0.65)';
    ctx.beginPath();
    ctx.moveTo(0, level.height);
    for (let x = -100; x < level.width + 200; x += 150) {
      const peakY = level.height * 0.45 + (x % 300 === 0 ? -120 : 40);
      ctx.lineTo(x - offset, peakY);
    }
    ctx.lineTo(level.width + 200, level.height);
    ctx.closePath();
    ctx.fill();
  }

  private renderSunkenBackdrop(ctx: CanvasRenderingContext2D, level: DungeonLevel, camX: number, t: number): void {
    const offset = camX * 0.3;
    // Submerged stone colonnades and tall swaying kelp fronds
    ctx.fillStyle = 'rgba(17, 42, 43, 0.6)';
    for (let x = -80; x < level.width + 200; x += 220) {
      ctx.fillRect(x - offset, level.height * 0.35, 36, level.height * 0.65);
    }

    // Swaying kelp
    ctx.strokeStyle = 'rgba(46, 196, 182, 0.35)';
    ctx.lineWidth = 14;
    for (let x = 40; x < level.width + 100; x += 140) {
      const kx = x - offset;
      ctx.beginPath();
      ctx.moveTo(kx, level.height);
      for (let y = level.height; y > level.height * 0.4; y -= 60) {
        const sway = Math.sin(t * 2 + y * 0.01 + x) * 20;
        ctx.lineTo(kx + sway, y);
      }
      ctx.stroke();
    }

    // Underwater caustic light ripples
    const caustic = Math.sin(t * 3) * 0.05 + 0.1;
    ctx.fillStyle = `rgba(76, 201, 240, ${caustic})`;
    ctx.fillRect(0, 0, level.width, level.height);
  }

  private renderCelestialBackdrop(ctx: CanvasRenderingContext2D, level: DungeonLevel, camX: number, t: number): void {
    // Multi-layer rolling clouds (0.2x and 0.4x parallax)
    const offset1 = (camX * 0.2 + t * 15) % 400;
    ctx.fillStyle = 'rgba(40, 60, 102, 0.4)';
    for (let x = -200; x < level.width + 400; x += 160) {
      ctx.beginPath();
      ctx.arc(x - offset1, level.height * 0.45, 90, 0, Math.PI * 2);
      ctx.fill();
    }

    const offset2 = (camX * 0.4 + t * 30) % 360;
    ctx.fillStyle = 'rgba(72, 104, 173, 0.35)';
    for (let x = -200; x < level.width + 400; x += 140) {
      ctx.beginPath();
      ctx.arc(x - offset2, level.height * 0.6, 75, 0, Math.PI * 2);
      ctx.fill();
    }

    // Floating sky island silhouettes with golden pagodas
    const islOffset = camX * 0.25;
    ctx.fillStyle = 'rgba(24, 40, 72, 0.7)';
    for (let x = 100; x < level.width + 100; x += 450) {
      const ix = x - islOffset;
      const iy = level.height * 0.3;
      // Inverted floating rock
      ctx.beginPath();
      ctx.moveTo(ix - 70, iy);
      ctx.lineTo(ix, iy + 65);
      ctx.lineTo(ix + 70, iy);
      ctx.closePath();
      ctx.fill();
      // Temple roof
      ctx.fillRect(ix - 30, iy - 25, 60, 25);
      ctx.beginPath();
      ctx.moveTo(ix - 45, iy - 25);
      ctx.lineTo(ix, iy - 50);
      ctx.lineTo(ix + 45, iy - 25);
      ctx.closePath();
      ctx.fill();
    }
  }

  private renderCosmicBackdrop(ctx: CanvasRenderingContext2D, level: DungeonLevel, camX: number, t: number): void {
    // Swirling violet nebula clouds
    const nebX = level.width * 0.5 - camX * 0.1;
    const nebY = level.height * 0.4;
    const nebGrad = ctx.createRadialGradient(nebX, nebY, 40, nebX, nebY, 350);
    nebGrad.addColorStop(0, 'rgba(181, 23, 158, 0.3)');
    nebGrad.addColorStop(0.5, 'rgba(74, 43, 153, 0.2)');
    nebGrad.addColorStop(1, 'rgba(7, 4, 14, 0)');
    ctx.fillStyle = nebGrad;
    ctx.beginPath();
    ctx.arc(nebX, nebY, 350, 0, Math.PI * 2);
    ctx.fill();

    // Twinkling stars (parallax 0.05x)
    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < 70; i++) {
      const sx = ((i * 197 - camX * 0.05) % level.width + level.width) % level.width;
      const sy = (i * 283) % (level.height * 0.85);
      const twinkle = Math.sin(t * 4 + i) * 0.5 + 0.5;
      ctx.globalAlpha = twinkle * 0.85;
      ctx.fillRect(sx, sy, (i % 3 === 0) ? 3 : 1.5, (i % 3 === 0) ? 3 : 1.5);
    }
    ctx.globalAlpha = 1.0;
  }

  private renderNecropolisBackdrop(ctx: CanvasRenderingContext2D, level: DungeonLevel, camX: number, t: number): void {
    // Distant mausoleum silhouettes and haunted cemetery fence
    const offset = camX * 0.3;
    ctx.fillStyle = 'rgba(14, 34, 26, 0.65)';
    for (let x = -80; x < level.width + 200; x += 240) {
      // Tomb crypt
      ctx.fillRect(x - offset, level.height * 0.45, 90, level.height * 0.55);
      ctx.beginPath();
      ctx.moveTo(x - offset - 10, level.height * 0.45);
      ctx.lineTo(x - offset + 45, level.height * 0.35);
      ctx.lineTo(x - offset + 100, level.height * 0.45);
      ctx.closePath();
      ctx.fill();
    }

    // Ghostly green spirit apparitions rising slowly
    for (let i = 0; i < 8; i++) {
      const gx = ((i * 380 + Math.sin(t + i) * 30 - offset) % level.width + level.width) % level.width;
      const gy = level.height * 0.7 - ((t * 25 + i * 80) % (level.height * 0.5));
      const gAlpha = Math.sin(t * 3 + i) * 0.15 + 0.25;
      ctx.fillStyle = `rgba(6, 214, 160, ${gAlpha})`;
      ctx.beginPath();
      ctx.arc(gx, gy, 14, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  private renderVaultBackdrop(ctx: CanvasRenderingContext2D, level: DungeonLevel, camX: number, t: number): void {
    // Fluted golden colonnades with Corinthian capitals (0.25x parallax)
    const offset = camX * 0.25;
    ctx.fillStyle = 'rgba(56, 38, 10, 0.7)';
    for (let x = -60; x < level.width + 200; x += 220) {
      // Column shaft
      ctx.fillRect(x - offset, 0, 48, level.height);
      // Capital & Base
      ctx.fillRect(x - offset - 8, level.height * 0.2, 64, 16);
      ctx.fillRect(x - offset - 8, level.height - 80, 64, 16);
    }

    // Divine golden god rays from the heavens
    const rayGrad = ctx.createLinearGradient(level.width * 0.5, 0, level.width * 0.5, level.height);
    rayGrad.addColorStop(0, 'rgba(255, 215, 0, 0.22)');
    rayGrad.addColorStop(0.6, 'rgba(255, 190, 11, 0.08)');
    rayGrad.addColorStop(1, 'rgba(255, 190, 11, 0)');
    ctx.fillStyle = rayGrad;
    ctx.fillRect(0, 0, level.width, level.height);
  }

  // =========================================================================
  // PLATFORMS WITH RICH MATERIAL DETAILS
  // =========================================================================
  private renderPlatforms(ctx: CanvasRenderingContext2D, level: DungeonLevel): void {
    ctx.save();
    const t = this.animTimer;

    for (let i = 0; i < level.platforms.length; i++) {
      const p = level.platforms[i];

      // If crumbled and collapsed, only render faint dust outline
      if (p.isCrumbled) {
        ctx.fillStyle = 'rgba(100, 116, 139, 0.2)';
        ctx.fillRect(p.x, p.y + p.h - 3, p.w, 3);
        continue;
      }

      ctx.save();
      const shake = (p.crumbleState === 'shaking') ? (p.shakeOffset || 0) : 0;
      if (shake !== 0) {
        ctx.translate(shake, 0);
      }

      const mat = p.material || level.biome.material;

      // Platform Base Body
      ctx.fillStyle = p.color || level.biome.platformColor;
      ctx.fillRect(p.x, p.y, p.w, p.h);

      // Material-Specific Architectural Detailing
      switch (mat) {
        case 'wood':
          // Wood planks + lush moss/grass top + hanging vines
          this.renderWoodPlatform(ctx, p);
          break;

        case 'stone':
          // Beveled stone masonry bricks & golden rivets
          this.renderStonePlatform(ctx, p);
          break;

        case 'ancient':
          // Sandstone runes & dripping water drops
          this.renderAncientPlatform(ctx, p, t);
          break;

        case 'crystal':
          // Translucent gemstone facets & corner crystal spikes
          this.renderCrystalPlatform(ctx, p, t);
          break;

        case 'tech':
          // Diamond tread plate, hazard stripes, rivet bolts
          this.renderTechPlatform(ctx, p, t);
          break;

        case 'basalt':
          // Dark obsidian crags with glowing red magma fissures
          this.renderBasaltPlatform(ctx, p, t);
          break;

        case 'ice':
          // Translucent glacial ice, snow caps, hanging icicles
          this.renderIcePlatform(ctx, p);
          break;

        case 'gold':
          // Gilded mirror bullion, filigree corners, radiant sparkle
          this.renderGoldPlatform(ctx, p, t);
          break;

        default:
          // Clean bevel border
          ctx.strokeStyle = p.borderColor || level.biome.platformBorder;
          ctx.lineWidth = 2;
          ctx.strokeRect(p.x, p.y, p.w, p.h);
          break;
      }

      // Special Gameplay Platform Modifiers

      // Crumbling platform crack lines and falling dust
      if (p.crumbleState === 'shaking') {
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(p.x + 8, p.y);
        ctx.lineTo(p.x + p.w * 0.35, p.y + p.h * 0.6);
        ctx.lineTo(p.x + p.w * 0.5, p.y + p.h);
        ctx.moveTo(p.x + p.w * 0.65, p.y);
        ctx.lineTo(p.x + p.w * 0.8, p.y + p.h * 0.55);
        ctx.lineTo(p.x + p.w * 0.9, p.y + p.h);
        ctx.stroke();

        // Falling stone crumbs
        ctx.fillStyle = '#94a3b8';
        for (let g = 0; g < 3; g++) {
          const gx = p.x + (g * 31 + t * 50) % p.w;
          const gy = p.y + p.h + (t * 70 + g * 12) % 18;
          ctx.fillRect(gx, gy, 2.5, 2.5);
        }
      }

      // Conveyor belt indicator
      if (p.conveyor) {
        ctx.fillStyle = '#ffbe0b';
        const offset = (t * p.conveyor * 0.4) % 24;
        for (let cx = p.x + offset; cx < p.x + p.w; cx += 24) {
          ctx.fillRect(cx, p.y + 2, 7, 3);
        }
      }

      // Bouncy mushroom cap
      if (p.bouncy) {
        ctx.fillStyle = '#e63946';
        ctx.fillRect(p.x + 3, p.y - 5, p.w - 6, 7);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(p.x + p.w * 0.25, p.y - 4, 5, 4);
        ctx.fillRect(p.x + p.w * 0.5, p.y - 4, 5, 4);
        ctx.fillRect(p.x + p.w * 0.75, p.y - 4, 5, 4);
      }

      ctx.restore();
    }
    ctx.restore();
  }

  // --- Platform Material Sub-Renders ---

  private renderWoodPlatform(ctx: CanvasRenderingContext2D, p: any): void {
    // Mossy/grassy top fringe
    ctx.fillStyle = '#2d6a4f';
    ctx.fillRect(p.x, p.y, p.w, 4);
    // Tiny grass tufts
    ctx.fillStyle = '#52b788';
    for (let gx = p.x + 8; gx < p.x + p.w - 8; gx += 16) {
      ctx.fillRect(gx, p.y - 3, 3, 3);
    }
    // Dangling leafy vines hanging below
    ctx.fillStyle = '#1b4332';
    for (let vx = p.x + 20; vx < p.x + p.w - 20; vx += 45) {
      const vh = 10 + ((vx * 13) % 12);
      ctx.fillRect(vx, p.y + p.h, 3, vh);
      ctx.beginPath();
      ctx.arc(vx + 1.5, p.y + p.h + vh, 4, 0, Math.PI * 2);
      ctx.fill();
    }
    // Border
    ctx.strokeStyle = '#40916c';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(p.x, p.y, p.w, p.h);
  }

  private renderStonePlatform(ctx: CanvasRenderingContext2D, p: any): void {
    // Beveled stone bricks
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 1;
    // Brick joint lines
    for (let bx = p.x + 40; bx < p.x + p.w - 20; bx += 40) {
      ctx.beginPath();
      ctx.moveTo(bx, p.y);
      ctx.lineTo(bx, p.y + p.h);
      ctx.stroke();
    }
    // Top specular highlight
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    ctx.lineTo(p.x + p.w, p.y);
    ctx.stroke();

    ctx.strokeStyle = '#4a628a';
    ctx.lineWidth = 2;
    ctx.strokeRect(p.x, p.y, p.w, p.h);
  }

  private renderAncientPlatform(ctx: CanvasRenderingContext2D, p: any, t: number): void {
    // Weathered sandstone with carved glowing runes
    ctx.strokeStyle = '#4cc9f0';
    ctx.lineWidth = 1.5;
    ctx.globalAlpha = 0.5 + Math.sin(t * 3 + p.x) * 0.2;
    for (let rx = p.x + 30; rx < p.x + p.w - 30; rx += 50) {
      ctx.strokeRect(rx, p.y + 6, 8, 8);
    }
    ctx.globalAlpha = 1.0;

    // Dripping water droplets from underside
    ctx.fillStyle = '#4cc9f0';
    for (let dx = p.x + 35; dx < p.x + p.w - 35; dx += 80) {
      const dropY = p.y + p.h + ((t * 40 + dx) % 25);
      ctx.beginPath();
      ctx.arc(dx, dropY, 2, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.strokeStyle = '#2e6f95';
    ctx.lineWidth = 2;
    ctx.strokeRect(p.x, p.y, p.w, p.h);
  }

  private renderCrystalPlatform(ctx: CanvasRenderingContext2D, p: any, t: number): void {
    // Faceted gem refraction lines
    ctx.strokeStyle = 'rgba(181, 23, 158, 0.4)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    ctx.lineTo(p.x + p.w * 0.5, p.y + p.h);
    ctx.lineTo(p.x + p.w, p.y);
    ctx.stroke();

    // Crystal corner spikes
    ctx.fillStyle = '#b5179e';
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    ctx.lineTo(p.x + 6, p.y - 8);
    ctx.lineTo(p.x + 12, p.y);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(p.x + p.w - 12, p.y);
    ctx.lineTo(p.x + p.w - 6, p.y - 8);
    ctx.lineTo(p.x + p.w, p.y);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = '#7209b7';
    ctx.lineWidth = 2;
    ctx.strokeRect(p.x, p.y, p.w, p.h);
  }

  private renderTechPlatform(ctx: CanvasRenderingContext2D, p: any, t: number): void {
    // Caution hazard stripes on top ledge
    ctx.save();
    ctx.beginPath();
    ctx.rect(p.x, p.y, p.w, 5);
    ctx.clip();
    for (let sx = p.x - 10; sx < p.x + p.w + 10; sx += 14) {
      ctx.fillStyle = '#ffb703';
      ctx.fillRect(sx, p.y, 7, 5);
      ctx.fillStyle = '#100a04';
      ctx.fillRect(sx + 7, p.y, 7, 5);
    }
    ctx.restore();

    // Rivet bolts along edges
    ctx.fillStyle = '#ffb703';
    ctx.fillRect(p.x + 4, p.y + p.h - 6, 3, 3);
    ctx.fillRect(p.x + p.w - 7, p.y + p.h - 6, 3, 3);

    ctx.strokeStyle = '#7d562b';
    ctx.lineWidth = 2;
    ctx.strokeRect(p.x, p.y, p.w, p.h);
  }

  private renderBasaltPlatform(ctx: CanvasRenderingContext2D, p: any, t: number): void {
    // Glowing magma vein cracks through the rock
    ctx.strokeStyle = '#fb5607';
    ctx.lineWidth = 1.5;
    ctx.globalAlpha = 0.7 + Math.sin(t * 4 + p.x) * 0.3;
    ctx.beginPath();
    ctx.moveTo(p.x + 20, p.y + p.h);
    ctx.lineTo(p.x + 45, p.y + 6);
    ctx.lineTo(p.x + 80, p.y + p.h - 4);
    ctx.stroke();
    ctx.globalAlpha = 1.0;

    ctx.strokeStyle = '#6d211b';
    ctx.lineWidth = 2;
    ctx.strokeRect(p.x, p.y, p.w, p.h);
  }

  private renderIcePlatform(ctx: CanvasRenderingContext2D, p: any): void {
    // Frosted snow layer on top
    ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
    ctx.fillRect(p.x, p.y, p.w, 4);

    // Translucent dangling icicles below
    ctx.fillStyle = 'rgba(162, 210, 255, 0.7)';
    for (let ix = p.x + 15; ix < p.x + p.w - 15; ix += 25) {
      const ih = 8 + ((ix * 7) % 10);
      ctx.beginPath();
      ctx.moveTo(ix, p.y + p.h);
      ctx.lineTo(ix + 3, p.y + p.h + ih);
      ctx.lineTo(ix + 6, p.y + p.h);
      ctx.closePath();
      ctx.fill();
    }

    ctx.strokeStyle = '#a2d2ff';
    ctx.lineWidth = 2;
    ctx.strokeRect(p.x, p.y, p.w, p.h);
  }

  private renderGoldPlatform(ctx: CanvasRenderingContext2D, p: any, t: number): void {
    // Mirror specular gloss highlight
    const glint = (t * 60 + p.x) % (p.w + 60) - 30;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.fillRect(p.x + Math.max(0, glint), p.y + 2, 12, p.h - 4);

    // Filigree gold border
    ctx.strokeStyle = '#ffd166';
    ctx.lineWidth = 2;
    ctx.strokeRect(p.x, p.y, p.w, p.h);
  }

  // =========================================================================
  // HAZARDS & PROPS
  // =========================================================================
  private renderHazards(ctx: CanvasRenderingContext2D, level: DungeonLevel): void {
    ctx.save();
    const t = this.animTimer;
    for (let i = 0; i < level.hazards.length; i++) {
      const h = level.hazards[i];
      if (h.type === 'lava') {
        // Churning animated volcanic lava
        ctx.fillStyle = '#d00000';
        ctx.fillRect(h.x, h.y, h.w, h.h);
        ctx.fillStyle = '#ffba08';
        const wave = Math.sin(t * 6) * 3;
        ctx.fillRect(h.x, h.y + wave, h.w, 5);
        // Popping lava bubbles
        for (let bx = h.x + 20; bx < h.x + h.w - 10; bx += 35) {
          const pop = Math.sin(t * 8 + bx);
          if (pop > 0.5) {
            ctx.fillStyle = '#ffd166';
            ctx.beginPath();
            ctx.arc(bx, h.y + wave - 2, 3, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      } else if (h.type === 'fire_vent') {
        // ==========================================
        // RHYTHMIC TIMED FLAME VENT
        // ==========================================
        // Heavy Industrial Vent Grate
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(h.x, h.y, h.w, h.h);
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(h.x, h.y, h.w, h.h);

        // Exhaust slots
        for (let gx = h.x + 4; gx < h.x + h.w - 4; gx += 8) {
          ctx.fillStyle = (h.state === 'active' || h.state === 'warning') ? '#fb5607' : '#1e293b';
          ctx.fillRect(gx, h.y + 2, 4, h.h - 4);
        }

        if (h.state === 'warning') {
          // Warning glow & steam/embers
          ctx.fillStyle = 'rgba(251, 86, 7, 0.25)';
          ctx.fillRect(h.x, h.y - 15, h.w, 15);
          // Sputtering spark embers
          ctx.fillStyle = '#ffbe0b';
          for (let s = 0; s < 4; s++) {
            const sx = h.x + (s * 19 + t * 55) % h.w;
            const sy = h.y - ((t * 70 + s * 22) % 28);
            ctx.beginPath();
            ctx.arc(sx, sy, 1.5, 0, Math.PI * 2);
            ctx.fill();
          }
        } else if (h.state === 'active') {
          // Towering roaring flame column
          const flameH = h.flameHeight || 85;
          const flameGrad = ctx.createLinearGradient(h.x, h.y + h.h, h.x, h.y - flameH);
          flameGrad.addColorStop(0, '#ffffff');
          flameGrad.addColorStop(0.25, '#ffbe0b');
          flameGrad.addColorStop(0.65, '#fb5607');
          flameGrad.addColorStop(1, 'rgba(239, 71, 111, 0)');
          ctx.fillStyle = flameGrad;

          ctx.beginPath();
          ctx.moveTo(h.x, h.y);
          const steps = 6;
          const stepW = h.w / steps;
          for (let s = 0; s <= steps; s++) {
            const fx = h.x + s * stepW;
            const tongue = Math.sin(t * 30 + s * 2.5) * 10;
            ctx.lineTo(fx, h.y - flameH + tongue);
          }
          ctx.lineTo(h.x + h.w, h.y);
          ctx.closePath();
          ctx.fill();

          // Searing core glow
          ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
          ctx.fillRect(h.x + 3, h.y - 12, h.w - 6, 12);
        }
      } else if (h.type === 'blade_trap') {
        // ==========================================
        // SWINGING PENDULUM CRESCENT BLADE TRAP
        // ==========================================
        const anchorX = h.anchorX ?? (h.x + h.w * 0.5);
        const anchorY = h.anchorY ?? (h.y - 120);
        const length = h.length ?? 120;
        const angle = h.angle ?? 0;

        const bladeX = anchorX + Math.sin(angle) * length;
        const bladeY = anchorY + Math.cos(angle) * length;

        // Ceiling Anchor Pivot
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.arc(anchorX, anchorY, 9, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#eab308';
        ctx.beginPath();
        ctx.arc(anchorX, anchorY, 4, 0, Math.PI * 2);
        ctx.fill();

        // Iron Chain Links
        ctx.strokeStyle = '#64748b';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(anchorX, anchorY);
        ctx.lineTo(bladeX, bladeY);
        ctx.stroke();

        // Swinging Crescent Guillotine Axe Head
        ctx.save();
        ctx.translate(bladeX, bladeY);
        ctx.rotate(-angle);

        // Motion blur sheen
        ctx.strokeStyle = 'rgba(241, 245, 249, 0.35)';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(0, 0, 24, -Math.PI * 0.35, Math.PI * 0.35);
        ctx.stroke();

        // Steel Crescent Blade Head
        ctx.fillStyle = '#cbd5e1';
        ctx.beginPath();
        ctx.arc(0, 0, 22, -Math.PI * 0.45, Math.PI * 0.45);
        ctx.lineTo(0, -6);
        ctx.closePath();
        ctx.fill();

        // Polished razor edge highlight
        ctx.strokeStyle = '#f8fafc';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Center brass axle ring
        ctx.fillStyle = '#eab308';
        ctx.beginPath();
        ctx.arc(0, 0, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      } else {
        // Heavy dark steel mounting base plate with rivet bolts
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(h.x, h.y + h.h - 4, h.w, 4);
        ctx.fillStyle = '#64748b';
        for (let bx = h.x + 4; bx < h.x + h.w - 2; bx += 14) {
          ctx.fillRect(bx, h.y + h.h - 3, 2, 2);
        }

        // Gleaming steel spikes with metallic specular bevels
        ctx.fillStyle = '#94a3b8';
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 1;
        const spikeW = 14;
        for (let sx = h.x; sx < h.x + h.w - spikeW + 1; sx += spikeW) {
          ctx.beginPath();
          ctx.moveTo(sx, h.y + h.h - 2);
          ctx.lineTo(sx + spikeW * 0.5, h.y);
          ctx.lineTo(sx + spikeW, h.y + h.h - 2);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
          // Specular glint on left facet
          ctx.fillStyle = '#f8fafc';
          ctx.beginPath();
          ctx.moveTo(sx + 2, h.y + h.h - 2);
          ctx.lineTo(sx + spikeW * 0.5, h.y);
          ctx.lineTo(sx + spikeW * 0.5, h.y + h.h - 2);
          ctx.closePath();
          ctx.fill();
          ctx.fillStyle = '#94a3b8';
        }
      }
    }
    ctx.restore();
  }

  private renderProps(ctx: CanvasRenderingContext2D, level: DungeonLevel): void {
    ctx.save();
    const t = this.animTimer;

    for (let i = 0; i < level.props.length; i++) {
      const prop = level.props[i];

      if (prop.type === 'torch') {
        // Wall torch with flickering multi-layer flame lobes
        ctx.fillStyle = '#78350f';
        ctx.fillRect(prop.x - 3, prop.y, 6, 20);
        const flick = Math.sin(t * 14 + prop.x) * 2;
        // Outer orange lobe
        ctx.fillStyle = '#ff7b00';
        ctx.beginPath();
        ctx.arc(prop.x, prop.y - 5 + flick, 7, 0, Math.PI * 2);
        ctx.fill();
        // Inner golden heart
        ctx.fillStyle = '#ffea00';
        ctx.beginPath();
        ctx.arc(prop.x, prop.y - 5 + flick, 4, 0, Math.PI * 2);
        ctx.fill();
      } else if (prop.type === 'crystal') {
        // Prismatic glowing magical crystal
        const glow = Math.sin(t * 3.5 + prop.x) * 0.25 + 0.75;
        ctx.fillStyle = prop.lightColor || '#4cc9f0';
        ctx.globalAlpha = glow;
        ctx.beginPath();
        ctx.moveTo(prop.x, prop.y - 24);
        ctx.lineTo(prop.x + 12, prop.y);
        ctx.lineTo(prop.x, prop.y + 12);
        ctx.lineTo(prop.x - 12, prop.y);
        ctx.closePath();
        ctx.fill();
        ctx.globalAlpha = 1.0;
      } else if (prop.type === 'gate') {
        // Majestic Golden Exit Portal Archway
        const pw = prop.w || 80;
        const ph = prop.h || 120;
        const gx = prop.x - pw * 0.5;
        const gy = prop.y;

        // Archway stone frame
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(gx - 8, gy - 12, pw + 16, ph + 12);
        // Stone pillars
        ctx.fillStyle = '#334155';
        ctx.fillRect(gx - 8, gy, 12, ph);
        ctx.fillRect(gx + pw - 4, gy, 12, ph);

        // Golden portal interior
        ctx.fillStyle = '#0a0f1d';
        ctx.fillRect(gx + 4, gy, pw - 8, ph);

        if (prop.active) {
          // Swirling golden portal vortex
          const vortexPulse = Math.sin(t * 5) * 0.15 + 0.85;
          const vortexGrad = ctx.createRadialGradient(prop.x, gy + ph * 0.5, 5, prop.x, gy + ph * 0.5, pw * 0.6);
          vortexGrad.addColorStop(0, '#ffffff');
          vortexGrad.addColorStop(0.4, '#ffd166');
          vortexGrad.addColorStop(1, 'rgba(255, 158, 0, 0.2)');
          ctx.fillStyle = vortexGrad;
          ctx.fillRect(gx + 4, gy, pw - 8, ph);

          // Golden portal frame
          ctx.strokeStyle = '#ffd166';
          ctx.lineWidth = 4;
          ctx.strokeRect(gx, gy, pw, ph);

          // Banner
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 12px "Outfit", sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('⚡ ENTER PORTAL ⚡', prop.x, gy + ph * 0.5);
        } else {
          // Iron portcullis bars
          ctx.strokeStyle = '#64748b';
          ctx.lineWidth = 2.5;
          for (let bx = gx + 14; bx < gx + pw - 6; bx += 14) {
            ctx.beginPath();
            ctx.moveTo(bx, gy);
            ctx.lineTo(bx, gy + ph);
            ctx.stroke();
          }
          // Frame
          ctx.strokeStyle = '#475569';
          ctx.lineWidth = 3;
          ctx.strokeRect(gx, gy, pw, ph);

          // Locked label
          ctx.fillStyle = '#e2e8f0';
          ctx.font = 'bold 11px "Outfit", sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('🔒 12 COINS REQUIRED', prop.x, gy - 16);
        }
      } else if (prop.type === 'vending_machine') {
        // The Great Vending Machine of Antiquity
        const vw = prop.w || 80;
        const vh = prop.h || 110;
        ctx.fillStyle = '#3e2723';
        ctx.fillRect(prop.x - vw * 0.5, prop.y, vw, vh);
        ctx.strokeStyle = '#ffd166';
        ctx.lineWidth = 3;
        ctx.strokeRect(prop.x - vw * 0.5, prop.y, vw, vh);

        // Glass window showing glowing sandwich
        ctx.fillStyle = 'rgba(255, 215, 0, 0.25)';
        ctx.fillRect(prop.x - vw * 0.5 + 8, prop.y + 10, vw - 16, vh * 0.45);
        ctx.strokeRect(prop.x - vw * 0.5 + 8, prop.y + 10, vw - 16, vh * 0.45);

        ctx.font = '24px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('🥪', prop.x, prop.y + vh * 0.32);

        // Coin slot
        ctx.fillStyle = '#ffbe0b';
        ctx.fillRect(prop.x + 14, prop.y + vh * 0.6, 12, 4);

        ctx.fillStyle = '#fff';
        ctx.font = '9px "Press Start 2P"';
        ctx.fillText('INSERT COIN', prop.x, prop.y - 12);
      } else if (prop.type === 'golden_altar') {
        // Sacred Extraction Altar
        const aw = prop.w || 120;
        const ah = prop.h || 70;
        ctx.fillStyle = '#2b2d42';
        ctx.fillRect(prop.x - aw * 0.5, prop.y, aw, ah);
        ctx.strokeStyle = '#ffd166';
        ctx.lineWidth = 3.5;
        ctx.strokeRect(prop.x - aw * 0.5, prop.y, aw, ah);

        ctx.fillStyle = '#ffbe0b';
        ctx.font = 'bold 12px "Outfit", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('✨ EXTRACTION SANCTUARY ✨', prop.x, prop.y - 18);
      }
    }
    ctx.restore();
  }

  // =========================================================================
  // VOLUMETRIC LIGHTING HALOS & GLOW
  // =========================================================================
  private renderLightingHalos(ctx: CanvasRenderingContext2D, level: DungeonLevel): void {
    ctx.save();
    ctx.globalCompositeOperation = 'screen';

    for (let i = 0; i < level.props.length; i++) {
      const pr = level.props[i];
      if (pr.lightRadius && pr.lightRadius > 0) {
        const rad = pr.lightRadius;
        const halo = ctx.createRadialGradient(pr.x, pr.y, 5, pr.x, pr.y, rad);
        halo.addColorStop(0, pr.lightColor || '#ffd166');
        halo.addColorStop(0.4, 'rgba(255, 209, 102, 0.15)');
        halo.addColorStop(1, 'rgba(0, 0, 0, 0)');

        ctx.fillStyle = halo;
        ctx.beginPath();
        ctx.arc(pr.x, pr.y, rad, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.restore();
  }

  // =========================================================================
  // AMBIENT WEATHER & PARTICLES (All 9 Biome Particle Systems)
  // =========================================================================
  private renderAmbientWeather(ctx: CanvasRenderingContext2D, level: DungeonLevel, camera: Camera): void {
    const type = level.biome.ambientParticle;
    const t = this.animTimer;
    ctx.save();

    switch (type) {
      case 'snow':
        // Swirling gentle snowflakes with horizontal wind drift
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        for (let i = 0; i < 48; i++) {
          const sx = (i * 137 + t * 40 + Math.sin(t + i) * 20) % level.width;
          const sy = (i * 211 + t * 85) % level.height;
          const size = (i % 3 === 0) ? 3 : 2;
          ctx.fillRect(sx, sy, size, size);
        }
        break;

      case 'embers':
        // Fiery rising volcanic cinder motes
        ctx.fillStyle = 'rgba(255, 107, 107, 0.85)';
        for (let i = 0; i < 40; i++) {
          const ex = (i * 153 + Math.sin(t * 2 + i) * 25) % level.width;
          const ey = level.height - ((i * 97 + t * 55) % level.height);
          ctx.fillRect(ex, ey, 2.5, 2.5);
        }
        break;

      case 'leaves':
        // Fluttering forest foliage leaves
        ctx.fillStyle = 'rgba(82, 183, 136, 0.8)';
        for (let i = 0; i < 35; i++) {
          const lx = (i * 163 + t * 35 + Math.sin(t * 2.5 + i) * 30) % level.width;
          const ly = (i * 113 + t * 45) % level.height;
          ctx.fillRect(lx, ly, 3.5, 3.5);
        }
        break;

      case 'sparks':
        // Royal golden torch embers ascending
        ctx.fillStyle = 'rgba(255, 209, 102, 0.85)';
        for (let i = 0; i < 35; i++) {
          const spx = (i * 173 + Math.cos(t * 3 + i) * 15) % level.width;
          const spy = level.height - ((i * 109 + t * 65) % level.height);
          ctx.fillRect(spx, spy, 2, 2);
        }
        break;

      case 'bubbles':
        // Translucent rising water bubbles
        ctx.fillStyle = 'rgba(76, 201, 240, 0.6)';
        for (let i = 0; i < 40; i++) {
          const bx = (i * 149 + Math.sin(t * 2 + i) * 18) % level.width;
          const by = level.height - ((i * 117 + t * 50) % level.height);
          const rad = (i % 3 === 0) ? 3.5 : 2;
          ctx.beginPath();
          ctx.arc(bx, by, rad, 0, Math.PI * 2);
          ctx.fill();
        }
        break;

      case 'crystals':
        // Twinkling amethyst crystal dust shards
        ctx.fillStyle = 'rgba(181, 23, 158, 0.8)';
        for (let i = 0; i < 35; i++) {
          const cx = (i * 181 + Math.sin(t + i) * 12) % level.width;
          const cy = (i * 127 + t * 25) % level.height;
          ctx.fillRect(cx, cy, 3, 3);
        }
        break;

      case 'steam':
        // Expanding industrial steam plumes
        ctx.fillStyle = 'rgba(255, 183, 3, 0.25)';
        for (let i = 0; i < 25; i++) {
          const stx = (i * 191 + Math.cos(t + i) * 20) % level.width;
          const sty = level.height - ((i * 89 + t * 40) % level.height);
          ctx.beginPath();
          ctx.arc(stx, sty, 12, 0, Math.PI * 2);
          ctx.fill();
        }
        break;

      case 'void':
        // Anti-gravity spiraling violet void rifts
        ctx.fillStyle = 'rgba(114, 9, 183, 0.8)';
        for (let i = 0; i < 35; i++) {
          const vx = (i * 167 + Math.sin(t * 3 + i) * 35) % level.width;
          const vy = (i * 139 + Math.cos(t * 3 + i) * 35) % level.height;
          ctx.fillRect(vx, vy, 2.5, 2.5);
        }
        break;

      case 'gold':
      default:
        // Divine golden star glints & bullion dust
        ctx.fillStyle = 'rgba(255, 215, 0, 0.85)';
        for (let i = 0; i < 50; i++) {
          const gx = (i * 179 + Math.sin(t * 2 + i) * 15) % level.width;
          const gy = level.height - ((i * 103 + t * 35) % level.height);
          ctx.fillRect(gx, gy, 2.5, 2.5);
        }
        break;
    }

    ctx.restore();
  }

  // =========================================================================
  // VIEWPORT VIGNETTE OVERLAY
  // =========================================================================
  private renderVignette(ctx: CanvasRenderingContext2D, camera: Camera): void {
    ctx.save();
    // Screen-space radial vignette centered on the camera
    const cx = camera.x;
    const cy = camera.y;
    const vw = camera.viewportWidth;
    const vh = camera.viewportHeight;
    const maxDim = Math.max(vw, vh) * 0.7;

    const vig = ctx.createRadialGradient(cx, cy, maxDim * 0.45, cx, cy, maxDim);
    vig.addColorStop(0, 'rgba(0, 0, 0, 0)');
    vig.addColorStop(1, 'rgba(0, 0, 0, 0.38)');

    ctx.fillStyle = vig;
    ctx.fillRect(cx - vw * 0.5, cy - vh * 0.5, vw, vh);

    // High-impact crimson vignette damage pulse when taking damage
    if (this.damageFlashTimer > 0) {
      const flashIntensity = Math.min(0.5, (this.damageFlashTimer / 0.28) * 0.5);
      const flashGrad = ctx.createRadialGradient(cx, cy, maxDim * 0.25, cx, cy, maxDim);
      flashGrad.addColorStop(0, `rgba(239, 71, 111, ${flashIntensity * 0.3})`);
      flashGrad.addColorStop(1, `rgba(239, 71, 111, ${flashIntensity})`);
      ctx.fillStyle = flashGrad;
      ctx.fillRect(cx - vw * 0.5, cy - vh * 0.5, vw, vh);
    }
    ctx.restore();
  }
}
