import type { Pokemon } from '../../domain/pokemon/types';
import { getDefensiveProfile } from '../../generator/adventure/getDefensiveProfile';
import type { MetaFormat, MetaMatchup, MetaSnapshot } from './types';

export function analyzeMetaMatchup(teamPokemonIds: number[], opponentId: number, pokemon: Pokemon[]): MetaMatchup {
  const lookup = new Map(pokemon.map(value => [value.id, value]));
  const opponent = lookup.get(opponentId);
  if (!opponent) return { threatened: [], offensiveAnswers: [], checkedMembers: 0 };

  const opponentDefenses = getDefensiveProfile(opponent.types).multipliers;
  const threatened: number[] = [];
  const offensiveAnswers: number[] = [];
  let checkedMembers = 0;

  for (const id of teamPokemonIds) {
    const ally = lookup.get(id);
    if (!ally) continue;
    checkedMembers++;
    const defenses = getDefensiveProfile(ally.types).multipliers;
    if (opponent.types.some(type => defenses[type] > 1)) threatened.push(id);
    if (ally.types.some(type => opponentDefenses[type] > 1)) offensiveAnswers.push(id);
  }
  return { threatened, offensiveAnswers, checkedMembers };
}

const keys: MetaFormat[] = ['singles', 'doubles'];
const limitedStrings = (value: unknown): value is string[] =>
  Array.isArray(value) && value.length <= 8 &&
  value.every(item => typeof item === 'string' && item.length > 0 && item.length < 100);

export function isMetaSnapshot(value: unknown, expectedFormat: MetaFormat): value is MetaSnapshot {
  if (!value || typeof value !== 'object') return false;
  const snapshot = value as Partial<MetaSnapshot>;
  if (snapshot.schemaVersion !== 1 || snapshot.status !== 'ready' ||
    snapshot.format !== expectedFormat || !keys.includes(snapshot.format) ||
    typeof snapshot.label !== 'string' || typeof snapshot.description !== 'string' ||
    !Number.isInteger(snapshot.droppedSpecies) || snapshot.droppedSpecies! < 0) return false;

  const source = snapshot.source;
  if (!source || source.organization !== 'Smogon / Pokémon Showdown' ||
    source.kind !== 'ladder' || !/^\d{4}-(0[1-9]|1[0-2])$/.test(source.month) ||
    !/^[a-z0-9]+$/.test(source.ladderId) || typeof source.cutoff !== 'number' ||
    !Number.isInteger(source.battles) || source.battles <= 0 ||
    typeof source.url !== 'string' ||
    source.url !== 'https://www.smogon.com/stats/' + source.month
      + '/chaos/' + source.ladderId + '-' + source.cutoff + '.json'
  ) return false;
  if (!Array.isArray(snapshot.pokemon) || snapshot.pokemon.length < 1 || snapshot.pokemon.length > 100) return false;
  const ids = new Set<number>();
  for (const rawEntry of snapshot.pokemon) {
    if (!rawEntry || typeof rawEntry !== 'object') return false;
    const p = rawEntry as MetaSnapshot['pokemon'][number];
    if (!Number.isInteger(p.pokemonId) || p.pokemonId <= 0 || ids.has(p.pokemonId) ||
      !Number.isFinite(p.usagePercent) || p.usagePercent < 0 || p.usagePercent > 100 ||
      !limitedStrings(p.moves) || !limitedStrings(p.items) ||
      !limitedStrings(p.abilities) || !Array.isArray(p.teammates) ||
      p.teammates.length > 8 || p.teammates.some(id => !Number.isInteger(id) || id <= 0)) return false;
    ids.add(p.pokemonId);
  }
  return true;
}
