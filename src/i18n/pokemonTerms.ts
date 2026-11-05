import type { Locale } from './LocaleProvider';
import officialTerms from './generated/pokemonTerms.json';

type Category = 'moves' | 'abilities' | 'natures';
type TermRow = readonly [english: string, spain: string, latinAmerica: string];
type TermCatalog = Record<string, TermRow>;

const curatedAbilities: TermCatalog = {
  // New Mega Z ability not always present in PokéAPI exports yet.
  'aura-guard': ['Aura Guard', 'Aura Protectora', 'Aura Protectora']
};

function normalize(text: string): string {
  return text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');
}

const catalogs: Record<Category, TermCatalog> = {
  moves: officialTerms.moves as TermCatalog,
  abilities: { ...(officialTerms.abilities as TermCatalog), ...curatedAbilities },
  natures: officialTerms.natures as TermCatalog
};

const indexes = {} as Record<Category, Map<string, TermRow>>;
for (const category of ['moves', 'abilities', 'natures'] as const) {
  const index = new Map<string, TermRow>();
  for (const [id, row] of Object.entries(catalogs[category])) {
    // Keep stable English identifiers for sets and data sources; both regional
    // names are aliases for display and searching, not storage keys.
    for (const alias of [id, ...row]) {
      const key = normalize(alias);
      if (!index.has(key)) index.set(key, row);
    }
  }
  indexes[category] = index;
}

function findTerm(category: Category, value: string): TermRow | undefined {
  return indexes[category].get(normalize(value));
}

export function pokemonTermName(category: Category, value: string, locale: Locale): string {
  const entry = findTerm(category, value);
  return entry ? entry[locale === 'es-ES' ? 1 : 2] : value;
}

export function pokemonMoveName(value: string, locale: Locale): string {
  return pokemonTermName('moves', value, locale);
}
export function pokemonAbilityName(value: string, locale: Locale): string {
  return pokemonTermName('abilities', value, locale);
}
export function pokemonNatureName(value: string, locale: Locale): string {
  return pokemonTermName('natures', value, locale);
}

/** Preserve the canonical English name when the user picks or pastes a translated move. */
export function canonicalMoveName(value: string): string {
  return findTerm('moves', value)?.[0] ?? value;
}
