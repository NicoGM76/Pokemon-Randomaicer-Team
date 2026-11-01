import type { CollectionConfig, CollectionResult } from '../domain/collections/types';
import { LocalDraftStore } from '../storage/drafts/LocalDraftStore';

export interface CollectionDraft {
  config: CollectionConfig;
  result: CollectionResult | null;
}

export const COLLECTION_DRAFT_KEY = 'pokemon-team-generator:draft:collection';
const COLLECTION_DRAFT_VERSION = 1;
const store = new LocalDraftStore<CollectionDraft>(COLLECTION_DRAFT_KEY, COLLECTION_DRAFT_VERSION);

export function loadCollectionDraft(): CollectionDraft | null {
  return store.load();
}

export function saveCollectionDraft(draft: CollectionDraft): void {
  store.save(draft);
}

export function clearCollectionDraft(): void {
  store.clear();
}
