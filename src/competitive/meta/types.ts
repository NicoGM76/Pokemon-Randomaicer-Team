export type MetaFormat = 'singles' | 'doubles';
export interface MetaPokemon {
  pokemonId: number;
  usagePercent: number;
  moves: string[];
  items: string[];
  abilities: string[];
  /** Positive raw teammate association signals; ordered only, never displayed as probabilities. */
  teammates: number[];
}
export interface MetaSnapshot {
  schemaVersion: 1;
  status: 'ready';
  format: MetaFormat;
  label: string;
  description: string;
  droppedSpecies: number;
  source: {
    organization: string;
    kind: 'ladder';
    month: string;
    ladderId: string;
    cutoff: number;
    battles: number;
    url: string;
  };
  pokemon: MetaPokemon[];
}
export interface MetaUnavailable {
  schemaVersion: 1;
  status: 'unavailable';
  format: MetaFormat;
  message: string;
}
export type MetaResponse = MetaSnapshot | MetaUnavailable;

export interface MetaMatchup {
  threatened: number[];
  offensiveAnswers: number[];
  checkedMembers: number;
}
