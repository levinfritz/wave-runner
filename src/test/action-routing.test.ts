import { describe, it, expect } from 'vitest';

/**
 * Tests for the action routing logic in main.ts.
 * Since main.ts is tightly coupled to the DOM, we extract and test
 * the routing logic that caused the level_select bug.
 */

// Simulate the action routing logic from handleAction
function routeAction(action: string): string {
  // Confirmed purchase actions
  if (action.startsWith('confirm_skin_')) return 'confirm_skin';
  if (action.startsWith('confirm_trail_')) return 'confirm_trail';

  // Skin/trail purchase
  if (action.startsWith('skin_')) return 'skin_purchase';
  if (action.startsWith('trail_')) return 'trail_purchase';

  // Level start — must NOT match 'level_select'
  if (action.startsWith('level_') && action !== 'level_select') {
    const levelIdx = parseInt(action.slice(6), 10);
    if (!isNaN(levelIdx)) return `start_level_${levelIdx}`;
    return 'invalid_level';
  }

  // Named actions
  switch (action) {
    case 'endless': return 'start_endless';
    case 'daily': return 'start_daily';
    case 'level_select': return 'navigate_level_select';
    case 'shop': return 'navigate_shop';
    case 'achievements': return 'navigate_achievements';
    case 'settings': return 'navigate_settings';
    case 'back': return 'navigate_back';
    case 'retry': return 'retry_game';
    case 'menu': return 'go_to_menu';
    case 'resume': return 'resume_game';
    case 'toggle_music': return 'toggle_music';
    case 'toggle_sfx': return 'toggle_sfx';
    case 'toggle_particles': return 'toggle_particles';
    case 'toggle_shake': return 'toggle_shake';
    case 'toggle_fullscreen': return 'toggle_fullscreen';
    default: return 'unknown';
  }
}

describe('Action routing', () => {
  it('should route level_select to navigation, not level start', () => {
    expect(routeAction('level_select')).toBe('navigate_level_select');
  });

  it('should route level_0 to start level 0', () => {
    expect(routeAction('level_0')).toBe('start_level_0');
  });

  it('should route level_11 to start level 11', () => {
    expect(routeAction('level_11')).toBe('start_level_11');
  });

  it('should route endless to start endless', () => {
    expect(routeAction('endless')).toBe('start_endless');
  });

  it('should route daily to start daily', () => {
    expect(routeAction('daily')).toBe('start_daily');
  });

  it('should route skin_ prefix to skin purchase', () => {
    expect(routeAction('skin_arrow')).toBe('skin_purchase');
  });

  it('should route trail_ prefix to trail purchase', () => {
    expect(routeAction('trail_fire')).toBe('trail_purchase');
  });

  it('should route confirm_skin_ prefix to confirm skin', () => {
    expect(routeAction('confirm_skin_star')).toBe('confirm_skin');
  });

  it('should route confirm_trail_ prefix to confirm trail', () => {
    expect(routeAction('confirm_trail_neon')).toBe('confirm_trail');
  });

  it('should route all settings toggles correctly', () => {
    expect(routeAction('toggle_music')).toBe('toggle_music');
    expect(routeAction('toggle_sfx')).toBe('toggle_sfx');
    expect(routeAction('toggle_particles')).toBe('toggle_particles');
    expect(routeAction('toggle_shake')).toBe('toggle_shake');
    expect(routeAction('toggle_fullscreen')).toBe('toggle_fullscreen');
  });

  it('should route navigation actions correctly', () => {
    expect(routeAction('shop')).toBe('navigate_shop');
    expect(routeAction('achievements')).toBe('navigate_achievements');
    expect(routeAction('settings')).toBe('navigate_settings');
    expect(routeAction('back')).toBe('navigate_back');
  });

  it('should route game actions correctly', () => {
    expect(routeAction('retry')).toBe('retry_game');
    expect(routeAction('menu')).toBe('go_to_menu');
    expect(routeAction('resume')).toBe('resume_game');
  });
});
