import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = file => JSON.parse(fs.readFileSync(path.join(root, 'src/data/curated', file), 'utf8'));

const generations = read('generations.json');
const families = read('game-families.json');
const games = read('games.json');
const packs = read('content-packs.json');
const dexes = read('regional-dexes.json');
const mechanicCatalogs = read('mechanic-catalogs.json');

function unique(items, key, label) {
  const values = items.map(item => item[key]);
  if (new Set(values).size !== values.length) throw new Error(`Duplicate ${label}`);
}

unique(generations, 'id', 'generation id');
unique(families, 'id', 'family id');
unique(games, 'id', 'game id');
unique(packs, 'id', 'content pack id');
unique(dexes, 'id', 'regional dex id');
unique(mechanicCatalogs, 'id', 'mechanic catalog id');

const generationNumbers = new Set(generations.map(item => item.number));
const familyIds = new Set(families.map(item => item.id));
const gameIds = new Set(games.map(item => item.id));
const dexIds = new Set(dexes.map(item => item.id));
const packIds = new Set(packs.map(item => item.id));

for (const family of families) {
  if (!generationNumbers.has(family.generation)) throw new Error(`${family.id}: unknown generation`);
  for (const gameId of family.gameIds) if (!gameIds.has(gameId)) throw new Error(`${family.id}: unknown game ${gameId}`);
  for (const dexId of family.dexIds) if (!dexIds.has(dexId)) throw new Error(`${family.id}: unknown dex ${dexId}`);
}

for (const game of games) {
  if (!generationNumbers.has(game.generation)) throw new Error(`${game.id}: unknown generation`);
  if (!familyIds.has(game.familyId)) throw new Error(`${game.id}: unknown family ${game.familyId}`);
  for (const dexId of game.dexIds) if (!dexIds.has(dexId)) throw new Error(`${game.id}: unknown dex ${dexId}`);
}

for (const pack of packs) {
  if (!gameIds.has(pack.gameId)) throw new Error(`${pack.id}: unknown game ${pack.gameId}`);
  for (const dexId of pack.dexIds ?? []) if (!dexIds.has(dexId)) throw new Error(`${pack.id}: unknown dex ${dexId}`);
  for (const dependency of pack.requiredContentPacks ?? []) if (!packIds.has(dependency)) throw new Error(`${pack.id}: unknown dependency ${dependency}`);
}

for (const catalog of mechanicCatalogs) {
  if (!familyIds.has(catalog.gameFamilyId)) throw new Error(`${catalog.id}: unknown family ${catalog.gameFamilyId}`);
}

console.log(`Catalog OK: ${generations.length} generations, ${families.length} families, ${games.length} games, ${packs.length} content packs, ${dexes.length} species dexes, ${mechanicCatalogs.length} mechanic catalogs.`);
