import type { PokemonStats, PokemonType } from '../../domain/pokemon/types';
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
 * Curated Mega Stone pairs, including the three officially available
 * Mega Z forms in Champions Regulation M-C. Not an exhaustive mega roster.
 */
export const MEGA_STONES: Record<string, { pokemonId: number; stone: string; label: string }> = {
  'venusaur-mega': { pokemonId: 3, stone: 'Venusaurite', label: 'Mega-Venusaur' },
  'charizard-mega-x': { pokemonId: 6, stone: 'Charizardite X', label: 'Mega-Charizard X' },
  'charizard-mega-y': { pokemonId: 6, stone: 'Charizardite Y', label: 'Mega-Charizard Y' },
  'blastoise-mega': { pokemonId: 9, stone: 'Blastoisinite', label: 'Mega-Blastoise' },
  'gengar-mega': { pokemonId: 94, stone: 'Gengarite', label: 'Mega-Gengar' },
  'gardevoir-mega': { pokemonId: 282, stone: 'Gardevoirite', label: 'Mega-Gardevoir' },
  'absol-mega': { pokemonId: 359, stone: 'Absolite', label: 'Mega-Absol' },
  'absol-mega-z': { pokemonId: 359, stone: 'Absolite Z', label: 'Mega-Absol Z' },
  'lucario-mega': { pokemonId: 448, stone: 'Lucarionite', label: 'Mega-Lucario' },
  'lucario-mega-z': { pokemonId: 448, stone: 'Lucarionite Z', label: 'Mega-Lucario Z' },
  'garchomp-mega': { pokemonId: 445, stone: 'Garchompite', label: 'Mega-Garchomp' },
  'garchomp-mega-z': { pokemonId: 445, stone: 'Garchompite Z', label: 'Mega-Garchomp Z' },
  'salamence-mega': { pokemonId: 373, stone: 'Salamencite', label: 'Mega-Salamence' },
  'scizor-mega': { pokemonId: 212, stone: 'Scizorite', label: 'Mega-Scizor' },
  'ampharos-mega': { pokemonId: 181, stone: 'Ampharosite', label: 'Mega-Ampharos' },
  'tyranitar-mega': { pokemonId: 248, stone: 'Tyranitarite', label: 'Mega-Tyranitar' },
  'gyarados-mega': { pokemonId: 130, stone: 'Gyaradosite', label: 'Mega-Gyarados' }
};
 
/** Effective types after Z Mega Evolution. Other Megas retain base-type analysis for now. */
export const MEGA_Z_TYPES: Record<string, PokemonType[]> = {
  'absol-mega-z': ['dark', 'ghost'],
  'garchomp-mega-z': ['dragon'],
  'lucario-mega-z': ['fighting', 'steel']
};

const MEGA_Z_ABILITIES: Record<string, string> = {
  'absol-mega-z': 'Sharpness',
  'garchomp-mega-z': 'Levitate',
  'lucario-mega-z': 'Aura Guard'
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
    return { ...member, formId, item: mega.stone, ability: MEGA_Z_ABILITIES[formId] ?? '' };
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

/**
 * Remaining capacity for one stat, including the value already assigned to it.
 * Editing an existing stat stays possible even after the total budget is full.
 */
export function maxAssignablePoints(
  member: CompetitivePokemonSet, stat: StatKey, environment: CompetitiveEnvironment
): number {
  const rules = getTrainingRules(environment);
  const points = pointsFor(member, environment);
  const usedElsewhere = statKeys.reduce((sum, key) => {
    if (key === stat) return sum;
    const assigned = points[key];
    return sum + (Number.isFinite(assigned) ? Math.max(0, assigned) : 0);
  }, 0);
  return Math.max(0, Math.min(rules.statMax, Math.floor(rules.totalMax - usedElsewhere)));
}

export function withStatValue(member: CompetitivePokemonSet, stat: StatKey,
  value: number, environment: CompetitiveEnvironment): CompetitivePokemonSet {
  const max = maxAssignablePoints(member, stat, environment);
  // Both typing and the number-input spinners must obey the SAME rule.
  const requested = Number.isFinite(value) ? Math.trunc(value) : 0;
  const limited = Math.max(0, Math.min(max, requested));
  if (environment === 'champions') {
    return { ...member, championsPoints: { ...pointsFor(member, 'champions'), [stat]: limited } };
  }
  return { ...member, evs: { ...member.evs, [stat]: limited } };
}
