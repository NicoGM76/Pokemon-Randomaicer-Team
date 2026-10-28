import fs from 'node:fs/promises';
import path from 'node:path';
import { parseCsv } from './csv.mjs';
import { DEX_SOURCE_MAP } from './dex-source-map.mjs';

const RAW_BASE = 'https://raw.githubusercontent.com/PokeAPI/pokeapi/master/data/v2/csv';
const FILES = [
  'pokedexes.csv',
  'pokemon_dex_numbers.csv',
  'pokemon_species.csv',
  'pokemon_evolution.csv',
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

function numberOrNull(value) {
  if (value == null || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function evolutionConditions(row) {
  const conditions = [];
  const trigger = numberOrNull(row.evolution_trigger_id);
  const minLevel = numberOrNull(row.minimum_level);
  const minHappiness = numberOrNull(row.minimum_happiness);
  const gender = numberOrNull(row.gender_id);
  const triggerItem = numberOrNull(row.trigger_item_id);
  const knownMove = numberOrNull(row.known_move_id);

  if (trigger === 2) conditions.push({ type: 'trade' });
  if (trigger === 3 && triggerItem != null) conditions.push({ type: 'item', itemId: `item-${triggerItem}` });
  if (minLevel != null) conditions.push({ type: 'level', minLevel });
  if (minHappiness != null) conditions.push({ type: 'friendship', minFriendship: minHappiness });
  if (row.time_of_day === 'day' || row.time_of_day === 'night' || row.time_of_day === 'dusk') {
    conditions.push({ type: 'time', value: row.time_of_day });
  }
  if (gender === 1) conditions.push({ type: 'gender', value: 'female' });
  if (gender === 2) conditions.push({ type: 'gender', value: 'male' });
  if (knownMove != null) conditions.push({ type: 'move_known', moveId: `move-${knownMove}` });

  const specialFields = [
    ['location_id', row.location_id],
    ['held_item_id', row.held_item_id],
    ['known_move_type_id', row.known_move_type_id],
    ['minimum_beauty', row.minimum_beauty],
    ['minimum_affection', row.minimum_affection],
    ['relative_physical_stats', row.relative_physical_stats],
    ['party_species_id', row.party_species_id],
    ['party_type_id', row.party_type_id],
    ['needs_overworld_rain', row.needs_overworld_rain === '1' ? '1' : ''],
    ['turn_upside_down', row.turn_upside_down === '1' ? '1' : ''],
    ['needs_multiplayer', row.needs_multiplayer === '1' ? '1' : ''],
    ['near_special_rock', row.near_special_rock === '1' ? '1' : ''],
    ['region_id', row.region_id],
    ['required_pokemon_form_id', row.required_pokemon_form_id],
    ['used_move_id', row.used_move_id],
    ['minimum_move_count', row.minimum_move_count],
    ['minimum_steps', row.minimum_steps],
    ['minimum_damage_taken', row.minimum_damage_taken],
    ['nature_bitmask', row.nature_bitmask],
    ['condition_expression', row.condition_expression]
  ];
  for (const [field, value] of specialFields) {
    if (value != null && value !== '' && value !== '0') {
      conditions.push({ type: 'special', conditionId: `${field}:${value}` });
    }
  }

  if (![1, 2, 3].includes(trigger ?? -1)) {
    conditions.push({ type: 'special', conditionId: `trigger:${trigger ?? 'unknown'}` });
  }
  if (trigger === 3 && triggerItem == null) {
    conditions.push({ type: 'special', conditionId: 'trigger:use-item-without-item' });
  }
  if (conditions.length === 0) {
    conditions.push({ type: 'special', conditionId: `pokeapi-evolution:${row.id}` });
  }

  return conditions;
}

export function buildEvolutionDataset(bundle) {
  const speciesById = new Map(bundle['pokemon_species.csv'].map(row => [Number(row.id), row]));
  const steps = [];
  const seen = new Set();

  for (const row of bundle['pokemon_evolution.csv'] ?? []) {
    const toId = numberOrNull(row.evolved_species_id);
    const target = toId == null ? undefined : speciesById.get(toId);
    const fromId = numberOrNull(target?.evolves_from_species_id);
    if (fromId == null || toId == null || !speciesById.has(fromId)) continue;

    const step = { fromId, toId, conditions: evolutionConditions(row) };
    const key = JSON.stringify(step);
    if (seen.has(key)) continue;
    seen.add(key);
    steps.push(step);
  }

  return steps.sort((a, b) => a.fromId - b.fromId || a.toId - b.toId || JSON.stringify(a.conditions).localeCompare(JSON.stringify(b.conditions)));
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
