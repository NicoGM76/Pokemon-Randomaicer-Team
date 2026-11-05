import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildCatalogUpsertSql, assertValidCatalog } from '../lib/catalog-sql.mjs';
const species = {
  id: 25, name: "Pika'chu", introducedGeneration: 1, evolutionFamilyId: 'pichu-line',
  types: ['electric'], stats: { hp: 35, attack: 55, defense: 40, specialAttack: 50, specialDefense: 50, speed: 90 },
  specialTags: [], isPseudoLegendary: false, isFossil: false, isStarter: false
};
const dataset = () => ({ pokemon: [{ ...species }], forms: [{ id: 'pikachu-special', pokemonId: 25, name: 'Special', formType: 'cosmetic', countsAsSameSpecies: true }], evolutions: [] });

test('SQL is atomic, quotes user-controlled names and tracks a sample checksum', () => {
  const query = buildCatalogUpsertSql(dataset());
  assert.match(query, /^-- Generated import/);
  assert.match(query, /BEGIN;[\s\S]*COMMIT;/);
  assert.match(query, /Pika''chu/);
  assert.match(query, /sample-[0-9a-f]{20}/);
  assert.match(query, /source_revision/);
});
test('full import requires at least 1000 Pokémon', () => {
  assert.throws(() => buildCatalogUpsertSql(dataset(), { full: true }), /Refusing to label/);
});
test('rejects invalid/duplicate species IDs and types', () => {
  const data = dataset(); data.pokemon.push({ ...species });
  assert.throws(() => assertValidCatalog(data), /Duplicate/);
  data.pokemon.pop(); data.pokemon[0].types = ['electric','electric'];
  assert.throws(() => assertValidCatalog(data), /typing/);
});
test('rejects referential integrity problems before writing SQL', () => {
  const data = dataset(); data.evolutions.push({ fromId: 25, toId: 150, conditions: [] });
  assert.throws(() => assertValidCatalog(data), /unknown species/);
  data.evolutions = []; data.forms[0].pokemonId = 999;
  assert.throws(() => assertValidCatalog(data), /form reference/);
});
