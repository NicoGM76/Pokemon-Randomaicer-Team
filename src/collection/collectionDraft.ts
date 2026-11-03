import type { CollectionConfig, CollectionResult } from '../domain/collections/types';
import { LocalDraftStore } from '../storage/drafts/LocalDraftStore';

export interface CollectionDraft {
  config: CollectionConfig;
  result: CollectionResult | null;
  /** Optional for drafts saved by older versions of Collection. */
  resultEngineVersion?: number;
}

function isCollectionConfig(value: unknown): value is CollectionConfig {
  if (!value || typeof value !== 'object') return false;
  const config = value as Partial<CollectionConfig>;
  return Array.isArray(config.entries)
    && config.entries.every(entry => Boolean(entry)
      && typeof entry.id === 'string'
      && typeof entry.label === 'string'
      && typeof entry.targetGeneration === 'number'
      && Boolean(entry.generator)
      && typeof entry.allowBonus === 'boolean')
    && typeof config.avoidRepeatedSpecies === 'boolean'
    && typeof config.avoidRepeatedFamilies === 'boolean'
    && typeof config.maxBonusPerTeam === 'number';
}

function isCollectionResult(value: unknown): value is CollectionResult {
  if (!value || typeof value !== 'object') return false;
  const result = value as Partial<CollectionResult>;
  return Array.isArray(result.teams)
    && typeof result.complete === 'boolean'
    && typeof result.totalPokemon === 'number'
    && typeof result.bonusesUsed === 'number'
    && typeof result.duplicateSpecies === 'number'
    && typeof result.duplicateFamilies === 'number'
    && Array.isArray(result.warnings);
}

function isCollectionDraft(value: unknown): value is CollectionDraft {
  if (!value || typeof value !== 'object') return false;
  const draft = value as Partial<CollectionDraft>;
  return isCollectionConfig(draft.config)
    && (draft.result === null || isCollectionResult(draft.result))
    && (draft.resultEngineVersion === undefined
      || (Number.isInteger(draft.resultEngineVersion) && draft.resultEngineVersion > 0));
}

export const COLLECTION_DRAFT_KEY = 'pokemon-team-generator:draft:collection';
const COLLECTION_DRAFT_VERSION = 1;
const store = new LocalDraftStore<CollectionDraft>(COLLECTION_DRAFT_KEY, COLLECTION_DRAFT_VERSION, isCollectionDraft);

export function loadCollectionDraft(): CollectionDraft | null {
  return store.load();
}

export function saveCollectionDraft(draft: CollectionDraft): void {
  store.save(draft);
}

export function clearCollectionDraft(): void {
  store.clear();
}
