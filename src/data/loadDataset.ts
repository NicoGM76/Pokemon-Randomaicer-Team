import pokemon from './generated/pokemon.json';
import forms from './generated/forms.json';
import evolutions from './generated/evolutions.json';
import regionalDexEntries from './generated/regional-dex-entries.json';
import generations from './curated/generations.json';
import gameFamilies from './curated/game-families.json';
import games from './curated/games.json';
import contentPacks from './curated/content-packs.json';
import regionalDexes from './curated/regional-dexes.json';
import mechanicCatalogs from './curated/mechanic-catalogs.json';
import availability from './curated/availability.json';
import availabilityCoverage from './curated/availability-coverage.json';
import type { CompiledDataset } from './types';

export function loadDataset(): CompiledDataset {
  return {
    metadata: {
      schemaVersion: 3,
      datasetVersion: '0.3.0-live-generated',
      generatedAt: new Date().toISOString()
    },
    pokemon,
    forms,
    generations,
    gameFamilies,
    games,
    contentPacks,
    regionalDexes,
    regionalDexEntries,
    mechanicCatalogs,
    availability,
    availabilityCoverage,
    evolutions
  } as CompiledDataset;
}
