import formCatalog from './data/formArtworkIds.json';
import { MEGA_STONES } from './core/trainingRules';

interface FormArtworkEntry { artworkId: number; speciesId: number }
const formIds = formCatalog.forms as Record<string, FormArtworkEntry>;

const ARTWORK_ROOT =
  'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/';

const rotomLabels: Record<string, string> = {
  'rotom-heat': 'Rotom Calor',
  'rotom-wash': 'Rotom Lavado',
  'rotom-frost': 'Rotom Frío',
  'rotom-fan': 'Rotom Ventilador',
  'rotom-mow': 'Rotom Corte'
};

function niceName(name: string): string {
  return name.split('-').map(part => part ? part[0].toUpperCase() + part.slice(1) : '').join(' ');
}

export function baseArtworkUrl(pokemonId: number): string {
  return ARTWORK_ROOT + pokemonId + '.png';
}

/** Only trust a form ID when it belongs to the currently selected species. */
export function memberArtworkUrl(pokemonId: number, formId?: string): string {
  const variant = formId ? formIds[formId] : undefined;
  if (!variant || variant.speciesId !== pokemonId) return baseArtworkUrl(pokemonId);
  return ARTWORK_ROOT + variant.artworkId + '.png';
}

export function memberDisplayName(pokemonId: number, pokemonName: string, formId?: string): string {
  const base = niceName(pokemonName);
  const variant = formId ? formIds[formId] : undefined;
  if (!variant || variant.speciesId !== pokemonId || !formId) return base;
  const mega = MEGA_STONES[formId];
  if (mega && mega.pokemonId === pokemonId) return mega.label;
  return rotomLabels[formId] ?? niceName(formId);
}
