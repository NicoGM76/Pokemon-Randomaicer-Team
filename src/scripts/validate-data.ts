import type { CompiledDataset } from '../data/types';

function ensureUnique<T>(items: T[], getKey: (item: T) => string | number, label: string): void {
  const seen = new Set<string | number>();
  for (const item of items) {
    const key = getKey(item);
    if (seen.has(key)) throw new Error(`duplicate ${label} id: ${String(key)}`);
    seen.add(key);
  }
}

export function validateDataset(dataset: CompiledDataset): true {
  ensureUnique(dataset.pokemon, item => item.id, 'pokemon');
  ensureUnique(dataset.forms, item => item.id, 'form');
  ensureUnique(dataset.generations, item => item.id, 'generation');
  ensureUnique(dataset.gameFamilies, item => item.id, 'game family');
  ensureUnique(dataset.games, item => item.id, 'game');
  ensureUnique(dataset.contentPacks, item => item.id, 'content pack');
  ensureUnique(dataset.regionalDexes, item => item.id, 'regional dex');
  ensureUnique(dataset.mechanicCatalogs, item => item.id, 'mechanic catalog');

  const pokemonIds = new Set(dataset.pokemon.map(item => item.id));
  const formIds = new Set(dataset.forms.map(item => item.id));
  const generationNumbers = new Set(dataset.generations.map(item => item.number));
  const familyIds = new Set(dataset.gameFamilies.map(item => item.id));
  const gameIds = new Set(dataset.games.map(item => item.id));
  const dexIds = new Set(dataset.regionalDexes.map(item => item.id));
  const packs = new Map(dataset.contentPacks.map(item => [item.id, item]));

  for (const family of dataset.gameFamilies) {
    if (!generationNumbers.has(family.generation)) throw new Error(`game family ${family.id} references unknown generation ${family.generation}`);
    for (const gameId of family.gameIds) if (!gameIds.has(gameId)) throw new Error(`game family ${family.id} references unknown gameId ${gameId}`);
    for (const dexId of family.dexIds) if (!dexIds.has(dexId)) throw new Error(`game family ${family.id} references unknown dexId ${dexId}`);
  }

  for (const game of dataset.games) {
    if (!generationNumbers.has(game.generation)) throw new Error(`game ${game.id} references unknown generation ${game.generation}`);
    if (!familyIds.has(game.familyId)) throw new Error(`game ${game.id} references unknown familyId ${game.familyId}`);
    for (const dexId of game.dexIds) if (!dexIds.has(dexId)) throw new Error(`game ${game.id} references unknown dexId ${dexId}`);
  }

  for (const form of dataset.forms) {
    if (!pokemonIds.has(form.pokemonId)) throw new Error(`form ${form.id} references unknown pokemonId ${form.pokemonId}`);
  }

  for (const pack of dataset.contentPacks) {
    if (!gameIds.has(pack.gameId)) throw new Error(`content pack ${pack.id} references unknown gameId ${pack.gameId}`);
    for (const dexId of pack.dexIds ?? []) if (!dexIds.has(dexId)) throw new Error(`content pack ${pack.id} references unknown dexId ${dexId}`);
    for (const dependency of pack.requiredContentPacks ?? []) {
      if (!packs.has(dependency)) throw new Error(`content pack ${pack.id} references unknown required contentPackId ${dependency}`);
    }
  }

  for (const catalog of dataset.mechanicCatalogs) {
    if (!familyIds.has(catalog.gameFamilyId)) throw new Error(`mechanic catalog ${catalog.id} references unknown gameFamilyId ${catalog.gameFamilyId}`);
  }

  for (const rule of dataset.availability) {
    if (!pokemonIds.has(rule.pokemonId)) throw new Error(`availability references unknown pokemonId ${rule.pokemonId}`);
    if (!gameIds.has(rule.gameId)) throw new Error(`availability references unknown gameId ${rule.gameId}`);
    if (!packs.has(rule.contentPackId)) throw new Error(`availability references unknown contentPackId ${rule.contentPackId}`);
    if (packs.get(rule.contentPackId)?.gameId !== rule.gameId) throw new Error(`availability contentPackId ${rule.contentPackId} belongs to another game`);
    if (rule.formId && !formIds.has(rule.formId)) throw new Error(`availability references unknown formId ${rule.formId}`);
  }

  for (const step of dataset.evolutions) {
    if (!pokemonIds.has(step.fromId) || !pokemonIds.has(step.toId)) throw new Error(`unknown evolution pokemon: ${step.fromId}->${step.toId}`);
  }
  return true;
}
