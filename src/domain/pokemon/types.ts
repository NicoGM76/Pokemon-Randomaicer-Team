export type PokemonType =
  | 'normal' | 'fire' | 'water' | 'electric' | 'grass' | 'ice'
  | 'fighting' | 'poison' | 'ground' | 'flying' | 'psychic' | 'bug'
  | 'rock' | 'ghost' | 'dragon' | 'dark' | 'steel' | 'fairy';

export interface PokemonStats {
  hp: number;
  attack: number;
  defense: number;
  specialAttack: number;
  specialDefense: number;
  speed: number;
}

export interface Pokemon {
  id: number;
  name: string;
  types: PokemonType[];
  introducedGeneration: number;
  evolutionFamilyId: string;
  stats: PokemonStats;
  specialTags: string[];
  isPseudoLegendary: boolean;
  isFossil: boolean;
  isStarter: boolean;
}

export type PokemonFormType = 'base' | 'cosmetic' | 'regional' | 'gameplay' | 'special';

export interface PokemonForm {
  id: string;
  pokemonId: number;
  name: string;
  formType: PokemonFormType;
  types?: PokemonType[];
  stats?: PokemonStats;
  countsAsSameSpecies: boolean;
}
