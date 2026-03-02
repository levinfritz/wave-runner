import { type Obstacle, createObstacle } from './Obstacle';
import { type Coin, createCoin } from './Coin';
import { randomRange, randomInt } from '../utils/Math';

interface ChunkDef {
  minDifficulty: number;
  weight: number; // higher = more likely to be picked
  generate: (x: number, topY: number, bottomY: number, difficulty: number) => Obstacle[];
}

const chunks: ChunkDef[] = [
  // ─── EARLY GAME (diff 0-3) ────────────────────────────

  // Simple sawblade in center
  {
    minDifficulty: 0,
    weight: 3,
    generate: (x, topY, bottomY) => {
      const centerY = (topY + bottomY) / 2;
      return [createObstacle('sawblade', x, centerY)];
    },
  },
  // Sawblade off-center (random position)
  {
    minDifficulty: 1,
    weight: 3,
    generate: (x, topY, bottomY) => {
      const t = randomRange(0.2, 0.8);
      const y = topY + (bottomY - topY) * t;
      return [createObstacle('sawblade', x, y)];
    },
  },
  // Spikes on top wall
  {
    minDifficulty: 1,
    weight: 2,
    generate: (x, topY) => {
      const obstacles: Obstacle[] = [];
      const count = randomInt(2, 4);
      for (let i = 0; i < count; i++) {
        obstacles.push(createObstacle('spike_top', x + i * 25, topY + 15));
      }
      return obstacles;
    },
  },
  // Spikes on bottom wall
  {
    minDifficulty: 1,
    weight: 2,
    generate: (x, _topY, bottomY) => {
      const obstacles: Obstacle[] = [];
      const count = randomInt(2, 4);
      for (let i = 0; i < count; i++) {
        obstacles.push(createObstacle('spike_bottom', x + i * 25, bottomY - 15));
      }
      return obstacles;
    },
  },
  // Two sawblades side by side (horizontal)
  {
    minDifficulty: 2,
    weight: 2,
    generate: (x, topY, bottomY) => {
      const y1 = topY + (bottomY - topY) * 0.3;
      const y2 = topY + (bottomY - topY) * 0.7;
      const pick = Math.random() > 0.5;
      return [createObstacle('sawblade', x, pick ? y1 : y2)];
    },
  },
  // Block obstacle
  {
    minDifficulty: 3,
    weight: 2,
    generate: (x, topY, bottomY) => {
      const centerY = (topY + bottomY) / 2;
      const offset = randomRange(-30, 30);
      return [createObstacle('block', x, centerY + offset)];
    },
  },

  // ─── MID GAME (diff 4-8) ──────────────────────────────

  // Saw + top spikes combo
  {
    minDifficulty: 4,
    weight: 2,
    generate: (x, topY, bottomY) => {
      const obstacles: Obstacle[] = [];
      obstacles.push(createObstacle('sawblade', x + 40, topY + (bottomY - topY) * 0.65));
      for (let i = 0; i < 3; i++) {
        obstacles.push(createObstacle('spike_top', x + i * 25, topY + 15));
      }
      return obstacles;
    },
  },
  // Saw + bottom spikes combo
  {
    minDifficulty: 4,
    weight: 2,
    generate: (x, topY, bottomY) => {
      const obstacles: Obstacle[] = [];
      obstacles.push(createObstacle('sawblade', x + 40, topY + (bottomY - topY) * 0.35));
      for (let i = 0; i < 3; i++) {
        obstacles.push(createObstacle('spike_bottom', x + i * 25, bottomY - 15));
      }
      return obstacles;
    },
  },
  // Double sawblade (top and bottom)
  {
    minDifficulty: 5,
    weight: 2,
    generate: (x, topY, bottomY) => {
      const gap = (bottomY - topY) * 0.35;
      return [
        createObstacle('sawblade', x, topY + gap * 0.5),
        createObstacle('sawblade', x, bottomY - gap * 0.5),
      ];
    },
  },
  // Gate
  {
    minDifficulty: 6,
    weight: 2,
    generate: (x, topY, bottomY) => {
      const centerY = (topY + bottomY) / 2;
      const obs = createObstacle('gate', x, centerY);
      obs.height = (bottomY - topY) * 0.8;
      return [obs];
    },
  },
  // Moving block
  {
    minDifficulty: 6,
    weight: 1,
    generate: (x, topY, bottomY) => {
      const centerY = (topY + bottomY) / 2;
      const obs = createObstacle('block', x, centerY);
      obs.moveAmplitude = (bottomY - topY) * 0.2;
      obs.moveSpeed = 1.5 + Math.random() * 1.5;
      obs.baseY = centerY;
      return [obs];
    },
  },
  // Two blocks narrowing path
  {
    minDifficulty: 7,
    weight: 2,
    generate: (x, topY, bottomY) => {
      const gap = bottomY - topY;
      return [
        createObstacle('block', x, topY + gap * 0.2),
        createObstacle('block', x, bottomY - gap * 0.2),
      ];
    },
  },
  // Staggered blocks (weave)
  {
    minDifficulty: 7,
    weight: 1,
    generate: (x, topY, bottomY) => {
      const gap = bottomY - topY;
      return [
        createObstacle('block', x, topY + gap * 0.25),
        createObstacle('block', x + 80, bottomY - gap * 0.25),
      ];
    },
  },
  // Moving sawblade
  {
    minDifficulty: 8,
    weight: 2,
    generate: (x, topY, bottomY) => {
      const centerY = (topY + bottomY) / 2;
      const obs = createObstacle('sawblade', x, centerY);
      obs.moveAmplitude = (bottomY - topY) * 0.25;
      obs.moveSpeed = 2 + Math.random() * 2;
      obs.baseY = centerY;
      return [obs];
    },
  },

  // ─── HARD (diff 9-14) ─────────────────────────────────

  // Block + saw combo
  {
    minDifficulty: 9,
    weight: 2,
    generate: (x, topY, bottomY) => {
      const gap = bottomY - topY;
      const blockY = Math.random() > 0.5 ? topY + gap * 0.2 : bottomY - gap * 0.2;
      const sawY = Math.random() > 0.5 ? topY + gap * 0.65 : topY + gap * 0.35;
      return [
        createObstacle('block', x, blockY),
        createObstacle('sawblade', x + 60, sawY),
      ];
    },
  },
  // Sweeping saw (large amplitude)
  {
    minDifficulty: 10,
    weight: 2,
    generate: (x, topY, bottomY) => {
      const centerY = (topY + bottomY) / 2;
      const obs = createObstacle('sawblade', x, centerY);
      obs.moveAmplitude = (bottomY - topY) * 0.35;
      obs.moveSpeed = 1.5 + Math.random();
      obs.baseY = centerY;
      return [obs];
    },
  },
  // Spike tunnel (alternating walls)
  {
    minDifficulty: 10,
    weight: 2,
    generate: (x, topY, bottomY) => {
      const obstacles: Obstacle[] = [];
      const count = randomInt(4, 6);
      for (let i = 0; i < count; i++) {
        if (i % 2 === 0) {
          obstacles.push(createObstacle('spike_top', x + i * 30, topY + 15));
        } else {
          obstacles.push(createObstacle('spike_bottom', x + i * 30, bottomY - 15));
        }
      }
      return obstacles;
    },
  },
  // Triple vertical sawblade
  {
    minDifficulty: 11,
    weight: 1,
    generate: (x, topY, bottomY) => {
      const gap = bottomY - topY;
      return [
        createObstacle('sawblade', x, topY + gap * 0.2),
        createObstacle('sawblade', x, topY + gap * 0.5),
        createObstacle('sawblade', x, topY + gap * 0.8),
      ];
    },
  },
  // Sawblade gauntlet (3 in a row, zigzag)
  {
    minDifficulty: 12,
    weight: 2,
    generate: (x, topY, bottomY) => {
      const obstacles: Obstacle[] = [];
      const gap = bottomY - topY;
      for (let i = 0; i < 3; i++) {
        const posY = topY + gap * (0.3 + (i % 2) * 0.4);
        obstacles.push(createObstacle('sawblade', x + i * 80, posY));
      }
      return obstacles;
    },
  },
  // Double gate (different phases)
  {
    minDifficulty: 12,
    weight: 1,
    generate: (x, topY, bottomY) => {
      const centerY = (topY + bottomY) / 2;
      const gH = (bottomY - topY) * 0.8;
      const g1 = createObstacle('gate', x, centerY);
      g1.height = gH;
      g1.gateInterval = 2;
      const g2 = createObstacle('gate', x + 120, centerY);
      g2.height = gH;
      g2.gateInterval = 2;
      g2.gateTimer = 1; // offset phase
      return [g1, g2];
    },
  },
  // Diagonal cascade (4 saws)
  {
    minDifficulty: 13,
    weight: 2,
    generate: (x, topY, bottomY) => {
      const obstacles: Obstacle[] = [];
      const gap = bottomY - topY;
      for (let i = 0; i < 4; i++) {
        const t = 0.15 + (i / 3) * 0.7;
        obstacles.push(createObstacle('sawblade', x + i * 60, topY + gap * t));
      }
      return obstacles;
    },
  },
  // Wall of spikes with gap
  {
    minDifficulty: 14,
    weight: 2,
    generate: (x, topY, bottomY) => {
      const obstacles: Obstacle[] = [];
      const gapCenter = randomRange(0.35, 0.65);
      for (let i = 0; i < 6; i++) {
        const t = i / 5;
        if (Math.abs(t - gapCenter) > 0.18) {
          const y = topY + (bottomY - topY) * t;
          obstacles.push(createObstacle('spike_top', x, y));
        }
      }
      return obstacles;
    },
  },

  // ─── LASERS & ORBS (diff 5+) ───────────────────────────

  // Single laser beam across corridor
  {
    minDifficulty: 5,
    weight: 2,
    generate: (x, topY, bottomY) => {
      const y = topY + (bottomY - topY) * randomRange(0.3, 0.7);
      const laser = createObstacle('laser', x, y);
      laser.width = (bottomY - topY) * 1.2; // slightly wider than corridor
      return [laser];
    },
  },
  // Floating pulse orb
  {
    minDifficulty: 6,
    weight: 2,
    generate: (x, topY, bottomY) => {
      const y = topY + (bottomY - topY) * randomRange(0.25, 0.75);
      return [createObstacle('pulse_orb', x, y)];
    },
  },
  // Double laser (top and bottom thirds)
  {
    minDifficulty: 10,
    weight: 1,
    generate: (x, topY, bottomY) => {
      const gap = bottomY - topY;
      const l1 = createObstacle('laser', x, topY + gap * 0.3);
      l1.width = gap;
      const l2 = createObstacle('laser', x, bottomY - gap * 0.3);
      l2.width = gap;
      l2.gateTimer = l2.gateInterval / 2; // offset phase
      return [l1, l2];
    },
  },
  // Pulse orb pair (bobbing opposite)
  {
    minDifficulty: 9,
    weight: 1,
    generate: (x, topY, bottomY) => {
      const gap = bottomY - topY;
      const o1 = createObstacle('pulse_orb', x, topY + gap * 0.3);
      const o2 = createObstacle('pulse_orb', x + 70, bottomY - gap * 0.3);
      o2.movePhase = Math.PI;
      return [o1, o2];
    },
  },
  // Laser + sawblade combo
  {
    minDifficulty: 12,
    weight: 1,
    generate: (x, topY, bottomY) => {
      const gap = bottomY - topY;
      const laser = createObstacle('laser', x, topY + gap * 0.5);
      laser.width = gap;
      const saw = createObstacle('sawblade', x + 80, topY + gap * 0.3);
      return [laser, saw];
    },
  },
  // Triple orb line
  {
    minDifficulty: 14,
    weight: 1,
    generate: (x, topY, bottomY) => {
      const gap = bottomY - topY;
      const obstacles: Obstacle[] = [];
      for (let i = 0; i < 3; i++) {
        const orb = createObstacle('pulse_orb', x + i * 60, topY + gap * (0.2 + i * 0.3));
        orb.movePhase = (i * Math.PI * 2) / 3;
        obstacles.push(orb);
      }
      return obstacles;
    },
  },
  // Laser corridor (3 lasers staggered)
  {
    minDifficulty: 18,
    weight: 1,
    generate: (x, topY, bottomY) => {
      const gap = bottomY - topY;
      const obstacles: Obstacle[] = [];
      for (let i = 0; i < 3; i++) {
        const laser = createObstacle('laser', x + i * 100, topY + gap * (0.25 + i * 0.25));
        laser.width = gap;
        laser.gateTimer = (i * laser.gateInterval) / 3;
        obstacles.push(laser);
      }
      return obstacles;
    },
  },
  // Orb + laser + saw nightmare
  {
    minDifficulty: 22,
    weight: 1,
    generate: (x, topY, bottomY) => {
      const gap = bottomY - topY;
      const centerY = (topY + bottomY) / 2;
      const laser = createObstacle('laser', x, centerY);
      laser.width = gap;
      const orb = createObstacle('pulse_orb', x + 60, topY + gap * 0.25);
      const saw = createObstacle('sawblade', x + 120, bottomY - gap * 0.25);
      saw.moveAmplitude = gap * 0.15;
      saw.moveSpeed = 2;
      saw.baseY = bottomY - gap * 0.25;
      return [laser, orb, saw];
    },
  },

  // ─── VERY HARD (diff 15-20) ───────────────────────────

  // Moving sawblade pair (opposite phase)
  {
    minDifficulty: 15,
    weight: 2,
    generate: (x, topY, bottomY) => {
      const centerY = (topY + bottomY) / 2;
      const obs1 = createObstacle('sawblade', x, centerY);
      obs1.moveAmplitude = (bottomY - topY) * 0.2;
      obs1.moveSpeed = 2.5;
      obs1.baseY = centerY;
      const obs2 = createObstacle('sawblade', x + 100, centerY);
      obs2.moveAmplitude = (bottomY - topY) * 0.2;
      obs2.moveSpeed = 2.5;
      obs2.movePhase = Math.PI;
      obs2.baseY = centerY;
      return [obs1, obs2];
    },
  },
  // Spike walls both sides
  {
    minDifficulty: 15,
    weight: 2,
    generate: (x, topY, bottomY) => {
      const obstacles: Obstacle[] = [];
      const count = randomInt(3, 5);
      for (let i = 0; i < count; i++) {
        obstacles.push(createObstacle('spike_top', x + i * 25, topY + 15));
        obstacles.push(createObstacle('spike_bottom', x + i * 25, bottomY - 15));
      }
      return obstacles;
    },
  },
  // Zigzag gauntlet extended (5 saws)
  {
    minDifficulty: 16,
    weight: 1,
    generate: (x, topY, bottomY) => {
      const obstacles: Obstacle[] = [];
      const gap = bottomY - topY;
      for (let i = 0; i < 5; i++) {
        const posY = topY + gap * (0.25 + (i % 2) * 0.5);
        obstacles.push(createObstacle('sawblade', x + i * 70, posY));
      }
      return obstacles;
    },
  },
  // Saw with spikes both walls
  {
    minDifficulty: 16,
    weight: 1,
    generate: (x, topY, bottomY) => {
      const obstacles: Obstacle[] = [];
      const centerY = (topY + bottomY) / 2;
      const obs = createObstacle('sawblade', x + 50, centerY);
      obs.moveAmplitude = (bottomY - topY) * 0.15;
      obs.moveSpeed = 2;
      obs.baseY = centerY;
      obstacles.push(obs);
      for (let i = 0; i < 4; i++) {
        obstacles.push(createObstacle('spike_top', x + i * 30, topY + 15));
        obstacles.push(createObstacle('spike_bottom', x + i * 30, bottomY - 15));
      }
      return obstacles;
    },
  },
  // Block maze (3 blocks in a weave)
  {
    minDifficulty: 17,
    weight: 1,
    generate: (x, topY, bottomY) => {
      const gap = bottomY - topY;
      return [
        createObstacle('block', x, topY + gap * 0.25),
        createObstacle('block', x + 80, bottomY - gap * 0.25),
        createObstacle('block', x + 160, topY + gap * 0.4),
      ];
    },
  },
  // Fast saw trio (fast oscillation, tight)
  {
    minDifficulty: 18,
    weight: 1,
    generate: (x, topY, bottomY) => {
      const centerY = (topY + bottomY) / 2;
      const obstacles: Obstacle[] = [];
      for (let i = 0; i < 3; i++) {
        const obs = createObstacle('sawblade', x + i * 90, centerY);
        obs.moveAmplitude = (bottomY - topY) * 0.2;
        obs.moveSpeed = 3 + Math.random();
        obs.movePhase = (i * Math.PI * 2) / 3;
        obs.baseY = centerY;
        obstacles.push(obs);
      }
      return obstacles;
    },
  },

  // ─── EXTREME (diff 20+) ───────────────────────────────

  // Block corridor gauntlet
  {
    minDifficulty: 20,
    weight: 1,
    generate: (x, topY, bottomY) => {
      const gap = bottomY - topY;
      const obstacles: Obstacle[] = [];
      for (let i = 0; i < 4; i++) {
        const t = i % 2 === 0 ? 0.2 : 0.8;
        obstacles.push(createObstacle('block', x + i * 70, topY + gap * t));
      }
      return obstacles;
    },
  },
  // Gate + moving saw
  {
    minDifficulty: 20,
    weight: 1,
    generate: (x, topY, bottomY) => {
      const centerY = (topY + bottomY) / 2;
      const gH = (bottomY - topY) * 0.8;
      const gate = createObstacle('gate', x, centerY);
      gate.height = gH;
      gate.gateInterval = 1.8;
      const saw = createObstacle('sawblade', x + 90, centerY);
      saw.moveAmplitude = (bottomY - topY) * 0.25;
      saw.moveSpeed = 2.5;
      saw.baseY = centerY;
      return [gate, saw];
    },
  },
  // Chaos cluster (random scattered obstacles)
  {
    minDifficulty: 22,
    weight: 1,
    generate: (x, topY, bottomY, difficulty) => {
      const obstacles: Obstacle[] = [];
      const count = Math.min(5, 3 + Math.floor(difficulty / 10));
      const gap = bottomY - topY;
      for (let i = 0; i < count; i++) {
        const px = x + randomRange(0, 200);
        const py = topY + gap * randomRange(0.15, 0.85);
        if (Math.random() > 0.4) {
          obstacles.push(createObstacle('sawblade', px, py));
        } else {
          obstacles.push(createObstacle('block', px, py));
        }
      }
      return obstacles;
    },
  },
  // Spike maze with gap weave
  {
    minDifficulty: 22,
    weight: 1,
    generate: (x, topY, bottomY) => {
      const obstacles: Obstacle[] = [];
      for (let i = 0; i < 6; i++) {
        // Alternating spike walls with offset gaps
        const gapPos = 0.3 + (i % 3) * 0.2;
        for (let j = 0; j < 5; j++) {
          const t = j / 4;
          if (Math.abs(t - gapPos) > 0.15) {
            const y = topY + (bottomY - topY) * t;
            obstacles.push(createObstacle(
              j < 2 ? 'spike_top' : 'spike_bottom',
              x + i * 40, y
            ));
          }
        }
      }
      return obstacles;
    },
  },
  // Four moving saws (nightmare)
  {
    minDifficulty: 25,
    weight: 1,
    generate: (x, topY, bottomY) => {
      const centerY = (topY + bottomY) / 2;
      const obstacles: Obstacle[] = [];
      for (let i = 0; i < 4; i++) {
        const obs = createObstacle('sawblade', x + i * 80, centerY);
        obs.moveAmplitude = (bottomY - topY) * 0.22;
        obs.moveSpeed = 2 + i * 0.5;
        obs.movePhase = (i * Math.PI) / 2;
        obs.baseY = centerY;
        obstacles.push(obs);
      }
      return obstacles;
    },
  },
  // Alternating gate + spike combo
  {
    minDifficulty: 25,
    weight: 1,
    generate: (x, topY, bottomY) => {
      const centerY = (topY + bottomY) / 2;
      const gH = (bottomY - topY) * 0.85;
      const obstacles: Obstacle[] = [];
      const g = createObstacle('gate', x, centerY);
      g.height = gH;
      g.gateInterval = 1.5;
      obstacles.push(g);
      // Spikes after gate for pressure
      for (let i = 0; i < 4; i++) {
        if (i % 2 === 0) {
          obstacles.push(createObstacle('spike_top', x + 60 + i * 30, topY + 15));
        } else {
          obstacles.push(createObstacle('spike_bottom', x + 60 + i * 30, bottomY - 15));
        }
      }
      return obstacles;
    },
  },
  // Double sweeping saws (crossing)
  {
    minDifficulty: 28,
    weight: 1,
    generate: (x, topY, bottomY) => {
      const centerY = (topY + bottomY) / 2;
      const amp = (bottomY - topY) * 0.3;
      const s1 = createObstacle('sawblade', x, centerY);
      s1.moveAmplitude = amp;
      s1.moveSpeed = 2;
      s1.movePhase = 0;
      s1.baseY = centerY;
      const s2 = createObstacle('sawblade', x, centerY);
      s2.moveAmplitude = amp;
      s2.moveSpeed = 2;
      s2.movePhase = Math.PI;
      s2.baseY = centerY;
      return [s1, s2];
    },
  },
];

// Weighted random selection — no array allocation
function pickChunk(difficulty: number): ChunkDef {
  let totalWeight = 0;
  for (let i = 0; i < chunks.length; i++) {
    if (chunks[i].minDifficulty <= difficulty) totalWeight += chunks[i].weight;
  }
  let roll = Math.random() * totalWeight;
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    if (chunk.minDifficulty > difficulty) continue;
    roll -= chunk.weight;
    if (roll <= 0) return chunk;
  }
  return chunks[0];
}

export class LevelGenerator {
  private nextObstacleX = 500;
  private nextCoinX = 250;
  private nextPortalX = 600; // first portal early (~12m)
  private difficulty = 0;
  private fixedDifficulty = -1; // -1 = use distance-based scaling
  private currentMode: 'ship' | 'wave' = 'ship';
  private noPortals = false;

  obstacles: Obstacle[] = [];
  coins: Coin[] = [];

  getDifficulty(): number {
    return this.difficulty;
  }

  reset(): void {
    this.nextObstacleX = 500;
    this.nextCoinX = 250;
    this.nextPortalX = 600;
    this.difficulty = 0;
    this.fixedDifficulty = -1;
    this.currentMode = 'ship';
    this.noPortals = false;
    this.obstacles = [];
    this.coins = [];
  }

  setFixedDifficulty(d: number): void {
    this.fixedDifficulty = d;
    this.difficulty = d;
  }

  setNoPortals(val: boolean): void {
    this.noPortals = val;
  }

  setStartMode(mode: 'ship' | 'wave'): void {
    this.currentMode = mode;
  }

  generate(playerX: number, getWalls: (x: number) => { topY: number; bottomY: number } | null): void {
    const generateAhead = playerX + 1200;

    // Generate obstacles — avoid placing near portals
    while (this.nextObstacleX < generateAhead) {
      const walls = getWalls(this.nextObstacleX);
      if (!walls) {
        this.nextObstacleX += 100;
        continue;
      }

      // Skip if too close to a portal (within 60px)
      let tooCloseToPortal = false;
      for (let i = this.obstacles.length - 1; i >= 0 && i >= this.obstacles.length - 20; i--) {
        const obs = this.obstacles[i];
        if ((obs.type === 'portal_ship' || obs.type === 'portal_wave') &&
            Math.abs(obs.x - this.nextObstacleX) < 60) {
          tooCloseToPortal = true;
          break;
        }
      }
      if (tooCloseToPortal) {
        this.nextObstacleX += 80;
        continue;
      }

      const chunk = pickChunk(this.difficulty);
      const newObs = chunk.generate(this.nextObstacleX, walls.topY, walls.bottomY, this.difficulty);
      // Push individually — avoid spread operator allocation
      for (let i = 0; i < newObs.length; i++) {
        this.obstacles.push(newObs[i]);
      }

      // Spacing decreases with difficulty, but never below 100
      const spacing = Math.max(100, 280 - this.difficulty * 4);
      this.nextObstacleX += spacing + randomRange(-20, 40);
    }

    // Generate portals (mode switching) — start at difficulty 2+, skip if noPortals
    while (!this.noPortals && this.difficulty >= 2 && this.nextPortalX <= generateAhead) {
      // Ensure portals don't overlap with existing obstacles (push portal forward if needed)
      let portalX = this.nextPortalX;
      for (let i = this.obstacles.length - 1; i >= 0 && i >= this.obstacles.length - 30; i--) {
        const obs = this.obstacles[i];
        if (obs.type !== 'portal_ship' && obs.type !== 'portal_wave' &&
            Math.abs(obs.x - portalX) < 60) {
          portalX = obs.x + 80; // push past the obstacle
        }
      }

      const walls = getWalls(portalX);
      if (walls) {
        const centerY = (walls.topY + walls.bottomY) / 2;
        const gapH = walls.bottomY - walls.topY;
        const targetMode = this.currentMode === 'ship' ? 'portal_wave' : 'portal_ship';
        const portal = createObstacle(targetMode as any, portalX, centerY);
        portal.height = gapH;
        this.obstacles.push(portal);
        this.currentMode = this.currentMode === 'ship' ? 'wave' : 'ship';
      }
      // Portal spacing: wider early, tighter as difficulty grows
      const minSpacing = Math.max(300, 600 - this.difficulty * 10);
      const maxSpacing = Math.max(500, 1000 - this.difficulty * 15);
      this.nextPortalX = portalX + minSpacing + randomRange(0, maxSpacing - minSpacing);
    }

    // Generate coins — avoid placing inside obstacles
    while (this.nextCoinX < generateAhead) {
      const walls = getWalls(this.nextCoinX);
      if (walls) {
        const y = randomRange(walls.topY + 25, walls.bottomY - 25);

        // Check if coin is too close to any obstacle (sawblade, block, pulse_orb)
        let blocked = false;
        for (let i = this.obstacles.length - 1; i >= 0 && i >= this.obstacles.length - 30; i--) {
          const obs = this.obstacles[i];
          if (obs.type === 'portal_ship' || obs.type === 'portal_wave') continue;
          const dx = Math.abs(obs.x - this.nextCoinX);
          const dy = Math.abs(obs.y - y);
          const minDist = (obs.width / 2) + 15; // obstacle radius + coin radius + margin
          if (dx < minDist && dy < minDist) {
            blocked = true;
            break;
          }
        }

        if (!blocked) {
          this.coins.push(createCoin(this.nextCoinX, y));
        }
      }
      this.nextCoinX += randomRange(180, 350);
    }
  }

  updateDifficulty(distance: number): void {
    if (this.fixedDifficulty >= 0) return; // Classic mode uses fixed difficulty
    this.difficulty = Math.min(30, distance / 50);
  }

  cleanup(behindX: number): void {
    const cutoff = behindX - 200;

    // In-place filter — no new array allocation
    let write = 0;
    for (let read = 0; read < this.obstacles.length; read++) {
      if (this.obstacles[read].x > cutoff) {
        this.obstacles[write++] = this.obstacles[read];
      }
    }
    this.obstacles.length = write;

    write = 0;
    for (let read = 0; read < this.coins.length; read++) {
      if (this.coins[read].x > cutoff) {
        this.coins[write++] = this.coins[read];
      }
    }
    this.coins.length = write;
  }
}
