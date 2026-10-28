import type { Pokemon, PokemonForm } from './pokemon/types';
import type { Availability, ContentPack } from './games/types';
import type { EvolutionStep } from './evolution/types';
import type { GeneratorConfig, PokemonCandidate } from './teams/types';

const gengar: Pokemon = {
  id: 94, name: 'Gengar', types: ['ghost', 'poison'], introducedGeneration: 1,
  evolutionFamilyId: 'gastly-line',
  stats: { hp: 60, attack: 65, defense: 60, specialAttack: 130, specialDefense: 75, speed: 110 },
  specialTags: [], isPseudoLegendary: false, isFossil: false, isStarter: false
};
const form: PokemonForm = { id: 'raichu-alola', pokemonId: 26, name: 'Raichu de Alola', formType: 'regional', countsAsSameSpecies: true };
const pack: ContentPack = { id: 'teal-mask', gameId: 'scarlet', name: 'The Teal Mask', type: 'dlc', requiredContentPacks: ['scarlet-base'], unlockCondition: 'early_story' };
const availability: Availability = { pokemonId: 1017, gameId: 'scarlet', contentPackId: 'teal-mask', stage: 'main_story', method: 'wild' };
const step: EvolutionStep = { fromId: 92, toId: 93, conditions: [{ type: 'level', minLevel: 25 }] };
const config: GeneratorConfig = { gameId: 'scarlet', enabledContentPacks: ['scarlet-base'], teamSize: 6, stage: 'all', mode: 'adventure', allowedMethods: ['wild'], allowTradeEvolution: false, starterRule: 'allow', legendaryRule: 'exclude' };
const candidate: PokemonCandidate = { candidateKey: 'gengar', sourcePokemon: gengar, resolvedPokemon: gengar, form, evolutionPath: [step], evolutionFamilyId: 'gastly-line', speciesGroupId: 'gengar', acquisitionOptions: [availability] };
void pack; void config; void candidate;
