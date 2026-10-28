import { describe, expect, it } from 'vitest';
import { defaultOnlyCurrentGeneration } from './gamePreferences';

describe('defaultOnlyCurrentGeneration', () => {
  it('is disabled for Generation I', () => {
    expect(defaultOnlyCurrentGeneration('red', 1)).toBe(false);
  });

  it('is enabled by default for original Black and White', () => {
    expect(defaultOnlyCurrentGeneration('black', 5)).toBe(true);
    expect(defaultOnlyCurrentGeneration('white', 5)).toBe(true);
  });

  it('stays optional in other games from Generation II onward', () => {
    expect(defaultOnlyCurrentGeneration('black-2', 5)).toBe(false);
    expect(defaultOnlyCurrentGeneration('sword', 8)).toBe(false);
  });
});
