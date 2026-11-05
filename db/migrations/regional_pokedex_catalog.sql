-- Regional dexes are distinct from game availability.
-- Membership in a dex does not imply a wild catch or in-story availability.
CREATE TABLE public.regional_dexes (
  id text PRIMARY KEY CHECK (length(btrim(id)) > 0),
  name text NOT NULL CHECK (length(btrim(name)) > 0),
  region text NOT NULL CHECK (length(btrim(region)) > 0),
  entry_count integer NOT NULL CHECK (entry_count >= 0),
  kind text NOT NULL CHECK (kind IN ('regional','content')),
  entry_status text NOT NULL CHECK (entry_status IN ('pending','imported','reviewed','published')),
  source_url text NULL,
  sub_dexes jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(sub_dexes)='array')
);
CREATE TABLE public.regional_dex_entries (
  dex_id text NOT NULL REFERENCES public.regional_dexes(id) ON DELETE CASCADE,
  pokemon_id integer NOT NULL REFERENCES public.pokemon_species(id) ON DELETE CASCADE,
  dex_number integer NOT NULL CHECK (dex_number >= 0),
  sub_dex text NULL,
  source text NOT NULL CHECK (source IN ('pokeapi','wikidex','curated')),
  source_dex text NULL,
  PRIMARY KEY (dex_id,pokemon_id)
);
CREATE INDEX regional_dex_entries_species_idx ON public.regional_dex_entries(pokemon_id);
CREATE INDEX regional_dex_entries_dex_order_idx ON public.regional_dex_entries(dex_id,dex_number);

ALTER TABLE public.regional_dexes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.regional_dex_entries ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.regional_dexes,public.regional_dex_entries FROM anon,authenticated,PUBLIC;
GRANT SELECT ON public.regional_dexes,public.regional_dex_entries TO anon,authenticated;
GRANT SELECT,INSERT,UPDATE,DELETE ON public.regional_dexes,public.regional_dex_entries TO service_role;
CREATE POLICY public_read_only ON public.regional_dexes FOR SELECT TO anon,authenticated USING(true);
CREATE POLICY public_read_only ON public.regional_dex_entries FOR SELECT TO anon,authenticated USING(true);

ALTER TABLE public.catalog_imports
  ADD COLUMN regional_dex_entries_count integer NULL CHECK(regional_dex_entries_count>=0);
