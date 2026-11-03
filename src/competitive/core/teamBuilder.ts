import type { Pokemon, PokemonStats } from '../../domain/pokemon/types';
import { getDefensiveProfile } from '../../generator/adventure/getDefensiveProfile';
import { pokemonTypes } from '../../generator/adventure/typeChart';
import { SAMPLE_TEMPLATES } from './templates';
import { statKeys } from './types';
import type { CompetitiveFormat, CompetitivePokemonSet, CompetitiveRole, CompetitiveTeam, CompetitiveTemplate } from './types';

const zeros = (): PokemonStats => ({
  hp: 0, attack: 0, defense: 0, specialAttack: 0, specialDefense: 0, speed: 0
});
const fullIvs = (): PokemonStats => ({
  hp: 31, attack: 31, defense: 31, specialAttack: 31, specialDefense: 31, speed: 31
});

export function createManualSet(pokemon: Pokemon): CompetitivePokemonSet {
  const special = pokemon.stats.specialAttack > pokemon.stats.attack;
  const evs = zeros();
  if (special) evs.specialAttack = 252;
  else evs.attack = 252;
  evs.speed = 252;
  evs.hp = 4;

  return {
    pokemonId: pokemon.id,
    role: special ? 'special' : 'physical',
    nature: special ? 'Timid' : 'Jolly',
    ability: '',
    item: '',
    moves: ['', '', '', ''],
    evs,
    ivs: fullIvs(),
    locked: false
  };
}

export function createTemplateSet(template: CompetitiveTemplate): CompetitivePokemonSet {
  const evs = zeros();
  const ivs = fullIvs();
  for (const key of statKeys) {
    evs[key] = template.evs[key] ?? 0;
    ivs[key] = template.ivs?.[key] ?? 31;
  }
  return {
    pokemonId: template.pokemonId,
    role: template.role,
    nature: template.nature,
    ability: template.ability,
    item: template.item,
    moves: [...template.moves],
    evs,
    ivs,
    locked: false,
    templateId: template.id
  };
}

function padTeam(current: CompetitiveTeam = []): CompetitiveTeam {
  return Array.from({ length: 6 }, (_, index) => current[index] ?? null);
}

function availability(format: CompetitiveFormat, pokemon: Pokemon[]): CompetitiveTemplate[] {
  const ids = new Set(pokemon.map(entry => entry.id));
  return SAMPLE_TEMPLATES.filter(entry => entry.format === format && ids.has(entry.pokemonId));
}

function candidateScore(
  candidate: CompetitiveTemplate,
  existing: CompetitivePokemonSet[],
  lookup: Map<number, Pokemon>,
  random: () => number
): number {
  const counts = new Map<CompetitiveRole, number>();
  for (const set of existing) counts.set(set.role, (counts.get(set.role) ?? 0) + 1);

  let score = 8 - 2.5 * (counts.get(candidate.role) ?? 0);
  const pokemon = lookup.get(candidate.pokemonId);
  if (!pokemon) return -Infinity;
  const profile = getDefensiveProfile(pokemon.types);
  for (const type of pokemonTypes) {
    if (profile.multipliers[type] <= 1) continue;
    const shared = existing.filter(member => {
      const other = lookup.get(member.pokemonId);
      return other && getDefensiveProfile(other.types).multipliers[type] > 1;
    }).length;
    score -= shared * 1.2;
  }
  const usedTypes = new Set(existing.flatMap(member => lookup.get(member.pokemonId)?.types ?? []));
  score += pokemon.types.filter(type => !usedTypes.has(type)).length * 0.7;
  return score + random() * 3;
}

function pickTemplate(
  format: CompetitiveFormat,
  pokemon: Pokemon[],
  existing: CompetitivePokemonSet[],
  random: () => number,
  excludeIds = new Set<number>()
): CompetitiveTemplate | undefined {
  const lookup = new Map(pokemon.map(entry => [entry.id, entry]));
  const usedIds = new Set([...existing.map(member => member.pokemonId), ...excludeIds]);
  const usedItems = new Set(existing.map(member => member.item.toLowerCase()).filter(Boolean));
  const candidates = availability(format, pokemon).filter(template =>
    !usedIds.has(template.pokemonId) &&
    (format !== 'doubles' || !usedItems.has(template.item.toLowerCase()))
  );
  return candidates
    .map(template => ({ template, score: candidateScore(template, existing, lookup, random) }))
    .sort((a, b) => b.score - a.score)[0]?.template;
}

export function generateCompetitiveTeam(
  format: CompetitiveFormat,
  pokemon: Pokemon[],
  current: CompetitiveTeam = [],
  random: () => number = Math.random
): CompetitiveTeam {
  const team = padTeam(current).map(member => member?.locked ? member : null);
  for (let index = 0; index < 6; index++) {
    if (team[index]) continue;
    const existing = team.filter((member): member is CompetitivePokemonSet => member !== null);
    const next = pickTemplate(format, pokemon, existing, random);
    if (next) team[index] = createTemplateSet(next);
  }
  return team;
}

export function regenerateCompetitiveSlot(
  format: CompetitiveFormat,
  pokemon: Pokemon[],
  current: CompetitiveTeam,
  index: number,
  random: () => number = Math.random
): CompetitiveTeam {
  if (!Number.isInteger(index) || index < 0 || index >= 6) return current;
  const padded = padTeam(current);
  if (padded[index]?.locked) return current;
  const existing = padded.filter((member, i): member is CompetitivePokemonSet =>
    i !== index && member !== null
  );
  const exclude = new Set<number>();
  if (padded[index]) exclude.add(padded[index].pokemonId);
  const template = pickTemplate(format, pokemon, existing, random, exclude);
  if (!template) return current;
  const next = [...padded];
  next[index] = createTemplateSet(template);
  return next;
}
