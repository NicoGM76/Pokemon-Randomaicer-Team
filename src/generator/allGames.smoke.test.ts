import { describe, expect, it } from 'vitest';
import { loadDataset } from '../data/loadDataset';
import type { GeneratorConfig } from '../domain/teams/types';
import { generateTeam } from './generateTeam';

const dataset = loadDataset();

describe('all catalog games smoke test', () => {
  for (const game of dataset.games) {
    it(`${game.name} can generate a six-Pokémon base-game team`, () => {
      const basePack = dataset.contentPacks.find(pack => pack.gameId === game.id && pack.type === 'base');
      expect(basePack, `Missing base content pack for ${game.id}`).toBeTruthy();

      const config: GeneratorConfig = {
        gameId: game.id,
        enabledContentPacks: basePack ? [basePack.id] : [],
        teamSize: 6,
        stage: 'all',
        mode: 'random',
        allowedMethods: ['wild', 'gift', 'evolution'],
        allowTradeEvolution: false,
        starterRule: 'allow',
        legendaryRule: 'exclude'
      };

      const result = generateTeam(dataset, config);
      expect(result.generatedSize, `${game.id} generated ${result.generatedSize}/6`).toBe(6);
    });
  }
});
