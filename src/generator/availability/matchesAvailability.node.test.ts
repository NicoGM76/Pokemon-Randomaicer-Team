// @ts-nocheck
import test from 'node:test';
import assert from 'node:assert/strict';
import { matchesAvailability } from './matchesAvailability';

const packs = [
  { id: 'scarlet-base', gameId: 'scarlet', name: 'Base', type: 'base', unlockCondition: 'none' },
  { id: 'teal-mask', gameId: 'scarlet', name: 'Teal Mask', type: 'dlc', requiredContentPacks: ['scarlet-base'], unlockCondition: 'early_story' },
  { id: 'indigo-disk', gameId: 'scarlet', name: 'Indigo Disk', type: 'dlc', requiredContentPacks: ['scarlet-base','teal-mask'], unlockCondition: 'main_story_completed' }
];
const config = (overrides = {}) => ({
  gameId: 'scarlet', enabledContentPacks: ['scarlet-base'], teamSize: 6, stage: 'main_story', mode: 'random',
  allowedMethods: ['wild','gift'], allowTradeEvolution: false, starterRule: 'allow', legendaryRule: 'allow', ...overrides
});
const rule = (overrides = {}) => ({ pokemonId: 1, gameId: 'scarlet', contentPackId: 'scarlet-base', stage: 'main_story', method: 'wild', ...overrides });

test('accepts enabled base-game rule and rejects another game', () => {
  assert.equal(matchesAvailability(rule(), config(), packs), true);
  assert.equal(matchesAvailability(rule({ gameId: 'violet' }), config(), packs), false);
});

test('requires dlc to be enabled and its prerequisites enabled', () => {
  const teal = rule({ contentPackId: 'teal-mask' });
  assert.equal(matchesAvailability(teal, config(), packs), false);
  assert.equal(matchesAvailability(teal, config({ enabledContentPacks: ['scarlet-base','teal-mask'] }), packs), true);
  const indigo = rule({ contentPackId: 'indigo-disk', stage: 'postgame' });
  assert.equal(matchesAvailability(indigo, config({ stage:'postgame', enabledContentPacks: ['scarlet-base','indigo-disk'] }), packs), false);
});

test('uses exact stage except all', () => {
  assert.equal(matchesAvailability(rule({ stage:'postgame' }), config({ stage:'main_story' }), packs), false);
  assert.equal(matchesAvailability(rule({ stage:'postgame' }), config({ stage:'all' }), packs), true);
});

test('checks acquisition method and unlock progress', () => {
  assert.equal(matchesAvailability(rule({ method:'home' }), config(), packs), false);
  const indigo = rule({ contentPackId: 'indigo-disk', stage: 'postgame' });
  const enabled = ['scarlet-base','teal-mask','indigo-disk'];
  assert.equal(matchesAvailability(indigo, config({ stage:'main_story', enabledContentPacks: enabled }), packs), false);
  assert.equal(matchesAvailability(indigo, config({ stage:'postgame', enabledContentPacks: enabled }), packs), true);
});
