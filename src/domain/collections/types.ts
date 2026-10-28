import type { GeneratorConfig, TeamSlot } from '../teams/types';

export interface CollectionEntryConfig {
  id: string;
  label: string;
  targetGeneration: number;
  generator: GeneratorConfig;
  allowBonus: boolean;
}

export interface CollectionConfig {
  entries: CollectionEntryConfig[];
  avoidRepeatedSpecies: boolean;
  avoidRepeatedFamilies: boolean;
  maxBonusPerTeam: number;
}

export interface CollectionTeam {
  entryId: string;
  label: string;
  targetGeneration: number;
  gameId: string;
  team: TeamSlot[];
  complete: boolean;
  locked: boolean;
  bonusCandidateKeys: string[];
}

export interface CollectionResult {
  teams: CollectionTeam[];
  complete: boolean;
  totalPokemon: number;
  bonusesUsed: number;
  duplicateSpecies: number;
  duplicateFamilies: number;
  warnings: string[];
}
