import fs from 'node:fs/promises';
import path from 'node:path';
import { fetchAvailabilityCsvBundle } from './lib/pokeapi-availability.mjs';
import { buildAvailabilityCandidates } from './lib/availability-builder.mjs';

const root = process.cwd();
const refresh = process.argv.includes('--refresh');
const cacheDir = path.join(root, '.cache', 'pokeapi-csv');
const curatedDir = path.join(root, 'src', 'data', 'curated');
const generatedDir = path.join(root, 'src', 'data', 'generated');

const readJson = async file => JSON.parse(await fs.readFile(file, 'utf8'));
const writeJson = async (file, data) => fs.writeFile(file, `${JSON.stringify(data, null, 2)}\n`, 'utf8');

console.log(`Syncing availability candidates for all games${refresh ? ' (refreshing cache)' : ''}...`);
const [games, contentPacks, dexEntries] = await Promise.all([
  readJson(path.join(curatedDir, 'games.json')),
  readJson(path.join(curatedDir, 'content-packs.json')),
  readJson(path.join(generatedDir, 'regional-dex-entries.json'))
]);

if (!dexEntries.length) {
  throw new Error('regional-dex-entries.json is empty. Run npm.cmd run data:sync-all first.');
}

const bundle = await fetchAvailabilityCsvBundle({ cacheDir, refresh });
const { candidates, report } = buildAvailabilityCandidates({ bundle, games, contentPacks, dexEntries });

await writeJson(path.join(generatedDir, 'availability-candidates.json'), candidates);
await writeJson(path.join(generatedDir, 'availability-import-report.json'), {
  source: 'PokeAPI encounter CSV + regional dex fallback',
  generatedAt: new Date().toISOString(),
  note: 'confirmed_encounter rows are source-confirmed acquisition evidence; membership_only rows must not be treated as capture/evolution availability until reviewed.',
  ...report
});

console.log(`Availability sync complete: ${report.total} candidates.`);
console.log(`- ${report.confirmedEncounter} with confirmed encounter evidence`);
console.log(`- ${report.membershipOnly} Pokédex-membership-only candidates needing review`);
const noEncounterData = Object.entries(report.byGame).filter(([, value]) => value.confirmedEncounter === 0 && value.totalCandidates > 0).map(([id]) => id);
if (noEncounterData.length) console.log(`Games with no confirmed encounter rows in current PokeAPI data: ${noEncounterData.join(', ')}`);
console.log('Next: npm.cmd run data:validate-availability');
