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
  /** Starting physics mode (default: 'ship') */
  startMode?: 'ship' | 'wave';
  /** Disable portal spawning for this level */
  noPortals?: boolean;
}

export const LEVELS: LevelDef[] = [
  // ─── TUTORIAL & BASICS (1-3) ────────────────────────────
  {
    id: 'level_1',
    name: 'First Wave',
    corridorWidth: 220,
    targetDistance: 100,
    difficulty: 1,
    speed: 180,
    starThresholds: [3, 6, 10],
    noPortals: true,
  },
  {
    id: 'level_2',
    name: 'Gentle Stream',
    corridorWidth: 200,
    targetDistance: 120,
    difficulty: 3,
    speed: 195,
    starThresholds: [3, 7, 11],
    noPortals: true,
  },
  {
    id: 'level_3',
    name: 'Wave Rider',
    corridorWidth: 210,
    targetDistance: 130,
    difficulty: 3,
    speed: 200,
    starThresholds: [3, 7, 11],
    startMode: 'wave',
    noPortals: true,
  },

  // ─── PORTALS & MID GAME (4-6) ──────────────────────────
  {
    id: 'level_4',
    name: 'Switcheroo',
    corridorWidth: 195,
    targetDistance: 150,
    difficulty: 5,
    speed: 215,
    starThresholds: [4, 8, 13],
  },
  {
    id: 'level_5',
    name: 'Sawmill',
    corridorWidth: 180,
    targetDistance: 170,
    difficulty: 7,
    speed: 230,
    starThresholds: [5, 9, 14],
  },
  {
    id: 'level_6',
    name: 'Laser Grid',
    corridorWidth: 175,
    targetDistance: 190,
    difficulty: 9,
    speed: 240,
    starThresholds: [5, 10, 16],
  },

  // ─── HARD (7-9) ─────────────────────────────────────────
  {
    id: 'level_7',
    name: 'Tight Squeeze',
    corridorWidth: 155,
    targetDistance: 210,
    difficulty: 11,
    speed: 255,
    starThresholds: [5, 10, 16],
  },
  {
    id: 'level_8',
    name: 'Chaos Corridor',
    corridorWidth: 160,
    targetDistance: 230,
    difficulty: 13,
    speed: 265,
    starThresholds: [6, 11, 17],
  },
  {
    id: 'level_9',
    name: 'Iron Maze',
    corridorWidth: 145,
    targetDistance: 250,
    difficulty: 16,
    speed: 280,
    starThresholds: [6, 12, 18],
  },

  // ─── EXTREME (10-12) ────────────────────────────────────
  {
    id: 'level_10',
    name: 'Death Wish',
    corridorWidth: 130,
    targetDistance: 280,
    difficulty: 20,
    speed: 300,
    starThresholds: [6, 12, 18],
  },
  {
    id: 'level_11',
    name: 'Nightmare',
    corridorWidth: 120,
    targetDistance: 310,
    difficulty: 24,
    speed: 325,
    starThresholds: [7, 13, 20],
  },
  {
    id: 'level_12',
    name: 'Impossible',
    corridorWidth: 110,
    targetDistance: 350,
    difficulty: 28,
    speed: 350,
    starThresholds: [7, 14, 21],
  },
];
