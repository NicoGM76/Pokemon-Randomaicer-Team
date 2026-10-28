import test from 'node:test';
import assert from 'node:assert/strict';
import { buildAvailabilityCandidates, normalizeMethod, resolveVersionTarget } from './availability-builder.mjs';

test('normalizes PokeAPI encounter methods into generator acquisition methods', () => {
  assert.equal(normalizeMethod('walk'), 'wild');
  assert.equal(normalizeMethod('overworld'), 'wild');
  assert.equal(normalizeMethod('gift'), 'gift');
  assert.equal(normalizeMethod('gift-egg'), 'gift');
  assert.equal(normalizeMethod('npc-trade'), 'trade');
});

test('maps base and DLC PokeAPI versions to the correct game/content pack', () => {
  const games = [
    { id: 'sword', pokeapiVersion: 'sword' },
    { id: 'shield', pokeapiVersion: 'shield' }
  ];
  const packs = [
    { id: 'sword-base', gameId: 'sword', type: 'base' },
    { id: 'isle-of-armor', gameId: 'sword', type: 'dlc' },
    { id: 'shield-isle-of-armor', gameId: 'shield', type: 'dlc' }
  ];
  assert.deepEqual(resolveVersionTarget('sword', games, packs), { gameId: 'sword', contentPackId: 'sword-base' });
  assert.deepEqual(resolveVersionTarget('the-isle-of-armor-sword', games, packs), { gameId: 'sword', contentPackId: 'isle-of-armor' });
  assert.deepEqual(resolveVersionTarget('the-isle-of-armor-shield', games, packs), { gameId: 'shield', contentPackId: 'shield-isle-of-armor' });
});

test('builds confirmed encounter candidates and pending dex-membership candidates without inventing methods', () => {
  const bundle = {
    'versions.csv': [
      { id: '1', version_group_id: '1', identifier: 'red' }
    ],
    'encounters.csv': [
      { id: '1', version_id: '1', location_area_id: '10', encounter_slot_id: '100', pokemon_id: '101', min_level: '3', max_level: '5' }
    ],
    'encounter_slots.csv': [
      { id: '100', version_group_id: '1', encounter_method_id: '1', slot: '1', rarity: '50' }
    ],
    'encounter_methods.csv': [
      { id: '1', identifier: 'walk', order: '1' }
    ],
    'pokemon.csv': [
      { id: '101', species_id: '1', is_default: '1' },
      { id: '102', species_id: '2', is_default: '1' }
    ]
  };
  const games = [{ id: 'red', pokeapiVersion: 'red', dexIds: ['kanto-classic'] }];
  const packs = [{ id: 'red-base', gameId: 'red', type: 'base', dexIds: ['kanto-classic'] }];
  const dexEntries = [
    { dexId: 'kanto-classic', pokemonId: 1, dexNumber: 1 },
    { dexId: 'kanto-classic', pokemonId: 2, dexNumber: 2 }
  ];

  const { candidates, report } = buildAvailabilityCandidates({ bundle, games, contentPacks: packs, dexEntries });

  assert.deepEqual(candidates.find(item => item.pokemonId === 1), {
    pokemonId: 1,
    gameId: 'red',
    contentPackId: 'red-base',
    acquisitionMethod: 'wild',
    source: 'pokeapi_encounter',
    confidence: 'confirmed_encounter',
    stage: 'needs_review',
    encounterMethods: ['walk']
  });
  assert.deepEqual(candidates.find(item => item.pokemonId === 2), {
    pokemonId: 2,
    gameId: 'red',
    contentPackId: 'red-base',
    acquisitionMethod: null,
    source: 'regional_dex',
    confidence: 'membership_only',
    stage: 'needs_review',
    encounterMethods: []
  });
  assert.equal(report.confirmedEncounter, 1);
  assert.equal(report.membershipOnly, 1);
});
