import type { GenerationResult, GeneratorConfig } from '../domain/teams/types';
import { LocalDraftStore } from '../storage/drafts/LocalDraftStore';

export interface AdventureDraft {
  config: GeneratorConfig;
  result: GenerationResult | null;
  notice: string;
}

function isGeneratorConfig(value: unknown): value is GeneratorConfig {
  if (!value || typeof value !== 'object') return false;
  const config = value as Partial<GeneratorConfig>;
  return typeof config.gameId === 'string'
    && Array.isArray(config.enabledContentPacks)
    && typeof config.teamSize === 'number'
    && typeof config.stage === 'string'
    && typeof config.mode === 'string'
    && Array.isArray(config.allowedMethods)
    && typeof config.allowTradeEvolution === 'boolean'
    && typeof config.starterRule === 'string'
    && typeof config.legendaryRule === 'string';
}

function isGenerationResult(value: unknown): value is GenerationResult {
  if (!value || typeof value !== 'object') return false;
  const result = value as Partial<GenerationResult>;
  return Array.isArray(result.team)
    && typeof result.requestedSize === 'number'
    && typeof result.generatedSize === 'number'
    && typeof result.complete === 'boolean'
    && Boolean(result.validation)
    && Array.isArray(result.warnings);
}

function isAdventureDraft(value: unknown): value is AdventureDraft {
  if (!value || typeof value !== 'object') return false;
  const draft = value as Partial<AdventureDraft>;
  return isGeneratorConfig(draft.config)
    && (draft.result === null || isGenerationResult(draft.result))
    && typeof draft.notice === 'string';
}

export const ADVENTURE_DRAFT_KEY = 'pokemon-team-generator:draft:adventure';
const ADVENTURE_DRAFT_VERSION = 1;
const store = new LocalDraftStore<AdventureDraft>(ADVENTURE_DRAFT_KEY, ADVENTURE_DRAFT_VERSION, isAdventureDraft);

export function loadAdventureDraft(): AdventureDraft | null {
  return store.load();
}

export function saveAdventureDraft(draft: AdventureDraft): void {
  store.save(draft);
}

export function clearAdventureDraft(): void {
  store.clear();
}
