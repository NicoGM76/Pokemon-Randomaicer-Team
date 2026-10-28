// @ts-nocheck
import test from 'node:test';
import assert from 'node:assert/strict';
import { validateDataset } from '../scripts/validate-data';

const base = () => ({
  metadata: { schemaVersion: 2, datasetVersion: 'test', generatedAt: '2026-10-23' },
  pokemon: [{ id: 1, name: 'A', types: ['grass'], introducedGeneration: 1, evolutionFamilyId: 'a', stats: { hp: 1, attack: 1, defense: 1, specialAttack: 1, specialDefense: 1, speed: 1 }, specialTags: [], isPseudoLegendary: false, isFossil: false, isStarter: false }],
  forms: [{ id: 'a-form', pokemonId: 1, name: 'A Form', formType: 'regional', countsAsSameSpecies: true }],
  generations: [{ id: 'gen-1', number: 1, name: 'Generación 1' }],
  gameFamilies: [{ id: 'family-a', name: 'Family A', generation: 1, gameIds: ['game-a'], dexIds: ['dex-a'] }],
  games: [{ id: 'game-a', name: 'Game A', generation: 1, familyId: 'family-a', dexIds: ['dex-a'] }],
  contentPacks: [{ id: 'game-a-base', gameId: 'game-a', name: 'Base', type: 'base', dexIds: ['dex-a'] }],
  regionalDexes: [{ id: 'dex-a', name: 'Dex A', region: 'A', entryCount: 1, kind: 'regional', entryStatus: 'reviewed' }],
  mechanicCatalogs: [],
  availability: [{ pokemonId: 1, formId: 'a-form', gameId: 'game-a', contentPackId: 'game-a-base', stage: 'main_story', method: 'wild' }],
  evolutions: []
});

test('rejects availability with unknown game', () => {
  const data = base();
  data.availability[0].gameId = 'missing';
  assert.throws(() => validateDataset(data), /unknown gameId/);
});

test('rejects unknown content pack and form references', () => {
  const data = base();
  data.availability[0].contentPackId = 'missing-pack';
  assert.throws(() => validateDataset(data), /unknown contentPackId/);
  data.availability[0].contentPackId = 'game-a-base';
  data.availability[0].formId = 'missing-form';
  assert.throws(() => validateDataset(data), /unknown formId/);
});

test('rejects evolution endpoints that do not exist', () => {
  const data = base();
  data.evolutions.push({ fromId: 1, toId: 999, conditions: [] });
  assert.throws(() => validateDataset(data), /unknown evolution pokemon/);
});

test('rejects duplicate identifiers', () => {
  const data = base();
  data.forms.push({ ...data.forms[0] });
  assert.throws(() => validateDataset(data), /duplicate form id/);
});
