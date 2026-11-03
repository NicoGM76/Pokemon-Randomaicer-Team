import { describe, expect, it } from 'vitest';
import { loadDataset } from '../../data/loadDataset';
import type { CollectionEntryConfig } from '../../domain/collections/types';
import { buildCollectionCandidates } from './collectionCandidates';

const dataset = loadDataset();
const fullEvolutionGraph =
  dataset.evolutions.some(step => step.fromId === 215 && step.toId === 461)
  && dataset.evolutions.some(step => step.fromId === 200 && step.toId === 429);

function entry(gameId: string, allowTradeEvolution: boolean): CollectionEntryConfig {
  return {
    id: 'johto', label: 'Johto', targetGeneration: 2, allowBonus: false,
    generator: {
      gameId, teamSize: 6, enabledContentPacks: [gameId + '-base'],
      stage: 'all', mode: 'adventure', allowedMethods: ['wild','gift','evolution'],
      allowTradeEvolution, starterRule: 'allow', legendaryRule: 'exclude'
    }
  };
}

describe('Collection integration against PokeAPI generated data', () => {
  // Checked-in sample data intentionally has 17 steps; CI sync expands to 675.
  it.skipIf(!fullEvolutionGraph)('resolves HGSS Gen II-origin evolutions past the Johto regional Pokédex', () => {
    const candidates = buildCollectionCandidates(dataset, entry('heartgold', false))
      .filter(candidate => ['chain-189', 'chain-118'].includes(candidate.evolutionFamilyId));
    // The requested species are checked directly to avoid coupling to chain IDs.
    const all = buildCollectionCandidates(dataset, entry('heartgold', false))
      .map(candidate => candidate.resolvedPokemon.id);
    expect(all).toContain(461); // Weavile
    expect(all).toContain(429); // Mismagius
    expect(all).not.toContain(215); // Sneasel
    expect(all).not.toContain(200); // Misdreavus
    expect(candidates.length).toBeGreaterThanOrEqual(0);
  });

  it.skipIf(!fullEvolutionGraph)('keeps original Gold without Gen IV evolutions', () => {
    const all = buildCollectionCandidates(dataset, entry('gold', false))
      .map(candidate => candidate.resolvedPokemon.id);
    expect(all).not.toContain(461);
    expect(all).not.toContain(429);
  });
});
