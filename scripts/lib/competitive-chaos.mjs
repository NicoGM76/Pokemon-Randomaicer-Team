/**
 * Convert Smogon monthly chaos JSON into small, source-labeled game data.
 * All values come from the source; do not treat ladder usage as tournament use.
 */

export const META_TARGETS = [
  {
    key: 'singles', ladderId: 'gen9ou', cutoff: 1695,
    label: 'Singles · Gen 9 OU',
    description: 'Escalera OU de Pokémon Showdown (Gen 9)'
  },
  {
    key: 'doubles', ladderId: 'gen9championsvgc2026regmcbo3', cutoff: 1630,
    label: 'Dobles · Pokémon Champions VGC 2026 Reg M-C (BO3)',
    description: 'Escalera Pokémon Champions VGC en partidas al mejor de tres, regulación M-C'
  }
];

export function selectMonthCandidates(today = new Date(), months = 3) {
  const date = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1));
  return Array.from({ length: months }, (_, index) => {
    const past = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() - index - 1, 1));
    return past.toISOString().slice(0, 7);
  });
}

function normalizeName(name) {
  return name.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
}

function rankedNames(dict, limit = 4) {
  if (!dict || typeof dict !== 'object' || Array.isArray(dict)) return [];
  return Object.entries(dict)
    .filter(([name, score]) =>
      // Smogon sometimes publishes a blank move name (""), which is not a
      // usable move and violates the UI's snapshot schema.
      name.trim().length > 0 && name !== 'Other' && name !== 'Nothing' &&
      Number.isFinite(score) && score > 0
    )
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit).map(([name]) => name);
}

export function convertChaosSnapshot(raw, pokemonCatalog, target, month) {
  if (!raw || typeof raw !== 'object' || !raw.info || !raw.data) {
    throw new Error('Smogon raw report missing info/data');
  }
  if (raw.info.metagame !== target.ladderId) {
    throw new Error('Smogon metagame mismatch: expected ' + target.ladderId);
  }
  if (Number(raw.info.cutoff) !== target.cutoff) {
    throw new Error('Smogon cutoff mismatch: expected ' + target.cutoff);
  }
  if (!Number.isInteger(raw.info['number of battles']) || raw.info['number of battles'] <= 0) {
    throw new Error('Smogon source has no positive battle count');
  }

  const idsByName = new Map();
  for (const pokemon of pokemonCatalog) {
    if (Number.isInteger(pokemon.id) && pokemon.id > 0 && typeof pokemon.name === 'string') {
      idsByName.set(normalizeName(pokemon.name), pokemon.id);
    }
  }

  let droppedSpecies = 0;
  const seen = new Set();
  const result = [];

  for (const [name, details] of Object.entries(raw.data)) {
    const id = idsByName.get(normalizeName(name));
    if (id === undefined || seen.has(id)) {
      droppedSpecies++;
      continue;
    }
    if (!details || !Number.isFinite(details.usage) || details.usage < 0 || details.usage > 1) {
      throw new Error('Invalid usage for ' + name);
    }
    seen.add(id);
    const teammates = rankedNames(details.Teammates, 12)
      .map(partner => idsByName.get(normalizeName(partner)))
      .filter(partner => partner !== undefined && partner !== id)
      .slice(0, 4);
    result.push({
      pokemonId: id,
      usagePercent: Math.round(details.usage * 100000) / 1000,
      moves: rankedNames(details.Moves),
      items: rankedNames(details.Items),
      abilities: rankedNames(details.Abilities),
      teammates
    });
  }

  result.sort((a, b) => b.usagePercent - a.usagePercent || a.pokemonId - b.pokemonId);
  if (result.length < 1) {
    throw new Error('Smogon snapshot has no recognizable species');
  }

  return {
    schemaVersion: 1,
    status: 'ready',
    format: target.key,
    label: target.label,
    description: target.description,
    source: {
      organization: 'Smogon / Pokémon Showdown',
      kind: 'ladder',
      month,
      ladderId: target.ladderId,
      cutoff: target.cutoff,
      battles: raw.info['number of battles'],
      url: 'https://www.smogon.com/stats/' + month + '/chaos/' + target.ladderId + '-' + target.cutoff + '.json'
    },
    droppedSpecies,
    pokemon: result.slice(0, 100)
  };
}
