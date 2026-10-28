import type { SavedTeam } from '../domain/teams/types';
import type { TeamRepository } from './TeamRepository';

interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

const STORAGE_KEY = 'patg:saved-teams:v1';

export class LocalStorageTeamRepository implements TeamRepository {
  constructor(private readonly storage: StorageLike = globalThis.localStorage) {}

  getAll(): SavedTeam[] {
    try {
      const raw = this.storage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  save(team: SavedTeam): void {
    const teams = this.getAll();
    const index = teams.findIndex(item => item.id === team.id);
    if (index >= 0) teams[index] = team;
    else teams.push(team);
    this.storage.setItem(STORAGE_KEY, JSON.stringify(teams));
  }

  delete(id: string): void {
    this.storage.setItem(STORAGE_KEY, JSON.stringify(this.getAll().filter(team => team.id !== id)));
  }
}
