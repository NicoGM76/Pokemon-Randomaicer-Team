import { describe, expect, it } from 'vitest';
import { itemDisplay, searchItems, isKnownItem } from './items';

describe('curated bilingual item suggestions', () => {
  it('suggests Restos for "res" and saves official canonical item', () => {
    const results = searchItems('res', 'es-419');
    expect(results[0]?.id).toBe('Leftovers');
    expect(itemDisplay('Leftovers','es-ES')).toBe('Restos');
    expect(isKnownItem('Leftovers')).toBe(true);
    expect(isKnownItem('Fake Item')).toBe(false);
  });
  it('recognizes common English names and Mega Stones', () => {
    expect(searchItems('charizard', 'es-ES').some(entry => entry.id === 'Charizardite X')).toBe(true);
    expect(searchItems('life orb','es-419')[0]?.id).toBe('Life Orb');
  });
});
