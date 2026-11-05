import type {
  CompetitiveEnvironment, CompetitiveFormat, CompetitiveTeam, CompetitiveWorkspace
} from './core/types';
import { createEmptyWorkspace, isCompetitiveTeam, loadCompetitiveDraft, saveCompetitiveDraft } from './competitiveDraft';

export const COMPETITIVE_SAVED_TEAMS_KEY = 'pokemon-team-generator:saved:competitive:v1';

export interface SavedCompetitiveTeam {
  id: string;
  name: string;
  createdAt: string;
  format: CompetitiveFormat;
  environment: CompetitiveEnvironment;
  /** Exactly six slots, including any empty positions and all set configuration. */
  team: CompetitiveTeam;
}

interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

function validSaved(value: unknown): value is SavedCompetitiveTeam {
  if (!value || typeof value !== 'object') return false;
  const data = value as Partial<SavedCompetitiveTeam>;
  return typeof data.id === 'string' && data.id.length > 0 && data.id.length < 120
    && typeof data.name === 'string' && data.name.trim().length > 0 && data.name.length <= 100
    && typeof data.createdAt === 'string' && !Number.isNaN(Date.parse(data.createdAt))
    && (data.format === 'singles' || data.format === 'doubles')
    && (data.environment === 'mainline' || data.environment === 'champions')
    && isCompetitiveTeam(data.team);
}

export class SavedCompetitiveTeamRepository {
  constructor(private readonly storage: StorageLike = globalThis.localStorage) {}

  getAll(): SavedCompetitiveTeam[] {
    try {
      const raw = this.storage?.getItem(COMPETITIVE_SAVED_TEAMS_KEY);
      if (!raw) return [];
      const list: unknown = JSON.parse(raw);
      return Array.isArray(list) ? list.filter(validSaved) : [];
    } catch {
      return [];
    }
  }

  save(team: SavedCompetitiveTeam): boolean {
    if (!validSaved(team)) return false;
    try {
      const existing = this.getAll();
      const index = existing.findIndex(value => value.id === team.id);
      if (index < 0) existing.push(team);
      else existing[index] = team;
      this.storage.setItem(COMPETITIVE_SAVED_TEAMS_KEY, JSON.stringify(existing));
      return true;
    } catch {
      return false;
    }
  }

  delete(id: string): boolean {
    try {
      this.storage.setItem(COMPETITIVE_SAVED_TEAMS_KEY,
        JSON.stringify(this.getAll().filter(team => team.id !== id)));
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * Restoring a named team replaces only its format.
 * The other format and its training environment remain untouched.
 */
export function restoreCompetitiveTeam(
  saved: SavedCompetitiveTeam, current: CompetitiveWorkspace = loadCompetitiveDraft()
): CompetitiveWorkspace {
  if (!validSaved(saved)) return current;
  const defaults = createEmptyWorkspace();
  const environments = { ...defaults.environmentByFormat, ...current.environmentByFormat };
  const restored: CompetitiveWorkspace = {
    ...current,
    format: saved.format,
    selectedSlot: 0,
    teams: { ...current.teams, [saved.format]: saved.team },
    environmentByFormat: { ...environments, [saved.format]: saved.environment }
  };
  saveCompetitiveDraft(restored);
  return restored;
}
