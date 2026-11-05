import { MEGA_STONES } from '../core/trainingRules';

export interface PokemonAssistProfile {
  pokemonId: number;
  formId?: string;
  abilities: string[];
  scarletVioletMoves: string[];
  /** True when a Mega form has no SV moves and suggestions come from its base species. */
  movesFromBaseSpecies?: boolean;
  /** PokeAPI species varieties, not automatically verified in Pokémon Champions. */
  availableVarieties: string[];
  source: string;
}

/**
 * Small, source-checked overrides for forms introduced in Champions which
 * may not yet exist in PokeAPI. Move suggestions still use the BASE
 * Scarlet/Violet learnset and are not a Champions legality guarantee.
 */
const curatedChampionsForms: Record<string, { pokemonId: number; abilities: string[]; source: string }> = {
  'absol-mega-z': {
    pokemonId: 359,
    abilities: ['sharpness'],
    source: 'https://bulbapedia.bulbagarden.net/wiki/Mega_Evolution'
  },
  'garchomp-mega-z': {
    pokemonId: 445,
    abilities: ['levitate'],
    source: 'https://bulbapedia.bulbagarden.net/wiki/Mega_Evolution'
  },
  'lucario-mega-z': {
    pokemonId: 448,
    abilities: ['aura-guard'],
    source: 'https://champions-news.pokemon-home.com/en/page/816.html'
  }
};

const memoryCache = new Map<string, Promise<PokemonAssistProfile>>();

function normalize(value: string): string {
  return value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'')
    .replace(/[^a-z0-9]/g,'');
}

export function optionNames(options: string[], input: string, limit = 8): string[] {
  const query = normalize(input.trim());
  if (!query) return options.slice(0, limit);
  return options.filter(value => normalize(value).includes(query)).slice(0,limit);
}

export function clearProfileCache(): void {
  memoryCache.clear();
}

interface AbilityRow { ability: { name: string } }
interface MoveRow {
  move: { name: string };
  version_group_details?: { version_group: { name: string } }[];
}

type ApiPokemon = {
  abilities?: AbilityRow[];
  moves?: MoveRow[];
};

type ApiSpecies = {
  varieties?: { pokemon: { name: string } }[];
};

function scarletVioletMoves(details: ApiPokemon): string[] {
  return [...new Set((details.moves ?? [])
    .filter(move => move.version_group_details?.some(v => v.version_group.name === 'scarlet-violet'))
    .map(move => move.move.name).filter(Boolean))].sort();
}

async function json<T>(url: string, client: typeof fetch): Promise<T> {
  const response = await client(url);
  if (!response.ok) throw new Error('PokéAPI HTTP ' + response.status);
  return await response.json() as T;
}

export function getPokemonProfile(
  pokemonId: number,
  formId: string | undefined,
  client: typeof fetch = fetch
): Promise<PokemonAssistProfile> {
  if (!Number.isInteger(pokemonId) || pokemonId < 1 || pokemonId > 1500) {
    return Promise.reject(new Error('Pokémon inválido'));
  }
  if (formId && !/^[a-z0-9-]+$/.test(formId)) {
    return Promise.reject(new Error('Forma inválida'));
  }
  const curated = formId ? curatedChampionsForms[formId] : undefined;
  if (curated && curated.pokemonId !== pokemonId) {
    return Promise.reject(new Error('La forma no corresponde a esta especie.'));
  }
  const name = curated ? String(pokemonId) : (formId ?? String(pokemonId));
  const key = pokemonId + ':' + (formId ?? 'base');
  const cached = memoryCache.get(key);
  if (cached) return cached;

  const request = (async () => {
    const base = 'https://pokeapi.co/api/v2/';
    const [details, species] = await Promise.all([
      json<ApiPokemon>(base + 'pokemon/' + encodeURIComponent(name), client),
      json<ApiSpecies>(base + 'pokemon-species/' + pokemonId, client)
    ]);
    const varieties = species.varieties?.map(v => v.pokemon.name) ?? [];
    if (formId && !curated && !varieties.includes(formId)) {
      throw new Error('La forma no está registrada para esa especie.');
    }
    const abilities = curated
      ? curated.abilities
      : [...new Set((details.abilities ?? []).map(a => a.ability?.name).filter(Boolean))];
    let moves = scarletVioletMoves(details);
    let movesFromBaseSpecies = false;
    // Classic Mega forms are absent from Scarlet/Violet. Their form endpoint
    // can report zero SV moves even though the species has a useful learnset.
    // Keep the Mega's abilities, but use the BASE species for didactic move
    // suggestions. These are never presented as Champions-legal moves.
    if (formId && !curated && MEGA_STONES[formId]?.pokemonId === pokemonId && moves.length === 0) {
      try {
        const baseDetails = await json<ApiPokemon>(base + 'pokemon/' + pokemonId, client);
        moves = scarletVioletMoves(baseDetails);
        movesFromBaseSpecies = moves.length > 0;
      } catch {
        // Ability and form data are still valid when the fallback endpoint fails.
        // No fabricated moves: the editor will show the empty-search explanation.
      }
    }

    return {
      pokemonId,
      formId,
      abilities,
      scarletVioletMoves: moves,
      movesFromBaseSpecies,
      availableVarieties: curated && formId
        ? [...new Set([...varieties, formId])] : varieties,
      source: curated?.source ?? base + 'pokemon/' + encodeURIComponent(name)
    };
  })().catch(error => {
    memoryCache.delete(key);
    throw error;
  });

  memoryCache.set(key, request);
  return request;
}
