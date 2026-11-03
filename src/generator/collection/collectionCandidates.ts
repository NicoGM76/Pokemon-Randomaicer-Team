import type { CompiledDataset } from '../../data/types';
import type { CollectionEntryConfig } from '../../domain/collections/types';
import type { PokemonCandidate } from '../../domain/teams/types';
import { buildCandidates, usesRegionalDexFallback } from '../candidates/buildCandidates';
import { resolveReachableEvolutions } from '../evolution/resolveReachableEvolutions';
import { passesCandidateFilters } from '../filters/passesCandidateFilters';

/**
 * Regional dex membership establishes which base Pokémon can be encountered.
 * It is not a complete list of evolutions available later in the game's
 * progression. Only Collection extends these paths; Adventure remains intact.
 *
 * Item availability and exact story unlocks are not curated for most games,
 * so these are possible evolutionary paths, NOT certified acquisition routes.
 */
export function buildCollectionCandidates(
  dataset: CompiledDataset,
  entry: CollectionEntryConfig
): PokemonCandidate[] {
  const game = dataset.games.find(value => value.id === entry.generator.gameId);
  if (!game) return [];

  const config = {
    ...entry.generator,
    typeChartGeneration: entry.targetGeneration,
    customRules: entry.generator.customRules?.onlyCurrentGeneration
      ? { ...entry.generator.customRules, onlyCurrentGeneration: false }
      : entry.generator.customRules
  };
  const initial = buildCandidates(dataset, config);
  if (!usesRegionalDexFallback(dataset, config)) return initial;

  const byId = new Map(dataset.pokemon.map(pokemon => [pokemon.id, pokemon]));
  const gameSteps = dataset.evolutions.filter(step => {
    const target = byId.get(step.toId);
    const origin = byId.get(step.fromId);
    return Boolean(target && origin
      && target.introducedGeneration <= game.generation
      && origin.introducedGeneration <= game.generation
      && origin.evolutionFamilyId === target.evolutionFamilyId);
  });
  const grouped = new Map<string, PokemonCandidate>();

  for (const existing of initial) {
    // A form's evolution needs form-specific rules; preserve non-base forms.
    const finals = existing.form
      ? [{ pokemonId: existing.resolvedPokemon.id, path: [] }]
      : resolveReachableEvolutions(existing.resolvedPokemon.id, gameSteps, config);

    for (const final of finals) {
      const evolved = byId.get(final.pokemonId);
      if (!evolved) continue;
      const form = final.path.length ? undefined : existing.form;
      const candidate: PokemonCandidate = {
        ...existing,
        candidateKey: String(evolved.id) + ':' + (form?.id ?? 'base'),
        resolvedPokemon: evolved,
        form,
        specialMechanics: final.path.length ? undefined : existing.specialMechanics,
        evolutionPath: [...existing.evolutionPath, ...final.path],
        speciesGroupId: String(evolved.id)
      };
      if (!passesCandidateFilters(candidate, config, game)) continue;
      const previous = grouped.get(candidate.candidateKey);
      if (!previous || candidate.evolutionPath.length < previous.evolutionPath.length) {
        grouped.set(candidate.candidateKey, candidate);
      }
    }
  }

  return [...grouped.values()].sort((a, b) => a.candidateKey.localeCompare(b.candidateKey));
}
