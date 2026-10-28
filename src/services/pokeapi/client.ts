// @ts-nocheck
const BASE_URL = 'https://pokeapi.co/api/v2';

export class PokeApiClient {
  constructor(private readonly fetchImpl: typeof fetch = fetch) {}

  async getPokemon(idOrName: number | string): Promise<unknown> {
    const response = await this.fetchImpl(`${BASE_URL}/pokemon/${idOrName}`);
    if (!response.ok) throw new Error(`PokéAPI pokemon request failed: ${response.status}`);
    return response.json();
  }

  async getSpecies(idOrName: number | string): Promise<unknown> {
    const response = await this.fetchImpl(`${BASE_URL}/pokemon-species/${idOrName}`);
    if (!response.ok) throw new Error(`PokéAPI species request failed: ${response.status}`);
    return response.json();
  }

  async getEvolutionChain(id: number): Promise<unknown> {
    const response = await this.fetchImpl(`${BASE_URL}/evolution-chain/${id}`);
    if (!response.ok) throw new Error(`PokéAPI evolution-chain request failed: ${response.status}`);
    return response.json();
  }
}
