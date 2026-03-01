import { loadSave, updateSave } from '../utils/Storage';
import { LEVELS } from './Levels';

export interface AchievementDef {
  id: string;
  name: string;
  desc: string;
  icon: string; // single char
  check: () => boolean;
}

export const ACHIEVEMENTS: AchievementDef[] = [
  // Distance milestones
  { id: 'dist_100', name: 'First Steps', desc: 'Reach 100m', icon: '1', check: () => loadSave().highScore >= 100 },
  { id: 'dist_500', name: 'Getting There', desc: 'Reach 500m', icon: '5', check: () => loadSave().highScore >= 500 },
  { id: 'dist_1000', name: 'Marathon', desc: 'Reach 1000m', icon: 'M', check: () => loadSave().highScore >= 1000 },
  { id: 'dist_2500', name: 'Unstoppable', desc: 'Reach 2500m', icon: 'U', check: () => loadSave().highScore >= 2500 },
  { id: 'dist_5000', name: 'Legend', desc: 'Reach 5000m', icon: 'L', check: () => loadSave().highScore >= 5000 },

  // Coin milestones (total earned)
  { id: 'coins_100', name: 'Coin Finder', desc: 'Earn 100 coins total', icon: '$', check: () => loadSave().totalCoinsEarned >= 100 },
  { id: 'coins_1000', name: 'Treasure Hunter', desc: 'Earn 1000 coins total', icon: '$', check: () => loadSave().totalCoinsEarned >= 1000 },
  { id: 'coins_5000', name: 'Gold Rush', desc: 'Earn 5000 coins total', icon: '$', check: () => loadSave().totalCoinsEarned >= 5000 },
  { id: 'coins_20000', name: 'Millionaire', desc: 'Earn 20000 coins total', icon: '$', check: () => loadSave().totalCoinsEarned >= 20000 },

  // Level milestones
  { id: 'level_first', name: 'First Victory', desc: 'Complete level 1', icon: '\u2605', check: () => (loadSave().levelStars['level_1'] || 0) > 0 },
  { id: 'level_half', name: 'Halfway', desc: 'Complete level 6', icon: '\u2605', check: () => (loadSave().levelStars['level_6'] || 0) > 0 },
  { id: 'level_all', name: 'Champion', desc: 'Complete all 12 levels', icon: '\u2605', check: () => {
    const s = loadSave();
    return LEVELS.every(l => (s.levelStars[l.id] || 0) > 0);
  }},
  { id: 'level_perfect', name: 'Perfectionist', desc: '3-star all levels', icon: '\u2605', check: () => {
    const s = loadSave();
    return LEVELS.every(l => (s.levelStars[l.id] || 0) >= 3);
  }},

  // Persistence
  { id: 'deaths_50', name: 'Perseverance', desc: 'Die 50 times', icon: '\u2620', check: () => loadSave().totalDeaths >= 50 },
  { id: 'deaths_200', name: 'Never Give Up', desc: 'Die 200 times', icon: '\u2620', check: () => loadSave().totalDeaths >= 200 },
  { id: 'deaths_500', name: 'Iron Will', desc: 'Die 500 times', icon: '\u2620', check: () => loadSave().totalDeaths >= 500 },

  // Games played
  { id: 'games_10', name: 'Regular', desc: 'Play 10 games', icon: '\u25B6', check: () => loadSave().gamesPlayed >= 10 },
  { id: 'games_50', name: 'Dedicated', desc: 'Play 50 games', icon: '\u25B6', check: () => loadSave().gamesPlayed >= 50 },
  { id: 'games_200', name: 'Obsessed', desc: 'Play 200 games', icon: '\u25B6', check: () => loadSave().gamesPlayed >= 200 },

  // Total distance
  { id: 'total_5000', name: 'Explorer', desc: 'Fly 5000m total', icon: '\u2192', check: () => loadSave().totalDistance >= 5000 },
  { id: 'total_50000', name: 'Voyager', desc: 'Fly 50000m total', icon: '\u2192', check: () => loadSave().totalDistance >= 50000 },
];

/** Check all achievements and unlock newly completed ones. Returns newly unlocked IDs. */
export function checkAchievements(): string[] {
  const save = loadSave();
  const newlyUnlocked: string[] = [];

  for (const ach of ACHIEVEMENTS) {
    if (save.achievements.includes(ach.id)) continue;
    if (ach.check()) {
      newlyUnlocked.push(ach.id);
    }
  }

  if (newlyUnlocked.length > 0) {
    updateSave({ achievements: [...save.achievements, ...newlyUnlocked] });
  }

  return newlyUnlocked;
}
