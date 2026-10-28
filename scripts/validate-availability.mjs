import fs from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const curatedDir = path.join(root, 'src', 'data', 'curated');
const generatedDir = path.join(root, 'src', 'data', 'generated');
const readJson = async file => JSON.parse(await fs.readFile(file, 'utf8'));

const [games, packs, pokemon, candidates] = await Promise.all([
  readJson(path.join(curatedDir, 'games.json')),
  readJson(path.join(curatedDir, 'content-packs.json')),
  readJson(path.join(generatedDir, 'pokemon.json')),
  readJson(path.join(generatedDir, 'availability-candidates.json'))
]);

const gameIds = new Set(games.map(item => item.id));
const packIds = new Set(packs.map(item => item.id));
const pokemonIds = new Set(pokemon.map(item => Number(item.id)));
const allowedConfidence = new Set(['confirmed_encounter', 'membership_only']);
const allowedMethods = new Set(['wild', 'gift', 'trade']);
const seen = new Set();
const errors = [];

for (const item of candidates) {
  if (!pokemonIds.has(Number(item.pokemonId))) errors.push(`unknown pokemonId ${item.pokemonId}`);
  if (!gameIds.has(item.gameId)) errors.push(`unknown gameId ${item.gameId}`);
  if (!packIds.has(item.contentPackId)) errors.push(`unknown contentPackId ${item.contentPackId}`);
  if (!allowedConfidence.has(item.confidence)) errors.push(`invalid confidence ${item.confidence}`);
  if (item.stage !== 'needs_review') errors.push(`unexpected unreviewed stage ${item.stage}`);
  if (item.confidence === 'membership_only' && item.acquisitionMethod !== null) errors.push(`membership_only row ${item.pokemonId}/${item.gameId} invented method ${item.acquisitionMethod}`);
  if (item.acquisitionMethod !== null && !allowedMethods.has(item.acquisitionMethod)) errors.push(`invalid acquisitionMethod ${item.acquisitionMethod}`);
  const key = [item.pokemonId, item.gameId, item.contentPackId, item.acquisitionMethod ?? 'unknown'].join('|');
  if (seen.has(key)) errors.push(`duplicate availability candidate ${key}`);
  seen.add(key);
}

if (errors.length) {
  console.error(errors.slice(0, 50).join('\n'));
  if (errors.length > 50) console.error(`...and ${errors.length - 50} more errors`);
  process.exitCode = 1;
} else {
  const confirmed = candidates.filter(item => item.confidence === 'confirmed_encounter').length;
  const pending = candidates.length - confirmed;
  console.log(`Availability candidates OK: ${candidates.length} rows, ${confirmed} encounter-confirmed, ${pending} membership-only pending review.`);
}
