import type { CompiledDataset } from '../../data/types';
import type { CollectionConfig, CollectionEntryConfig, CollectionResult, CollectionTeam } from '../../domain/collections/types';
import type { GeneratorConfig, PokemonCandidate, TeamSlot } from '../../domain/teams/types';
import { generateAdventureTeam } from '../adventure/generateAdventureTeam';
import { buildCandidates } from '../candidates/buildCandidates';
import { passesCandidateFilters } from '../filters/passesCandidateFilters';
import { generateRandomTeam } from '../random/generateRandomTeam';
import { familyOriginGeneration } from './familyOriginGeneration';

function keyOf(slot: TeamSlot): string {
  return slot.candidate.candidateKey;
}

function speciesOf(slot: TeamSlot): string {
  return slot.candidate.speciesGroupId;
}

function familyOf(slot: TeamSlot): string {
  return slot.candidate.evolutionFamilyId;
}

function reserve(team: TeamSlot[], species: Set<string>, families: Set<string>): void {
  for (const slot of team) {
    species.add(speciesOf(slot));
    families.add(familyOf(slot));
  }
}

function effectiveGeneratorConfig(entry: CollectionEntryConfig): GeneratorConfig {
  const config = entry.generator;
  return {
    ...config,
    typeChartGeneration: entry.targetGeneration,
    customRules: config.customRules?.onlyCurrentGeneration
      ? { ...config.customRules, onlyCurrentGeneration: false }
      : config.customRules
  };
}

function gameCandidates(dataset: CompiledDataset, entry: CollectionEntryConfig): PokemonCandidate[] {
  return buildCandidates(dataset, effectiveGeneratorConfig(entry));
}

function normalCandidates(dataset: CompiledDataset, entry: CollectionEntryConfig): PokemonCandidate[] {
  return gameCandidates(dataset, entry).filter(
    candidate => familyOriginGeneration(dataset, candidate.evolutionFamilyId) === entry.targetGeneration
  );
}

function availableForCollection(
  candidates: PokemonCandidate[],
  species: Set<string>,
  families: Set<string>,
  config: CollectionConfig,
  ownLocked: TeamSlot[] = []
): PokemonCandidate[] {
  const ownKeys = new Set(ownLocked.map(keyOf));
  return candidates.filter(candidate => {
    if (ownKeys.has(candidate.candidateKey)) return true;
    if (config.avoidRepeatedSpecies && species.has(candidate.speciesGroupId)) return false;
    if (config.avoidRepeatedFamilies && families.has(candidate.evolutionFamilyId)) return false;
    return true;
  });
}

function legalGlobalBonusCandidates(
  dataset: CompiledDataset,
  entry: CollectionEntryConfig,
  species: Set<string>,
  families: Set<string>,
  collection: CollectionConfig
): PokemonCandidate[] {
  const game = dataset.games.find(item => item.id === entry.generator.gameId);
  if (!game) return [];
  const bonusConfig = effectiveGeneratorConfig(entry);

  return dataset.pokemon
    .map<PokemonCandidate>(pokemon => ({
      candidateKey: `${pokemon.id}:bonus`,
      sourcePokemon: pokemon,
      resolvedPokemon: pokemon,
      evolutionPath: [],
      evolutionFamilyId: pokemon.evolutionFamilyId,
      speciesGroupId: String(pokemon.id),
      acquisitionOptions: []
    }))
    .filter(candidate => familyOriginGeneration(dataset, candidate.evolutionFamilyId) !== entry.targetGeneration)
    .filter(candidate => !collection.avoidRepeatedSpecies || !species.has(candidate.speciesGroupId))
    .filter(candidate => !collection.avoidRepeatedFamilies || !families.has(candidate.evolutionFamilyId))
    .filter(candidate => passesCandidateFilters(candidate, bonusConfig, game));
}

function bonusCandidates(
  dataset: CompiledDataset,
  entry: CollectionEntryConfig,
  allGameCandidates: PokemonCandidate[],
  species: Set<string>,
  families: Set<string>,
  collection: CollectionConfig
): PokemonCandidate[] {
  const fromSelectedGame = availableForCollection(
    allGameCandidates.filter(candidate => familyOriginGeneration(dataset, candidate.evolutionFamilyId) !== entry.targetGeneration),
    species,
    families,
    collection
  );
  if (fromSelectedGame.length) return fromSelectedGame;
  return legalGlobalBonusCandidates(dataset, entry, species, families, collection);
}

function generateOne(
  dataset: CompiledDataset,
  collection: CollectionConfig,
  entry: CollectionEntryConfig,
  current: CollectionTeam | undefined,
  reservedSpecies: Set<string>,
  reservedFamilies: Set<string>,
  rng: () => number
): CollectionTeam {
  if (current?.locked) return current;

  const effectiveConfig = effectiveGeneratorConfig(entry);
  const lockedSlots = current?.team.filter(slot => slot.locked) ?? [];
  const allGameCandidates = gameCandidates(dataset, entry);
  const localCandidates = allGameCandidates.filter(
    candidate => familyOriginGeneration(dataset, candidate.evolutionFamilyId) === entry.targetGeneration
  );
  const legalCandidates = availableForCollection(localCandidates, reservedSpecies, reservedFamilies, collection, lockedSlots);
  const generator = effectiveConfig.mode === 'adventure' ? generateAdventureTeam : generateRandomTeam;
  const generated = generator(legalCandidates, effectiveConfig, lockedSlots, rng);
  let team = generated.team;
  const bonusKeys: string[] = current?.bonusCandidateKeys.filter(key => lockedSlots.some(slot => slot.candidate.candidateKey === key)) ?? [];

  if (
    team.length < effectiveConfig.teamSize &&
    entry.allowBonus &&
    bonusKeys.length < collection.maxBonusPerTeam
  ) {
    const localSpecies = new Set(reservedSpecies);
    const localFamilies = new Set(reservedFamilies);
    reserve(team, localSpecies, localFamilies);
    const pool = bonusCandidates(dataset, entry, allGameCandidates, localSpecies, localFamilies, collection);
    if (pool.length) {
      const picked = pool[Math.floor(rng() * pool.length)];
      const slot: TeamSlot = { candidate: picked, locked: false };
      team = [...team, slot].slice(0, effectiveConfig.teamSize);
      bonusKeys.push(picked.candidateKey);
    }
  }

  return {
    entryId: entry.id,
    label: entry.label,
    targetGeneration: entry.targetGeneration,
    gameId: effectiveConfig.gameId,
    team,
    complete: team.length === effectiveConfig.teamSize,
    locked: false,
    bonusCandidateKeys: bonusKeys
  };
}

function summarize(teams: CollectionTeam[], config: CollectionConfig): CollectionResult {
  const speciesCounts = new Map<string, number>();
  const familyCounts = new Map<string, number>();
  for (const team of teams) {
    for (const slot of team.team) {
      speciesCounts.set(speciesOf(slot), (speciesCounts.get(speciesOf(slot)) ?? 0) + 1);
      familyCounts.set(familyOf(slot), (familyCounts.get(familyOf(slot)) ?? 0) + 1);
    }
  }
  const duplicateSpecies = [...speciesCounts.values()].filter(count => count > 1).length;
  const duplicateFamilies = [...familyCounts.values()].filter(count => count > 1).length;
  const violatesSpecies = config.avoidRepeatedSpecies && duplicateSpecies > 0;
  const violatesFamilies = config.avoidRepeatedFamilies && duplicateFamilies > 0;
  const warnings: string[] = [];
  if (teams.some(team => !team.complete)) warnings.push('Algunos equipos no pudieron completarse sin relajar las reglas globales.');
  if (violatesSpecies) warnings.push('Hay especies repetidas aunque la colección las prohíbe.');
  if (violatesFamilies) warnings.push('Hay familias evolutivas repetidas aunque la colección las prohíbe.');
  return {
    teams,
    complete: teams.every(team => team.complete) && !violatesSpecies && !violatesFamilies,
    totalPokemon: teams.reduce((total, team) => total + team.team.length, 0),
    bonusesUsed: teams.reduce((total, team) => total + team.bonusCandidateKeys.length, 0),
    duplicateSpecies,
    duplicateFamilies,
    warnings
  };
}

function attempt(
  dataset: CompiledDataset,
  config: CollectionConfig,
  current: CollectionResult | undefined,
  rng: () => number
): CollectionResult {
  const currentByEntry = new Map(current?.teams.map(team => [team.entryId, team]) ?? []);
  const reservedSpecies = new Set<string>();
  const reservedFamilies = new Set<string>();
  const resultByEntry = new Map<string, CollectionTeam>();

  for (const entry of config.entries) {
    const existing = currentByEntry.get(entry.id);
    if (!existing) continue;
    if (existing.locked) {
      resultByEntry.set(entry.id, existing);
      reserve(existing.team, reservedSpecies, reservedFamilies);
      continue;
    }
    reserve(existing.team.filter(slot => slot.locked), reservedSpecies, reservedFamilies);
  }

  const pending = config.entries
    .filter(entry => !resultByEntry.has(entry.id))
    .map(entry => ({ entry, poolSize: normalCandidates(dataset, entry).length }))
    .sort((a, b) => a.poolSize - b.poolSize || rng() - 0.5);

  for (const { entry } of pending) {
    const team = generateOne(
      dataset,
      config,
      entry,
      currentByEntry.get(entry.id),
      reservedSpecies,
      reservedFamilies,
      rng
    );
    resultByEntry.set(entry.id, team);
    reserve(team.team, reservedSpecies, reservedFamilies);
  }

  return summarize(config.entries.map(entry => resultByEntry.get(entry.id)!).filter(Boolean), config);
}

function score(result: CollectionResult, config: CollectionConfig): number {
  const speciesPenalty = config.avoidRepeatedSpecies ? result.duplicateSpecies * 10000 : 0;
  const familyPenalty = config.avoidRepeatedFamilies ? result.duplicateFamilies * 10000 : 0;
  return result.totalPokemon * 1000 - result.bonusesUsed * 10 - speciesPenalty - familyPenalty;
}

export function generateCollection(
  dataset: CompiledDataset,
  config: CollectionConfig,
  current?: CollectionResult,
  rng: () => number = Math.random
): CollectionResult {
  let best: CollectionResult | undefined;
  const attempts = current ? 8 : 16;
  for (let index = 0; index < attempts; index++) {
    const next = attempt(dataset, config, current, rng);
    if (!best || score(next, config) > score(best, config)) best = next;
    if (next.complete && next.bonusesUsed === 0) break;
  }
  return best ?? summarize([], config);
}
