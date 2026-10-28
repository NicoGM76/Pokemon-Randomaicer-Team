import fs from 'node:fs';
import path from 'node:path';
import { DEX_SOURCE_MAP } from './lib/dex-source-map.mjs';
import { isValidRegionalDexNumber } from './lib/dex-number-validation.mjs';

const root = process.cwd();
const read = file => JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'));
const dexes = read('src/data/curated/regional-dexes.json');
const entries = read('src/data/generated/regional-dex-entries.json');
const pokemon = read('src/data/generated/pokemon.json');

const dexIds = new Set(dexes.map(dex => dex.id));
const pokemonIds = new Set(pokemon.map(mon => mon.id));
const errors = [];

for (const dex of dexes) if (!DEX_SOURCE_MAP[dex.id]) errors.push(`${dex.id}: no bulk source mapping`);
for (const entry of entries) {
  if (!dexIds.has(entry.dexId)) errors.push(`entry: unknown dex ${entry.dexId}`);
  if (!pokemonIds.has(entry.pokemonId)) errors.push(`${entry.dexId}: unknown pokemon ${entry.pokemonId}`);
  if (!isValidRegionalDexNumber(entry.dexNumber)) errors.push(`${entry.dexId}: invalid dex number ${entry.dexNumber}`);
}

const byDex = new Map();
for (const entry of entries) byDex.set(entry.dexId, (byDex.get(entry.dexId) ?? 0) + 1);
const countMismatches = dexes
  .map(dex => ({ id: dex.id, expected: dex.entryCount, actual: byDex.get(dex.id) ?? 0 }))
  .filter(item => item.expected !== item.actual);

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}

console.log(`Data references OK: ${dexes.length} dexes, ${entries.length} dex entries, ${pokemon.length} Pokémon records.`);
if (countMismatches.length) {
  console.log(`Count review needed for ${countMismatches.length} dexes:`);
  for (const item of countMismatches) console.log(`- ${item.id}: ${item.actual}/${item.expected}`);
  process.exitCode = 2;
} else {
  console.log('All regional dex counts match the catalog.');
}
