import type { CompiledDataset } from '../../data/types';
import type { CollectionConfig, CollectionResult } from '../../domain/collections/types';
import { generateCollection } from './generateCollection';

export function regenerateCollectionTeam(
  dataset: CompiledDataset,
  config: CollectionConfig,
  current: CollectionResult,
  entryId: string,
  rng: () => number = Math.random
): CollectionResult {
  const target = current.teams.find(team => team.entryId === entryId);
  if (!target || target.locked) return current;

  const originalLocks = new Map(current.teams.map(team => [team.entryId, team.locked]));
  const guarded: CollectionResult = {
    ...current,
    teams: current.teams.map(team => ({
      ...team,
      locked: team.entryId !== entryId ? true : false
    }))
  };

  const regenerated = generateCollection(dataset, config, guarded, rng);
  return {
    ...regenerated,
    teams: regenerated.teams.map(team => ({
      ...team,
      locked: originalLocks.get(team.entryId) ?? false
    }))
  };
}
