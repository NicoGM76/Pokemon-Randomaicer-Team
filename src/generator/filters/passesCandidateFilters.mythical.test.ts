import { describe, expect, it } from 'vitest';
import type { Game } from '../../domain/games/types';
import type { PokemonCandidate, GeneratorConfig } from '../../domain/teams/types';
import { passesCandidateFilters } from './passesCandidateFilters';

const game: Game = { id: 'red', name: 'Pokémon Rojo', generation: 1, familyId: 'rby', dexIds: ['kanto-classic'] };

const config: GeneratorConfig = {
  gameId: 'red',
  enabledContentPacks: ['red-base'],
  teamSize: 6,
  stage: 'all',
  mode: 'adventure',
  allowedMethods: ['wild'],
  allowTradeEvolution: false,
  starterRule: 'allow',
  legendaryRule: 'exclude'
};

const mythicalCandidate: PokemonCandidate = {
  candidateKey: '151:base',
  sourcePokemon: {
    id: 151,
    name: 'Mew',
    types: ['psychic'],
    introducedGeneration: 1,
    evolutionFamilyId: 'chain-151',
    stats: { hp: 100, attack: 100, defense: 100, specialAttack: 100, specialDefense: 100, speed: 100 },
    specialTags: ['mythical'],
    isPseudoLegendary: false,
    isFossil: false,
    isStarter: false
  },
  resolvedPokemon: {
    id: 151,
    name: 'Mew',
    types: ['psychic'],
    introducedGeneration: 1,
    evolutionFamilyId: 'chain-151',
    stats: { hp: 100, attack: 100, defense: 100, specialAttack: 100, specialDefense: 100, speed: 100 },
    specialTags: ['mythical'],
    isPseudoLegendary: false,
    isFossil: false,
    isStarter: false
  },
  evolutionPath: [],
  evolutionFamilyId: 'chain-151',
  speciesGroupId: '151',
  acquisitionOptions: []
};

describe('legendary exclusion', () => {
  it('also excludes mythical Pokémon from normal adventure pools', () => {
    expect(passesCandidateFilters(mythicalCandidate, config, game)).toBe(false);
  });
});
