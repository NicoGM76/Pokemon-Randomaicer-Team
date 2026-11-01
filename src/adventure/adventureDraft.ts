import type { GenerationResult, GeneratorConfig } from '../domain/teams/types';
import { LocalDraftStore } from '../storage/drafts/LocalDraftStore';

export interface AdventureDraft {
  config: GeneratorConfig;
  result: GenerationResult | null;
  notice: string;
}

export const ADVENTURE_DRAFT_KEY = 'pokemon-team-generator:draft:adventure';
const ADVENTURE_DRAFT_VERSION = 1;
const store = new LocalDraftStore<AdventureDraft>(ADVENTURE_DRAFT_KEY, ADVENTURE_DRAFT_VERSION);

export function loadAdventureDraft(): AdventureDraft | null {
  return store.load();
}

export function saveAdventureDraft(draft: AdventureDraft): void {
  store.save(draft);
}

export function clearAdventureDraft(): void {
  store.clear();
}
