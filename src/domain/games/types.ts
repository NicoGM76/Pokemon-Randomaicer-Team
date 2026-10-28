export type ContentPackType = 'base' | 'dlc' | 'update';
export type ContentUnlockCondition = 'none' | 'early_story' | 'main_story_completed' | 'postgame';
export type GameStage = 'main_story' | 'postgame';
export type AdventureStage = GameStage | 'all';
export type AcquisitionMethod = 'wild' | 'gift' | 'evolution' | 'trade' | 'other_version' | 'transfer' | 'home';
export type RegionalDexKind = 'regional' | 'content';
export type DexEntryStatus = 'pending' | 'imported' | 'reviewed' | 'published';

export interface Generation {
  id: string;
  number: number;
  name: string;
}

export interface GameFamily {
  id: string;
  name: string;
  generation: number;
  gameIds: string[];
  dexIds: string[];
}

export interface Game {
  id: string;
  name: string;
  generation: number;
  familyId: string;
  dexIds: string[];
  releaseYear?: number;
  pokeapiVersion?: string;
}

export interface DexSubdivision {
  id: string;
  name: string;
  entryCount: number;
}

export interface RegionalDex {
  id: string;
  name: string;
  region: string;
  entryCount: number;
  kind: RegionalDexKind;
  subDexes?: DexSubdivision[];
  sourceUrl?: string;
  entryStatus: DexEntryStatus;
}


export interface RegionalDexEntry {
  dexId: string;
  pokemonId: number;
  dexNumber: number;
  subDex?: string;
  source: 'pokeapi' | 'wikidex' | 'curated';
  sourceDex?: string;
}

export interface MechanicCatalog {
  id: string;
  name: string;
  gameFamilyId: string;
  kind: 'mechanic';
  mechanic: string;
  entryCount: number;
  uniquePokemonCount?: number;
  sourceUrl?: string;
  entryStatus: DexEntryStatus;
}

export interface ContentPack {
  id: string;
  gameId: string;
  name: string;
  type: ContentPackType;
  dexIds?: string[];
  requiredContentPacks?: string[];
  unlockCondition?: ContentUnlockCondition;
}

export interface Availability {
  pokemonId: number;
  formId?: string;
  gameId: string;
  contentPackId: string;
  stage: GameStage;
  method: AcquisitionMethod;
}
