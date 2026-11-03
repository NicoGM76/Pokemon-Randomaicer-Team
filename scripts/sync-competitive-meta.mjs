import fs from 'node:fs/promises';
import path from 'node:path';
import { convertChaosSnapshot, META_TARGETS, selectMonthCandidates } from './lib/competitive-chaos.mjs';

const root = process.cwd();
const pokemon = JSON.parse(await fs.readFile(path.join(root, 'src/data/generated/pokemon.json'), 'utf8'));
const outputDir = path.join(root, 'public/meta');
const latestMonths = selectMonthCandidates(new Date(), 4);
await fs.mkdir(outputDir, { recursive: true });

async function fetchWithTimeout(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { 'user-agent': 'Pokemon-Adventure-Team-Generator/2.2 (static meta importer)' }
    });
    if (!response.ok) throw new Error('HTTP ' + response.status);
    const length = Number(response.headers.get('content-length') ?? 0);
    if (length > 12 * 1024 * 1024) throw new Error('Source file over 12 MB limit');
    const text = await response.text();
    if (text.length > 12 * 1024 * 1024) throw new Error('Source file over 12 MB limit');
    return JSON.parse(text);
  } finally {
    clearTimeout(timeout);
  }
}

const outputs = [];
for (const target of META_TARGETS) {
  let snapshot;
  const failures = [];
  for (const month of latestMonths) {
    const url = 'https://www.smogon.com/stats/' + month + '/chaos/'
      + target.ladderId + '-' + target.cutoff + '.json';
    try {
      const raw = await fetchWithTimeout(url);
      snapshot = convertChaosSnapshot(raw, pokemon, target, month);
      if (snapshot.pokemon.length < 8) throw new Error('Fewer than 8 mapped Pokémon');
      break;
    } catch (error) {
      failures.push(month + ': ' + String(error?.message ?? error));
    }
  }
  if (!snapshot) {
    throw new Error('No verified snapshot for ' + target.key
      + '. Tried ' + latestMonths.join(', ') + '. ' + failures.join(' | '));
  }
  const filepath = path.join(outputDir, target.key + '.json');
  await fs.writeFile(filepath, JSON.stringify(snapshot), 'utf8');
  outputs.push({
    format: target.key, month: snapshot.source.month,
    ladder: snapshot.source.ladderId, matched: snapshot.pokemon.length,
    dropped: snapshot.droppedSpecies, battles: snapshot.source.battles
  });
}

console.log('Smogon competitive snapshots refreshed: ' + JSON.stringify(outputs, null, 2));
