import { createHash } from 'node:crypto';

// Generate an auditable PostgreSQL load, without requiring secrets in Node or the browser.
// Execute the resulting SQL using a PRIVILEGED server-side PostgreSQL connection.
const TYPES = new Set('normal fire water electric grass ice fighting poison ground flying psychic bug rock ghost dragon dark steel fairy'.split(' '));
const STATS = ['hp', 'attack', 'defense', 'specialAttack', 'specialDefense', 'speed'];
const safeText = value => "'" + String(value).replaceAll("'", "''") + "'";
const jsonLiteral = value => safeText(JSON.stringify(value)) + '::jsonb';

export function assertValidCatalog({ pokemon, forms, evolutions, regionalDexes, regionalDexEntries }) {
  if (![pokemon, forms, evolutions].every(Array.isArray)) throw new Error('Expected pokemon, forms, evolutions arrays.');
  if (pokemon.length === 0) throw new Error('Refusing an empty Pokémon catalog.');
  const ids = new Set();
  for (const p of pokemon) {
    if (!Number.isInteger(p.id) || p.id < 1 || ids.has(p.id)) throw new Error('Duplicate or invalid Pokémon ID.');
    ids.add(p.id);
    if (typeof p.name !== 'string' || !p.name.trim()) throw new Error('Invalid Pokémon name.');
    if (!Number.isInteger(p.introducedGeneration) || p.introducedGeneration < 1 || p.introducedGeneration > 15) throw new Error('Invalid generation.');
    if (typeof p.evolutionFamilyId !== 'string' || !p.evolutionFamilyId.trim()) throw new Error('Invalid evolution family.');
    if (!Array.isArray(p.types) || p.types.length < 1 || p.types.length > 2 || new Set(p.types).size !== p.types.length || p.types.some(t => !TYPES.has(t))) throw new Error('Invalid Pokémon typing.');
    if (!p.stats || STATS.some(s => !Number.isInteger(p.stats[s]) || p.stats[s] < (s === 'hp' ? 1 : 0) || p.stats[s] > 32767)) throw new Error('Invalid base stats.');
    if (!Array.isArray(p.specialTags) || p.specialTags.some(t => typeof t !== 'string')) throw new Error('Invalid tags.');
    for (const prop of ['isPseudoLegendary','isFossil','isStarter']) if (typeof p[prop] !== 'boolean') throw new Error('Invalid Pokémon flags.');
  }
  const formsSeen = new Set();
  for (const form of forms) {
    if (typeof form.id !== 'string' || !form.id.trim() || formsSeen.has(form.id) || !ids.has(form.pokemonId)) throw new Error('Invalid Pokémon form reference.');
    formsSeen.add(form.id);
    if (typeof form.name !== 'string' || !form.name.trim()) throw new Error('Invalid form name.');
    if (!['base','cosmetic','regional','gameplay','special'].includes(form.formType) || typeof form.countsAsSameSpecies !== 'boolean') throw new Error('Invalid form definition.');
    if (form.types !== undefined && (!Array.isArray(form.types) || form.types.length < 1 || form.types.length > 2 || new Set(form.types).size !== form.types.length || form.types.some(t => !TYPES.has(t)))) throw new Error('Invalid form typing.');
    if (form.stats !== undefined && STATS.some(s => !Number.isInteger(form.stats?.[s]) || form.stats[s] < 0 || form.stats[s] > 32767)) throw new Error('Invalid form stats.');
  }
  const pairs = new Set();
  for (const step of evolutions) {
    if (!ids.has(step.fromId) || !ids.has(step.toId) || step.fromId === step.toId || !Array.isArray(step.conditions)) throw new Error('Evolution references unknown species.');
    // Same from/to can be a legitimate alternative evolution requirement.
    // Only identical condition sets are truly duplicates.
    const variant = JSON.stringify(step);
    if (pairs.has(variant)) throw new Error('Duplicate evolution variant.');
    pairs.add(variant);
  }
  if ((regionalDexes === undefined) !== (regionalDexEntries === undefined))
    throw new Error('Regional dex metadata and entries must be supplied together.');
  if (regionalDexes !== undefined) {
    if (!Array.isArray(regionalDexes) || !Array.isArray(regionalDexEntries)) throw new Error('Invalid regional dex arrays.');
    const dexIds = new Set();
    for (const dex of regionalDexes) {
      if (!dex || typeof dex.id !== 'string' || !dex.id.trim() || dexIds.has(dex.id) ||
          !Number.isInteger(dex.entryCount) || dex.entryCount < 0 ||
          !['regional','content'].includes(dex.kind) ||
          !['pending','imported','reviewed','published'].includes(dex.entryStatus)) throw new Error('Invalid regional dex metadata.');
      dexIds.add(dex.id);
    }
    const uniqueEntries = new Set();
    for (const entry of regionalDexEntries) {
      if (!dexIds.has(entry.dexId) || !ids.has(entry.pokemonId) ||
          !Number.isInteger(entry.dexNumber) || entry.dexNumber < 0 ||
          !['pokeapi','wikidex','curated'].includes(entry.source)) throw new Error('Invalid regional dex entry.');
      const key = entry.dexId + '/' + entry.pokemonId;
      if (uniqueEntries.has(key)) throw new Error('Duplicate regional dex entry.');
      uniqueEntries.add(key);
    }
    for (const dex of regionalDexes) {
      const observed = regionalDexEntries.filter(e => e.dexId === dex.id).length;
      if (observed !== dex.entryCount) throw new Error('Regional dex count mismatch: ' + dex.id);
    }
  }
}

export function buildCatalogUpsertSql(data, { full = false } = {}) {
  assertValidCatalog(data);
  if (full && data.pokemon.length < 1000) throw new Error('Refusing to label a partial catalog as full (<1000 species).');
  const { pokemon, forms, evolutions, regionalDexes, regionalDexEntries } = data;
  if (full && (!regionalDexes || regionalDexes.length < 20 || !regionalDexEntries || regionalDexEntries.length < 5000))
    throw new Error('Refusing to label a regional catalog as full without verified dex entries.');
  const revision = createHash('sha256').update(JSON.stringify(data)).digest('hex');
  const tag = (full ? 'full-' : 'sample-') + revision.slice(0, 20);
  const regionalSql = regionalDexes ? [
    'CREATE TEMP TABLE _pa_dexes (v jsonb) ON COMMIT DROP;',
    'INSERT INTO _pa_dexes(v) SELECT value FROM jsonb_array_elements(' + jsonLiteral(regionalDexes) + ');',
    'CREATE TEMP TABLE _pa_dex_entries (v jsonb) ON COMMIT DROP;',
    'INSERT INTO _pa_dex_entries(v) SELECT value FROM jsonb_array_elements(' + jsonLiteral(regionalDexEntries) + ');',
    'INSERT INTO public.regional_dexes(id,name,region,entry_count,kind,entry_status,source_url,sub_dexes)',
    "SELECT v->>'id',v->>'name',v->>'region',(v->>'entryCount')::integer,v->>'kind',v->>'entryStatus',v->>'sourceUrl',COALESCE(v->'subDexes','[]'::jsonb) FROM _pa_dexes",
    'ON CONFLICT(id) DO UPDATE SET name=excluded.name,region=excluded.region,entry_count=excluded.entry_count,kind=excluded.kind,entry_status=excluded.entry_status,source_url=excluded.source_url,sub_dexes=excluded.sub_dexes;',
    "DELETE FROM public.regional_dex_entries WHERE dex_id IN (SELECT v->>'id' FROM _pa_dexes);",
    'INSERT INTO public.regional_dex_entries(dex_id,pokemon_id,dex_number,sub_dex,source,source_dex)',
    "SELECT v->>'dexId',(v->>'pokemonId')::integer,(v->>'dexNumber')::integer,v->>'subDex',v->>'source',v->>'sourceDex' FROM _pa_dex_entries;"
  ].join('\n') : '';
  const sql = `-- Generated import. Source integrity: SHA-256 ${revision}.
-- TRANSACTIONAL. Does not delete species missing from this import, nor user data.
BEGIN;
CREATE TEMP TABLE _pa_species (v jsonb) ON COMMIT DROP;
INSERT INTO _pa_species(v) SELECT value FROM jsonb_array_elements(${jsonLiteral(pokemon)});
CREATE TEMP TABLE _pa_forms (v jsonb) ON COMMIT DROP;
INSERT INTO _pa_forms(v) SELECT value FROM jsonb_array_elements(${jsonLiteral(forms)});
CREATE TEMP TABLE _pa_evolutions (v jsonb) ON COMMIT DROP;
INSERT INTO _pa_evolutions(v) SELECT value FROM jsonb_array_elements(${jsonLiteral(evolutions)});

INSERT INTO public.pokemon_species (id,name,introduced_generation,evolution_family_id,hp,attack,defense,special_attack,special_defense,speed,special_tags,is_pseudo_legendary,is_fossil,is_starter)
SELECT (v->>'id')::integer,v->>'name',(v->>'introducedGeneration')::smallint,v->>'evolutionFamilyId',
(v->'stats'->>'hp')::smallint,(v->'stats'->>'attack')::smallint,(v->'stats'->>'defense')::smallint,
(v->'stats'->>'specialAttack')::smallint,(v->'stats'->>'specialDefense')::smallint,(v->'stats'->>'speed')::smallint,
ARRAY(SELECT jsonb_array_elements_text(v->'specialTags')),(v->>'isPseudoLegendary')::boolean,(v->>'isFossil')::boolean,(v->>'isStarter')::boolean
FROM _pa_species
ON CONFLICT (id) DO UPDATE SET name=excluded.name,introduced_generation=excluded.introduced_generation,
evolution_family_id=excluded.evolution_family_id,hp=excluded.hp,attack=excluded.attack,defense=excluded.defense,
special_attack=excluded.special_attack,special_defense=excluded.special_defense,speed=excluded.speed,
special_tags=excluded.special_tags,is_pseudo_legendary=excluded.is_pseudo_legendary,
is_fossil=excluded.is_fossil,is_starter=excluded.is_starter;

DELETE FROM public.pokemon_types WHERE pokemon_id IN (SELECT (v->>'id')::integer FROM _pa_species);
INSERT INTO public.pokemon_types(pokemon_id,slot,type_name)
SELECT (v->>'id')::integer,t.ordinality::smallint,t.type_name
FROM _pa_species CROSS JOIN LATERAL jsonb_array_elements_text(v->'types') WITH ORDINALITY AS t(type_name,ordinality);

INSERT INTO public.pokemon_forms(id,pokemon_id,name,form_type,counts_as_same_species,stats)
SELECT v->>'id',(v->>'pokemonId')::integer,v->>'name',v->>'formType',(v->>'countsAsSameSpecies')::boolean,v->'stats' FROM _pa_forms
ON CONFLICT (id) DO UPDATE SET pokemon_id=excluded.pokemon_id,name=excluded.name,
form_type=excluded.form_type,counts_as_same_species=excluded.counts_as_same_species,stats=excluded.stats;

DELETE FROM public.pokemon_form_types WHERE form_id IN (SELECT v->>'id' FROM _pa_forms);
INSERT INTO public.pokemon_form_types(form_id,slot,type_name)
SELECT v->>'id',t.ordinality::smallint,t.type_name FROM _pa_forms
CROSS JOIN LATERAL jsonb_array_elements_text(COALESCE(v->'types','[]'::jsonb)) WITH ORDINALITY AS t(type_name,ordinality);

-- Replace only the evolution pairs provided in this import, to avoid stale
-- alternative requirements while retaining unrelated or curated evolutions.
DELETE FROM public.pokemon_evolutions AS e
USING _pa_evolutions AS src
WHERE e.from_pokemon_id = (src.v->>'fromId')::integer
  AND e.to_pokemon_id = (src.v->>'toId')::integer;

INSERT INTO public.pokemon_evolutions(from_pokemon_id,to_pokemon_id,variant_index,conditions)
SELECT (v->>'fromId')::integer,(v->>'toId')::integer,
  row_number() over (
    partition by (v->>'fromId')::integer,(v->>'toId')::integer
    order by (v->'conditions')::text
  )::smallint,
  v->'conditions' FROM _pa_evolutions;

${regionalSql}

INSERT INTO public.catalog_imports(id,source_name,source_revision,species_count,forms_count,evolutions_count,regional_dex_entries_count,completeness,notes)
VALUES (${safeText(tag)},${safeText(full ? 'PokéAPI CSV generated catalog' : 'Repository curated bootstrap')},${safeText(revision)},
${pokemon.length},${forms.length},${evolutions.length},${regionalDexEntries?.length ?? 0},${safeText(full ? 'full' : 'sample')},
${safeText(full ? 'Validated generated data (1000+ species).' : 'Sample only. Full catalog is generated during CI builds.')})
ON CONFLICT(id) DO NOTHING;
COMMIT;
`;
  return sql;
}
