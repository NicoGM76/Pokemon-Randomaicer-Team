import type { CollectionConfig, CollectionResult } from '../domain/collections/types';

export function setAllTradeEvolution(config: CollectionConfig, enabled: boolean): CollectionConfig {
  return {
    ...config,
    entries: config.entries.map(entry => ({
      ...entry,
      generator: { ...entry.generator, allowTradeEvolution: enabled }
    }))
  };
}

export function setAllBonus(config: CollectionConfig, enabled: boolean): CollectionConfig {
  return {
    ...config,
    entries: config.entries.map(entry => ({ ...entry, allowBonus: enabled }))
  };
}

/** Region locks never overwrite Pokémon-level locks. */
export function setTeamLocks(result: CollectionResult, locked: boolean): CollectionResult {
  return {
    ...result,
    teams: result.teams.map(team => ({ ...team, locked }))
  };
}

/** Explicitly clears both kinds of locks without replacing the candidates. */
export function clearAllLocks(result: CollectionResult): CollectionResult {
  return {
    ...result,
    teams: result.teams.map(team => ({
      ...team,
      locked: false,
      team: team.team.map(slot => ({ ...slot, locked: false }))
    }))
  };
}
