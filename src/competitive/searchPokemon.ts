import type { Pokemon } from '../domain/pokemon/types';

function normalize(value: string): string {
  return value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');
}

/** A typo with a single missing, extra or swapped character is useful for names. */
function oneEditAway(a: string, b: string): boolean {
  if (Math.abs(a.length - b.length) > 1) return false;
  let ai = 0;
  let bi = 0;
  let errors = 0;
  while (ai < a.length && bi < b.length) {
    if (a[ai] === b[bi]) {
      ai++;
      bi++;
    } else {
      errors++;
      if (errors > 1) return false;
      if (a.length > b.length) ai++;
      else if (b.length > a.length) bi++;
      else { ai++; bi++; }
    }
  }
  return errors + Number(ai < a.length || bi < b.length) <= 1;
}

export function searchPokemon(pokemon: Pokemon[], input: string, limit = 8): Pokemon[] {
  const query = normalize(input.trim());
  if (!query || limit < 1) return [];
  // In Spanish conversation the G in Gholdengo often loses its H.
  const needle = query === 'goldengo' ? 'gholdengo' : query;

  const found: { entry: Pokemon; score: number }[] = [];
  for (const entry of pokemon) {
    const name = normalize(entry.name);
    const dex = String(entry.id);
    let score = -1;
    if (dex === needle || name === needle) score = 100;
    else if (name.startsWith(needle)) score = 80;
    else if (name.includes(needle)) score = 60;
    else if (dex.startsWith(needle) && /^\d+$/.test(needle)) score = 50;
    else if (needle.length >= 5 && oneEditAway(needle, name)) score = 30;
    if (score >= 0) found.push({ entry, score });
  }
  return found.sort((a, b) => b.score - a.score || a.entry.id - b.entry.id)
    .slice(0, limit).map(value => value.entry);
}
