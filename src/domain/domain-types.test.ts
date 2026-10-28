import { describe, expect, test } from 'vitest';
import type { Pokemon, PokemonForm } from './pokemon/types';
import type { Availability, ContentPack } from './games/types';
import type { EvolutionStep } from './evolution/types';
import type { GeneratorConfig, PokemonCandidate } from './teams/types';

describe('domain model fixtures', () => {
  test('represents pokemon and forms', () => {
    const pokemon: Pokemon = {
      id: 94,
      name: 'Gengar',
      types: ['ghost', 'poison'],
      introducedGeneration: 1,
      evolutionFamilyId: 'gastly-line',
      stats: { hp: 60, attack: 65, defense: 60, specialAttack: 130, specialDefense: 75, speed: 110 },
      specialTags: [],
      isPseudoLegendary: false,
      isFossil: false,
      isStarter: false
    };
    const form: PokemonForm = {
      id: 'raichu-alola',
      pokemonId: 26,
      name: 'Raichu de Alola',
      formType: 'regional',
      types: ['electric', 'psychic'],
      countsAsSameSpecies: true
    };
    expect(pokemon.name).toBe('Gengar');
    expect(form.formType).toBe('regional');
  });

  test('represents dlc-aware availability and config', () => {
    const pack: ContentPack = {
      id: 'teal-mask', gameId: 'scarlet', name: 'The Teal Mask', type: 'dlc', requiredContentPacks: ['scarlet-base'], unlockCondition: 'early_story'
    };
    const rule: Availability = {
      pokemonId: 1017,
      gameId: 'scarlet',
      contentPackId: 'teal-mask',
      stage: 'main_story',
      method: 'wild'
    };
    const step: EvolutionStep = {
      fromId: 92,
      toId: 93,
      conditions: [{ type: 'level', minLevel: 25 }]
    };
    const config: GeneratorConfig = {
      gameId: 'scarlet', enabledContentPacks: ['scarlet-base', 'teal-mask'], teamSize: 6, stage: 'all', mode: 'adventure',
      allowedMethods: ['wild', 'gift', 'evolution'], allowTradeEvolution: false,
      starterRule: 'allow', legendaryRule: 'exclude'
    };
    expect(pack.type).toBe('dlc');
    expect(rule.contentPackId).toBe('teal-mask');
    expect(step.conditions[0].type).toBe('level');
    expect(config.teamSize).toBe(6);
  });

  test('candidate distinguishes source and resolved pokemon', () => {
    const source = {} as Pokemon;
    const resolved = {} as Pokemon;
    const candidate: PokemonCandidate = {
      candidateKey: 'gastly>haunter', sourcePokemon: source, resolvedPokemon: resolved,
      evolutionPath: [], evolutionFamilyId: 'gastly-line', speciesGroupId: 'haunter', acquisitionOptions: []
    };
    expect(candidate.sourcePokemon).toBe(source);
    expect(candidate.resolvedPokemon).toBe(resolved);
  });
});
