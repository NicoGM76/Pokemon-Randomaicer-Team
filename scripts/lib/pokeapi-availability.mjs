import fs from 'node:fs/promises';
import path from 'node:path';
import { parseCsv } from './csv.mjs';

const RAW_BASE = 'https://raw.githubusercontent.com/PokeAPI/pokeapi/master/data/v2/csv';
const FILES = [
  'versions.csv',
  'encounters.csv',
  'encounter_slots.csv',
  'encounter_methods.csv',
  'pokemon.csv'
];

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

export async function fetchAvailabilityCsvBundle({ cacheDir, refresh = false, fetchImpl = fetch }) {
  await ensureDir(cacheDir);
  const bundle = {};
  for (const file of FILES) {
    const cached = path.join(cacheDir, file);
    let text;
    if (!refresh) {
      try { text = await fs.readFile(cached, 'utf8'); } catch { /* download below */ }
    }
    if (!text) {
      const response = await fetchImpl(`${RAW_BASE}/${file}`);
      if (!response.ok) throw new Error(`PokéAPI CSV ${file}: HTTP ${response.status}`);
      text = await response.text();
      await fs.writeFile(cached, text, 'utf8');
    }
    bundle[file] = parseCsv(text);
  }
  return bundle;
}
