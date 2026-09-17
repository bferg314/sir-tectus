export interface SavedLobbySlot {
  num: number;
  knightIndex: number;
  active: boolean;
  isCpu: boolean;
}

export interface SaveData {
  standardVictories: number;
  trueEndingsAchieved: number;
  goldenSkinsUnlocked: boolean;
  bestRunTimeSeconds: number;
  lifetimeCoins: number;
  lobbySlots?: SavedLobbySlot[];
}

const STORAGE_KEY = 'sir_tectus_save_data_v1';

export class SaveManager {
  private static data: SaveData = {
    standardVictories: 0,
    trueEndingsAchieved: 0,
    goldenSkinsUnlocked: false,
    bestRunTimeSeconds: 0,
    lifetimeCoins: 0,
    lobbySlots: [
      { num: 1, knightIndex: 0, active: true, isCpu: false },
      { num: 2, knightIndex: 1, active: true, isCpu: true },
      { num: 3, knightIndex: 2, active: false, isCpu: true },
      { num: 4, knightIndex: 3, active: false, isCpu: true }
    ]
  };

  public static load(): SaveData {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        this.data = { ...this.data, ...JSON.parse(raw) };
      }
    } catch (e) {
      console.warn('Could not load save data from localStorage:', e);
    }
    return this.data;
  }

  public static save(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
    } catch (e) {
      console.warn('Could not save to localStorage:', e);
    }
  }

  public static get isTrueEndingUnlocked(): boolean {
    return this.data.standardVictories > 0;
  }

  public static recordStandardVictory(runTimeSec: number, coins: number): void {
    this.data.standardVictories++;
    this.data.lifetimeCoins += coins;
    if (this.data.bestRunTimeSeconds === 0 || runTimeSec < this.data.bestRunTimeSeconds) {
      this.data.bestRunTimeSeconds = Math.floor(runTimeSec);
    }
    this.save();
  }

  public static recordTrueEnding(runTimeSec: number, coins: number): void {
    this.data.trueEndingsAchieved++;
    this.data.goldenSkinsUnlocked = true;
    this.data.lifetimeCoins += coins;
    if (this.data.bestRunTimeSeconds === 0 || runTimeSec < this.data.bestRunTimeSeconds) {
      this.data.bestRunTimeSeconds = Math.floor(runTimeSec);
    }
    this.save();
  }

  public static get hasGoldenSkins(): boolean {
    return this.data.goldenSkinsUnlocked;
  }

  public static getData(): SaveData {
    return this.data;
  }

  public static getLobbySlots(): SavedLobbySlot[] {
    if (!this.data.lobbySlots || this.data.lobbySlots.length < 4) {
      this.data.lobbySlots = [
        { num: 1, knightIndex: 0, active: true, isCpu: false },
        { num: 2, knightIndex: 1, active: true, isCpu: true },
        { num: 3, knightIndex: 2, active: false, isCpu: true },
        { num: 4, knightIndex: 3, active: false, isCpu: true }
      ];
    }
    return JSON.parse(JSON.stringify(this.data.lobbySlots));
  }

  public static saveLobbySlots(slots: SavedLobbySlot[]): void {
    this.data.lobbySlots = JSON.parse(JSON.stringify(slots));
    this.save();
  }

  public static resetData(): void {
    this.data = {
      standardVictories: 0,
      trueEndingsAchieved: 0,
      goldenSkinsUnlocked: false,
      bestRunTimeSeconds: 0,
      lifetimeCoins: 0
    };
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.warn('Could not reset localStorage:', e);
    }
  }
}
