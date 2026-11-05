-- Victini appears as National/Regional Dex #000 in original and updated Unova.
-- Zero is a legitimate Pokédex index; negative values remain invalid.
ALTER TABLE public.regional_dex_entries DROP CONSTRAINT regional_dex_entries_dex_number_check;
ALTER TABLE public.regional_dex_entries
  ADD CONSTRAINT regional_dex_entries_dex_number_check CHECK (dex_number >= 0);
