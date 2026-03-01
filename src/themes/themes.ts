export type ParticleStyle = 'sparks' | 'bubbles' | 'snow' | 'fire' | 'stars' | 'pixels' | 'rain' | 'petals' | 'ash' | 'fireflies' | 'glitter' | 'dust';
export type PatternType = 'grid' | 'diamonds' | 'dots' | 'waves' | 'hexagons' | 'circuits' | 'stars' | 'none' | 'triangles' | 'crosses' | 'rings';

export interface GameTheme {
  name: string;
  background: {
    gradient: string[];
    pattern: PatternType;
    patternColor: string;
    patternScale: number;
    parallaxLayers: number;
  };
  corridor: {
    wallColor: string;
    wallThickness: number;
    fillColor: string;
    wallGlow: boolean;
    glowColor: string;
  };
  obstacles: {
    primaryColor: string;
    secondaryColor: string;
    glowIntensity: number;
  };
  player: {
    color: string;
    trailColor: string;
    trailGlow: boolean;
  };
  particles: {
    enabled: boolean;
    color: string;
    style: ParticleStyle;
  };
  ui: {
    textColor: string;
    accentColor: string;
  };
}

export const themes: GameTheme[] = [
  // 1. Neon Purple (Space Waves classic feel)
  {
    name: 'Neon Purple',
    background: { gradient: ['#0a0020', '#1a0040', '#2d0066'], pattern: 'diamonds', patternColor: '#ffffff10', patternScale: 1.0, parallaxLayers: 3 },
    corridor: { wallColor: '#9933ff', wallThickness: 3, fillColor: '#1a0040cc', wallGlow: true, glowColor: '#9933ff80' },
    obstacles: { primaryColor: '#9933ff', secondaryColor: '#cc66ff', glowIntensity: 0.8 },
    player: { color: '#ffffff', trailColor: '#9933ff', trailGlow: true },
    particles: { enabled: true, color: '#cc66ff', style: 'sparks' },
    ui: { textColor: '#ffffff', accentColor: '#9933ff' },
  },
  // 2. Cyber Blue
  {
    name: 'Cyber Blue',
    background: { gradient: ['#000a1a', '#001133', '#002266'], pattern: 'circuits', patternColor: '#00ccff10', patternScale: 1.2, parallaxLayers: 3 },
    corridor: { wallColor: '#00ccff', wallThickness: 2, fillColor: '#001133cc', wallGlow: true, glowColor: '#00ccff80' },
    obstacles: { primaryColor: '#00ccff', secondaryColor: '#0088ff', glowIntensity: 0.9 },
    player: { color: '#ffffff', trailColor: '#00ccff', trailGlow: true },
    particles: { enabled: true, color: '#00ccff', style: 'sparks' },
    ui: { textColor: '#ffffff', accentColor: '#00ccff' },
  },
  // 3. Lava Flow
  {
    name: 'Lava Flow',
    background: { gradient: ['#1a0000', '#330000', '#4d0000'], pattern: 'waves', patternColor: '#ff330015', patternScale: 1.5, parallaxLayers: 2 },
    corridor: { wallColor: '#ff4400', wallThickness: 3, fillColor: '#33000099', wallGlow: true, glowColor: '#ff440080' },
    obstacles: { primaryColor: '#ff4400', secondaryColor: '#ff8800', glowIntensity: 1.0 },
    player: { color: '#ffcc00', trailColor: '#ff4400', trailGlow: true },
    particles: { enabled: true, color: '#ff6600', style: 'fire' },
    ui: { textColor: '#ffffff', accentColor: '#ff4400' },
  },
  // 4. Deep Ocean
  {
    name: 'Deep Ocean',
    background: { gradient: ['#000d1a', '#001a33', '#003355'], pattern: 'waves', patternColor: '#00668810', patternScale: 2.0, parallaxLayers: 3 },
    corridor: { wallColor: '#0099cc', wallThickness: 2, fillColor: '#001a33bb', wallGlow: true, glowColor: '#0099cc60' },
    obstacles: { primaryColor: '#0099cc', secondaryColor: '#00cccc', glowIntensity: 0.6 },
    player: { color: '#00ffcc', trailColor: '#0099cc', trailGlow: true },
    particles: { enabled: true, color: '#00cccc', style: 'bubbles' },
    ui: { textColor: '#ffffff', accentColor: '#0099cc' },
  },
  // 5. Arctic Ice
  {
    name: 'Arctic Ice',
    background: { gradient: ['#e8f4f8', '#c8e6f0', '#a8d8e8'], pattern: 'diamonds', patternColor: '#ffffff30', patternScale: 1.0, parallaxLayers: 2 },
    corridor: { wallColor: '#4499cc', wallThickness: 2, fillColor: '#c8e6f0aa', wallGlow: false, glowColor: '#4499cc40' },
    obstacles: { primaryColor: '#3388bb', secondaryColor: '#66bbdd', glowIntensity: 0.3 },
    player: { color: '#003366', trailColor: '#4499cc', trailGlow: false },
    particles: { enabled: true, color: '#ffffff', style: 'snow' },
    ui: { textColor: '#003366', accentColor: '#4499cc' },
  },
  // 6. Sunset Desert
  {
    name: 'Sunset Desert',
    background: { gradient: ['#ff6633', '#ff9933', '#ffcc33'], pattern: 'dots', patternColor: '#ffffff10', patternScale: 1.0, parallaxLayers: 2 },
    corridor: { wallColor: '#cc3300', wallThickness: 3, fillColor: '#ff993388', wallGlow: false, glowColor: '#cc330060' },
    obstacles: { primaryColor: '#cc3300', secondaryColor: '#ff6633', glowIntensity: 0.4 },
    player: { color: '#ffffff', trailColor: '#ff6633', trailGlow: false },
    particles: { enabled: true, color: '#ffcc33', style: 'dust' },
    ui: { textColor: '#ffffff', accentColor: '#ff6633' },
  },
  // 7. Matrix Green
  {
    name: 'Matrix Green',
    background: { gradient: ['#000000', '#001100', '#002200'], pattern: 'none', patternColor: '#00ff0008', patternScale: 1.0, parallaxLayers: 1 },
    corridor: { wallColor: '#00ff00', wallThickness: 2, fillColor: '#001100cc', wallGlow: true, glowColor: '#00ff0060' },
    obstacles: { primaryColor: '#00ff00', secondaryColor: '#00cc00', glowIntensity: 0.7 },
    player: { color: '#00ff00', trailColor: '#00ff00', trailGlow: true },
    particles: { enabled: true, color: '#00ff00', style: 'rain' },
    ui: { textColor: '#00ff00', accentColor: '#00cc00' },
  },
  // 8. Candy Pop
  {
    name: 'Candy Pop',
    background: { gradient: ['#ffe6f0', '#e6fff0', '#fff0e6'], pattern: 'dots', patternColor: '#ff99cc20', patternScale: 0.8, parallaxLayers: 2 },
    corridor: { wallColor: '#ff66aa', wallThickness: 3, fillColor: '#ffe6f0aa', wallGlow: false, glowColor: '#ff66aa40' },
    obstacles: { primaryColor: '#ff66aa', secondaryColor: '#66ddaa', glowIntensity: 0.3 },
    player: { color: '#ff3388', trailColor: '#ff66aa', trailGlow: false },
    particles: { enabled: true, color: '#ff99cc', style: 'stars' },
    ui: { textColor: '#cc3377', accentColor: '#ff66aa' },
  },
  // 9. Retro 80s / Synthwave
  {
    name: 'Retro 80s',
    background: { gradient: ['#0d001a', '#1a0033', '#330066'], pattern: 'grid', patternColor: '#ff00ff15', patternScale: 1.5, parallaxLayers: 3 },
    corridor: { wallColor: '#ff00ff', wallThickness: 3, fillColor: '#1a003399', wallGlow: true, glowColor: '#ff00ff80' },
    obstacles: { primaryColor: '#ff00ff', secondaryColor: '#00ffff', glowIntensity: 1.0 },
    player: { color: '#ffffff', trailColor: '#ff00ff', trailGlow: true },
    particles: { enabled: true, color: '#ff00ff', style: 'sparks' },
    ui: { textColor: '#ffffff', accentColor: '#ff00ff' },
  },
  // 10. Forest Night
  {
    name: 'Forest Night',
    background: { gradient: ['#001a0d', '#002610', '#003318'], pattern: 'none', patternColor: '#33ff3308', patternScale: 1.0, parallaxLayers: 3 },
    corridor: { wallColor: '#33cc33', wallThickness: 2, fillColor: '#001a0dcc', wallGlow: false, glowColor: '#33cc3340' },
    obstacles: { primaryColor: '#339933', secondaryColor: '#66cc66', glowIntensity: 0.3 },
    player: { color: '#ccff66', trailColor: '#33cc33', trailGlow: true },
    particles: { enabled: true, color: '#ccff66', style: 'fireflies' },
    ui: { textColor: '#ccff66', accentColor: '#33cc33' },
  },
  // 11. Galaxy
  {
    name: 'Galaxy',
    background: { gradient: ['#000011', '#0a0033', '#1a0044'], pattern: 'stars', patternColor: '#ffffff20', patternScale: 1.0, parallaxLayers: 4 },
    corridor: { wallColor: '#6633cc', wallThickness: 2, fillColor: '#0a003388', wallGlow: true, glowColor: '#6633cc60' },
    obstacles: { primaryColor: '#9966ff', secondaryColor: '#ff66cc', glowIntensity: 0.7 },
    player: { color: '#ffffff', trailColor: '#9966ff', trailGlow: true },
    particles: { enabled: true, color: '#ffffff', style: 'stars' },
    ui: { textColor: '#ffffff', accentColor: '#9966ff' },
  },
  // 12. Volcanic
  {
    name: 'Volcanic',
    background: { gradient: ['#1a0a00', '#2d1500', '#401a00'], pattern: 'none', patternColor: '#ff440010', patternScale: 1.0, parallaxLayers: 2 },
    corridor: { wallColor: '#cc3300', wallThickness: 3, fillColor: '#1a0a00cc', wallGlow: true, glowColor: '#cc330080' },
    obstacles: { primaryColor: '#cc3300', secondaryColor: '#ff6600', glowIntensity: 0.9 },
    player: { color: '#ffaa00', trailColor: '#cc3300', trailGlow: true },
    particles: { enabled: true, color: '#666666', style: 'ash' },
    ui: { textColor: '#ffffff', accentColor: '#cc3300' },
  },
  // 13. Underwater Cave
  {
    name: 'Underwater Cave',
    background: { gradient: ['#000d1a', '#001a2d', '#002240'], pattern: 'dots', patternColor: '#00ffcc08', patternScale: 1.5, parallaxLayers: 3 },
    corridor: { wallColor: '#00ccaa', wallThickness: 2, fillColor: '#000d1acc', wallGlow: true, glowColor: '#00ccaa50' },
    obstacles: { primaryColor: '#00ccaa', secondaryColor: '#00ffcc', glowIntensity: 0.6 },
    player: { color: '#00ffcc', trailColor: '#00ccaa', trailGlow: true },
    particles: { enabled: true, color: '#00ffcc', style: 'bubbles' },
    ui: { textColor: '#ffffff', accentColor: '#00ccaa' },
  },
  // 14. Toxic Waste
  {
    name: 'Toxic Waste',
    background: { gradient: ['#0a1a00', '#112200', '#1a3300'], pattern: 'hexagons', patternColor: '#66ff0010', patternScale: 1.2, parallaxLayers: 2 },
    corridor: { wallColor: '#66ff00', wallThickness: 3, fillColor: '#0a1a00cc', wallGlow: true, glowColor: '#66ff0080' },
    obstacles: { primaryColor: '#66ff00', secondaryColor: '#99ff33', glowIntensity: 0.8 },
    player: { color: '#ffffff', trailColor: '#66ff00', trailGlow: true },
    particles: { enabled: true, color: '#66ff00', style: 'bubbles' },
    ui: { textColor: '#66ff00', accentColor: '#99ff33' },
  },
  // 15. Sakura
  {
    name: 'Sakura',
    background: { gradient: ['#fff0f5', '#ffe0eb', '#ffd0e0'], pattern: 'none', patternColor: '#ff99cc10', patternScale: 1.0, parallaxLayers: 2 },
    corridor: { wallColor: '#ff6699', wallThickness: 2, fillColor: '#fff0f5aa', wallGlow: false, glowColor: '#ff669940' },
    obstacles: { primaryColor: '#ff6699', secondaryColor: '#ff99bb', glowIntensity: 0.2 },
    player: { color: '#cc0044', trailColor: '#ff6699', trailGlow: false },
    particles: { enabled: true, color: '#ffaacc', style: 'petals' },
    ui: { textColor: '#990033', accentColor: '#ff6699' },
  },
  // 16. Thunderstorm
  {
    name: 'Thunderstorm',
    background: { gradient: ['#0a0a1a', '#151530', '#202045'], pattern: 'none', patternColor: '#ffffff05', patternScale: 1.0, parallaxLayers: 3 },
    corridor: { wallColor: '#8866cc', wallThickness: 3, fillColor: '#0a0a1acc', wallGlow: true, glowColor: '#8866cc80' },
    obstacles: { primaryColor: '#8866cc', secondaryColor: '#aa88ee', glowIntensity: 0.8 },
    player: { color: '#ffff99', trailColor: '#8866cc', trailGlow: true },
    particles: { enabled: true, color: '#ccccff', style: 'rain' },
    ui: { textColor: '#ffffff', accentColor: '#8866cc' },
  },
  // 17. Gold Rush
  {
    name: 'Gold Rush',
    background: { gradient: ['#1a1000', '#2d1a00', '#402600'], pattern: 'diamonds', patternColor: '#ffcc0010', patternScale: 1.0, parallaxLayers: 2 },
    corridor: { wallColor: '#ffcc00', wallThickness: 3, fillColor: '#1a1000cc', wallGlow: true, glowColor: '#ffcc0060' },
    obstacles: { primaryColor: '#ffcc00', secondaryColor: '#ffdd44', glowIntensity: 0.7 },
    player: { color: '#ffffff', trailColor: '#ffcc00', trailGlow: true },
    particles: { enabled: true, color: '#ffcc00', style: 'glitter' },
    ui: { textColor: '#ffffff', accentColor: '#ffcc00' },
  },
  // 18. Vaporwave
  {
    name: 'Vaporwave',
    background: { gradient: ['#1a0033', '#330066', '#660099'], pattern: 'grid', patternColor: '#ff66cc15', patternScale: 2.0, parallaxLayers: 3 },
    corridor: { wallColor: '#ff66cc', wallThickness: 2, fillColor: '#33006688', wallGlow: true, glowColor: '#ff66cc60' },
    obstacles: { primaryColor: '#ff66cc', secondaryColor: '#66ffff', glowIntensity: 0.8 },
    player: { color: '#ffffff', trailColor: '#ff66cc', trailGlow: true },
    particles: { enabled: true, color: '#66ffff', style: 'pixels' },
    ui: { textColor: '#ffffff', accentColor: '#ff66cc' },
  },
  // 19. Minimalist White
  {
    name: 'Minimalist White',
    background: { gradient: ['#f0f0f0', '#ffffff', '#f0f0f0'], pattern: 'none', patternColor: '#00000005', patternScale: 1.0, parallaxLayers: 0 },
    corridor: { wallColor: '#333333', wallThickness: 2, fillColor: '#ffffff', wallGlow: false, glowColor: '#33333320' },
    obstacles: { primaryColor: '#333333', secondaryColor: '#666666', glowIntensity: 0.0 },
    player: { color: '#000000', trailColor: '#333333', trailGlow: false },
    particles: { enabled: false, color: '#333333', style: 'pixels' },
    ui: { textColor: '#333333', accentColor: '#666666' },
  },
  // 20. Blood Moon
  {
    name: 'Blood Moon',
    background: { gradient: ['#0a0000', '#1a0000', '#2d0000'], pattern: 'none', patternColor: '#ff000008', patternScale: 1.0, parallaxLayers: 2 },
    corridor: { wallColor: '#cc0000', wallThickness: 3, fillColor: '#1a0000cc', wallGlow: true, glowColor: '#cc000080' },
    obstacles: { primaryColor: '#cc0000', secondaryColor: '#ff3333', glowIntensity: 0.8 },
    player: { color: '#ffffff', trailColor: '#cc0000', trailGlow: true },
    particles: { enabled: true, color: '#ff0000', style: 'dust' },
    ui: { textColor: '#ffffff', accentColor: '#cc0000' },
  },
  // 21. Steampunk
  {
    name: 'Steampunk',
    background: { gradient: ['#1a1008', '#2d1a0d', '#402610'], pattern: 'hexagons', patternColor: '#cc880015', patternScale: 1.3, parallaxLayers: 2 },
    corridor: { wallColor: '#cc8833', wallThickness: 3, fillColor: '#1a1008cc', wallGlow: false, glowColor: '#cc883340' },
    obstacles: { primaryColor: '#cc8833', secondaryColor: '#ddaa55', glowIntensity: 0.3 },
    player: { color: '#ffdd88', trailColor: '#cc8833', trailGlow: false },
    particles: { enabled: true, color: '#cc8833', style: 'sparks' },
    ui: { textColor: '#ffdd88', accentColor: '#cc8833' },
  },
  // 22. Holographic
  {
    name: 'Holographic',
    background: { gradient: ['#0d0d1a', '#1a1a33', '#26264d'], pattern: 'grid', patternColor: '#ffffff10', patternScale: 1.0, parallaxLayers: 3 },
    corridor: { wallColor: '#66ccff', wallThickness: 2, fillColor: '#1a1a33aa', wallGlow: true, glowColor: '#66ccff60' },
    obstacles: { primaryColor: '#66ccff', secondaryColor: '#ff66cc', glowIntensity: 0.9 },
    player: { color: '#ffffff', trailColor: '#66ccff', trailGlow: true },
    particles: { enabled: true, color: '#ccffff', style: 'glitter' },
    ui: { textColor: '#ffffff', accentColor: '#66ccff' },
  },
  // 23. Pixel Art
  {
    name: 'Pixel Art',
    background: { gradient: ['#1a1a2e', '#16213e', '#0f3460'], pattern: 'grid', patternColor: '#ffffff08', patternScale: 0.5, parallaxLayers: 1 },
    corridor: { wallColor: '#e94560', wallThickness: 3, fillColor: '#16213ecc', wallGlow: false, glowColor: '#e9456040' },
    obstacles: { primaryColor: '#e94560', secondaryColor: '#533483', glowIntensity: 0.2 },
    player: { color: '#ffffff', trailColor: '#e94560', trailGlow: false },
    particles: { enabled: true, color: '#e94560', style: 'pixels' },
    ui: { textColor: '#ffffff', accentColor: '#e94560' },
  },
  // 24. Jungle
  {
    name: 'Jungle',
    background: { gradient: ['#0a1a00', '#153300', '#1a4d00'], pattern: 'none', patternColor: '#33ff0008', patternScale: 1.0, parallaxLayers: 3 },
    corridor: { wallColor: '#33aa00', wallThickness: 3, fillColor: '#0a1a00cc', wallGlow: false, glowColor: '#33aa0040' },
    obstacles: { primaryColor: '#33aa00', secondaryColor: '#66cc33', glowIntensity: 0.3 },
    player: { color: '#ffff00', trailColor: '#33aa00', trailGlow: false },
    particles: { enabled: true, color: '#66cc33', style: 'fireflies' },
    ui: { textColor: '#ffffff', accentColor: '#33aa00' },
  },
  // 25. Space Station
  {
    name: 'Space Station',
    background: { gradient: ['#0a0a0f', '#15151f', '#20202f'], pattern: 'circuits', patternColor: '#66aaff10', patternScale: 1.0, parallaxLayers: 2 },
    corridor: { wallColor: '#6688aa', wallThickness: 3, fillColor: '#0a0a0fcc', wallGlow: false, glowColor: '#6688aa40' },
    obstacles: { primaryColor: '#6688aa', secondaryColor: '#88aacc', glowIntensity: 0.4 },
    player: { color: '#ffffff', trailColor: '#6688aa', trailGlow: false },
    particles: { enabled: true, color: '#88aacc', style: 'sparks' },
    ui: { textColor: '#ffffff', accentColor: '#6688aa' },
  },
  // 26. Frozen Tundra
  {
    name: 'Frozen Tundra',
    background: { gradient: ['#d0e8f0', '#e0f0f8', '#f0f8ff'], pattern: 'diamonds', patternColor: '#ffffff40', patternScale: 1.5, parallaxLayers: 2 },
    corridor: { wallColor: '#6699bb', wallThickness: 2, fillColor: '#e0f0f8cc', wallGlow: false, glowColor: '#6699bb30' },
    obstacles: { primaryColor: '#4477aa', secondaryColor: '#6699bb', glowIntensity: 0.2 },
    player: { color: '#003366', trailColor: '#6699bb', trailGlow: false },
    particles: { enabled: true, color: '#ffffff', style: 'snow' },
    ui: { textColor: '#003366', accentColor: '#4477aa' },
  },
  // 27. Autumn Forest
  {
    name: 'Autumn Forest',
    background: { gradient: ['#1a0d00', '#332200', '#4d3300'], pattern: 'none', patternColor: '#ff880010', patternScale: 1.0, parallaxLayers: 3 },
    corridor: { wallColor: '#cc6600', wallThickness: 3, fillColor: '#1a0d00cc', wallGlow: false, glowColor: '#cc660040' },
    obstacles: { primaryColor: '#cc6600', secondaryColor: '#cc3300', glowIntensity: 0.3 },
    player: { color: '#ffcc00', trailColor: '#cc6600', trailGlow: false },
    particles: { enabled: true, color: '#cc6600', style: 'petals' },
    ui: { textColor: '#ffffff', accentColor: '#cc6600' },
  },
  // 28. Neon Tokyo
  {
    name: 'Neon Tokyo',
    background: { gradient: ['#0a0015', '#15002a', '#200040'], pattern: 'grid', patternColor: '#ff006620', patternScale: 1.0, parallaxLayers: 3 },
    corridor: { wallColor: '#ff0066', wallThickness: 2, fillColor: '#15002acc', wallGlow: true, glowColor: '#ff006680' },
    obstacles: { primaryColor: '#ff0066', secondaryColor: '#00ffcc', glowIntensity: 1.0 },
    player: { color: '#ffffff', trailColor: '#ff0066', trailGlow: true },
    particles: { enabled: true, color: '#ff0066', style: 'sparks' },
    ui: { textColor: '#ffffff', accentColor: '#ff0066' },
  },
  // 29. Aztec Gold
  {
    name: 'Aztec Gold',
    background: { gradient: ['#1a1500', '#2d2200', '#403300'], pattern: 'triangles', patternColor: '#ffaa0012', patternScale: 1.0, parallaxLayers: 2 },
    corridor: { wallColor: '#ddaa00', wallThickness: 3, fillColor: '#1a1500cc', wallGlow: false, glowColor: '#ddaa0040' },
    obstacles: { primaryColor: '#ddaa00', secondaryColor: '#ffcc33', glowIntensity: 0.4 },
    player: { color: '#ffffff', trailColor: '#ddaa00', trailGlow: false },
    particles: { enabled: true, color: '#ffcc33', style: 'dust' },
    ui: { textColor: '#ffffff', accentColor: '#ddaa00' },
  },
  // 30. Deep Space
  {
    name: 'Deep Space',
    background: { gradient: ['#000005', '#00000f', '#00001a'], pattern: 'stars', patternColor: '#ffffff15', patternScale: 1.0, parallaxLayers: 4 },
    corridor: { wallColor: '#3344aa', wallThickness: 2, fillColor: '#00000faa', wallGlow: true, glowColor: '#3344aa60' },
    obstacles: { primaryColor: '#3344aa', secondaryColor: '#5566cc', glowIntensity: 0.6 },
    player: { color: '#ffffff', trailColor: '#3344aa', trailGlow: true },
    particles: { enabled: true, color: '#ffffff', style: 'stars' },
    ui: { textColor: '#ffffff', accentColor: '#5566cc' },
  },
  // 31. Coral Reef
  {
    name: 'Coral Reef',
    background: { gradient: ['#001a2d', '#002840', '#003355'], pattern: 'waves', patternColor: '#ff664410', patternScale: 1.5, parallaxLayers: 3 },
    corridor: { wallColor: '#ff6644', wallThickness: 2, fillColor: '#001a2dcc', wallGlow: false, glowColor: '#ff664440' },
    obstacles: { primaryColor: '#ff6644', secondaryColor: '#00ccaa', glowIntensity: 0.5 },
    player: { color: '#ffcc44', trailColor: '#ff6644', trailGlow: false },
    particles: { enabled: true, color: '#00ccaa', style: 'bubbles' },
    ui: { textColor: '#ffffff', accentColor: '#ff6644' },
  },
  // 32. Northern Lights
  {
    name: 'Northern Lights',
    background: { gradient: ['#000d1a', '#001a26', '#002633'], pattern: 'none', patternColor: '#00ff8810', patternScale: 1.0, parallaxLayers: 3 },
    corridor: { wallColor: '#00ff88', wallThickness: 2, fillColor: '#000d1acc', wallGlow: true, glowColor: '#00ff8860' },
    obstacles: { primaryColor: '#00ff88', secondaryColor: '#00ccff', glowIntensity: 0.7 },
    player: { color: '#ffffff', trailColor: '#00ff88', trailGlow: true },
    particles: { enabled: true, color: '#00ff88', style: 'dust' },
    ui: { textColor: '#ffffff', accentColor: '#00ff88' },
  },
  // 33. Sandstorm
  {
    name: 'Sandstorm',
    background: { gradient: ['#2d2200', '#4d3a00', '#665500'], pattern: 'dots', patternColor: '#ffcc6615', patternScale: 1.0, parallaxLayers: 2 },
    corridor: { wallColor: '#cc9933', wallThickness: 3, fillColor: '#2d2200cc', wallGlow: false, glowColor: '#cc993340' },
    obstacles: { primaryColor: '#cc9933', secondaryColor: '#ddbb55', glowIntensity: 0.3 },
    player: { color: '#ffffff', trailColor: '#cc9933', trailGlow: false },
    particles: { enabled: true, color: '#ccaa55', style: 'dust' },
    ui: { textColor: '#ffffff', accentColor: '#cc9933' },
  },
  // 34. Crystal Cave
  {
    name: 'Crystal Cave',
    background: { gradient: ['#0d001a', '#1a0033', '#2a0055'], pattern: 'diamonds', patternColor: '#cc66ff15', patternScale: 0.8, parallaxLayers: 3 },
    corridor: { wallColor: '#cc66ff', wallThickness: 2, fillColor: '#0d001acc', wallGlow: true, glowColor: '#cc66ff70' },
    obstacles: { primaryColor: '#cc66ff', secondaryColor: '#ff99ff', glowIntensity: 0.8 },
    player: { color: '#ffffff', trailColor: '#cc66ff', trailGlow: true },
    particles: { enabled: true, color: '#ff99ff', style: 'glitter' },
    ui: { textColor: '#ffffff', accentColor: '#cc66ff' },
  },
  // 35. Electric Storm
  {
    name: 'Electric Storm',
    background: { gradient: ['#050510', '#0a0a20', '#101035'], pattern: 'none', patternColor: '#ffff0008', patternScale: 1.0, parallaxLayers: 2 },
    corridor: { wallColor: '#ffff00', wallThickness: 2, fillColor: '#0a0a20cc', wallGlow: true, glowColor: '#ffff0080' },
    obstacles: { primaryColor: '#ffff00', secondaryColor: '#ffcc00', glowIntensity: 1.0 },
    player: { color: '#ffffff', trailColor: '#ffff00', trailGlow: true },
    particles: { enabled: true, color: '#ffff66', style: 'sparks' },
    ui: { textColor: '#ffffff', accentColor: '#ffff00' },
  },
  // 36. Midnight Blue
  {
    name: 'Midnight Blue',
    background: { gradient: ['#000022', '#000044', '#000066'], pattern: 'stars', patternColor: '#ffffff10', patternScale: 1.0, parallaxLayers: 3 },
    corridor: { wallColor: '#0044cc', wallThickness: 2, fillColor: '#000044cc', wallGlow: true, glowColor: '#0044cc60' },
    obstacles: { primaryColor: '#0044cc', secondaryColor: '#0066ff', glowIntensity: 0.6 },
    player: { color: '#ffffff', trailColor: '#0066ff', trailGlow: true },
    particles: { enabled: true, color: '#0066ff', style: 'stars' },
    ui: { textColor: '#ffffff', accentColor: '#0066ff' },
  },
  // 37. Emerald
  {
    name: 'Emerald',
    background: { gradient: ['#001a0d', '#003320', '#004d33'], pattern: 'hexagons', patternColor: '#00ff6610', patternScale: 1.2, parallaxLayers: 2 },
    corridor: { wallColor: '#00cc66', wallThickness: 2, fillColor: '#001a0dcc', wallGlow: true, glowColor: '#00cc6660' },
    obstacles: { primaryColor: '#00cc66', secondaryColor: '#00ff88', glowIntensity: 0.6 },
    player: { color: '#ffffff', trailColor: '#00cc66', trailGlow: true },
    particles: { enabled: true, color: '#00ff88', style: 'glitter' },
    ui: { textColor: '#ffffff', accentColor: '#00cc66' },
  },
  // 38. Inferno
  {
    name: 'Inferno',
    background: { gradient: ['#1a0000', '#2d0000', '#440000'], pattern: 'waves', patternColor: '#ff000010', patternScale: 2.0, parallaxLayers: 2 },
    corridor: { wallColor: '#ff3300', wallThickness: 3, fillColor: '#1a0000cc', wallGlow: true, glowColor: '#ff330090' },
    obstacles: { primaryColor: '#ff3300', secondaryColor: '#ff6600', glowIntensity: 1.0 },
    player: { color: '#ffff00', trailColor: '#ff3300', trailGlow: true },
    particles: { enabled: true, color: '#ff4400', style: 'fire' },
    ui: { textColor: '#ffffff', accentColor: '#ff3300' },
  },
  // 39. Bubblegum
  {
    name: 'Bubblegum',
    background: { gradient: ['#ff99cc', '#ffaadd', '#ffbbee'], pattern: 'dots', patternColor: '#ffffff30', patternScale: 0.8, parallaxLayers: 1 },
    corridor: { wallColor: '#ff3388', wallThickness: 3, fillColor: '#ffaaddaa', wallGlow: false, glowColor: '#ff338840' },
    obstacles: { primaryColor: '#ff3388', secondaryColor: '#ff66aa', glowIntensity: 0.2 },
    player: { color: '#990033', trailColor: '#ff3388', trailGlow: false },
    particles: { enabled: true, color: '#ff66aa', style: 'bubbles' },
    ui: { textColor: '#990033', accentColor: '#ff3388' },
  },
  // 40. Monochrome
  {
    name: 'Monochrome',
    background: { gradient: ['#111111', '#1a1a1a', '#222222'], pattern: 'grid', patternColor: '#ffffff08', patternScale: 1.0, parallaxLayers: 1 },
    corridor: { wallColor: '#cccccc', wallThickness: 2, fillColor: '#111111cc', wallGlow: false, glowColor: '#cccccc30' },
    obstacles: { primaryColor: '#cccccc', secondaryColor: '#888888', glowIntensity: 0.2 },
    player: { color: '#ffffff', trailColor: '#cccccc', trailGlow: false },
    particles: { enabled: true, color: '#888888', style: 'pixels' },
    ui: { textColor: '#ffffff', accentColor: '#cccccc' },
  },
  // 41. Cherry Blossom
  {
    name: 'Cherry Blossom',
    background: { gradient: ['#2d001a', '#440028', '#550033'], pattern: 'none', patternColor: '#ff66aa08', patternScale: 1.0, parallaxLayers: 2 },
    corridor: { wallColor: '#ff4488', wallThickness: 2, fillColor: '#2d001acc', wallGlow: true, glowColor: '#ff448860' },
    obstacles: { primaryColor: '#ff4488', secondaryColor: '#ff88bb', glowIntensity: 0.5 },
    player: { color: '#ffffff', trailColor: '#ff4488', trailGlow: true },
    particles: { enabled: true, color: '#ff99cc', style: 'petals' },
    ui: { textColor: '#ffffff', accentColor: '#ff4488' },
  },
  // 42. Radioactive
  {
    name: 'Radioactive',
    background: { gradient: ['#0a0d00', '#151f00', '#1f2f00'], pattern: 'hexagons', patternColor: '#aaff0010', patternScale: 1.0, parallaxLayers: 2 },
    corridor: { wallColor: '#aaff00', wallThickness: 3, fillColor: '#0a0d00cc', wallGlow: true, glowColor: '#aaff0080' },
    obstacles: { primaryColor: '#aaff00', secondaryColor: '#ccff33', glowIntensity: 0.9 },
    player: { color: '#ffffff', trailColor: '#aaff00', trailGlow: true },
    particles: { enabled: true, color: '#aaff00', style: 'sparks' },
    ui: { textColor: '#aaff00', accentColor: '#ccff33' },
  },
  // 43. Twilight
  {
    name: 'Twilight',
    background: { gradient: ['#1a0033', '#2d1155', '#441177'], pattern: 'stars', patternColor: '#ffffff10', patternScale: 1.0, parallaxLayers: 3 },
    corridor: { wallColor: '#8844cc', wallThickness: 2, fillColor: '#1a003399', wallGlow: true, glowColor: '#8844cc60' },
    obstacles: { primaryColor: '#8844cc', secondaryColor: '#aa66ee', glowIntensity: 0.6 },
    player: { color: '#ffcc66', trailColor: '#8844cc', trailGlow: true },
    particles: { enabled: true, color: '#aa66ee', style: 'fireflies' },
    ui: { textColor: '#ffffff', accentColor: '#8844cc' },
  },
  // 44. Ice Cream
  {
    name: 'Ice Cream',
    background: { gradient: ['#ffe8d6', '#ffd4b8', '#ffc0a0'], pattern: 'dots', patternColor: '#ff885520', patternScale: 0.8, parallaxLayers: 1 },
    corridor: { wallColor: '#cc6633', wallThickness: 3, fillColor: '#ffe8d6aa', wallGlow: false, glowColor: '#cc663340' },
    obstacles: { primaryColor: '#cc6633', secondaryColor: '#ff9966', glowIntensity: 0.2 },
    player: { color: '#663300', trailColor: '#cc6633', trailGlow: false },
    particles: { enabled: true, color: '#ff9966', style: 'dust' },
    ui: { textColor: '#663300', accentColor: '#cc6633' },
  },
  // 45. Phantom
  {
    name: 'Phantom',
    background: { gradient: ['#0a0a0a', '#151515', '#1f1f1f'], pattern: 'none', patternColor: '#ffffff05', patternScale: 1.0, parallaxLayers: 1 },
    corridor: { wallColor: '#555555', wallThickness: 2, fillColor: '#0a0a0acc', wallGlow: false, glowColor: '#55555540' },
    obstacles: { primaryColor: '#555555', secondaryColor: '#777777', glowIntensity: 0.1 },
    player: { color: '#ffffff', trailColor: '#555555', trailGlow: false },
    particles: { enabled: true, color: '#444444', style: 'dust' },
    ui: { textColor: '#ffffff', accentColor: '#777777' },
  },
  // 46. Solar Flare
  {
    name: 'Solar Flare',
    background: { gradient: ['#1a0800', '#331500', '#4d2200'], pattern: 'waves', patternColor: '#ffcc0010', patternScale: 1.5, parallaxLayers: 2 },
    corridor: { wallColor: '#ffaa00', wallThickness: 3, fillColor: '#1a0800cc', wallGlow: true, glowColor: '#ffaa0080' },
    obstacles: { primaryColor: '#ffaa00', secondaryColor: '#ffcc44', glowIntensity: 0.9 },
    player: { color: '#ffffff', trailColor: '#ffaa00', trailGlow: true },
    particles: { enabled: true, color: '#ffcc44', style: 'fire' },
    ui: { textColor: '#ffffff', accentColor: '#ffaa00' },
  },
  // 47. Cyberpunk Yellow
  {
    name: 'Cyberpunk Yellow',
    background: { gradient: ['#0d0d00', '#1a1a00', '#2d2d00'], pattern: 'circuits', patternColor: '#ffff0010', patternScale: 1.0, parallaxLayers: 2 },
    corridor: { wallColor: '#ffff00', wallThickness: 2, fillColor: '#0d0d00cc', wallGlow: true, glowColor: '#ffff0060' },
    obstacles: { primaryColor: '#ffff00', secondaryColor: '#cccc00', glowIntensity: 0.8 },
    player: { color: '#ffffff', trailColor: '#ffff00', trailGlow: true },
    particles: { enabled: true, color: '#ffff44', style: 'sparks' },
    ui: { textColor: '#ffff00', accentColor: '#cccc00' },
  },
  // 48. Rose Garden
  {
    name: 'Rose Garden',
    background: { gradient: ['#1a000d', '#2d001a', '#440026'], pattern: 'none', patternColor: '#ff335510', patternScale: 1.0, parallaxLayers: 2 },
    corridor: { wallColor: '#cc2255', wallThickness: 2, fillColor: '#1a000dcc', wallGlow: true, glowColor: '#cc225560' },
    obstacles: { primaryColor: '#cc2255', secondaryColor: '#ff4477', glowIntensity: 0.5 },
    player: { color: '#ffffff', trailColor: '#cc2255', trailGlow: true },
    particles: { enabled: true, color: '#ff6699', style: 'petals' },
    ui: { textColor: '#ffffff', accentColor: '#cc2255' },
  },
  // 49. Tron Legacy
  {
    name: 'Tron Legacy',
    background: { gradient: ['#000000', '#050510', '#0a0a1a'], pattern: 'grid', patternColor: '#00ccff12', patternScale: 1.5, parallaxLayers: 2 },
    corridor: { wallColor: '#00ccff', wallThickness: 2, fillColor: '#000000cc', wallGlow: true, glowColor: '#00ccff80' },
    obstacles: { primaryColor: '#00ccff', secondaryColor: '#ff6600', glowIntensity: 1.0 },
    player: { color: '#ffffff', trailColor: '#00ccff', trailGlow: true },
    particles: { enabled: true, color: '#00ccff', style: 'pixels' },
    ui: { textColor: '#ffffff', accentColor: '#00ccff' },
  },
  // 50. Alien World
  {
    name: 'Alien World',
    background: { gradient: ['#001a0a', '#00330f', '#004d15'], pattern: 'hexagons', patternColor: '#00ff4410', patternScale: 1.3, parallaxLayers: 3 },
    corridor: { wallColor: '#00dd44', wallThickness: 2, fillColor: '#001a0acc', wallGlow: true, glowColor: '#00dd4470' },
    obstacles: { primaryColor: '#00dd44', secondaryColor: '#88ff00', glowIntensity: 0.7 },
    player: { color: '#ffffff', trailColor: '#00dd44', trailGlow: true },
    particles: { enabled: true, color: '#88ff00', style: 'bubbles' },
    ui: { textColor: '#ffffff', accentColor: '#00dd44' },
  },
  // 51. Pastel Dream
  {
    name: 'Pastel Dream',
    background: { gradient: ['#e8d5f5', '#d5e8f5', '#d5f5e8'], pattern: 'waves', patternColor: '#ffffff20', patternScale: 2.0, parallaxLayers: 2 },
    corridor: { wallColor: '#aa77cc', wallThickness: 2, fillColor: '#e8d5f5aa', wallGlow: false, glowColor: '#aa77cc30' },
    obstacles: { primaryColor: '#aa77cc', secondaryColor: '#77aacc', glowIntensity: 0.2 },
    player: { color: '#553377', trailColor: '#aa77cc', trailGlow: false },
    particles: { enabled: true, color: '#cc99ee', style: 'stars' },
    ui: { textColor: '#553377', accentColor: '#aa77cc' },
  },
  // 52. Copper Wire
  {
    name: 'Copper Wire',
    background: { gradient: ['#0d0808', '#1a1010', '#261818'], pattern: 'circuits', patternColor: '#cc664410', patternScale: 1.0, parallaxLayers: 2 },
    corridor: { wallColor: '#cc6644', wallThickness: 3, fillColor: '#0d0808cc', wallGlow: true, glowColor: '#cc664460' },
    obstacles: { primaryColor: '#cc6644', secondaryColor: '#dd8866', glowIntensity: 0.5 },
    player: { color: '#ffddcc', trailColor: '#cc6644', trailGlow: true },
    particles: { enabled: true, color: '#dd8866', style: 'sparks' },
    ui: { textColor: '#ffddcc', accentColor: '#cc6644' },
  },
  // 53. Neon Mint
  {
    name: 'Neon Mint',
    background: { gradient: ['#001a15', '#003328', '#004d3b'], pattern: 'dots', patternColor: '#00ffaa10', patternScale: 1.0, parallaxLayers: 2 },
    corridor: { wallColor: '#00ffaa', wallThickness: 2, fillColor: '#001a15cc', wallGlow: true, glowColor: '#00ffaa80' },
    obstacles: { primaryColor: '#00ffaa', secondaryColor: '#44ffcc', glowIntensity: 0.8 },
    player: { color: '#ffffff', trailColor: '#00ffaa', trailGlow: true },
    particles: { enabled: true, color: '#44ffcc', style: 'sparks' },
    ui: { textColor: '#ffffff', accentColor: '#00ffaa' },
  },
  // 54. Magma Core
  {
    name: 'Magma Core',
    background: { gradient: ['#0d0000', '#1a0500', '#2d0a00'], pattern: 'waves', patternColor: '#ff220010', patternScale: 1.8, parallaxLayers: 2 },
    corridor: { wallColor: '#ff2200', wallThickness: 3, fillColor: '#0d0000dd', wallGlow: true, glowColor: '#ff220090' },
    obstacles: { primaryColor: '#ff2200', secondaryColor: '#ff5500', glowIntensity: 1.0 },
    player: { color: '#ffcc00', trailColor: '#ff2200', trailGlow: true },
    particles: { enabled: true, color: '#ff5500', style: 'fire' },
    ui: { textColor: '#ffffff', accentColor: '#ff2200' },
  },
  // 55. Winter Night
  {
    name: 'Winter Night',
    background: { gradient: ['#0a0f1a', '#152030', '#1a2845'], pattern: 'stars', patternColor: '#ffffff10', patternScale: 1.0, parallaxLayers: 3 },
    corridor: { wallColor: '#6688bb', wallThickness: 2, fillColor: '#0a0f1acc', wallGlow: false, glowColor: '#6688bb40' },
    obstacles: { primaryColor: '#6688bb', secondaryColor: '#88aadd', glowIntensity: 0.3 },
    player: { color: '#ffffff', trailColor: '#88aadd', trailGlow: false },
    particles: { enabled: true, color: '#ffffff', style: 'snow' },
    ui: { textColor: '#ffffff', accentColor: '#88aadd' },
  },
];
