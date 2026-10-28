import type { SavedTeam } from '../domain/teams/types';
import type { TeamRepository } from './TeamRepository';

interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

class MemoryStorage implements StorageLike {
  private readonly values = new Map<string, string>();

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }

  removeItem(key: string): void {
    this.values.delete(key);
  }
}

const STORAGE_KEY = 'patg:saved-teams:v1';
const STORAGE_PROBE_KEY = 'patg:storage-probe';

function getDefaultStorage(): StorageLike {
  try {
    const storage = globalThis.localStorage;
    storage.setItem(STORAGE_PROBE_KEY, '1');
    storage.removeItem(STORAGE_PROBE_KEY);
    return storage;
  } catch {
    return new MemoryStorage();
  }
}

export class LocalStorageTeamRepository implements TeamRepository {
  private readonly storage: StorageLike;

  constructor(storage?: StorageLike) {
    this.storage = storage ?? getDefaultStorage();
  }

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
