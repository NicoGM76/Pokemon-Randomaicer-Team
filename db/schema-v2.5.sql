-- V2.5: catálogos públicos y metagame, PostgreSQL 17 / Supabase.
-- No almacena cuentas, equipos privados ni credenciales. Cargar solo fuentes verificadas.
CREATE TABLE public.pokemon_species (
  id integer PRIMARY KEY CHECK (id > 0),
  name text NOT NULL CHECK (length(btrim(name)) > 0),
  introduced_generation smallint NOT NULL CHECK (introduced_generation BETWEEN 1 AND 15),
  evolution_family_id text NOT NULL,
  hp smallint NOT NULL CHECK (hp > 0),
  attack smallint NOT NULL CHECK (attack >= 0),
  defense smallint NOT NULL CHECK (defense >= 0),
  special_attack smallint NOT NULL CHECK (special_attack >= 0),
  special_defense smallint NOT NULL CHECK (special_defense >= 0),
  speed smallint NOT NULL CHECK (speed >= 0),
  special_tags text[] NOT NULL DEFAULT '{}'::text[],
  is_pseudo_legendary boolean NOT NULL DEFAULT false,
  is_fossil boolean NOT NULL DEFAULT false,
  is_starter boolean NOT NULL DEFAULT false
);
CREATE INDEX pokemon_species_family_idx ON public.pokemon_species(evolution_family_id);
CREATE INDEX pokemon_species_generation_idx ON public.pokemon_species(introduced_generation);

CREATE TABLE public.pokemon_types (
  pokemon_id integer NOT NULL REFERENCES public.pokemon_species(id) ON DELETE CASCADE,
  slot smallint NOT NULL CHECK (slot IN (1,2)),
  type_name text NOT NULL CHECK (type_name IN (
    'normal','fire','water','electric','grass','ice','fighting','poison','ground',
    'flying','psychic','bug','rock','ghost','dragon','dark','steel','fairy'
  )),
  PRIMARY KEY (pokemon_id,slot),
  UNIQUE (pokemon_id,type_name)
);
CREATE INDEX pokemon_types_type_idx ON public.pokemon_types(type_name);

CREATE TABLE public.pokemon_forms (
  id text PRIMARY KEY CHECK (length(btrim(id)) > 0),
  pokemon_id integer NOT NULL REFERENCES public.pokemon_species(id) ON DELETE CASCADE,
  name text NOT NULL CHECK (length(btrim(name)) > 0),
  form_type text NOT NULL CHECK (form_type IN ('base','cosmetic','regional','gameplay','special')),
  counts_as_same_species boolean NOT NULL,
  -- The source models form-specific stats as an optional object; keep it optional.
  stats jsonb NULL CHECK (stats IS NULL OR jsonb_typeof(stats) = 'object')
);
CREATE INDEX pokemon_forms_species_idx ON public.pokemon_forms(pokemon_id);

CREATE TABLE public.pokemon_form_types (
  form_id text NOT NULL REFERENCES public.pokemon_forms(id) ON DELETE CASCADE,
  slot smallint NOT NULL CHECK (slot IN (1,2)),
  type_name text NOT NULL CHECK (type_name IN (
    'normal','fire','water','electric','grass','ice','fighting','poison','ground',
    'flying','psychic','bug','rock','ghost','dragon','dark','steel','fairy'
  )),
  PRIMARY KEY (form_id,slot),
  UNIQUE (form_id,type_name)
);

CREATE TABLE public.pokemon_evolutions (
  from_pokemon_id integer NOT NULL REFERENCES public.pokemon_species(id) ON DELETE CASCADE,
  to_pokemon_id integer NOT NULL REFERENCES public.pokemon_species(id) ON DELETE CASCADE,
  conditions jsonb NOT NULL CHECK (jsonb_typeof(conditions) = 'array'),
  variant_index smallint NOT NULL DEFAULT 1 CHECK (variant_index BETWEEN 1 AND 100),
  PRIMARY KEY (from_pokemon_id,to_pokemon_id,variant_index),
  CHECK (from_pokemon_id <> to_pokemon_id)
);

-- Full and incremental source loads must be identified; no implication that a stub is complete.
CREATE TABLE public.catalog_imports (
  id text PRIMARY KEY CHECK (length(btrim(id)) > 0),
  source_name text NOT NULL,
  source_revision text NOT NULL,
  imported_at timestamptz NOT NULL DEFAULT now(),
  species_count integer NOT NULL CHECK (species_count >= 0),
  forms_count integer NOT NULL CHECK (forms_count >= 0),
  evolutions_count integer NOT NULL CHECK (evolutions_count >= 0),
  completeness text NOT NULL CHECK (completeness IN ('sample','full','partial')),
  notes text NOT NULL DEFAULT ''
);

-- These preserve canonical source names until a validated naming/alias mapping exists.
CREATE TABLE public.moves (name text PRIMARY KEY CHECK (length(btrim(name)) > 0));
CREATE TABLE public.abilities (name text PRIMARY KEY CHECK (length(btrim(name)) > 0));
CREATE TABLE public.items (name text PRIMARY KEY CHECK (length(btrim(name)) > 0));

CREATE TABLE public.source_snapshots (
  snapshot_key text PRIMARY KEY CHECK (length(btrim(snapshot_key)) > 0),
  format text NOT NULL CHECK (format IN ('singles','doubles')),
  label text NOT NULL,
  description text NOT NULL,
  source_organization text NOT NULL,
  source_kind text NOT NULL CHECK (source_kind = 'ladder'),
  source_month text NOT NULL CHECK (source_month ~ '^20[0-9]{2}-(0[1-9]|1[0-2])$'),
  ladder_id text NOT NULL,
  cutoff integer NOT NULL CHECK (cutoff > 0),
  battles bigint NOT NULL CHECK (battles > 0),
  source_url text NOT NULL CHECK (source_url LIKE 'https://%'),
  dropped_species integer NOT NULL CHECK (dropped_species >= 0),
  fetched_at timestamptz NOT NULL DEFAULT now(),
  source_sha256 text NULL CHECK (source_sha256 IS NULL OR source_sha256 ~ '^[a-f0-9]{64}$'),
  status text NOT NULL DEFAULT 'ready' CHECK (status IN ('ready','unavailable')),
  UNIQUE (format,source_month,ladder_id,cutoff)
);

CREATE TABLE public.metagame_usage (
  snapshot_key text NOT NULL REFERENCES public.source_snapshots(snapshot_key) ON DELETE CASCADE,
  pokemon_id integer NOT NULL REFERENCES public.pokemon_species(id),
  usage_percent numeric(7,4) NOT NULL CHECK (usage_percent BETWEEN 0 AND 100),
  PRIMARY KEY(snapshot_key,pokemon_id)
);
CREATE INDEX metagame_usage_rank_idx ON public.metagame_usage(snapshot_key,usage_percent DESC);

-- Source provides ranked names, NOT per-move usage probabilities.
CREATE TABLE public.metagame_moves (
  snapshot_key text NOT NULL,
  pokemon_id integer NOT NULL,
  rank smallint NOT NULL CHECK (rank BETWEEN 1 AND 4),
  move_name text NOT NULL REFERENCES public.moves(name),
  PRIMARY KEY(snapshot_key,pokemon_id,rank),
  UNIQUE(snapshot_key,pokemon_id,move_name),
  FOREIGN KEY(snapshot_key,pokemon_id) REFERENCES public.metagame_usage(snapshot_key,pokemon_id) ON DELETE CASCADE
);
CREATE TABLE public.metagame_abilities (
  snapshot_key text NOT NULL,
  pokemon_id integer NOT NULL,
  rank smallint NOT NULL CHECK (rank BETWEEN 1 AND 4),
  ability_name text NOT NULL REFERENCES public.abilities(name),
  PRIMARY KEY(snapshot_key,pokemon_id,rank),
  UNIQUE(snapshot_key,pokemon_id,ability_name),
  FOREIGN KEY(snapshot_key,pokemon_id) REFERENCES public.metagame_usage(snapshot_key,pokemon_id) ON DELETE CASCADE
);
CREATE TABLE public.metagame_items (
  snapshot_key text NOT NULL,
  pokemon_id integer NOT NULL,
  rank smallint NOT NULL CHECK (rank BETWEEN 1 AND 4),
  item_name text NOT NULL REFERENCES public.items(name),
  PRIMARY KEY(snapshot_key,pokemon_id,rank),
  UNIQUE(snapshot_key,pokemon_id,item_name),
  FOREIGN KEY(snapshot_key,pokemon_id) REFERENCES public.metagame_usage(snapshot_key,pokemon_id) ON DELETE CASCADE
);
CREATE TABLE public.metagame_teammates (
  snapshot_key text NOT NULL,
  pokemon_id integer NOT NULL,
  rank smallint NOT NULL CHECK (rank BETWEEN 1 AND 4),
  teammate_pokemon_id integer NOT NULL REFERENCES public.pokemon_species(id),
  PRIMARY KEY(snapshot_key,pokemon_id,rank),
  UNIQUE(snapshot_key,pokemon_id,teammate_pokemon_id),
  FOREIGN KEY(snapshot_key,pokemon_id) REFERENCES public.metagame_usage(snapshot_key,pokemon_id) ON DELETE CASCADE,
  CHECK (pokemon_id <> teammate_pokemon_id)
);

-- Explicit read-only grants + RLS on EVERY public table.
-- Import jobs execute with a privileged server-side credential, never in the browser.
DO $rls$
DECLARE tbl text;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'pokemon_species','pokemon_types','pokemon_forms','pokemon_form_types',
    'pokemon_evolutions','catalog_imports','moves','abilities','items',
    'source_snapshots','metagame_usage','metagame_moves','metagame_abilities',
    'metagame_items','metagame_teammates'
  ] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY',tbl);
    EXECUTE format('REVOKE ALL ON public.%I FROM anon, authenticated, PUBLIC',tbl);
    EXECUTE format('GRANT SELECT ON public.%I TO anon, authenticated',tbl);
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO service_role',tbl);
    IF tbl = 'source_snapshots' THEN
      EXECUTE format('CREATE POLICY public_read_verified ON public.%I FOR SELECT TO anon, authenticated USING (status = ''ready'')',tbl);
    ELSE
      EXECUTE format('CREATE POLICY public_read_only ON public.%I FOR SELECT TO anon, authenticated USING (true)',tbl);
    END IF;
  END LOOP;
END $rls$;


-- Cover child-side foreign keys for referential integrity and join performance.
CREATE INDEX pokemon_evolutions_to_idx ON public.pokemon_evolutions(to_pokemon_id);
CREATE INDEX metagame_usage_pokemon_idx ON public.metagame_usage(pokemon_id);
CREATE INDEX metagame_moves_move_idx ON public.metagame_moves(move_name);
CREATE INDEX metagame_abilities_ability_idx ON public.metagame_abilities(ability_name);
CREATE INDEX metagame_items_item_idx ON public.metagame_items(item_name);
CREATE INDEX metagame_teammates_partner_idx ON public.metagame_teammates(teammate_pokemon_id);
