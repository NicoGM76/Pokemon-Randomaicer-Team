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

// Keep the primary snapshot required, but history optional. Never reuse an
// older cached file after a newer sync fails to find a comparable sample.
const outputs = [];
const pendingFiles = [];
for (const target of META_TARGETS) {
  const verified = [];
  const failures = [];
  for (const month of latestMonths) {
    const url = 'https://www.smogon.com/stats/' + month + '/chaos/'
      + target.ladderId + '-' + target.cutoff + '.json';
    try {
      const raw = await fetchWithTimeout(url);
      const snapshot = convertChaosSnapshot(raw, pokemon, target, month);
      if (snapshot.pokemon.length < 8) throw new Error('Fewer than 8 mapped Pokémon');
      verified.push(snapshot);
      if (verified.length === 2) break;
    } catch (error) {
      failures.push(month + ': ' + String(error?.message ?? error));
    }
  }
  if (verified.length === 0) {
    throw new Error('No verified snapshot for ' + target.key
      + '. Tried ' + latestMonths.join(', ') + '. ' + failures.join(' | '));
  }
  const latest = verified[0];
  const previous = verified[1] ?? {
    schemaVersion: 1,
    status: 'unavailable',
    format: target.key,
    message: 'No hay dos meses verificados del mismo formato, regulación y rating en la ventana consultada.'
  };
  pendingFiles.push({ filename: target.key + '.json', snapshot: latest });
  pendingFiles.push({ filename: target.key + '-previous.json', snapshot: previous });
  outputs.push({
    format: target.key,
    month: latest.source.month, previousMonth: verified[1]?.source.month ?? null,
    ladder: latest.source.ladderId, matched: latest.pokemon.length,
    dropped: latest.droppedSpecies, battles: latest.source.battles
  });
}

// Ensure BOTH formats have a verified latest month before replacing any file.
for (const { filename, snapshot } of pendingFiles) {
  await fs.writeFile(path.join(outputDir, filename), JSON.stringify(snapshot), 'utf8');
}

console.log('Smogon competitive snapshots refreshed: ' + JSON.stringify(outputs, null, 2));
