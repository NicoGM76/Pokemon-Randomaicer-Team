-- Preserve alternative evolution requirements for the same Pokémon pair.
-- PokéAPI can list several evolution rules (e.g. alternative items/conditions).
ALTER TABLE public.pokemon_evolutions
  ADD COLUMN variant_index smallint NOT NULL DEFAULT 1
  CHECK (variant_index BETWEEN 1 AND 100);

ALTER TABLE public.pokemon_evolutions
  DROP CONSTRAINT pokemon_evolutions_pkey;

ALTER TABLE public.pokemon_evolutions
  ADD CONSTRAINT pokemon_evolutions_pkey
  PRIMARY KEY (from_pokemon_id, to_pokemon_id, variant_index);

COMMENT ON COLUMN public.pokemon_evolutions.variant_index IS
  '1-based deterministic variant index among alternative condition sets for the same evolution pair.';
