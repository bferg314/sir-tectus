export class GameLoop {
  private isRunning: boolean = false;
  private lastTime: number = 0;
  private accumulator: number = 0;
  private readonly step: number = 1 / 60; // 60 FPS physics
  private animFrameId: number = 0;

  private onUpdate: (dt: number) => void;
  private onRender: (interpolation: number) => void;

  constructor(
    onUpdate: (dt: number) => void,
    onRender: (interpolation: number) => void
  ) {
    this.onUpdate = onUpdate;
    this.onRender = onRender;
  }

  public start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    this.lastTime = performance.now();
    this.accumulator = 0;
    this.loop = this.loop.bind(this);
    this.animFrameId = requestAnimationFrame(this.loop);
  }

  public stop(): void {
    this.isRunning = false;
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = 0;
    }
  }

  private loop(currentTime: number): void {
    if (!this.isRunning) return;

    let delta = (currentTime - this.lastTime) / 1000;
    this.lastTime = currentTime;

    // Clamp delta to prevent spiral of death on lag spikes or tab switch
    if (delta > 0.1) delta = 0.1;

    this.accumulator += delta;

    while (this.accumulator >= this.step) {
      this.onUpdate(this.step);
      this.accumulator -= this.step;
    }

    const interpolation = this.accumulator / this.step;
    this.onRender(interpolation);

    this.animFrameId = requestAnimationFrame(this.loop);
  }
}
