import assert from 'node:assert/strict';
import { parseCsv } from './lib/csv.mjs';
import { buildDexEntries, buildPokemonDataset } from './lib/pokeapi-bulk.mjs';

assert.deepEqual(parseCsv('a,b\n1,"x,y"\n'), [{ a: '1', b: 'x,y' }]);

const bundle = {
  'pokedexes.csv': [
    { id: '2', identifier: 'kanto' },
    { id: '12', identifier: 'kalos-central' },
    { id: '13', identifier: 'kalos-coastal' },
    { id: '14', identifier: 'kalos-mountain' }
  ],
  'pokemon_dex_numbers.csv': [
    { species_id: '1', pokedex_id: '2', pokedex_number: '1' },
    { species_id: '1', pokedex_id: '12', pokedex_number: '80' },
    { species_id: '2', pokedex_id: '13', pokedex_number: '81' },
    { species_id: '3', pokedex_id: '14', pokedex_number: '82' }
  ],
  'pokemon_species.csv': [
    { id:'1',identifier:'bulbasaur',generation_id:'1',evolution_chain_id:'1',is_legendary:'0',is_mythical:'0' }
  ],
  'pokemon.csv': [{ id:'1',species_id:'1',is_default:'1' }],
  'pokemon_types.csv': [{ pokemon_id:'1',type_id:'12',slot:'1' }, { pokemon_id:'1',type_id:'4',slot:'2' }],
  'pokemon_stats.csv': [
    {pokemon_id:'1',stat_id:'1',base_stat:'45'}, {pokemon_id:'1',stat_id:'2',base_stat:'49'},
    {pokemon_id:'1',stat_id:'3',base_stat:'49'}, {pokemon_id:'1',stat_id:'4',base_stat:'65'},
    {pokemon_id:'1',stat_id:'5',base_stat:'65'}, {pokemon_id:'1',stat_id:'6',base_stat:'45'}
  ],
  'types.csv': [{id:'12',identifier:'grass'}, {id:'4',identifier:'poison'}]
};

const dexes = [
  { id:'kanto-classic', entryCount:1 },
  { id:'kalos-xy', entryCount:3 }
];
const { entries, report } = buildDexEntries(bundle, dexes);
assert.equal(entries.length, 4);
assert.equal(report[0].complete, true);
assert.equal(report[1].complete, true);
assert.deepEqual(entries.filter(e => e.dexId === 'kalos-xy').map(e => e.subDex), ['central','coastal','mountain']);

const pokemon = buildPokemonDataset(bundle, []);
assert.equal(pokemon.length, 1);
assert.deepEqual(pokemon[0].types, ['grass','poison']);
assert.deepEqual(pokemon[0].stats, {hp:45,attack:49,defense:49,specialAttack:65,specialDefense:65,speed:45});

console.log('Bulk importer unit checks OK.');
