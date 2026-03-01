export interface SkinDef {
  id: string;
  name: string;
  price: number; // 0 = free/default
  shape: string;
}

export interface TrailDef {
  id: string;
  name: string;
  price: number;
  style: string;
}

export const SKINS: SkinDef[] = [
  { id: 'default', name: 'Droplet', price: 0, shape: 'default' },
  { id: 'arrow', name: 'Arrow', price: 500, shape: 'arrow' },
  { id: 'diamond', name: 'Diamond', price: 1000, shape: 'diamond' },
  { id: 'star', name: 'Star', price: 1500, shape: 'star' },
  { id: 'rocket', name: 'Rocket', price: 2000, shape: 'rocket' },
  { id: 'circle', name: 'Orb', price: 750, shape: 'circle' },
  { id: 'triangle', name: 'Prism', price: 1200, shape: 'triangle' },
  { id: 'hexagon', name: 'Hex', price: 2500, shape: 'hexagon' },
  // New shapes
  { id: 'pentagon', name: 'Penta', price: 800, shape: 'pentagon' },
  { id: 'cross', name: 'Cross', price: 600, shape: 'cross' },
  { id: 'bolt', name: 'Bolt', price: 1800, shape: 'bolt' },
  { id: 'shield', name: 'Shield', price: 2200, shape: 'shield' },
  { id: 'heart', name: 'Heart', price: 1600, shape: 'heart' },
  { id: 'crown', name: 'Crown', price: 3000, shape: 'crown' },
  { id: 'blade', name: 'Blade', price: 2800, shape: 'blade' },
  { id: 'crescent', name: 'Moon', price: 3500, shape: 'crescent' },
  { id: 'ghost', name: 'Ghost', price: 4000, shape: 'ghost' },
  { id: 'flame', name: 'Flame', price: 4500, shape: 'flame' },
  { id: 'skull', name: 'Skull', price: 5000, shape: 'skull' },
  { id: 'eye', name: 'Eye', price: 6000, shape: 'eye' },
];

export const TRAILS: TrailDef[] = [
  { id: 'default', name: 'Classic', price: 0, style: 'default' },
  { id: 'rainbow', name: 'Rainbow', price: 1000, style: 'rainbow' },
  { id: 'fire', name: 'Fire', price: 1500, style: 'fire' },
  { id: 'glitter', name: 'Glitter', price: 2000, style: 'glitter' },
  { id: 'thick', name: 'Thick', price: 500, style: 'thick' },
  { id: 'dashed', name: 'Dashed', price: 750, style: 'dashed' },
  { id: 'double', name: 'Double', price: 1800, style: 'double' },
  // New trails
  { id: 'dotted', name: 'Dotted', price: 600, style: 'dotted' },
  { id: 'zigzag', name: 'Zigzag', price: 1200, style: 'zigzag' },
  { id: 'neon', name: 'Neon', price: 2500, style: 'neon' },
  { id: 'ice', name: 'Ice', price: 1400, style: 'ice' },
  { id: 'electric', name: 'Electric', price: 3000, style: 'electric' },
  { id: 'wave', name: 'Sine', price: 900, style: 'wave' },
  { id: 'fade', name: 'Ghost', price: 1600, style: 'fade' },
  { id: 'pulse', name: 'Pulse', price: 2200, style: 'pulse' },
];
