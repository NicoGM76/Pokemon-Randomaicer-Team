// @ts-nocheck
import fs from 'node:fs';
import path from 'node:path';
import type { CompiledDataset } from '../data/types';
import { validateDataset } from './validate-data';

function readJson<T>(file: string): T {
  return JSON.parse(fs.readFileSync(file, 'utf8')) as T;
}

export function compileDataset(rootDir = process.cwd()): CompiledDataset {
  const generated = path.join(rootDir, 'src/data/generated');
  const curated = path.join(rootDir, 'src/data/curated');
  const dataset: CompiledDataset = {
    metadata: { schemaVersion: 2, datasetVersion: '0.2.0', generatedAt: new Date().toISOString() },
    pokemon: readJson(path.join(generated, 'pokemon.json')),
    forms: readJson(path.join(generated, 'forms.json')),
    evolutions: readJson(path.join(generated, 'evolutions.json')),
    generations: readJson(path.join(curated, 'generations.json')),
    gameFamilies: readJson(path.join(curated, 'game-families.json')),
    games: readJson(path.join(curated, 'games.json')),
    contentPacks: readJson(path.join(curated, 'content-packs.json')),
    regionalDexes: readJson(path.join(curated, 'regional-dexes.json')),
    regionalDexEntries: readJson(path.join(generated, 'regional-dex-entries.json')),
    mechanicCatalogs: readJson(path.join(curated, 'mechanic-catalogs.json')),
    availability: readJson(path.join(curated, 'availability.json'))
  };
  validateDataset(dataset);
  return dataset;
}

export function writeCompiledDataset(rootDir = process.cwd()): string {
  const dataset = compileDataset(rootDir);
  const out = path.join(rootDir, 'src/data/compiled/dataset.json');
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, `${JSON.stringify(dataset, null, 2)}\n`);
  return out;
}
