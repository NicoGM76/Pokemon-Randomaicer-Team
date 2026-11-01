/** @vitest-environment jsdom */
import { beforeEach, describe, expect, it } from 'vitest';
import type { GenerationResult, GeneratorConfig } from '../domain/teams/types';
import { ADVENTURE_DRAFT_KEY, clearAdventureDraft, loadAdventureDraft, saveAdventureDraft } from './adventureDraft';

const config: GeneratorConfig = {
  gameId: 'black',
  enabledContentPacks: ['black-base'],
  teamSize: 6,
  stage: 'all',
  mode: 'adventure',
  allowedMethods: ['wild', 'gift', 'evolution'],
  allowTradeEvolution: false,
  starterRule: 'require_one',
  legendaryRule: 'exclude',
  customRules: { onlyCurrentGeneration: true }
};

const result: GenerationResult = {
  team: [],
  requestedSize: 6,
  generatedSize: 0,
  complete: false,
  validation: { valid: false, issues: [] },
  warnings: []
};

beforeEach(() => localStorage.clear());

describe('adventure draft', () => {
  it('restores config, result and notice', () => {
    saveAdventureDraft({ config, result, notice: 'en progreso' });
    expect(loadAdventureDraft()).toEqual({ config, result, notice: 'en progreso' });
  });

  it('ignores incompatible stored versions', () => {
    localStorage.setItem(ADVENTURE_DRAFT_KEY, JSON.stringify({ version: 999, value: { config, result, notice: 'viejo' } }));
    expect(loadAdventureDraft()).toBeNull();
  });

  it('can clear the current draft', () => {
    saveAdventureDraft({ config, result, notice: '' });
    clearAdventureDraft();
    expect(loadAdventureDraft()).toBeNull();
  });
});
