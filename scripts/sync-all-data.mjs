import fs from 'node:fs/promises';
import path from 'node:path';
import { fetchCsvBundle, buildDexEntries, buildPokemonDataset } from './lib/pokeapi-bulk.mjs';

const root = process.cwd();
const refresh = process.argv.includes('--refresh');
const cacheDir = path.join(root, '.cache', 'pokeapi-csv');
const curatedDir = path.join(root, 'src', 'data', 'curated');
const generatedDir = path.join(root, 'src', 'data', 'generated');

const readJson = async file => JSON.parse(await fs.readFile(file, 'utf8'));
const writeJson = async (file, data) => fs.writeFile(file, `${JSON.stringify(data, null, 2)}\n`, 'utf8');

console.log(`Syncing all regional Pokédex data${refresh ? ' (refreshing cache)' : ''}...`);
const regionalDexes = await readJson(path.join(curatedDir, 'regional-dexes.json'));
const previousPokemon = await readJson(path.join(generatedDir, 'pokemon.json'));
const bundle = await fetchCsvBundle({ cacheDir, refresh });
const { entries, report } = buildDexEntries(bundle, regionalDexes);
const pokemon = buildPokemonDataset(bundle, previousPokemon);

await writeJson(path.join(generatedDir, 'regional-dex-entries.json'), entries);
await writeJson(path.join(generatedDir, 'pokemon.json'), pokemon);
await writeJson(path.join(generatedDir, 'dex-import-report.json'), {
  source: 'PokeAPI CSV repository',
  generatedAt: new Date().toISOString(),
  dexes: report
});

const complete = report.filter(item => item.complete).length;
const partial = report.length - complete;
const totalEntries = entries.length;
console.log(`Dex sync complete: ${complete}/${report.length} dexes match expected counts, ${partial} need review.`);
console.log(`Imported ${totalEntries} regional-dex rows and ${pokemon.length} Pokémon species records.`);
for (const item of report.filter(item => !item.complete)) {
  console.log(`- ${item.dexId}: ${item.actual}/${item.expected}${item.missingSources.length ? `; missing source ${item.missingSources.join(', ')}` : ''}`);
}
console.log('Next: npm.cmd run data:validate-all');
