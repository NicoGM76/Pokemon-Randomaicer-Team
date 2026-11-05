import type { MetaSnapshot } from './types';

export interface MetaHistoryChange {
  pokemonId: number;
  previousUsage: number;
  currentUsage: number;
  /** Change in percentage points, NOT a percentage win rate. */
  changePoints: number;
  previousRank: number;
  currentRank: number;
}

export interface MetaHistoryComparison {
  olderMonth: string;
  newerMonth: string;
  changes: MetaHistoryChange[];
  /** A species absent from a top-100 sample is unknown, not zero usage. */
  noLongerInSample: number;
  newToSample: number;
}

export function compareMetaSnapshots(
  newer: MetaSnapshot, older: MetaSnapshot
): MetaHistoryComparison {
  if (newer.format !== older.format || newer.source.kind !== 'ladder' ||
      older.source.kind !== 'ladder' ||
      newer.source.organization !== older.source.organization ||
      newer.source.ladderId !== older.source.ladderId ||
      newer.source.cutoff !== older.source.cutoff) {
    throw new Error('No se pueden comparar formatos, regulaciones o cortes de rating distintos.');
  }
  if (older.source.month >= newer.source.month) {
    throw new Error('Se necesita una muestra anterior a la muestra actual.');
  }

  const olderEntries = new Map(older.pokemon.map((entry, index) => [
    entry.pokemonId, { entry, rank: index + 1 }
  ]));
  const currentIds = new Set(newer.pokemon.map(entry => entry.pokemonId));

  const changes: MetaHistoryChange[] = [];
  for (const [index, entry] of newer.pokemon.entries()) {
    const previous = olderEntries.get(entry.pokemonId);
    if (!previous) continue;
    changes.push({
      pokemonId: entry.pokemonId,
      previousUsage: previous.entry.usagePercent,
      currentUsage: entry.usagePercent,
      changePoints: Math.round((entry.usagePercent - previous.entry.usagePercent) * 1000) / 1000,
      previousRank: previous.rank,
      currentRank: index + 1
    });
  }
  changes.sort((a, b) => b.changePoints - a.changePoints || a.pokemonId - b.pokemonId);

  return {
    olderMonth: older.source.month,
    newerMonth: newer.source.month,
    changes,
    newToSample: newer.pokemon.length - changes.length,
    noLongerInSample: older.pokemon.filter(entry => !currentIds.has(entry.pokemonId)).length
  };
}
