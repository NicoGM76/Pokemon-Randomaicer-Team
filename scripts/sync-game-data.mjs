import fs from 'node:fs/promises';
import path from 'node:path';

const API = 'https://pokeapi.co/api/v2';
const root = process.cwd();
const gameId = process.argv[2];
if (!gameId) {
  console.error('Uso: npm run data:sync-game -- platinum');
  process.exit(1);
}

const games = JSON.parse(await fs.readFile(path.join(root, 'src/data/curated/games.json'), 'utf8'));
const game = games.find(g => g.id === gameId);
if (!game) throw new Error(`Juego desconocido: ${gameId}`);
if (!game.pokeapiVersion) throw new Error(`${game.name} todavía no tiene identificador de versión compatible configurado.`);

const cacheDir = path.join(root, '.cache', 'pokeapi');
await fs.mkdir(cacheDir, { recursive: true });

async function cachedJson(url, key) {
  const file = path.join(cacheDir, `${key}.json`);
  try { return JSON.parse(await fs.readFile(file, 'utf8')); } catch {}
  const res = await fetch(url, { headers: { 'user-agent': 'PokemonAdventureTeamGenerator/0.1 local-data-import' } });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}: ${url}`);
  const json = await res.json();
  await fs.writeFile(file, JSON.stringify(json));
  return json;
}

const list = await cachedJson(`${API}/pokemon?limit=2000&offset=0`, 'pokemon-list');
const found = [];
let cursor = 0;
const workers = Math.min(6, list.results.length);

async function worker() {
  while (true) {
    const index = cursor++;
    if (index >= list.results.length) return;
    const pokemon = list.results[index];
    const id = Number(pokemon.url.match(/\/pokemon\/(\d+)\/?$/)?.[1]);
    if (!id) continue;
    try {
      const encounters = await cachedJson(`${API}/pokemon/${id}/encounters`, `encounters-${id}`);
      const matches = encounters.some(area => area.version_details?.some(v => v.version?.name === game.pokeapiVersion));
      if (matches) found.push({ pokemonId: id, pokemonName: pokemon.name, version: game.pokeapiVersion, suggestedMethod: 'wild', reviewRequired: true });
    } catch (error) {
      console.warn(`No se pudo revisar ${pokemon.name}: ${error.message}`);
    }
    if ((index + 1) % 100 === 0) console.log(`Revisados ${index + 1}/${list.results.length}...`);
  }
}
await Promise.all(Array.from({ length: workers }, () => worker()));
found.sort((a,b) => a.pokemonId - b.pokemonId);
const outDir = path.join(root, 'data-imports');
await fs.mkdir(outDir, { recursive: true });
const out = path.join(outDir, `${gameId}-wild-review.json`);
await fs.writeFile(out, JSON.stringify({ gameId, gameName: game.name, source: 'PokeAPI encounters', generatedAt: new Date().toISOString(), note: 'Revisar Historia/Postgame y excepciones antes de mover a curated.', pokemon: found }, null, 2));
console.log(`\n${found.length} Pokémon silvestres detectados. Reporte: ${out}`);
console.log('Este archivo NO se publica automáticamente: debe revisarse antes de pasar a curated.');
