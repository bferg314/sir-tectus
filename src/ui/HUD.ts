import { RunManager } from '../roguelike/RunManager';
import { Player } from '../entities/Player';

export class HUD {
  private hudLayer: HTMLElement | null = null;
  private stageNumEl: HTMLElement | null = null;
  private biomeNameEl: HTMLElement | null = null;
  private diffTagEl: HTMLElement | null = null;
  private coinTallyEl: HTMLElement | null = null;
  private purseAmountEl: HTMLElement | null = null;
  private sandwichCoinEl: HTMLElement | null = null;
  private sandwichBearerEl: HTMLElement | null = null;
  private toastEl: HTMLElement | null = null;
  private toastTextEl: HTMLElement | null = null;
  private toastTimeout: number = 0;

  constructor() {
    this.hudLayer = document.getElementById('hud-layer');
    this.stageNumEl = document.getElementById('hud-stage-num');
    this.biomeNameEl = document.getElementById('hud-biome-name');
    this.diffTagEl = document.getElementById('hud-diff-tag');
    this.coinTallyEl = document.getElementById('hud-coin-tally');
    this.purseAmountEl = document.getElementById('hud-purse-amount');
    this.sandwichCoinEl = document.getElementById('hud-sandwich-coin');
    this.sandwichBearerEl = document.getElementById('hud-sandwich-bearer');
    this.toastEl = document.getElementById('hud-toast');
    this.toastTextEl = document.getElementById('hud-toast-text');
  }

  public show(): void {
    if (this.hudLayer) this.hudLayer.classList.remove('hidden');
  }

  public hide(): void {
    if (this.hudLayer) this.hudLayer.classList.add('hidden');
  }

  public update(runManager: RunManager, players: Player[]): void {
    // 1. Stage & Biome
    if (this.stageNumEl) this.stageNumEl.textContent = `MAP ${runManager.currentStage} / 5`;
    if (this.biomeNameEl) this.biomeNameEl.textContent = runManager.currentBiome.name.toUpperCase();

    if (this.diffTagEl) {
      const tier = runManager.currentBiome.tier;
      this.diffTagEl.textContent = tier.toUpperCase();
      this.diffTagEl.className = `difficulty-tag ${tier}`;
    }

    // 2. Coin Tally
    if (this.coinTallyEl) {
      if (runManager.currentStage === 5) {
        this.coinTallyEl.textContent = 'EXTRACT!';
      } else {
        this.coinTallyEl.textContent = `${runManager.coinsCollectedThisStage} / 12`;
      }
    }

    if (this.purseAmountEl) {
      this.purseAmountEl.textContent = `${runManager.totalPurseCoins}`;
    }

    // 3. Map 4 Sandwich Coin badge
    if (this.sandwichCoinEl) {
      if (runManager.hasCoinOfSandwich) {
        this.sandwichCoinEl.classList.remove('hidden');
      } else {
        this.sandwichCoinEl.classList.add('hidden');
      }
    }

    // 4. Map 5 Sandwich Active
    if (this.sandwichBearerEl) {
      const hasCarrier = players.some(p => p.isCarryingSandwich);
      if (hasCarrier) {
        this.sandwichBearerEl.classList.remove('hidden');
      } else {
        this.sandwichBearerEl.classList.add('hidden');
      }
    }

    // 5. Update Player Cards
    for (let i = 0; i < 4; i++) {
      const card = document.getElementById(`p${i + 1}-hud-card`);
      if (!card) continue;

      const p = players[i];
      if (!p) {
        card.classList.add('hidden');
        continue;
      }
      card.classList.remove('hidden');
      card.style.borderColor = p.color;

      // Title & Status
      const titleEl = document.getElementById(`p${i + 1}-knight-title`);
      if (titleEl) {
        titleEl.textContent = p.name.toUpperCase();
        titleEl.style.color = p.color;
      }

      const statusEl = document.getElementById(`p${i + 1}-status`);
      if (statusEl) {
        if (p.isInBubble) {
          statusEl.textContent = 'BUBBLE';
          statusEl.className = 'status-badge bubble';
        } else {
          statusEl.textContent = 'ALIVE';
          statusEl.className = 'status-badge alive';
        }
      }

      // Hearts
      const heartsEl = document.getElementById(`p${i + 1}-hearts`);
      if (heartsEl) {
        let heartsStr = '';
        for (let h = 0; h < p.maxHealth; h++) {
          heartsStr += h < p.health ? '❤️' : '🖤';
        }
        heartsEl.textContent = heartsStr;
      }

      // Ammo
      const ammoEl = document.getElementById(`p${i + 1}-ammo`);
      if (ammoEl) {
        ammoEl.textContent = `🏹 ${p.quiverAmmo}/${p.maxQuiverAmmo}`;
      }

      // Ability / Sandwich Status
      const abilityEl = document.getElementById(`p${i + 1}-ability`);
      if (abilityEl) {
        if (p.isCarryingSandwich) {
          abilityEl.textContent = '🥪 BEARING SANDWICH';
        } else if (p.name.includes('Tectus')) {
          abilityEl.textContent = '🛡️ SHIELD READY';
        } else if (p.name.includes('Bareti')) {
          abilityEl.textContent = '🔥 FIRE READY';
        } else if (p.name.includes('Fluctus')) {
          abilityEl.textContent = '🌊 SURF READY';
        } else {
          abilityEl.textContent = '🗡️ SWORD READY';
        }
      }
    }
  }

  public showToast(text: string, durationMs: number = 3000): void {
    if (!this.toastEl || !this.toastTextEl) return;
    this.toastTextEl.textContent = text;
    this.toastEl.classList.remove('hidden');

    if (this.toastTimeout) clearTimeout(this.toastTimeout);
    this.toastTimeout = window.setTimeout(() => {
      if (this.toastEl) this.toastEl.classList.add('hidden');
    }, durationMs);
  }
}
