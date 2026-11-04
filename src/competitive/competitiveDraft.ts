import { LocalDraftStore } from '../storage/drafts/LocalDraftStore';
import { natureEffects, roleLabels, statKeys } from './core/types';
import { TERA_TYPES } from './core/trainingRules';
import type { CompetitivePokemonSet, CompetitiveTeam, CompetitiveWorkspace } from './core/types';

export const COMPETITIVE_DRAFT_KEY = 'pokemon-team-generator:draft:competitive';
const VERSION = 1;

export function createEmptyWorkspace(): CompetitiveWorkspace {
  return {
    format: 'singles',
    showLearning: true,
    selectedSlot: 0,
    teams: {
      singles: [null, null, null, null, null, null],
      doubles: [null, null, null, null, null, null]
    },
    environmentByFormat: { singles: 'mainline', doubles: 'champions' }
  };
}

function isStats(value: unknown): boolean {
  if (!value || typeof value !== 'object') return false;
  const stats = value as Record<string, unknown>;
  return statKeys.every(key => typeof stats[key] === 'number' && Number.isFinite(stats[key]));
}

function isSet(value: unknown): value is CompetitivePokemonSet {
  if (!value || typeof value !== 'object') return false;
  const set = value as Partial<CompetitivePokemonSet>;
  return typeof set.pokemonId === 'number'
    && Number.isInteger(set.pokemonId) && set.pokemonId > 0
    && typeof set.role === 'string'
    && Object.prototype.hasOwnProperty.call(roleLabels, set.role)
    && typeof set.nature === 'string'
    && Object.prototype.hasOwnProperty.call(natureEffects, set.nature)
    && typeof set.item === 'string'
    && typeof set.ability === 'string'
    && typeof set.locked === 'boolean'
    && Array.isArray(set.moves) && set.moves.length === 4
    && set.moves.every(move => typeof move === 'string')
    && isStats(set.evs) && isStats(set.ivs)
    && (set.templateId === undefined || typeof set.templateId === 'string')
    && (set.championsPoints === undefined || isStats(set.championsPoints))
    && (set.formId === undefined || (typeof set.formId === 'string' && set.formId.length < 100))
    && (set.teraType === undefined || TERA_TYPES.some(type => type === set.teraType));
}

function isTeam(value: unknown): value is CompetitiveTeam {
  return Array.isArray(value)
    && value.length === 6
    && value.every(member => member === null || isSet(member));
}

function isWorkspace(value: unknown): value is CompetitiveWorkspace {
  if (!value || typeof value !== 'object') return false;
  const state = value as Partial<CompetitiveWorkspace>;
  return (state.format === 'singles' || state.format === 'doubles')
    && typeof state.showLearning === 'boolean'
    && Number.isInteger(state.selectedSlot)
    && (state.selectedSlot ?? -1) >= 0 && (state.selectedSlot ?? 6) <= 5
    && Boolean(state.teams)
    && isTeam(state.teams?.singles) && isTeam(state.teams?.doubles)
    && (state.environmentByFormat === undefined || (
      (state.environmentByFormat.singles === 'mainline' || state.environmentByFormat.singles === 'champions') &&
      (state.environmentByFormat.doubles === 'mainline' || state.environmentByFormat.doubles === 'champions')
    ));
}

const store = new LocalDraftStore<CompetitiveWorkspace>(COMPETITIVE_DRAFT_KEY, VERSION, isWorkspace);

export function loadCompetitiveDraft(): CompetitiveWorkspace {
  return store.load() ?? createEmptyWorkspace();
}

export function saveCompetitiveDraft(workspace: CompetitiveWorkspace): void {
  store.save(workspace);
}

export function clearCompetitiveDraft(): void {
  store.clear();
}

export function removeUnknownPokemon(workspace: CompetitiveWorkspace, knownIds: Set<number>): CompetitiveWorkspace {
  return {
    ...workspace,
    teams: {
      singles: workspace.teams.singles.map(set => set && knownIds.has(set.pokemonId) ? set : null),
      doubles: workspace.teams.doubles.map(set => set && knownIds.has(set.pokemonId) ? set : null)
    }
  };
}
