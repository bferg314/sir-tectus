import { Game } from '../core/Game';
import { BiomeConfig } from '../world/BiomeTypes';
import { RELIC_POOL, Relic } from '../roguelike/RelicRegistry';
import { SaveManager } from '../core/SaveManager';

export class UIManager {
  private overlay: HTMLElement | null = null;
  private game: Game;

  constructor(game: Game) {
    this.game = game;
    this.overlay = document.getElementById('menu-overlay');
  }

  public showTitleScreen(): void {
    if (!this.overlay) return;
    const isTrueEndingReady = SaveManager.isTrueEndingUnlocked;

    this.overlay.innerHTML = `
      <div class="menu-screen">
        <h1 class="game-title">Sir Tectus</h1>
        <h2 class="game-subtitle">& The Golden Sandwich</h2>

        ${isTrueEndingReady ? `
          <div style="margin-bottom: 24px; text-align: center;">
            <span style="font-size: 13px; padding: 6px 16px; border-radius: 20px; border: 1px solid #06d6a0; background: rgba(6, 214, 160, 0.15); color: #06d6a0; box-shadow: 0 0 14px rgba(6, 214, 160, 0.25);">
              ⚡ SECRET TRUE ENDING OPENED (Lord Crustifer stirs in the deep)
            </span>
          </div>
        ` : ''}

        <div class="menu-buttons">
          <button id="btn-start-lobby" class="btn-primary">⚔️ Embark on Quest</button>
          <button id="btn-open-options" class="btn-secondary">⚙️ Options & Controls</button>
          <button id="btn-toggle-fs" class="btn-secondary">🖥️ Toggle Fullscreen</button>
        </div>

        <div class="controls-panel">
          <div class="control-item"><strong>P1 Keyboard:</strong> WASD + Space, F (Sword), G (Bow), E (Ability), Shift (Dash)</div>
          <div class="control-item"><strong>Gamepads:</strong> 1-4 Controllers (A: Jump, X: Attack, B: Bow, Y: Ability)</div>
        </div>
      </div>
    `;

    document.getElementById('btn-start-lobby')?.addEventListener('click', () => {
      this.game.sound.init();
      this.showLobbyScreen();
    });

    document.getElementById('btn-open-options')?.addEventListener('click', () => {
      this.showOptionsMenu(false);
    });

    document.getElementById('btn-toggle-fs')?.addEventListener('click', () => {
      this.game.input.toggleFullscreen();
    });

    this.game.gpNav.enabled = true;
    this.game.gpNav.setOnBack(null);
    setTimeout(() => this.game.gpNav.focusFirst(), 50);
  }

  public showOptionsMenu(fromPause: boolean = false): void {
    if (!this.overlay) return;

    const isMuted = this.game.sound.muted;
    const isFullscreen = !!document.fullscreenElement;

    this.overlay.innerHTML = `
      <div class="menu-screen">
        <div class="options-modal-card">
          <h2 class="game-title" style="font-size: 32px; margin-bottom: 6px;">Options & Controls</h2>
          <div class="game-subtitle" style="margin-bottom: 18px;">Configure Your Experience</div>

          <div class="options-grid">
            <!-- Left: Settings -->
            <div class="options-section">
              <div class="options-section-title">GAME SETTINGS</div>

              <div class="options-row">
                <span>Display Mode</span>
                <button id="btn-opt-fullscreen" class="btn-secondary" style="padding: 6px 14px; font-size: 13px;">
                  ${isFullscreen ? '🖥️ Fullscreen [ON]' : '🖥️ Windowed [OFF]'}
                </button>
              </div>

              <div class="options-row">
                <span>Master Audio</span>
                <button id="btn-opt-sound" class="btn-secondary" style="padding: 6px 14px; font-size: 13px;">
                  ${isMuted ? '🔇 Audio [MUTED]' : '🔊 Audio [ACTIVE]'}
                </button>
              </div>

              <div class="options-row" style="margin-top: 20px;">
                <span style="color: var(--danger);">Reset Data</span>
                <button id="btn-opt-reset" class="btn-secondary" style="padding: 6px 14px; font-size: 12px; border-color: var(--danger); color: var(--danger);">
                  🗑️ Clear Save
                </button>
              </div>
            </div>

            <!-- Right: Controls Guide -->
            <div class="options-section">
              <div class="options-section-title">CONTROLLER & KEYBOARD</div>
              <table class="controls-guide-table">
                <tr>
                  <td>Movement / Walk / Crouch</td>
                  <td class="key-badge">Left Stick / WASD</td>
                </tr>
                <tr>
                  <td>Jump / Double Jump</td>
                  <td class="key-badge">A / Space</td>
                </tr>
                <tr>
                  <td>Sword Slash (Air + Down = Pogo!)</td>
                  <td class="key-badge">X / F or J</td>
                </tr>
                <tr>
                  <td>Draw Bow (Release to Fire)</td>
                  <td class="key-badge">B / Hold G or K</td>
                </tr>
                <tr>
                  <td>Knight Signature Ability</td>
                  <td class="key-badge">Y / E or R</td>
                </tr>
                <tr>
                  <td>Air Dash / Toss Sandwich</td>
                  <td class="key-badge">Bumpers / Shift / T</td>
                </tr>
                <tr>
                  <td>Pause Quest Menu</td>
                  <td class="key-badge">Start / Esc or P</td>
                </tr>
              </table>
            </div>
          </div>

          <button id="btn-opt-back" class="btn-primary" style="width: 220px; margin-top: 10px;">
            ⬅️ Back
          </button>
        </div>
      </div>
    `;

    document.getElementById('btn-opt-fullscreen')?.addEventListener('click', () => {
      this.game.input.toggleFullscreen();
      setTimeout(() => this.showOptionsMenu(fromPause), 150);
    });

    document.getElementById('btn-opt-sound')?.addEventListener('click', () => {
      this.game.sound.toggleMute();
      this.showOptionsMenu(fromPause);
    });

    document.getElementById('btn-opt-reset')?.addEventListener('click', () => {
      this.showConfirmModal({
        icon: '⚠️',
        title: 'Reset All Records?',
        message: 'Are you sure you want to reset your game records, best times, and True Ending unlocks?<br><span style="color: #ef476f; font-size: 13px; margin-top: 6px; display: inline-block;">This cannot be undone!</span>',
        confirmText: '⚠️ Reset Everything',
        cancelText: '🛡️ Keep Records',
        isDanger: true,
        onConfirm: () => {
          SaveManager.resetData();
          this.showOptionsMenu(fromPause);
        },
        onCancel: () => this.showOptionsMenu(fromPause)
      });
    });

    const goBack = () => {
      if (fromPause) {
        this.game.pauseGame();
      } else {
        this.showTitleScreen();
      }
    };

    document.getElementById('btn-opt-back')?.addEventListener('click', goBack);

    this.game.gpNav.enabled = true;
    this.game.gpNav.setOnBack(goBack);
    setTimeout(() => this.game.gpNav.focusFirst(), 50);
  }

  public showConfirmModal(options: {
    icon?: string;
    title: string;
    message: string;
    confirmText: string;
    cancelText: string;
    isDanger?: boolean;
    onConfirm: () => void;
    onCancel: () => void;
  }): void {
    if (!this.overlay) return;

    this.overlay.innerHTML = `
      <div class="menu-screen">
        <div class="confirm-modal-card">
          <div class="confirm-modal-icon">${options.icon || '⚠️'}</div>
          <h2 class="game-title" style="font-size: 28px; margin-bottom: 8px; color: ${options.isDanger ? '#f87171' : '#ffd166'};">${options.title}</h2>
          <div class="confirm-modal-text">
            ${options.message}
          </div>
          <div class="confirm-modal-buttons">
            <button id="btn-modal-cancel" class="btn-primary">${options.cancelText}</button>
            <button id="btn-modal-confirm" class="btn-secondary" style="${options.isDanger ? 'border-color: rgba(239, 71, 111, 0.6); color: #f87171;' : ''}">
              ${options.confirmText}
            </button>
          </div>
        </div>
      </div>
    `;

    document.getElementById('btn-modal-cancel')?.addEventListener('click', () => {
      options.onCancel();
    });

    document.getElementById('btn-modal-confirm')?.addEventListener('click', () => {
      options.onConfirm();
    });

    this.game.gpNav.enabled = true;
    this.game.gpNav.setOnBack(options.onCancel);
    // Focus safe cancel option by default
    setTimeout(() => this.game.gpNav.focusFirst(), 50);
  }

  public showPauseMenu(onResume: () => void, onOptions: () => void, onQuit: () => void): void {
    if (!this.overlay) return;

    const currentStage = this.game.runManager.currentStage;
    const biomeName = this.game.runManager.currentBiome ? this.game.runManager.currentBiome.name : 'Unknown Realm';
    const coins = this.game.runManager.totalPurseCoins;
    const isMuted = this.game.sound.muted;
    const isFullscreen = !!document.fullscreenElement;

    this.overlay.innerHTML = `
      <div class="menu-screen">
        <div class="pause-overlay-card">
          <h2 class="game-title" style="font-size: 34px; margin-bottom: 4px;">⏸️ Quest Paused</h2>
          <div class="game-subtitle" style="margin-bottom: 20px; font-size: 14px;">
            Map ${currentStage} / 5 &bull; ${biomeName} &bull; 💰 ${coins} Coins
          </div>

          <div class="menu-buttons" style="width: 100%; gap: 12px;">
            <button id="btn-pause-resume" class="btn-primary">⚔️ Resume Quest</button>
            <button id="btn-pause-fs" class="btn-secondary">
              ${isFullscreen ? '🖥️ Fullscreen [ON]' : '🖥️ Windowed [OFF]'}
            </button>
            <button id="btn-pause-sound" class="btn-secondary">
              ${isMuted ? '🔇 Audio [MUTED]' : '🔊 Audio [ACTIVE]'}
            </button>
            <button id="btn-pause-options" class="btn-secondary">⚙️ Options & Controls</button>
            <button id="btn-pause-quit" class="btn-secondary" style="border-color: rgba(239, 71, 111, 0.4); color: #f87171;">
              🚪 Abandon Run
            </button>
          </div>
        </div>
      </div>
    `;

    document.getElementById('btn-pause-resume')?.addEventListener('click', onResume);

    document.getElementById('btn-pause-fs')?.addEventListener('click', () => {
      this.game.input.toggleFullscreen();
      setTimeout(() => this.showPauseMenu(onResume, onOptions, onQuit), 150);
    });

    document.getElementById('btn-pause-sound')?.addEventListener('click', () => {
      this.game.sound.toggleMute();
      this.showPauseMenu(onResume, onOptions, onQuit);
    });

    document.getElementById('btn-pause-options')?.addEventListener('click', onOptions);

    document.getElementById('btn-pause-quit')?.addEventListener('click', () => {
      this.showConfirmModal({
        icon: '🚪',
        title: 'Abandon Quest?',
        message: 'Are you sure you want to abandon this quest and return to the title screen?<br><span style="color: #ef476f; font-size: 13px; margin-top: 6px; display: inline-block;">All progress and collected items for this run will be lost!</span>',
        confirmText: '🚪 Yes, Abandon',
        cancelText: '⚔️ Keep Fighting',
        isDanger: true,
        onConfirm: () => onQuit(),
        onCancel: () => this.showPauseMenu(onResume, onOptions, onQuit)
      });
    });

    this.game.gpNav.enabled = true;
    this.game.gpNav.setOnBack(onResume);
    setTimeout(() => this.game.gpNav.focusFirst(), 50);
  }

  public showLobbyScreen(): void {
    if (!this.overlay) return;

    const KNIGHT_ROSTER = [
      {
        id: 'tectus',
        name: 'Sir Tectus',
        icon: '🛡️',
        color: '#e63946',
        title: 'The Shield of Antiquity',
        ability: 'Double Jump & Shield Stance (Reflect & Boomerang)',
        stats: 'DEF ★★★★★ • ATK ★★★☆☆ • MOB ★★★☆☆'
      },
      {
        id: 'bareti',
        name: 'Sir Bareti',
        icon: '🔥',
        color: '#ff9e00',
        title: 'The Crimson Pyromancer',
        ability: 'Triple Jump & Pyromancy Fireballs (Burn AoE)',
        stats: 'DEF ★★★☆☆ • ATK ★★★★★ • MOB ★★★★☆'
      },
      {
        id: 'fluctus',
        name: 'Sir Fluctus',
        icon: '🌊',
        color: '#2ec4b6',
        title: 'The Wave Vanguard',
        ability: 'Hydro Air Dash & Water Slide Wave Surfing',
        stats: 'DEF ★★★★☆ • ATK ★★★★☆ • MOB ★★★★★'
      },
      {
        id: 'morgani',
        name: 'Sir Morgani',
        icon: '🗡️',
        color: '#a855f7',
        title: 'The Shadow Bladesmith',
        ability: 'Acrobatic Air Vault & Piercing Throwing Swords',
        stats: 'DEF ★★★☆☆ • ATK ★★★★★ • MOB ★★★★★'
      }
    ];

    const slots = SaveManager.getLobbySlots();

    const renderSlotsHtml = () => slots.map(s => {
      const k = KNIGHT_ROSTER[s.knightIndex];
      return `
        <div class="lobby-slot ${s.active ? 'active' : 'inactive'}" style="border-color: ${s.active ? k.color : '#334155'}; box-shadow: ${s.active ? `0 0 20px ${k.color}35` : 'none'};">
          <div class="player-num" style="background: ${s.active ? k.color : '#334155'};">
            P${s.num} ${s.num === 1 ? '(YOU)' : ''}
          </div>
          
          <div class="knight-carousel-controls">
            <button class="carousel-btn prev-knight" data-slot="${s.num}" title="Previous Knight" ${!s.active ? 'disabled' : ''}>◀</button>
            <div class="lobby-knight-preview" style="border-color: ${k.color};">
              <span class="knight-icon-display" style="filter: drop-shadow(0 0 10px ${k.color});">${k.icon}</span>
            </div>
            <button class="carousel-btn next-knight" data-slot="${s.num}" title="Next Knight" ${!s.active ? 'disabled' : ''}>▶</button>
          </div>

          <div class="lobby-slot-title" style="color: ${s.active ? k.color : '#64748b'};">${k.name}</div>
          <div class="lobby-knight-title" style="color: ${s.active ? '#cbd5e1' : '#475569'};">${k.title}</div>
          <div class="lobby-slot-ability" style="color: ${s.active ? '#94a3b8' : '#475569'};">${k.ability}</div>
          <div class="lobby-knight-stats" style="color: ${s.active ? k.color : '#475569'};">${k.stats}</div>

          <button class="slot-toggle-btn" data-slot="${s.num}" style="${s.active ? `border-color: ${k.color};` : ''}">
            ${!s.active ? '❌ CLOSED (CLICK TO JOIN)' : (s.isCpu ? '🤖 COMPANION BOT' : '🎮 HUMAN PLAYER')}
          </button>
        </div>
      `;
    }).join('');

    this.overlay.innerHTML = `
      <div class="menu-screen">
        <h2 class="game-title" style="font-size: 34px;">Choose Your Knights</h2>
        <div class="game-subtitle">Select any Sir for Player 1 & Companions (1 to 4 Players)</div>

        <div class="lobby-grid">
          ${renderSlotsHtml()}
        </div>

        <div class="menu-buttons" style="flex-direction: row; justify-content: center; gap: 16px; margin-top: 10px;">
          <button id="btn-start-game" class="btn-primary">🚀 Embark on Quest</button>
          <button id="btn-back-title" class="btn-secondary">Back to Title</button>
        </div>
      </div>
    `;

    const attachSlotListeners = () => {
      // Knight Carousel Previous
      document.querySelectorAll<HTMLButtonElement>('.prev-knight').forEach(btn => {
        btn.onclick = (e) => {
          e.stopPropagation();
          const slotNum = parseInt(btn.getAttribute('data-slot') || '1');
          const s = slots[slotNum - 1];
          if (!s.active) return;
          s.knightIndex = (s.knightIndex - 1 + KNIGHT_ROSTER.length) % KNIGHT_ROSTER.length;
          updateGrid(`.prev-knight[data-slot="${slotNum}"]`);
        };
      });

      // Knight Carousel Next
      document.querySelectorAll<HTMLButtonElement>('.next-knight').forEach(btn => {
        btn.onclick = (e) => {
          e.stopPropagation();
          const slotNum = parseInt(btn.getAttribute('data-slot') || '1');
          const s = slots[slotNum - 1];
          if (!s.active) return;
          s.knightIndex = (s.knightIndex + 1) % KNIGHT_ROSTER.length;
          updateGrid(`.next-knight[data-slot="${slotNum}"]`);
        };
      });

      // Role Mode Switcher
      document.querySelectorAll<HTMLButtonElement>('.slot-toggle-btn').forEach(btn => {
        btn.onclick = () => {
          const slotNum = parseInt(btn.getAttribute('data-slot') || '1');
          const s = slots[slotNum - 1];
          if (!s.active) {
            s.active = true;
            s.isCpu = false;
          } else if (!s.isCpu && slotNum > 1) {
            s.isCpu = true;
          } else {
            if (slotNum === 1) {
              s.isCpu = !s.isCpu;
            } else {
              s.active = false;
            }
          }
          updateGrid(`.slot-toggle-btn[data-slot="${slotNum}"]`);
        };
      });
    };

    const updateGrid = (focusSelector?: string) => {
      const grid = document.querySelector('.lobby-grid');
      if (grid) grid.innerHTML = renderSlotsHtml();
      SaveManager.saveLobbySlots(slots);
      attachSlotListeners();
      if (focusSelector) {
        const el = document.querySelector<HTMLElement>(focusSelector);
        if (el) {
          el.focus();
          this.game.gpNav.focusElement(el);
        }
      }
    };

    attachSlotListeners();

    document.getElementById('btn-start-game')?.addEventListener('click', () => {
      SaveManager.saveLobbySlots(slots);
      this.clear();
      const payload = slots.map(s => {
        const k = KNIGHT_ROSTER[s.knightIndex];
        return {
          num: s.num,
          name: k.name,
          color: k.color,
          active: s.active,
          isCpu: s.isCpu
        };
      });
      this.game.startRun(payload);
    });

    const backToTitle = () => this.showTitleScreen();
    document.getElementById('btn-back-title')?.addEventListener('click', backToTitle);

    this.game.gpNav.enabled = true;
    this.game.gpNav.setOnBack(backToTitle);
    setTimeout(() => this.game.gpNav.focusFirst(), 50);
  }

  public showBranchingPortals(portalOptions: BiomeConfig[], onSelect: (biome: BiomeConfig) => void): void {
    if (!this.overlay) return;

    // Deduplicate options by biome id
    const uniqueOptions = portalOptions.filter(
      (b, idx, arr) => arr.findIndex(x => x.id === b.id) === idx
    );

    const isSinglePortal = uniqueOptions.length === 1;
    const isVault = uniqueOptions[0]?.tier === 'vault';

    const subtitleText = isVault
      ? 'The Final Gateway to the Legendary Sanctuary Has Opened'
      : (isSinglePortal
        ? 'Your Destiny Beckons Beyond The Portal'
        : 'Choose Your Next Path Through The Kingdom');

    const portalsHtml = uniqueOptions.map((opt, i) => `
      <div class="portal-card ${opt.tier === 'vault' ? 'vault-card' : ''}" id="portal-card-${i}" tabindex="0" role="button" aria-label="Enter ${opt.name}">
        <div class="portal-icon">${opt.tier === 'vault' ? '🥪' : '🌀'}</div>
        <div class="portal-name">${opt.name}</div>
        <div class="difficulty-tag ${opt.tier}">${opt.tier.toUpperCase()}</div>
        <p class="portal-desc">${opt.description}</p>
      </div>
    `).join('');

    this.overlay.innerHTML = `
      <div class="menu-screen">
        <h2 class="game-title" style="font-size: 34px;">Realm Conquered!</h2>
        <div class="game-subtitle">${subtitleText}</div>

        <div class="portals-container">
          ${portalsHtml}
        </div>
      </div>
    `;

    uniqueOptions.forEach((opt, i) => {
      const card = document.getElementById(`portal-card-${i}`);
      card?.addEventListener('click', () => onSelect(opt));
      card?.addEventListener('keydown', (e: KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(opt);
        }
      });
    });

    this.game.gpNav.enabled = true;
    this.game.gpNav.setOnBack(null);
    setTimeout(() => this.game.gpNav.focusFirst(), 50);
  }

  public showCampfireShop(
    coins: number,
    onBuyRelic: (relic: Relic) => boolean,
    onContinue: () => void
  ): void {
    if (!this.overlay) return;

    const offered = [...RELIC_POOL].sort(() => Math.random() - 0.5).slice(0, 3);

    const renderRelicsHtml = () => offered.map(r => `
      <div class="relic-card" data-relic="${r.id}" tabindex="0">
        <div class="relic-selection-badge">✦ SELECT RELIC ✦</div>
        <div class="relic-icon">${r.icon}</div>
        <div class="relic-title">${r.name}</div>
        <div class="relic-cost">${r.cost} COINS</div>
        <div class="relic-desc">${r.description}</div>
      </div>
    `).join('');

    this.overlay.innerHTML = `
      <div class="menu-screen">
        <h2 class="game-title" style="font-size: 32px;">The Campfire Sanctuary</h2>
        <div class="game-subtitle">Team Purse: <span id="campfire-purse">${coins}</span> Coins</div>

        <div class="relics-grid">
          ${renderRelicsHtml()}
        </div>

        <button id="btn-leave-campfire" class="btn-primary" style="margin-top: 14px;">Rest & Advance</button>
      </div>
    `;

    document.querySelectorAll<HTMLElement>('.relic-card').forEach(card => {
      card.onclick = () => {
        const relicId = card.getAttribute('data-relic');
        const relic = offered.find(r => r.id === relicId);
        if (relic) {
          const bought = onBuyRelic(relic);
          if (bought) {
            card.style.opacity = '0.35';
            card.style.pointerEvents = 'none';
            const purseEl = document.getElementById('campfire-purse');
            if (purseEl) purseEl.textContent = `${this.game.runManager.totalPurseCoins}`;
          }
        }
      };
    });

    document.getElementById('btn-leave-campfire')?.addEventListener('click', () => {
      this.clear();
      onContinue();
    });

    this.game.gpNav.enabled = true;
    this.game.gpNav.setOnBack(onContinue);
    setTimeout(() => this.game.gpNav.focusFirst(), 50);
  }

  public showStandardVictory(runTimeSec: number, coins: number): void {
    if (!this.overlay) return;

    this.overlay.innerHTML = `
      <div class="menu-screen">
        <h1 class="game-title" style="color: #ffd166;">VICTORY!</h1>
        <h2 class="game-subtitle">A Hearty Meal Has Been Claimed!</h2>

        <div style="font-size: 58px; margin: 16px 0;">🥪✨</div>

        <p style="max-width: 580px; text-align: center; color: #e2e8f0; font-size: 15px; line-height: 1.6; margin-bottom: 24px;">
          The knights successfully extracted the legendary Golden Sandwich from the depths of the sanctuary!
          <br><br>
          <strong style="color: #06d6a0;">⚡ ANCIENT SEAL BROKEN:</strong><br>
          An ancient hunger stirs in the deep... The path to the <strong>True Ending</strong> is now unsealed for all future runs!
        </p>

        <div style="font-family: var(--font-heading); color: #ffd166; margin-bottom: 24px;">
          Time: ${Math.floor(runTimeSec)}s &nbsp;|&nbsp; Lifetime Coins Gathered: ${coins}
        </div>

        <button id="btn-victory-replay" class="btn-primary">Play Again</button>
      </div>
    `;

    document.getElementById('btn-victory-replay')?.addEventListener('click', () => {
      this.showTitleScreen();
    });

    this.game.gpNav.enabled = true;
    this.game.gpNav.setOnBack(() => this.showTitleScreen());
    setTimeout(() => this.game.gpNav.focusFirst(), 50);
  }

  public showTrueEnding(runTimeSec: number, coins: number): void {
    if (!this.overlay) return;

    this.overlay.innerHTML = `
      <div class="menu-screen">
        <h1 class="game-title" style="color: #ffbe0b;">TRUE ENDING</h1>
        <h2 class="game-subtitle">The Eternal Feast: Knights of the Infinite Crust</h2>

        <div style="font-size: 64px; margin: 16px 0;">👑🥪👑</div>

        <p style="max-width: 600px; text-align: center; color: #f8fafc; font-size: 15px; line-height: 1.6; margin-bottom: 24px;">
          Lord Crustifer, Sovereign of the Infinite Banquet, has fallen before the might of the four knights!
          The Golden Sandwich bestows eternal glory and the golden armor skins upon all four heroes!
        </p>

        <div style="font-family: var(--font-heading); color: #06d6a0; font-size: 18px; margin-bottom: 24px;">
          🌟 GOLDEN SKINS UNLOCKED FOR ALL 4 KNIGHTS!
        </div>

        <button id="btn-true-ending-title" class="btn-primary">Return to Title</button>
      </div>
    `;

    document.getElementById('btn-true-ending-title')?.addEventListener('click', () => {
      this.showTitleScreen();
    });

    this.game.gpNav.enabled = true;
    this.game.gpNav.setOnBack(() => this.showTitleScreen());
    setTimeout(() => this.game.gpNav.focusFirst(), 50);
  }

  public showGameOver(stage: number): void {
    if (!this.overlay) return;

    this.overlay.innerHTML = `
      <div class="menu-screen">
        <h1 class="game-title" style="color: #ef476f;">PARTY DEFEATED</h1>
        <h2 class="game-subtitle">All Knights Trapped in Soul Bubbles</h2>

        <p style="color: #94a3b8; font-size: 14px; margin-bottom: 24px;">
          The expedition perished on Map ${stage} of 5.
        </p>

        <div class="menu-buttons">
          <button id="btn-gameover-retry" class="btn-primary">Try Again</button>
          <button id="btn-gameover-title" class="btn-secondary">Title Screen</button>
        </div>
      </div>
    `;

    document.getElementById('btn-gameover-retry')?.addEventListener('click', () => {
      this.showLobbyScreen();
    });
    document.getElementById('btn-gameover-title')?.addEventListener('click', () => {
      this.showTitleScreen();
    });

    this.game.gpNav.enabled = true;
    this.game.gpNav.setOnBack(() => this.showTitleScreen());
    setTimeout(() => this.game.gpNav.focusFirst(), 50);
  }

  public clear(): void {
    if (this.overlay) this.overlay.innerHTML = '';
    this.game.gpNav.enabled = false;
    document.querySelectorAll('.controller-focused').forEach(e => e.classList.remove('controller-focused'));
    (document.activeElement as HTMLElement)?.blur();
  }
}
