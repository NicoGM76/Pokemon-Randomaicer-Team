import type { Availability, AcquisitionMethod, AdventureStage } from '../games/types';
import type { EvolutionStep } from '../evolution/types';
import type { Pokemon, PokemonForm, PokemonType } from '../pokemon/types';

export type GeneratorMode = 'random' | 'adventure' | 'custom';
export type RequiredOneRule = 'allow' | 'require_one' | 'exclude';
export type InclusionRule = 'allow' | 'exclude';

export interface CustomRules {
  monotype?: PokemonType;
  onlyCurrentGeneration?: boolean;
  onlyRegionalForms?: boolean;
  mythicalRule?: InclusionRule;
  ultraBeastRule?: InclusionRule;
  paradoxRule?: InclusionRule;
  pseudoLegendaryRule?: InclusionRule;
  fossilRule?: InclusionRule;
  maxSharedType?: number;
}

export interface GeneratorConfig {
  gameId: string;
  enabledContentPacks: string[];
  teamSize: number;
  stage: AdventureStage;
  mode: GeneratorMode;
  allowedMethods: AcquisitionMethod[];
  allowTradeEvolution: boolean;
  starterRule: RequiredOneRule;
  legendaryRule: RequiredOneRule;
  typeChartGeneration?: number;
  customRules?: CustomRules;
}

export interface SpecialMechanic {
  id: string;
  label: string;
  type: 'mega' | 'gigantamax' | 'unique_z_move' | 'other';
}

export interface PokemonCandidate {
  candidateKey: string;
  sourcePokemon: Pokemon;
  resolvedPokemon: Pokemon;
  form?: PokemonForm;
  evolutionPath: EvolutionStep[];
  evolutionFamilyId: string;
  speciesGroupId: string;
  acquisitionOptions: Availability[];
  specialMechanics?: SpecialMechanic[];
}

export interface TeamSlot {
  candidate: PokemonCandidate;
  locked: boolean;
}

export type ValidationIssueCode =
  | 'team_too_small'
  | 'duplicate_evolution_family'
  | 'duplicate_species_group'
  | 'too_many_shared_types'
  | 'missing_required_starter'
  | 'too_many_starters'
  | 'missing_required_legendary'
  | 'too_many_legendaries';

export interface ValidationIssue {
  code: ValidationIssueCode;
  message: string;
}

export interface TeamValidationResult {
  valid: boolean;
  issues: ValidationIssue[];
}

export interface GenerationWarning {
  code: string;
  message: string;
}

export interface GenerationResult {
  team: TeamSlot[];
  requestedSize: number;
  generatedSize: number;
  complete: boolean;
  validation: TeamValidationResult;
  warnings: GenerationWarning[];
}

export interface SavedTeam {
  id: string;
  name: string;
  createdAt: string;
  gameId: string;
  config: GeneratorConfig;
  team: TeamSlot[];
}

export interface SlotRegenerationResult {
  team: TeamSlot[];
  changed: boolean;
  reason?: 'no_alternative';
}
