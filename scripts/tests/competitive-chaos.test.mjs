import test from 'node:test';
import assert from 'node:assert/strict';
import { convertChaosSnapshot, selectMonthCandidates } from '../lib/competitive-chaos.mjs';

const pokemon = [
  { id: 984, name: 'Great Tusk' }, { id: 1000, name: 'Gholdengo' },
  { id: 983, name: 'Kingambit' }, { id: 479, name: 'Rotom' }
];
const raw = {
  info: { metagame: 'gen9ou', cutoff: 1695, 'number of battles': 123456 },
  data: {
    'Great Tusk': {
      usage: 0.32145,
      Moves: { 'Rapid Spin': 210, 'Headlong Rush': 350, Other: 5 },
      Items: { Leftovers: 100, 'Booster Energy': 320 },
      Abilities: { Protosynthesis: 350 },
      Teammates: { Gholdengo: 155, Kingambit: 70, 'Rotom-Wash': 100 }
    },
    Gholdengo: { usage: 0.249, Moves: { 'Make It Rain': 9 }, Items: {}, Abilities: {}, Teammates: {} },
    Kingambit: { usage: 0.182, Moves: {}, Items: {}, Abilities: {}, Teammates: {} },
    'Rotom-Wash': { usage: 0.3, Moves: {}, Items: {}, Abilities: {}, Teammates: {} },
    'Missing Species': { usage: 0.9, Moves: {}, Items: {}, Abilities: {}, Teammates: {} }
  }
};

const target = {
  key: 'singles', ladderId: 'gen9ou', cutoff: 1695,
  label: 'Singles · Gen 9 OU', description: 'OU test'
};
test('converts dated raw Smogon usage without fabricating variant identity', () => {
  const snapshot = convertChaosSnapshot(raw, pokemon, target, '2026-09');
  assert.equal(snapshot.status, 'ready');
  assert.equal(snapshot.source.month, '2026-09');
  assert.equal(snapshot.source.ladderId, 'gen9ou');
  assert.equal(snapshot.source.cutoff, 1695);
  assert.equal(snapshot.source.battles, 123456);
  assert.equal(snapshot.pokemon.length, 3);
  assert.equal(snapshot.pokemon[0].pokemonId, 984);
  assert.equal(snapshot.pokemon[0].usagePercent, 32.145);
  assert.deepEqual(snapshot.pokemon[0].moves, ['Headlong Rush', 'Rapid Spin']);
  assert.deepEqual(snapshot.pokemon[0].items, ['Booster Energy', 'Leftovers']);
  assert.deepEqual(snapshot.pokemon[0].teammates, [1000, 983]);
  assert.equal(snapshot.pokemon.some(p => p.pokemonId === 479), false);
  assert.equal(snapshot.droppedSpecies, 2);
});

test('rejects mislabeled format or cutoff and unreasonable usage numbers', () => {
  assert.throws(() => convertChaosSnapshot(
    { ...raw, info: { ...raw.info, metagame: 'gen9anythinggoes' } },
    pokemon, target, '2026-09'
  ), /metagame/i);
  assert.throws(() => convertChaosSnapshot(
    { ...raw, info: { ...raw.info, cutoff: 1500 } },
    pokemon, target, '2026-09'
  ), /cutoff/i);
  assert.throws(() => convertChaosSnapshot({
    ...raw, data: { 'Great Tusk': { ...raw.data['Great Tusk'], usage: 3 } }
  }, pokemon, target, '2026-09'), /usage/i);
});

test('chooses only complete past months, never the month currently in progress', () => {
  assert.deepEqual(selectMonthCandidates(new Date('2026-11-03T12:00:00Z'), 3),
    ['2026-10', '2026-09', '2026-08']);
});

test('skips blank Smogon move names while retaining valid popular moves', () => {
  const withGaps = {
    ...raw,
    data: {
      ...raw.data,
      'Great Tusk': {
        ...raw.data['Great Tusk'],
        Moves: { '': 999, '   ': 820, 'Headlong Rush': 350, 'Rapid Spin': 210,
          Other: 100, Nothing: 100 }
      }
    }
  };
  const snapshot = convertChaosSnapshot(withGaps, pokemon, target, '2026-10');
  const greatTusk = snapshot.pokemon.find(entry => entry.pokemonId === 984);
  assert.deepEqual(greatTusk.moves, ['Headlong Rush', 'Rapid Spin']);
  assert.equal(snapshot.pokemon.some(entry =>
    entry.moves.some(move => !move.trim())), false);
});
