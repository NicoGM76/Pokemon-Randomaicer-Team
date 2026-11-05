import fs from 'node:fs/promises';
import { describe, expect, it } from 'vitest';
import { isMetaSnapshot } from './matchups';
import type { MetaFormat, MetaSnapshot } from './types';

/** Checks the actual JSON that Vite publishes, not a handcrafted fixture. */
const formats: MetaFormat[] = ['singles', 'doubles'];

function explainInvalid(value: unknown, format: MetaFormat): string {
  if (!value || typeof value !== 'object') return 'El documento no es un objeto JSON';
  const obj = value as Partial<MetaSnapshot> & { message?: string };
  const issues: string[] = [];
  if (obj.schemaVersion !== 1 || obj.status !== 'ready' || obj.format !== format) {
    issues.push('metadata=' + JSON.stringify([obj.schemaVersion, obj.status, obj.format, obj.message]));
  }
  if (!obj.source || typeof obj.source !== 'object') issues.push('source ausente');
  else {
    const source = obj.source;
    if (source.organization !== 'Smogon / Pokémon Showdown') issues.push('organization=' + source.organization);
    if (source.kind !== 'ladder') issues.push('kind=' + source.kind);
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(source.month)) issues.push('month=' + source.month);
    if (!/^[a-z0-9]+$/.test(source.ladderId)) issues.push('ladderId=' + source.ladderId);
    if (!Number.isInteger(source.battles) || source.battles <= 0) issues.push('battles=' + source.battles);
    if (typeof source.cutoff !== 'number') issues.push('cutoff=' + source.cutoff);
    const expectedUrl = 'https://www.smogon.com/stats/' + source.month +
      '/chaos/' + source.ladderId + '-' + source.cutoff + '.json';
    if (source.url !== expectedUrl) issues.push('url=' + source.url + ' expected=' + expectedUrl);
  }
  if (!Number.isInteger(obj.droppedSpecies) || (obj.droppedSpecies ?? -1) < 0) {
    issues.push('droppedSpecies=' + obj.droppedSpecies);
  }
  if (!Array.isArray(obj.pokemon)) issues.push('pokemon array absent');
  else {
    if (obj.pokemon.length < 1 || obj.pokemon.length > 100) issues.push('pokemon.length=' + obj.pokemon.length);
    const ids = new Set<number>();
    for (const [index, row] of obj.pokemon.entries()) {
      if (!row || typeof row !== 'object') { issues.push('pokemon[' + index + '] absent'); continue; }
      if (!Number.isInteger(row.pokemonId) || row.pokemonId <= 0 || ids.has(row.pokemonId))
        issues.push('pokemon[' + index + '].pokemonId=' + row.pokemonId);
      ids.add(row.pokemonId);
      if (!Number.isFinite(row.usagePercent) || row.usagePercent < 0 || row.usagePercent > 100)
        issues.push('pokemon[' + index + '].usagePercent=' + row.usagePercent);
      for (const key of ['moves', 'items', 'abilities'] as const) {
        const values = row[key];
        if (!Array.isArray(values) || values.length > 8 || values.some(v =>
          typeof v !== 'string' || v.length === 0 || v.length >= 100
        )) issues.push('pokemon[' + index + '].' + key + '=' + JSON.stringify(values));
      }
      if (!Array.isArray(row.teammates) || row.teammates.length > 8 ||
        row.teammates.some(id => !Number.isInteger(id) || id <= 0))
        issues.push('pokemon[' + index + '].teammates=' + JSON.stringify(row.teammates));
      if (issues.length >= 10) break;
    }
  }
  return issues.length ? issues.join('\n') : 'sin violaciones evidentes de campos; revisar el validador';
}

describe('published competitive snapshot contract', () => {
  for (const format of formats) {
    for (const { suffix, optional } of [
      { suffix: '', optional: false },
      { suffix: '-previous', optional: true }
    ]) {
      it('accepts the generated ' + format + suffix + ' snapshot before deployment', async () => {
        const file = 'public/meta/' + format + suffix + '.json';
        let content: string;
        try {
          content = await fs.readFile(file, 'utf8');
        } catch (error) {
          // Historical files do not exist in the checked-in offline placeholders.
          if (!process.env.CI && optional) return;
          throw error;
        }
        const json = JSON.parse(content) as unknown;
        const state = json as { status?: string; format?: string; schemaVersion?: number };
        if (state.status === 'unavailable') {
          if (optional) {
            expect(state.format).toBe(format);
            expect(state.schemaVersion).toBe(1);
            return;
          }
          if (!process.env.CI) return;
        }
        expect(isMetaSnapshot(json, format), file + '\n' + explainInvalid(json, format)).toBe(true);
      });
    }
  }
});
