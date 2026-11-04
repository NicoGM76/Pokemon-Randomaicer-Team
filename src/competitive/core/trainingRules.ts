import type { PokemonStats } from '../../domain/pokemon/types';
import type { CompetitiveEnvironment, CompetitivePokemonSet, StatKey } from './types';
import { statKeys } from './types';

export interface TrainingRules {
  statMax: number;
  totalMax: number;
  label: 'EVs' | 'PC';
  usesIVs: boolean;
  canTera: boolean;
  canMega: boolean;
}

export function getTrainingRules(environment: CompetitiveEnvironment): TrainingRules {
  return environment === 'champions'
    ? { statMax: 32, totalMax: 66, label: 'PC', usesIVs: false, canTera: false, canMega: true }
    : { statMax: 252, totalMax: 510, label: 'EVs', usesIVs: true, canTera: true, canMega: false };
}

/** Pokémon Champions converts EVs at Lv.50: 4 EV -> 1 PC, then +8 EV per additional PC. */
export function championsPointsFromEVs(evs: PokemonStats): PokemonStats {
  const pc = {} as PokemonStats;
  for (const stat of statKeys) {
    const ev = Math.max(0, Math.floor(evs[stat] || 0));
    pc[stat] = ev < 4 ? 0 : Math.min(32, 1 + Math.floor((ev - 4) / 8));
  }
  return pc;
}

export function pointsFor(member: CompetitivePokemonSet, environment: CompetitiveEnvironment): PokemonStats {
  return environment === 'mainline' ? member.evs
    : member.championsPoints ?? championsPointsFromEVs(member.evs);
}

/**
 * Curated, confirmed classic Mega pairs, not a purported full 2026
 * Champions legal-mega list. Newer Z-A mega forms need dedicated curation.
 */
export const MEGA_STONES: Record<string, { pokemonId: number; stone: string; label: string }> = {
  'venusaur-mega': { pokemonId: 3, stone: 'Venusaurite', label: 'Mega-Venusaur' },
  'charizard-mega-x': { pokemonId: 6, stone: 'Charizardite X', label: 'Mega-Charizard X' },
  'charizard-mega-y': { pokemonId: 6, stone: 'Charizardite Y', label: 'Mega-Charizard Y' },
  'blastoise-mega': { pokemonId: 9, stone: 'Blastoisinite', label: 'Mega-Blastoise' },
  'gengar-mega': { pokemonId: 94, stone: 'Gengarite', label: 'Mega-Gengar' },
  'gardevoir-mega': { pokemonId: 282, stone: 'Gardevoirite', label: 'Mega-Gardevoir' },
  'lucario-mega': { pokemonId: 448, stone: 'Lucarionite', label: 'Mega-Lucario' },
  'garchomp-mega': { pokemonId: 445, stone: 'Garchompite', label: 'Mega-Garchomp' },
  'salamence-mega': { pokemonId: 373, stone: 'Salamencite', label: 'Mega-Salamence' },
  'scizor-mega': { pokemonId: 212, stone: 'Scizorite', label: 'Mega-Scizor' },
  'ampharos-mega': { pokemonId: 181, stone: 'Ampharosite', label: 'Mega-Ampharos' },
  'tyranitar-mega': { pokemonId: 248, stone: 'Tyranitarite', label: 'Mega-Tyranitar' },
  'gyarados-mega': { pokemonId: 130, stone: 'Gyaradosite', label: 'Mega-Gyarados' }
};

export function megaOptions(pokemonId: number, environment: CompetitiveEnvironment) {
  return environment !== 'champions' ? [] : Object.entries(MEGA_STONES)
    .filter(([, value]) => value.pokemonId === pokemonId)
    .map(([id, value]) => ({ id, ...value }));
}

export function applyFormSelection(
  member: CompetitivePokemonSet,
  formId: string,
  environment: CompetitiveEnvironment
): CompetitivePokemonSet {
  const mega = MEGA_STONES[formId];
  if (mega && environment === 'champions' && mega.pokemonId === member.pokemonId) {
    return { ...member, formId, item: mega.stone, ability: '' };
  }
  const currentMega = member.formId ? MEGA_STONES[member.formId] : null;
  return {
    ...member,
    formId: formId || undefined,
    item: currentMega?.stone === member.item ? '' : member.item,
    ability: currentMega ? '' : member.ability
  };
}

export const TERA_TYPES = [
  'normal','fire','water','electric','grass','ice','fighting','poison','ground',
  'flying','psychic','bug','rock','ghost','dragon','dark','steel','fairy'
] as const;

export function withStatValue(member: CompetitivePokemonSet, stat: StatKey,
  value: number, environment: CompetitiveEnvironment): CompetitivePokemonSet {
  if (environment === 'champions') {
    return { ...member, championsPoints: { ...pointsFor(member, 'champions'), [stat]: value } };
  }
  return { ...member, evs: { ...member.evs, [stat]: value } };
}
