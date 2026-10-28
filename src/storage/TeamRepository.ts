import type { SavedTeam } from '../domain/teams/types';

export interface TeamRepository {
  save(team: SavedTeam): void;
  getAll(): SavedTeam[];
  delete(id: string): void;
}
