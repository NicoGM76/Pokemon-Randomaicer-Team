export interface PokemonAssistProfile {
  pokemonId: number;
  formId?: string;
  abilities: string[];
  scarletVioletMoves: string[];
  /** PokeAPI species varieties, not automatically verified in Pokémon Champions. */
  availableVarieties: string[];
  source: string;
}

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
  const name = formId ?? String(pokemonId);
  if (formId && !/^[a-z0-9-]+$/.test(formId)) {
    return Promise.reject(new Error('Forma inválida'));
  }
  const key = pokemonId + ':' + name;
  const cached = memoryCache.get(key);
  if (cached) return cached;

  const request = (async () => {
    const base = 'https://pokeapi.co/api/v2/';
    const [details, species] = await Promise.all([
      json<ApiPokemon>(base + 'pokemon/' + encodeURIComponent(name), client),
      json<ApiSpecies>(base + 'pokemon-species/' + pokemonId, client)
    ]);
    const varieties = species.varieties?.map(v => v.pokemon.name) ?? [];
    if (formId && !varieties.includes(formId)) {
      throw new Error('La forma no está registrada para esa especie.');
    }
    const abilities = [...new Set((details.abilities ?? []).map(a => a.ability?.name).filter(Boolean))];
    const moves = [...new Set((details.moves ?? [])
      .filter(move => move.version_group_details?.some(v => v.version_group.name === 'scarlet-violet'))
      .map(move => move.move.name).filter(Boolean))];

    return {
      pokemonId,
      formId,
      abilities,
      scarletVioletMoves: moves.sort(),
      availableVarieties: varieties,
      source: base + 'pokemon/' + encodeURIComponent(name)
    };
  })().catch(error => {
    memoryCache.delete(key);
    throw error;
  });

  memoryCache.set(key, request);
  return request;
}
