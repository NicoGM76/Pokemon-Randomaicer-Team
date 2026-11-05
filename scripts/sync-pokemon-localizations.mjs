/**
 * One-time/periodic offline-friendly localization generator.
 * PokeAPI CSV IDs: en=9, es-ES=7, es-419=14. Run manually to update
 * committed data; the application never needs network access for labels.
 */
import fs from 'node:fs/promises';

const upstream = 'https://raw.githubusercontent.com/PokeAPI/pokeapi/master/data/v2/csv/';
const categories = [
  ['moves', 'moves.csv', 'move_names.csv', 900],
  ['abilities', 'abilities.csv', 'ability_names.csv', 300],
  ['natures', 'natures.csv', 'nature_names.csv', 25]
];

function csv(text) {
  const output = [];
  let row = [], cell = '', quoted = false;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char === '"') {
      if (quoted && text[i + 1] === '"') { cell += '"'; i++; }
      else quoted = !quoted;
    } else if (char === ',' && !quoted) {
      row.push(cell); cell = '';
    } else if ((char === '\n' || char === '\r') && !quoted) {
      if (char === '\r' && text[i + 1] === '\n') i++;
      row.push(cell);
      if (row.length > 1 || row[0]) output.push(row);
      row = []; cell = '';
    } else cell += char;
  }
  if (quoted) throw new Error('Malformed CSV: unclosed quote');
  if (cell || row.length) { row.push(cell); output.push(row); }
  return output;
}

async function getRows(filename) {
  const response = await fetch(upstream + filename, { signal: AbortSignal.timeout(20000) });
  if (!response.ok) throw new Error(filename + ': HTTP ' + response.status);
  return csv(await response.text()).slice(1);
}

const output = {
  source: 'PokeAPI/pokeapi data/v2/csv (official es=7 and es-419=14 translations)',
  moves: {}, abilities: {}, natures: {}
};
for (const [category, identifiers, namesFile, minimum] of categories) {
  const [ids, names] = await Promise.all([getRows(identifiers), getRows(namesFile)]);
  const byId = new Map();
  for (const [id, language, name] of names) {
    if (!byId.has(id)) byId.set(id, {});
    byId.get(id)[language] = name;
  }
  for (const [id, slug] of ids) {
    const translations = byId.get(id);
    if (!translations?.['9'] || !translations?.['7'] || !translations?.['14']) continue;
    output[category][slug] = [
      translations['9'], translations['7'], translations['14']
    ];
  }
  if (Object.keys(output[category]).length < minimum) {
    throw new Error(category + ': localization coverage dropped below expected threshold');
  }
}
await fs.mkdir('src/i18n/generated', { recursive: true });
await fs.writeFile(
  'src/i18n/generated/pokemonTerms.json', JSON.stringify(output) + '\n', 'utf8'
);
console.log('PokeAPI official regional terms synchronized:',
  Object.fromEntries(categories.map(([name]) => [name, Object.keys(output[name]).length])));
