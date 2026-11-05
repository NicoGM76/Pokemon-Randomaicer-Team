# PostgreSQL V2.5 · Pokémon Adventure

**Producción:** proyecto Supabase `pokemon-adventure`, región `sa-east-1`, PostgreSQL 17, plan Free. Esquema ya aplicado y probado en el proyecto de la cuenta del propietario.

**URL del panel:** https://supabase.com/dashboard/project/ffnutyxsfjkbdgavfmpv

## Esquema y seguridad

- [`schema-v2.5.sql`](schema-v2.5.sql): 15 tablas principales y 2 tablas de Pokédex regionales; Pokémon, tipos, formas, evoluciones, registros de origen, movimientos, habilidades, objetos y estadísticas competitivas con claves foráneas.
- RLS habilitado en todas las tablas; `anon` y `authenticated` **solo** pueden leer datos públicos. La importación corresponde a un proceso de servidor privilegiado (`service_role` o usuario de base).
- El esquema inicial fue aplicado como migración `create_pokemon_catalog_v25`. Los índices auxiliares y permisos de importación se registraron como `index_pokemon_catalog_foreign_keys` y `grant_catalog_server_import`.
- Para crear una base desde cero: ejecutar `schema-v2.5.sql` y después las migraciones en `migrations/` para variantes evolutivas y Pokédex regionales (la última admite el número 000). **No se debe volver a ejecutar sobre el proyecto existente**, porque contiene sentencias `CREATE TABLE` sin `IF NOT EXISTS`.

## Datos iniciales y exportación reproducible

Se importó y verificó el **catálogo completo generado desde PokéAPI**: **1025 especies**, **1551 registros de tipos**, **675 evoluciones** (incluyendo alternativas), **22 Pokédex regionales**, **5474 entradas** y **2 formas curadas**. Hay dos entradas con `dex_number=0`, ambas legítimas para Victini en Teselia. La base conserva además el registro histórico inicial de 43 especies de muestra; el registro más reciente tiene `completeness=full`. Las tablas con RLS son **17/17** y el asesor de seguridad no reportó observaciones.

Para generar una importación **completa**, desde el repositorio y en un entorno seguro:

```powershell
npm.cmd run data:sync-all
npm.cmd run data:validate-all
node scripts/db/emit-catalog-sql.mjs --full > catalog-import.sql
# Ejecutar el SQL generado en PostgreSQL con un cliente autorizado y verificación ON_ERROR_STOP.
```

- La exportación contiene una transacción y un hash SHA-256; **no** necesita credenciales de Supabase para generarse.
- `--full` **rechaza** menos de 1000 especies, menos de 20 Pokédex o menos de 5000 entradas regionales; valida referencias, unicidad y conteos por Pokédex. Sin el indicador se registra como muestra.
- El cargador conserva condiciones evolutivas alternativas para el mismo par de especies e incluye ambas variantes de Victini `#000`.
- No borra especies no incluidas ni tablas privadas, pero actualiza los campos de IDs existentes; usar primero sobre una copia cuando haya datos curados manualmente.
- Si se usa `psql`, ejecutar `psql -X -v ON_ERROR_STOP=1 -f catalog-import.sql` con la conexión configurada fuera del repositorio. No pegar la URL con contraseña en commits, consola compartida o frontend.
- La importación competitiva requiere snapshots Smogon realmente `ready`; los archivos `public/meta/*.json` incluidos en Git son marcadores `unavailable` hasta que el pipeline los actualice. **No crear estadísticas ficticias.**
- Para importaciones automáticas futuras, almacenar credenciales de base o servicio **únicamente** en secretos de servidor; nunca usar `VITE_*` ni publicarlas en GitHub Pages.

## Respaldo y contingencia

Google Drive dedicado: [Pokemon-Adventure-DB-Backups](https://drive.google.com/drive/folders/1zuJuD8I4Na2nc_oxHfxHMljMv3XI4NNE), con `daily/`, `weekly/`, `monthly/`, `manifests/` y `restore-tests/` verificadas.

**Las carpetas no equivalen a copias realizadas.** Existen scripts y workflows listos para exportar, cifrar con age, subir, comparar y hacer prueba de restauración local, pero **falta configurar las credenciales de PostgreSQL y Drive en GitHub Actions y ejecutar una restauración real**. Véase [instrucciones de habilitación de respaldos](backup-setup.md). No guardar contraseñas en scripts ni en Drive. Los equipos locales del navegador aún no se sincronizan con Supabase.

El sitio seguirá usando JSON y guardados locales hasta que se implemente y pruebe su capa de datos remotos. Véase [plan V2.5](../docs/v2-5-postgres-backup-free.md).

## Consultas de verificación (lectura)

```sql
SELECT COUNT(*) AS species FROM public.pokemon_species;
SELECT COUNT(*) AS forms FROM public.pokemon_forms;
SELECT COUNT(*) AS evolutions FROM public.pokemon_evolutions;
SELECT id, completeness, species_count FROM public.catalog_imports ORDER BY imported_at DESC;
```

**Completado:** catálogo completo validado e importado. **Pendiente:** primer backup cifrado en Drive + restauración real, y capa frontend de recuperación durante caída de Supabase.

## Migraciones adicionales aplicadas

- `preserve_evolution_alternative_conditions`: añade `variant_index` para no perder condiciones alternativas de evolución (675 pasos / 484 parejas).
- `regional_pokedex_catalog`: introduce tablas `regional_dexes` y `regional_dex_entries` con RLS de solo lectura.
- `allow_zero_regional_dex_number`: respeta `#000` de Victini en las Pokédex de Teselia.

Todos los scripts de migración están en [`migrations/`](migrations/). El esquema y los datos se reprodujeron y comprobaron mediante consultas SQL reales, no solo con un plan.
