const STORAGE_KEY = 'wave_runner_save';

export interface SaveData {
  highScore: number;
  totalDistance: number;
  coins: number;
  unlockedSkins: string[];
  selectedSkin: string;
  selectedTrail: string;
  unlockedTrails: string[];
  levelStars: Record<string, number>;
  settings: {
    musicVolume: number;
    sfxVolume: number;
    particles: boolean;
    screenShake: boolean;
  };
  // Progression & meta
  tutorialSeen: boolean;
  totalDeaths: number;
  totalCoinsEarned: number;
  achievements: string[]; // unlocked achievement IDs
  dailyDate: string; // "YYYY-MM-DD"
  dailyBest: number; // best distance on today's daily
  gamesPlayed: number;
  // Progression
  lastLoginDate: string; // "YYYY-MM-DD"
  loginStreak: number;
  topRuns: { distance: number; date: string; mode: string }[];
}

const defaultSave: SaveData = {
  highScore: 0,
  totalDistance: 0,
  coins: 0,
  unlockedSkins: ['default'],
  selectedSkin: 'default',
  selectedTrail: 'default',
  unlockedTrails: ['default'],
  levelStars: {},
  settings: {
    musicVolume: 0.5,
    sfxVolume: 0.7,
    particles: true,
    screenShake: true,
  },
  tutorialSeen: false,
  totalDeaths: 0,
  totalCoinsEarned: 0,
  achievements: [],
  dailyDate: '',
  dailyBest: 0,
  gamesPlayed: 0,
  lastLoginDate: '',
  loginStreak: 0,
  topRuns: [],
};

let cachedData: SaveData | null = null;

export function loadSave(): SaveData {
  if (cachedData) return cachedData;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      const merged = { ...defaultSave, ...parsed, settings: { ...defaultSave.settings, ...parsed.settings } };
      cachedData = merged;
      return merged;
    }
  } catch {
    // ignore
  }
  cachedData = { ...defaultSave };
  return cachedData;
}

export function saveToDisk(): void {
  if (!cachedData) return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cachedData));
  } catch {
    // storage full or unavailable
  }
}

export function updateSave(partial: Partial<SaveData>): void {
  const data = loadSave();
  if (partial.settings) {
    partial.settings = { ...data.settings, ...partial.settings };
  }
  Object.assign(data, partial);
  cachedData = data;
  saveToDisk();
}

export function updateSettings(partial: Partial<SaveData['settings']>): void {
  const data = loadSave();
  data.settings = { ...data.settings, ...partial };
  cachedData = data;
  saveToDisk();
}

/** Get today's date string for daily challenge */
export function getTodayString(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Get a daily seed number from today's date */
export function getDailySeed(): number {
  const str = getTodayString();
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}
