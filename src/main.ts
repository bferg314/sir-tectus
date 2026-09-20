import './style.css';
import { Game } from './core/Game';
import { BIOMES } from './world/BiomeRegistry';

window.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
  if (!canvas) {
    console.error('Canvas element not found!');
    return;
  }

  // Handle high-DPI crisp pixel rendering while preserving 1280x720 logical coordinates
  const setupCanvas = () => {
    canvas.width = 1280;
    canvas.height = 720;
  };
  setupCanvas();
  window.addEventListener('resize', setupCanvas);

  // Initialize master Game orchestrator
  const game = new Game(canvas);
  (window as any).BIOMES = BIOMES;
  if (new URLSearchParams(window.location.search).has('vault')) {
    game.ui.showBranchingPortals(
      [BIOMES['golden-sandwich-sanctuary']],
      (b) => { console.log('Selected realm:', b.name); }
    );
  } else if (new URLSearchParams(window.location.search).has('portals')) {
    const leftBiome = BIOMES['frostpeak-summit'] || Object.values(BIOMES)[0];
    const rightBiome = BIOMES['infernal-core'] || Object.values(BIOMES)[1];
    game.ui.showBranchingPortals(
      [leftBiome, rightBiome],
      (b) => { console.log('Selected realm:', b.name); }
    );
  }
  console.log('⚔️ Sir Tectus and the Golden Sandwich initialized successfully!');
});
