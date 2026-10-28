const DLC_VERSION_MAP = new Map([
  ['the-isle-of-armor-sword', { gameId: 'sword', contentPackId: 'isle-of-armor' }],
  ['the-isle-of-armor-shield', { gameId: 'shield', contentPackId: 'shield-isle-of-armor' }],
  ['the-crown-tundra-sword', { gameId: 'sword', contentPackId: 'crown-tundra' }],
  ['the-crown-tundra-shield', { gameId: 'shield', contentPackId: 'shield-crown-tundra' }],
  ['the-teal-mask-scarlet', { gameId: 'scarlet', contentPackId: 'teal-mask' }],
  ['the-teal-mask-violet', { gameId: 'violet', contentPackId: 'violet-teal-mask' }],
  ['the-indigo-disk-scarlet', { gameId: 'scarlet', contentPackId: 'indigo-disk' }],
  ['the-indigo-disk-violet', { gameId: 'violet', contentPackId: 'violet-indigo-disk' }],
  ['mega-dimension', { gameId: 'legends-za', contentPackId: 'mega-dimension' }]
]);

export function normalizeMethod(identifier) {
  if (identifier === 'gift' || identifier === 'gift-egg') return 'gift';
  if (identifier === 'npc-trade') return 'trade';
  return 'wild';
}

export function resolveVersionTarget(versionIdentifier, games, contentPacks) {
  const dlc = DLC_VERSION_MAP.get(versionIdentifier);
  if (dlc) return dlc;

  const game = games.find(item => item.pokeapiVersion === versionIdentifier);
  if (!game) return null;
  const basePack = contentPacks.find(pack => pack.gameId === game.id && pack.type === 'base');
  return basePack ? { gameId: game.id, contentPackId: basePack.id } : null;
}

function candidateKey(item) {
  return [item.pokemonId, item.gameId, item.contentPackId, item.acquisitionMethod ?? 'unknown'].join('|');
}

export function buildAvailabilityCandidates({ bundle, games, contentPacks, dexEntries }) {
  const versionById = new Map(bundle['versions.csv'].map(row => [Number(row.id), row.identifier]));
  const slotById = new Map(bundle['encounter_slots.csv'].map(row => [Number(row.id), row]));
  const methodById = new Map(bundle['encounter_methods.csv'].map(row => [Number(row.id), row.identifier]));
  const speciesByPokemonId = new Map(bundle['pokemon.csv'].map(row => [Number(row.id), Number(row.species_id)]));

  const grouped = new Map();
  for (const encounter of bundle['encounters.csv']) {
    const versionIdentifier = versionById.get(Number(encounter.version_id));
    if (!versionIdentifier) continue;
    const target = resolveVersionTarget(versionIdentifier, games, contentPacks);
    if (!target) continue;

    const slot = slotById.get(Number(encounter.encounter_slot_id));
    const methodIdentifier = slot ? methodById.get(Number(slot.encounter_method_id)) : null;
    if (!methodIdentifier) continue;
    const speciesId = speciesByPokemonId.get(Number(encounter.pokemon_id));
    if (!speciesId) continue;

    const normalized = normalizeMethod(methodIdentifier);
    const key = [speciesId, target.gameId, target.contentPackId, normalized].join('|');
    const current = grouped.get(key) ?? {
      pokemonId: speciesId,
      gameId: target.gameId,
      contentPackId: target.contentPackId,
      acquisitionMethod: normalized,
      source: 'pokeapi_encounter',
      confidence: 'confirmed_encounter',
      stage: 'needs_review',
      encounterMethods: []
    };
    if (!current.encounterMethods.includes(methodIdentifier)) current.encounterMethods.push(methodIdentifier);
    grouped.set(key, current);
  }

  const candidates = Array.from(grouped.values()).map(item => ({
    ...item,
    encounterMethods: [...item.encounterMethods].sort()
  }));
  const knownMembership = new Set(candidates.map(candidateKey));
  const packMembership = new Map();

  for (const pack of contentPacks) {
    const pokemonIds = new Set();
    for (const dexId of pack.dexIds ?? []) {
      for (const entry of dexEntries) {
        if (entry.dexId === dexId) pokemonIds.add(Number(entry.pokemonId));
      }
    }
    packMembership.set(pack.id, pokemonIds);
  }

  for (const pack of contentPacks) {
    for (const pokemonId of packMembership.get(pack.id) ?? []) {
      const alreadyConfirmed = candidates.some(item => item.pokemonId === pokemonId && item.gameId === pack.gameId && item.contentPackId === pack.id);
      if (alreadyConfirmed) continue;
      candidates.push({
        pokemonId,
        gameId: pack.gameId,
        contentPackId: pack.id,
        acquisitionMethod: null,
        source: 'regional_dex',
        confidence: 'membership_only',
        stage: 'needs_review',
        encounterMethods: []
      });
    }
  }

  candidates.sort((a, b) => a.gameId.localeCompare(b.gameId) || a.contentPackId.localeCompare(b.contentPackId) || a.pokemonId - b.pokemonId || String(a.acquisitionMethod).localeCompare(String(b.acquisitionMethod)));

  const byGame = {};
  for (const game of games) {
    const rows = candidates.filter(item => item.gameId === game.id);
    byGame[game.id] = {
      totalCandidates: rows.length,
      confirmedEncounter: rows.filter(item => item.confidence === 'confirmed_encounter').length,
      membershipOnly: rows.filter(item => item.confidence === 'membership_only').length
    };
  }

  return {
    candidates,
    report: {
      total: candidates.length,
      confirmedEncounter: candidates.filter(item => item.confidence === 'confirmed_encounter').length,
      membershipOnly: candidates.filter(item => item.confidence === 'membership_only').length,
      byGame
    }
  };
}
