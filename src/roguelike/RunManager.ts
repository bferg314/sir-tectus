import { BiomeConfig } from '../world/BiomeTypes';
import { BIOMES, getBiomesByTier } from '../world/BiomeRegistry';
import { SaveManager } from '../core/SaveManager';

export class RunManager {
  public currentStage: number = 1;
  public currentBiome: BiomeConfig;
  public coinsCollectedThisStage: number = 0;
  public totalPurseCoins: number = 0;
  public totalCoinsGatheredLifetimeRun: number = 0;
  public hasCoinOfSandwich: boolean = false;
  public hasHolyCondiment: boolean = false;
  public runStartTime: number = 0;
  public activeRelics: Set<string> = new Set();

  constructor() {
    // Stage 1 is always an Easy Biome
    const easyBiomes = getBiomesByTier('easy');
    this.currentBiome = easyBiomes[Math.floor(Math.random() * easyBiomes.length)];
  }

  public startNewRun(): void {
    this.currentStage = 1;
    this.coinsCollectedThisStage = 0;
    this.totalPurseCoins = 0;
    this.totalCoinsGatheredLifetimeRun = 0;
    this.hasCoinOfSandwich = false;
    this.hasHolyCondiment = false;
    this.activeRelics.clear();
    this.runStartTime = performance.now();

    const easyBiomes = getBiomesByTier('easy');
    this.currentBiome = easyBiomes[Math.floor(Math.random() * easyBiomes.length)];
  }

  public collectCoin(): void {
    this.coinsCollectedThisStage++;
    this.totalPurseCoins++;
    this.totalCoinsGatheredLifetimeRun++;
  }

  public get isGateUnlocked(): boolean {
    return this.coinsCollectedThisStage >= 12;
  }

  public getBranchingPortalOptions(): BiomeConfig[] {
    if (this.currentStage === 1) {
      // Branch to Easy vs Medium
      const easy = getBiomesByTier('easy').filter(b => b.id !== this.currentBiome.id);
      const med = getBiomesByTier('medium');
      return [
        easy[Math.floor(Math.random() * easy.length)],
        med[Math.floor(Math.random() * med.length)]
      ];
    } else if (this.currentStage === 2) {
      // Branch to Medium vs Medium/Hard
      const med = getBiomesByTier('medium').filter(b => b.id !== this.currentBiome.id);
      const hard = getBiomesByTier('hard');
      return [
        med[Math.floor(Math.random() * med.length)],
        hard[Math.floor(Math.random() * hard.length)]
      ];
    } else if (this.currentStage === 3) {
      // Branch to Hard vs Hard
      const hard = getBiomesByTier('hard').filter(b => b.id !== this.currentBiome.id);
      return [
        hard[0] || BIOMES['celestial-spires'],
        hard[1] || BIOMES['astral-void']
      ];
    } else {
      // Stage 4 always leads directly to the singular Golden Vault (Map 5)
      return [
        BIOMES['golden-sandwich-sanctuary']
      ];
    }
  }

  public advanceToBiome(chosenBiome: BiomeConfig): void {
    this.currentStage++;
    this.currentBiome = chosenBiome;
    this.coinsCollectedThisStage = 0;
  }

  public checkTrueEndingCondition(allKnightsAlive: boolean): boolean {
    // Rule: Must have achieved Standard Victory once before to unlock the True Ending pathway
    if (!SaveManager.isTrueEndingUnlocked) {
      return false;
    }

    // Condition A: All 4 players survived to the end with the sandwich
    // Condition B: Or they found the Holy Golden Condiment
    return allKnightsAlive || this.hasHolyCondiment;
  }

  public getElapsedTimeSeconds(): number {
    return (performance.now() - this.runStartTime) / 1000;
  }
}
