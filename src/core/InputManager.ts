export interface PlayerInputState {
  moveX: number;
  moveY: number;
  jump: boolean;
  jumpPressed: boolean;
  attack: boolean;        // Primary (Sword)
  attackPressed: boolean;
  aimBow: boolean;        // Secondary (Bow draw)
  aimBowPressed: boolean;
  shootArrow: boolean;    // Secondary release
  ability: boolean;       // Signature Knight Ability (Shield / Fire / Slide / Sword Throw)
  abilityPressed: boolean;
  dash: boolean;
  dashPressed: boolean;
  dropThrough: boolean;
  pausePressed: boolean;
  tossPressed: boolean;   // Sandwich toss/pass
}

export class InputManager {
  private keyStates: Map<string, boolean> = new Map();
  private prevKeyStates: Map<string, boolean> = new Map();
  private prevGamepadButtons: Map<number, boolean[]> = new Map();

  // Connected gamepads
  private activeGamepads: (Gamepad | null)[] = [null, null, null, null];

  // Fullscreen callback
  public onFullscreenToggle?: () => void;
  public onPauseToggle?: () => void;

  constructor() {
    this.initKeyboardListeners();
    this.initGamepadListeners();
  }

  private initKeyboardListeners(): void {
    window.addEventListener('keydown', (e: KeyboardEvent) => {
      // Toggle Fullscreen with F11 or 'f' (when not in a text input)
      if (e.key === 'F11' || (e.key.toLowerCase() === 'f' && !this.isModifierActive(e))) {
        if (e.key === 'F11') e.preventDefault();
        this.toggleFullscreen();
      }

      if (e.key === 'Escape' || e.key.toLowerCase() === 'p') {
        if (this.onPauseToggle) this.onPauseToggle();
      }

      this.keyStates.set(e.code, true);
    });

    window.addEventListener('keyup', (e: KeyboardEvent) => {
      this.keyStates.set(e.code, false);
    });

    // Window blur reset
    window.addEventListener('blur', () => {
      this.keyStates.clear();
      this.prevKeyStates.clear();
    });
  }

  private isModifierActive(e: KeyboardEvent): boolean {
    return e.ctrlKey || e.altKey || e.metaKey;
  }

  private initGamepadListeners(): void {
    window.addEventListener('gamepadconnected', (e: GamepadEvent) => {
      console.log(`[InputManager] Gamepad connected at index ${e.gamepad.index}: ${e.gamepad.id}`);
    });
    window.addEventListener('gamepaddisconnected', (e: GamepadEvent) => {
      console.log(`[InputManager] Gamepad disconnected from index ${e.gamepad.index}`);
    });
  }

  public update(): void {
    // Poll navigator.getGamepads()
    const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
    for (let i = 0; i < 4; i++) {
      this.activeGamepads[i] = gamepads[i] || null;
    }
  }

  public postUpdate(): void {
    // Copy current keys to prev
    this.prevKeyStates = new Map(this.keyStates);

    // Copy gamepad buttons to prev
    for (let i = 0; i < 4; i++) {
      const gp = this.activeGamepads[i];
      if (gp) {
        this.prevGamepadButtons.set(i, gp.buttons.map(b => b.pressed));
      }
    }
  }

  public toggleFullscreen(): void {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.warn(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(err => {
          console.warn(`Error attempting to exit fullscreen: ${err.message}`);
        });
      }
    }
    if (this.onFullscreenToggle) this.onFullscreenToggle();
  }

  public getPlayerInput(playerIndex: number): PlayerInputState {
    const input: PlayerInputState = {
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

    // 1. Check Gamepad
    const gp = this.activeGamepads[playerIndex];
    if (gp) {
      const prevButtons = this.prevGamepadButtons.get(playerIndex) || [];
      const deadzone = 0.22;

      // Left Stick
      let axisX = gp.axes[0] || 0;
      let axisY = gp.axes[1] || 0;
      if (Math.abs(axisX) > deadzone) input.moveX = axisX;
      if (Math.abs(axisY) > deadzone) input.moveY = axisY;

      // D-Pad buttons (standard mapping: 12 up, 13 down, 14 left, 15 right)
      if (gp.buttons[14]?.pressed) input.moveX = -1;
      if (gp.buttons[15]?.pressed) input.moveX = 1;
      if (gp.buttons[12]?.pressed) input.moveY = -1;
      if (gp.buttons[13]?.pressed) input.moveY = 1;

      // Buttons (Standard Xbox/PS layout)
      // A / Cross (Button 0) = Jump
      const btnA = gp.buttons[0]?.pressed || false;
      const prevA = prevButtons[0] || false;
      input.jump = btnA;
      input.jumpPressed = btnA && !prevA;

      // X / Square (Button 2) = Melee Sword Attack
      const btnX = gp.buttons[2]?.pressed || false;
      const prevX = prevButtons[2] || false;
      input.attack = btnX;
      input.attackPressed = btnX && !prevX;

      // B / Circle (Button 1) = Draw Bow
      const btnB = gp.buttons[1]?.pressed || false;
      const prevB = prevButtons[1] || false;
      input.aimBow = btnB;
      input.aimBowPressed = btnB && !prevB;
      input.shootArrow = !btnB && prevB; // Release fires arrow

      // Y / Triangle (Button 3) = Signature Knight Ability
      const btnY = gp.buttons[3]?.pressed || false;
      const prevY = prevButtons[3] || false;
      input.ability = btnY;
      input.abilityPressed = btnY && !prevY;

      // Bumpers / Triggers: LB (4), RB (5), LT (6), RT (7) = Dash & Toss
      const btnLB = gp.buttons[4]?.pressed || false;
      const btnRB = gp.buttons[5]?.pressed || false;
      const btnLT = gp.buttons[6]?.pressed || false;
      const btnRT = gp.buttons[7]?.pressed || false;
      const isDashing = btnLB || btnRB || btnLT || btnRT;
      const prevDashing = (prevButtons[4] || prevButtons[5] || prevButtons[6] || prevButtons[7]) || false;
      input.dash = isDashing;
      input.dashPressed = isDashing && !prevDashing;

      // Right Stick Click (11) or Bumper = Toss sandwich
      if (gp.buttons[5]?.pressed && !prevButtons[5]) {
        input.tossPressed = true;
      }

      // Start / Menu (Button 9) = Pause
      const btnStart = gp.buttons[9]?.pressed || false;
      const prevStart = prevButtons[9] || false;
      input.pausePressed = btnStart && !prevStart;

      // Select / Back (Button 8) = Fullscreen
      if (gp.buttons[8]?.pressed && !prevButtons[8]) {
        this.toggleFullscreen();
      }
    }

    // 2. Keyboard Mapping fallback/supplement for Player 1-4
    this.applyKeyboardSplit(playerIndex, input);

    // Global Pause Keys (Escape / KeyP)
    const wasPressedKey = (code: string) => this.keyStates.get(code) === true && this.prevKeyStates.get(code) !== true;
    if (wasPressedKey('Escape') || wasPressedKey('KeyP')) {
      input.pausePressed = true;
    }

    // Drop Through Platform if Down + Jump
    if (input.moveY > 0.5 && input.jumpPressed) {
      input.dropThrough = true;
    }

    return input;
  }

  private applyKeyboardSplit(playerIndex: number, input: PlayerInputState): void {
    const isDown = (code: string) => this.keyStates.get(code) === true;
    const wasPressed = (code: string) => isDown(code) && this.prevKeyStates.get(code) !== true;

    if (playerIndex === 0) {
      // Player 1: WASD + Space, F, G, R, Shift
      if (isDown('KeyA')) input.moveX = -1;
      if (isDown('KeyD')) input.moveX = 1;
      if (isDown('KeyW')) input.moveY = -1;
      if (isDown('KeyS')) input.moveY = 1;

      if (isDown('Space') || isDown('KeyW')) input.jump = true;
      if (wasPressed('Space') || wasPressed('KeyW')) input.jumpPressed = true;

      if (isDown('KeyJ') || isDown('KeyF')) input.attack = true;
      if (wasPressed('KeyJ') || wasPressed('KeyF')) input.attackPressed = true;

      // Secondary Bow Draw (Hold G / K, release to shoot)
      if (isDown('KeyK') || isDown('KeyG')) input.aimBow = true;
      if (wasPressed('KeyK') || wasPressed('KeyG')) input.aimBowPressed = true;
      if (!isDown('KeyK') && !isDown('KeyG') && (this.prevKeyStates.get('KeyK') || this.prevKeyStates.get('KeyG'))) {
        input.shootArrow = true;
      }

      // Ability (R / E / L)
      if (isDown('KeyE') || isDown('KeyR') || isDown('KeyL')) input.ability = true;
      if (wasPressed('KeyE') || wasPressed('KeyR') || wasPressed('KeyL')) input.abilityPressed = true;

      // Dash (Shift / Q)
      if (isDown('ShiftLeft') || isDown('KeyQ')) input.dash = true;
      if (wasPressed('ShiftLeft') || wasPressed('KeyQ')) input.dashPressed = true;

      // Toss Sandwich (T)
      if (wasPressed('KeyT')) input.tossPressed = true;
    } else if (playerIndex === 1) {
      // Player 2: Arrow Keys + Numpad
      if (isDown('ArrowLeft')) input.moveX = -1;
      if (isDown('ArrowRight')) input.moveX = 1;
      if (isDown('ArrowUp')) input.moveY = -1;
      if (isDown('ArrowDown')) input.moveY = 1;

      if (isDown('ArrowUp') || isDown('Numpad0')) input.jump = true;
      if (wasPressed('ArrowUp') || wasPressed('Numpad0')) input.jumpPressed = true;

      if (isDown('Numpad1') || isDown('Slash')) input.attack = true;
      if (wasPressed('Numpad1') || wasPressed('Slash')) input.attackPressed = true;

      if (isDown('Numpad2') || isDown('Period')) input.aimBow = true;
      if (wasPressed('Numpad2') || wasPressed('Period')) input.aimBowPressed = true;
      if (!isDown('Numpad2') && !isDown('Period') && (this.prevKeyStates.get('Numpad2') || this.prevKeyStates.get('Period'))) {
        input.shootArrow = true;
      }

      if (isDown('Numpad3') || isDown('Comma')) input.ability = true;
      if (wasPressed('Numpad3') || wasPressed('Comma')) input.abilityPressed = true;

      if (isDown('ShiftRight') || isDown('NumpadEnter')) input.dash = true;
      if (wasPressed('ShiftRight') || wasPressed('NumpadEnter')) input.dashPressed = true;

      if (wasPressed('NumpadDecimal')) input.tossPressed = true;
    }
  }
}
