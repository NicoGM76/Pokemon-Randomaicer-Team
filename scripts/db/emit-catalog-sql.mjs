import fs from 'node:fs/promises';
import path from 'node:path';
import { buildCatalogUpsertSql } from '../lib/catalog-sql.mjs';

// Usage (from repo root):
//   npm run data:sync-all
//   npm run data:validate-all
//   node scripts/db/emit-catalog-sql.mjs --full > catalog-import.sql
//   psql "$DATABASE_URL" -X -v ON_ERROR_STOP=1 -f catalog-import.sql
// This tool never connects to a database or reads secrets.
const root = process.cwd();
const read = name => fs.readFile(path.join(root, 'src/data/generated', name + '.json'), 'utf8').then(JSON.parse);
const [pokemon, forms, evolutions, regionalDexEntries] = await Promise.all(['pokemon','forms','evolutions','regional-dex-entries'].map(read));
const regionalDexes = JSON.parse(await fs.readFile(path.join(root, 'src/data/curated/regional-dexes.json'), 'utf8'));
const includeRegional = process.argv.includes('--full');
const data = includeRegional ? { pokemon, forms, evolutions, regionalDexes, regionalDexEntries } : { pokemon, forms, evolutions };
const sql = buildCatalogUpsertSql(data, { full: includeRegional });
process.stdout.write(sql);
