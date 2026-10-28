import type { EvolutionStep } from '../domain/evolution/types';
import type { Availability, ContentPack, Game, GameFamily, Generation, MechanicCatalog, RegionalDex, RegionalDexEntry } from '../domain/games/types';
import type { Pokemon, PokemonForm } from '../domain/pokemon/types';

export interface DatasetMetadata {
  schemaVersion: number;
  datasetVersion: string;
  generatedAt: string;
}

export interface CompiledDataset {
  metadata: DatasetMetadata;
  pokemon: Pokemon[];
  forms: PokemonForm[];
  generations: Generation[];
  gameFamilies: GameFamily[];
  games: Game[];
  contentPacks: ContentPack[];
  regionalDexes: RegionalDex[];
  regionalDexEntries: RegionalDexEntry[];
  mechanicCatalogs: MechanicCatalog[];
  availability: Availability[];
  evolutions: EvolutionStep[];
}
