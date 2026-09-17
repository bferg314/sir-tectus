export class GamepadNavigator {
  public enabled: boolean = false;
  private navCooldown: number = 0;
  private prevButtonA: boolean = false;
  private prevButtonB: boolean = false;
  private onBackCallback: (() => void) | null = null;
  private onNavigateCallback: (() => void) | null = null;

  public setOnBack(cb: (() => void) | null): void {
    this.onBackCallback = cb;
  }

  public setOnNavigate(cb: (() => void) | null): void {
    this.onNavigateCallback = cb;
  }

  public update(dt: number): void {
    if (!this.enabled) return;

    if (this.navCooldown > 0) this.navCooldown -= dt;

    const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
    const gp = gamepads[0];
    if (!gp) return;

    const btnA = gp.buttons[0]?.pressed || false;
    const btnB = gp.buttons[1]?.pressed || false;

    // 1. Directional Navigation (Left Stick & D-Pad)
    if (this.navCooldown <= 0) {
      const axisY = gp.axes[1] || 0;
      const axisX = gp.axes[0] || 0;
      const dpadUp = gp.buttons[12]?.pressed || false;
      const dpadDown = gp.buttons[13]?.pressed || false;
      const dpadLeft = gp.buttons[14]?.pressed || false;
      const dpadRight = gp.buttons[15]?.pressed || false;

      if (axisY < -0.45 || dpadUp || axisX < -0.45 || dpadLeft) {
        this.navigate(-1);
        this.navCooldown = 0.22;
        if (this.onNavigateCallback) this.onNavigateCallback();
      } else if (axisY > 0.45 || dpadDown || axisX > 0.45 || dpadRight) {
        this.navigate(1);
        this.navCooldown = 0.22;
        if (this.onNavigateCallback) this.onNavigateCallback();
      }
    }

    // 2. Button A (Cross): Activate currently focused item on PRESS EDGE
    if (btnA && !this.prevButtonA) {
      const activeEl = document.activeElement as HTMLElement;
      if (
        activeEl &&
        (activeEl.tagName === 'BUTTON' ||
          activeEl.classList.contains('portal-card') ||
          activeEl.classList.contains('relic-card') ||
          activeEl.classList.contains('lobby-slot') ||
          activeEl.classList.contains('slot-toggle-btn'))
      ) {
        activeEl.click();
      }
    }
    this.prevButtonA = btnA;

    // 3. Button B (Circle): Cancel / Back / Close on PRESS EDGE
    if (btnB && !this.prevButtonB) {
      if (this.onBackCallback) {
        this.onBackCallback();
      }
    }
    this.prevButtonB = btnB;
  }

  public focusFirst(): void {
    const focusable = this.getFocusableElements();
    if (focusable.length > 0) {
      this.setFocus(focusable[0]);
    }
  }

  public navigate(dir: number): void {
    const focusable = this.getFocusableElements();
    if (focusable.length === 0) return;

    const currentIndex = focusable.indexOf(document.activeElement as HTMLElement);
    let nextIndex = currentIndex + dir;

    if (currentIndex === -1) {
      nextIndex = dir > 0 ? 0 : focusable.length - 1;
    } else if (nextIndex < 0) {
      nextIndex = focusable.length - 1;
    } else if (nextIndex >= focusable.length) {
      nextIndex = 0;
    }

    this.setFocus(focusable[nextIndex]);
  }

  public setFocus(el: HTMLElement): void {
    document.querySelectorAll('.controller-focused').forEach(e => e.classList.remove('controller-focused'));
    el.focus();
    el.classList.add('controller-focused');
  }

  public focusElement(el: HTMLElement): void {
    this.setFocus(el);
  }

  private getFocusableElements(): HTMLElement[] {
    return Array.from(
      document.querySelectorAll<HTMLElement>(
        'button:not(:disabled), .portal-card, .relic-card, .slot-toggle-btn, input'
      )
    ).filter(el => el.offsetParent !== null && !el.classList.contains('hidden'));
  }
}
