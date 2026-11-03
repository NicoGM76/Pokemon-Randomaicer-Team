import type { CompiledDataset } from '../../data/types';
import type { CollectionConfig, CollectionResult } from '../../domain/collections/types';
import type { PokemonCandidate } from '../../domain/teams/types';
import { canAddCandidateToTeam } from '../constraints/canAddCandidateToTeam';
import { validateTeam } from '../validation/validateTeam';
import { familyOriginGeneration } from './familyOriginGeneration';
import { buildCollectionCandidates } from './collectionCandidates';
import { summarizeCollection } from './generateCollection';

/**
 * Replace exactly one slot. All other slots, their ordering and their
 * existing locks remain unchanged, as do all other regions.
 */
export function regenerateCollectionMember(
  dataset: CompiledDataset,
  config: CollectionConfig,
  current: CollectionResult,
  entryId: string,
  index: number,
  rng: () => number = Math.random
): CollectionResult {
  const target = current.teams.find(team => team.entryId === entryId);
  const entry = config.entries.find(value => value.id === entryId);
  if (!target || !entry || target.locked
    || !Number.isInteger(index) || index < 0 || index >= target.team.length
    || target.team[index].locked) return current;

  const oldSlot = target.team[index];
  const others = target.team.filter((_, slotIndex) => slotIndex !== index);
  const otherCandidates = others.map(slot => slot.candidate);
  const external = current.teams.filter(team => team.entryId !== entryId)
    .flatMap(team => team.team.map(slot => slot.candidate));
  const speciesInOtherTeams = new Set(external.map(candidate => candidate.speciesGroupId));
  const familiesInOtherTeams = new Set(external.map(candidate => candidate.evolutionFamilyId));

  const effectiveConfig = {
    ...entry.generator,
    typeChartGeneration: entry.targetGeneration,
    customRules: entry.generator.customRules?.onlyCurrentGeneration
      ? { ...entry.generator.customRules, onlyCurrentGeneration: false }
      : entry.generator.customRules
  };

  const otherBonuses = target.bonusCandidateKeys.filter(key => key !== oldSlot.candidate.candidateKey);
  const bonusRoom = entry.allowBonus && otherBonuses.length < config.maxBonusPerTeam;
  const allowed = (candidate: PokemonCandidate): boolean => {
    if (candidate.candidateKey === oldSlot.candidate.candidateKey) return false;
    if (config.avoidRepeatedSpecies && speciesInOtherTeams.has(candidate.speciesGroupId)) return false;
    if (config.avoidRepeatedFamilies && familiesInOtherTeams.has(candidate.evolutionFamilyId)) return false;
    if (!canAddCandidateToTeam(candidate, otherCandidates, effectiveConfig)) return false;

    const validation = validateTeam([...otherCandidates, candidate], effectiveConfig);
    return validation.issues.every(issue =>
      issue.code === 'team_too_small' && target.team.length < effectiveConfig.teamSize
    );
  };

  const all = buildCollectionCandidates(dataset, entry).filter(allowed);
  const normal = all.filter(candidate =>
    familyOriginGeneration(dataset, candidate.evolutionFamilyId) === entry.targetGeneration
  );
  const bonus = bonusRoom ? all.filter(candidate =>
    familyOriginGeneration(dataset, candidate.evolutionFamilyId) !== entry.targetGeneration
  ) : [];
  const wasBonus = target.bonusCandidateKeys.includes(oldSlot.candidate.candidateKey);
  const pool = wasBonus ? (bonus.length ? bonus : normal) : (normal.length ? normal : bonus);
  if (!pool.length) return current;

  const roll = rng();
  const picked = pool[Math.min(pool.length - 1,
    Math.max(0, Math.floor((Number.isFinite(roll) ? roll : 0) * pool.length)))];
  const chosenIsBonus = familyOriginGeneration(dataset, picked.evolutionFamilyId) !== entry.targetGeneration;
  const newBonusKeys = [...otherBonuses, ...(chosenIsBonus ? [picked.candidateKey] : [])];

  const teams = current.teams.map(team => team.entryId !== entryId ? team : {
    ...team,
    team: team.team.map((slot, slotIndex) =>
      slotIndex === index ? { candidate: picked, locked: false } : slot),
    bonusCandidateKeys: newBonusKeys
  });
  return summarizeCollection(teams, config);
}
