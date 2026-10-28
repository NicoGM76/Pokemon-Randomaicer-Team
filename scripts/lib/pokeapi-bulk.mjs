import fs from 'node:fs/promises';
import path from 'node:path';
import { parseCsv } from './csv.mjs';
import { DEX_SOURCE_MAP } from './dex-source-map.mjs';

const RAW_BASE = 'https://raw.githubusercontent.com/PokeAPI/pokeapi/master/data/v2/csv';
const FILES = [
  'pokedexes.csv',
  'pokemon_dex_numbers.csv',
  'pokemon_species.csv',
  'pokemon.csv',
  'pokemon_types.csv',
  'pokemon_stats.csv',
  'types.csv'
];

const STARTER_SPECIES_IDS = new Set([
  1, 4, 7,
  152, 155, 158,
  252, 255, 258,
  387, 390, 393,
  495, 498, 501,
  650, 653, 656,
  722, 725, 728,
  810, 813, 816,
  906, 909, 912
]);

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

export async function fetchCsvBundle({ cacheDir, refresh = false, fetchImpl = fetch }) {
  await ensureDir(cacheDir);
  const bundle = {};
  for (const file of FILES) {
    const cached = path.join(cacheDir, file);
    let text;
    if (!refresh) {
      try { text = await fs.readFile(cached, 'utf8'); } catch { /* fetch below */ }
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

export function buildDexEntries(bundle, regionalDexes) {
  const pokedexByIdentifier = new Map(bundle['pokedexes.csv'].map(row => [row.identifier, Number(row.id)]));
  const rowsByPokedex = new Map();
  for (const row of bundle['pokemon_dex_numbers.csv']) {
    const id = Number(row.pokedex_id);
    const list = rowsByPokedex.get(id) ?? [];
    list.push({ pokemonId: Number(row.species_id), dexNumber: Number(row.pokedex_number) });
    rowsByPokedex.set(id, list);
  }

  const entries = [];
  const report = [];
  for (const dex of regionalDexes) {
    const sources = DEX_SOURCE_MAP[dex.id] ?? [];
    let actual = 0;
    const missingSources = [];
    for (const source of sources) {
      const pokeapiDexId = pokedexByIdentifier.get(source.identifier);
      if (!pokeapiDexId) {
        missingSources.push(source.identifier);
        continue;
      }
      const sourceEntries = (rowsByPokedex.get(pokeapiDexId) ?? [])
        .sort((a, b) => a.dexNumber - b.dexNumber)
        .map(entry => ({
          dexId: dex.id,
          pokemonId: entry.pokemonId,
          dexNumber: entry.dexNumber,
          ...(source.subDex ? { subDex: source.subDex } : {}),
          source: 'pokeapi',
          sourceDex: source.identifier
        }));
      entries.push(...sourceEntries);
      actual += sourceEntries.length;
    }
    report.push({
      dexId: dex.id,
      expected: dex.entryCount,
      actual,
      complete: actual === dex.entryCount && missingSources.length === 0,
      missingSources
    });
  }
  return { entries, report };
}

function titleFromIdentifier(identifier) {
  return identifier.split('-').map(part => part ? part[0].toUpperCase() + part.slice(1) : part).join(' ');
}

export function buildPokemonDataset(bundle, existingPokemon = []) {
  const existing = new Map(existingPokemon.map(pokemon => [pokemon.id, pokemon]));
  const speciesRows = bundle['pokemon_species.csv'];
  const defaultPokemonBySpecies = new Map(
    bundle['pokemon.csv']
      .filter(row => row.is_default === '1')
      .map(row => [Number(row.species_id), Number(row.id)])
  );
  const typeById = new Map(bundle['types.csv'].map(row => [Number(row.id), row.identifier]));
  const typesByPokemon = new Map();
  for (const row of bundle['pokemon_types.csv']) {
    const pokemonId = Number(row.pokemon_id);
    const type = typeById.get(Number(row.type_id));
    if (!type || !['normal','fire','water','electric','grass','ice','fighting','poison','ground','flying','psychic','bug','rock','ghost','dragon','dark','steel','fairy'].includes(type)) continue;
    const list = typesByPokemon.get(pokemonId) ?? [];
    list.push({ slot: Number(row.slot), type });
    typesByPokemon.set(pokemonId, list);
  }
  const statsByPokemon = new Map();
  for (const row of bundle['pokemon_stats.csv']) {
    const pokemonId = Number(row.pokemon_id);
    const stats = statsByPokemon.get(pokemonId) ?? {};
    const key = ({1:'hp',2:'attack',3:'defense',4:'specialAttack',5:'specialDefense',6:'speed'})[Number(row.stat_id)];
    if (key) stats[key] = Number(row.base_stat);
    statsByPokemon.set(pokemonId, stats);
  }

  return speciesRows.map(row => {
    const id = Number(row.id);
    const pokemonId = defaultPokemonBySpecies.get(id);
    const previous = existing.get(id);
    const sortedTypes = (typesByPokemon.get(pokemonId) ?? []).sort((a,b) => a.slot - b.slot).map(item => item.type);
    const stats = statsByPokemon.get(pokemonId) ?? {};
    const tags = [];
    if (row.is_legendary === '1') tags.push('legendary');
    if (row.is_mythical === '1') tags.push('mythical');
    return {
      id,
      name: previous?.name ?? titleFromIdentifier(row.identifier),
      types: sortedTypes,
      introducedGeneration: Number(row.generation_id),
      evolutionFamilyId: `chain-${row.evolution_chain_id || id}`,
      stats: {
        hp: stats.hp ?? 0,
        attack: stats.attack ?? 0,
        defense: stats.defense ?? 0,
        specialAttack: stats.specialAttack ?? 0,
        specialDefense: stats.specialDefense ?? 0,
        speed: stats.speed ?? 0
      },
      specialTags: Array.from(new Set([...(previous?.specialTags ?? []), ...tags])),
      isPseudoLegendary: previous?.isPseudoLegendary ?? false,
      isFossil: previous?.isFossil ?? false,
      isStarter: Boolean(previous?.isStarter || STARTER_SPECIES_IDS.has(id))
    };
  });
}
