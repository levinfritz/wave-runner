export interface LevelDef {
  id: string;
  name: string;
  /** Corridor base width (smaller = harder) */
  corridorWidth: number;
  /** Target distance in meters to complete */
  targetDistance: number;
  /** Fixed difficulty (overrides distance-based scaling) */
  difficulty: number;
  /** Scroll speed override */
  speed: number;
  /** Star thresholds: [1-star coins, 2-star coins, 3-star coins] */
  starThresholds: [number, number, number];
}

export const LEVELS: LevelDef[] = [
  {
    id: 'level_1',
    name: 'First Wave',
    corridorWidth: 220,
    targetDistance: 100,
    difficulty: 1,
    speed: 180,
    starThresholds: [2, 5, 8],
  },
  {
    id: 'level_2',
    name: 'Gentle Stream',
    corridorWidth: 200,
    targetDistance: 150,
    difficulty: 2,
    speed: 200,
    starThresholds: [3, 6, 10],
  },
  {
    id: 'level_3',
    name: 'Narrow Pass',
    corridorWidth: 170,
    targetDistance: 150,
    difficulty: 3,
    speed: 210,
    starThresholds: [3, 7, 12],
  },
  {
    id: 'level_4',
    name: 'Spike Alley',
    corridorWidth: 190,
    targetDistance: 180,
    difficulty: 4,
    speed: 220,
    starThresholds: [4, 8, 13],
  },
  {
    id: 'level_5',
    name: 'Sawmill',
    corridorWidth: 180,
    targetDistance: 200,
    difficulty: 6,
    speed: 230,
    starThresholds: [5, 9, 14],
  },
  {
    id: 'level_6',
    name: 'Gauntlet',
    corridorWidth: 170,
    targetDistance: 200,
    difficulty: 8,
    speed: 240,
    starThresholds: [5, 10, 16],
  },
  {
    id: 'level_7',
    name: 'Tight Squeeze',
    corridorWidth: 150,
    targetDistance: 220,
    difficulty: 10,
    speed: 250,
    starThresholds: [6, 11, 17],
  },
  {
    id: 'level_8',
    name: 'Chaos Corridor',
    corridorWidth: 160,
    targetDistance: 250,
    difficulty: 12,
    speed: 260,
    starThresholds: [6, 12, 18],
  },
  {
    id: 'level_9',
    name: 'Iron Maze',
    corridorWidth: 145,
    targetDistance: 250,
    difficulty: 14,
    speed: 270,
    starThresholds: [7, 13, 20],
  },
  {
    id: 'level_10',
    name: 'Death Wish',
    corridorWidth: 130,
    targetDistance: 300,
    difficulty: 18,
    speed: 300,
    starThresholds: [8, 15, 22],
  },
  {
    id: 'level_11',
    name: 'Nightmare',
    corridorWidth: 120,
    targetDistance: 300,
    difficulty: 22,
    speed: 320,
    starThresholds: [9, 16, 24],
  },
  {
    id: 'level_12',
    name: 'Impossible',
    corridorWidth: 110,
    targetDistance: 350,
    difficulty: 28,
    speed: 350,
    starThresholds: [10, 18, 26],
  },
];
