import type { CompiledDataset } from '../../data/types';
import type { Pokemon, PokemonForm } from '../../domain/pokemon/types';
import type { PokemonCandidate, GeneratorConfig } from '../../domain/teams/types';
import { matchesAvailability } from '../availability/matchesAvailability';
import { resolveReachableEvolutions } from '../evolution/resolveReachableEvolutions';
import { passesCandidateFilters } from '../filters/passesCandidateFilters';

function withForm(base: Pokemon, form?: PokemonForm): Pokemon {
  if (!form) return base;
  return { ...base, types: form.types ?? base.types, stats: form.stats ?? base.stats };
}

function buildDexFallbackIds(dataset: CompiledDataset, config: GeneratorConfig): Set<number> {
  const enabledPacks = dataset.contentPacks.filter(pack =>
    pack.gameId === config.gameId && config.enabledContentPacks.includes(pack.id)
  );
  const dexIds = new Set(enabledPacks.flatMap(pack => pack.dexIds ?? []));
  return new Set(
    dataset.regionalDexEntries
      .filter(entry => dexIds.has(entry.dexId))
      .map(entry => entry.pokemonId)
  );
}

export function usesRegionalDexFallback(dataset: CompiledDataset, config: GeneratorConfig): boolean {
  const coverage = dataset.availabilityCoverage?.find(item => item.gameId === config.gameId);
  return coverage?.status !== 'complete';
}

export function buildCandidates(dataset: CompiledDataset, config: GeneratorConfig): PokemonCandidate[] {
  const game = dataset.games.find(g => g.id === config.gameId);
  if (!game) return [];
  const grouped = new Map<string, PokemonCandidate>();
  const dexFallback = usesRegionalDexFallback(dataset, config);
  const fallbackIds = dexFallback ? buildDexFallbackIds(dataset, config) : new Set<number>();
  const fallbackEvolutionSteps = dexFallback
    ? dataset.evolutions.filter(step => fallbackIds.has(step.fromId) && fallbackIds.has(step.toId))
    : dataset.evolutions;

  for (const source of dataset.pokemon) {
    if (dexFallback) {
      if (!fallbackIds.has(source.id)) continue;
      const finals = resolveReachableEvolutions(source.id, fallbackEvolutionSteps, config);
      for (const final of finals) {
        const resolvedPokemon = dataset.pokemon.find(p => p.id === final.pokemonId);
        if (!resolvedPokemon) continue;
        const candidate: PokemonCandidate = {
          candidateKey: `${resolvedPokemon.id}:base`,
          sourcePokemon: source,
          resolvedPokemon,
          evolutionPath: final.path,
          evolutionFamilyId: source.evolutionFamilyId,
          speciesGroupId: String(resolvedPokemon.id),
          acquisitionOptions: []
        };
        if (!passesCandidateFilters(candidate, config, game)) continue;
        const existing = grouped.get(candidate.candidateKey);
        if (!existing || candidate.evolutionPath.length < existing.evolutionPath.length) {
          grouped.set(candidate.candidateKey, candidate);
        }
      }
      continue;
    }

    const availability = dataset.availability.filter(rule => rule.pokemonId === source.id && matchesAvailability(rule, config, dataset.contentPacks));
    if (!availability.length) continue;

    const byForm = new Map<string, typeof availability>();
    for (const rule of availability) {
      const key = rule.formId ?? 'base';
      const list = byForm.get(key) ?? [];
      list.push(rule); byForm.set(key, list);
    }

    for (const [formKey, acquisitionOptions] of byForm) {
      const form = formKey === 'base' ? undefined : dataset.forms.find(f => f.id === formKey);
      if (form?.formType === 'cosmetic') continue;
      const finals = resolveReachableEvolutions(source.id, dataset.evolutions, config);
      for (const final of finals) {
        const baseResolved = dataset.pokemon.find(p => p.id === final.pokemonId);
        if (!baseResolved) continue;
        const candidateForm = form && form.pokemonId === baseResolved.id ? form : (source.id === baseResolved.id ? form : undefined);
        const resolvedPokemon = withForm(baseResolved, candidateForm);
        const candidateKey = `${resolvedPokemon.id}:${candidateForm?.id ?? 'base'}`;
        const candidate: PokemonCandidate = {
          candidateKey,
          sourcePokemon: source,
          resolvedPokemon,
          form: candidateForm,
          evolutionPath: final.path,
          evolutionFamilyId: source.evolutionFamilyId,
          speciesGroupId: String(resolvedPokemon.id),
          acquisitionOptions: [...acquisitionOptions]
        };
        if (!passesCandidateFilters(candidate, config, game)) continue;
        const existing = grouped.get(candidateKey);
        if (!existing) grouped.set(candidateKey, candidate);
        else {
          const merged = [...existing.acquisitionOptions];
          for (const option of acquisitionOptions) {
            if (!merged.some(x => JSON.stringify(x) === JSON.stringify(option))) merged.push(option);
          }
          if (candidate.evolutionPath.length < existing.evolutionPath.length) {
            candidate.acquisitionOptions = merged;
            grouped.set(candidateKey, candidate);
          } else existing.acquisitionOptions = merged;
        }
      }
    }
  }
  return [...grouped.values()].sort((a,b) => a.candidateKey.localeCompare(b.candidateKey));
}
