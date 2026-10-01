export interface CameraTarget {
  x: number;
  y: number;
  isAlive: boolean;
  isInBubble?: boolean;
}

export class Camera {
  public x: number = 640;
  public y: number = 360;
  public zoom: number = 1.0;
  public targetZoom: number = 1.0;
  public targetX: number = 640;
  public targetY: number = 360;

  // Level bounds
  public minX: number = 0;
  public maxX: number = 2560;
  public minY: number = 0;
  public maxY: number = 1440;

  private trauma: number = 0; // 0.0 to 1.0
  private shakeOffsetX: number = 0;
  private shakeOffsetY: number = 0;

  public readonly viewportWidth: number = 1280;
  public readonly viewportHeight: number = 720;

  public setBounds(minX: number, minY: number, maxX: number, maxY: number): void {
    this.minX = minX;
    this.minY = minY;
    this.maxX = maxX;
    this.maxY = maxY;
  }

  public addTrauma(amount: number): void {
    this.trauma = Math.min(1.0, this.trauma + amount);
  }

  public update(dt: number, targets: CameraTarget[]): void {
    // Prefer alive targets; fallback to bubble targets; fallback to center
    let activeTargets = targets.filter(t => t.isAlive && !t.isInBubble);
    if (activeTargets.length === 0) {
      activeTargets = targets.filter(t => t.isAlive);
    }
    if (activeTargets.length === 0 && targets.length > 0) {
      activeTargets = targets;
    }

    if (activeTargets.length > 0) {
      let minTargetX = activeTargets[0].x;
      let maxTargetX = activeTargets[0].x;
      let minTargetY = activeTargets[0].y;
      let maxTargetY = activeTargets[0].y;

      for (let i = 1; i < activeTargets.length; i++) {
        const t = activeTargets[i];
        if (t.x < minTargetX) minTargetX = t.x;
        if (t.x > maxTargetX) maxTargetX = t.x;
        if (t.y < minTargetY) minTargetY = t.y;
        if (t.y > maxTargetY) maxTargetY = t.y;
      }

      this.targetX = (minTargetX + maxTargetX) * 0.5;
      this.targetY = (minTargetY + maxTargetY) * 0.5 - 20;

      // Calculate span with comfortable padding
      const spanX = Math.max(480, maxTargetX - minTargetX + 380);
      const spanY = Math.max(340, maxTargetY - minTargetY + 320);

      const zoomX = this.viewportWidth / spanX;
      const zoomY = this.viewportHeight / spanY;
      // Allow zooming out to 0.65 for wide co-op exploration, up to 1.15 when close
      this.targetZoom = Math.min(1.15, Math.max(0.65, Math.min(zoomX, zoomY)));

      // Protect the advancing higher player!
      // In Canvas 2D, smaller Y is higher in the level.
      // If the vertical spread between players exceeds the camera viewport, anchor the camera to the HIGHER player (minTargetY)
      // so the higher player NEVER gets pushed off the top of the screen by a lower straggler.
      const halfViewH = (this.viewportHeight * 0.5) / this.targetZoom;
      const maxAllowedTargetY = minTargetY + halfViewH - 80;
      if (this.targetY > maxAllowedTargetY) {
        this.targetY = maxAllowedTargetY;
      }
    }

    // Clamp targets to level boundary taking current zoom into account
    const halfViewW = (this.viewportWidth * 0.5) / this.targetZoom;
    const halfViewH = (this.viewportHeight * 0.5) / this.targetZoom;

    if (this.maxX - this.minX > halfViewW * 2) {
      this.targetX = Math.max(this.minX + halfViewW, Math.min(this.maxX - halfViewW, this.targetX));
    } else {
      this.targetX = (this.minX + this.maxX) * 0.5;
    }

    if (this.maxY - this.minY > halfViewH * 2) {
      this.targetY = Math.max(this.minY + halfViewH, Math.min(this.maxY - halfViewH, this.targetY));
    } else {
      this.targetY = (this.minY + this.maxY) * 0.5;
    }

    // Smooth Lerp tracking
    const lerpSpeed = 7.0 * dt;
    this.x += (this.targetX - this.x) * lerpSpeed;
    this.y += (this.targetY - this.y) * lerpSpeed;
    this.zoom += (this.targetZoom - this.zoom) * lerpSpeed;

    // Screen Shake update
    if (this.trauma > 0) {
      const shakePower = this.trauma * this.trauma;
      const maxOffset = 24 * shakePower;
      this.shakeOffsetX = (Math.random() * 2 - 1) * maxOffset;
      this.shakeOffsetY = (Math.random() * 2 - 1) * maxOffset;
      this.trauma = Math.max(0, this.trauma - dt * 2.0);
    } else {
      this.shakeOffsetX = 0;
      this.shakeOffsetY = 0;
    }
  }

  public applyTransform(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    ctx.translate(this.viewportWidth * 0.5, this.viewportHeight * 0.5);
    ctx.scale(this.zoom, this.zoom);
    ctx.translate(-this.x + this.shakeOffsetX, -this.y + this.shakeOffsetY);
  }

  public resetTransform(ctx: CanvasRenderingContext2D): void {
    ctx.restore();
  }

  public screenToWorld(screenX: number, screenY: number): { x: number; y: number } {
    const normX = (screenX - this.viewportWidth * 0.5) / this.zoom;
    const normY = (screenY - this.viewportHeight * 0.5) / this.zoom;
    return {
      x: normX + this.x - this.shakeOffsetX,
      y: normY + this.y - this.shakeOffsetY
    };
  }

  public worldToScreen(worldX: number, worldY: number): { x: number; y: number } {
    const normX = (worldX - this.x + this.shakeOffsetX) * this.zoom;
    const normY = (worldY - this.y + this.shakeOffsetY) * this.zoom;
    return {
      x: normX + this.viewportWidth * 0.5,
      y: normY + this.viewportHeight * 0.5
    };
  }

  public reset(spawnX: number = 640, spawnY: number = 360): void {
    this.x = spawnX;
    this.y = spawnY;
    this.targetX = spawnX;
    this.targetY = spawnY;
    this.zoom = 1.0;
    this.targetZoom = 1.0;
    this.trauma = 0;
    this.shakeOffsetX = 0;
    this.shakeOffsetY = 0;
  }
}
