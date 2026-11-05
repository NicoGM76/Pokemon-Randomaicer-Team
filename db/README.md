# PostgreSQL V2.5 · Pokémon Adventure

**Producción:** proyecto Supabase `pokemon-adventure`, región `sa-east-1`, PostgreSQL 17, plan Free. Esquema ya aplicado y probado en el proyecto de la cuenta del propietario.

**URL del panel:** https://supabase.com/dashboard/project/ffnutyxsfjkbdgavfmpv

## Esquema y seguridad

- [`schema-v2.5.sql`](schema-v2.5.sql): 15 tablas públicas normalizadas; Pokémon, tipos, formas, evoluciones, registros de origen, movimientos, habilidades, objetos y estadísticas competitivas con claves foráneas.
- RLS habilitado en todas las tablas; `anon` y `authenticated` **solo** pueden leer datos públicos. La importación corresponde a un proceso de servidor privilegiado (`service_role` o usuario de base).
- El esquema inicial fue aplicado como migración `create_pokemon_catalog_v25`. Los índices auxiliares y permisos de importación se registraron como `index_pokemon_catalog_foreign_keys` y `grant_catalog_server_import`.
- El archivo completo `schema-v2.5.sql` incluye dichas mejoras para **crear una nueva base vacía**. **No se debe volver a ejecutar sobre el proyecto existente**, porque contiene sentencias `CREATE TABLE` sin `IF NOT EXISTS`.

## Datos iniciales y exportación reproducible

Se importaron **43 especies de muestra, 2 formas, 17 evoluciones** desde los JSON versionados en el repositorio. Se registró como `completeness=sample`; **no es la Pokédex completa**. El despliegue habitual genera un catálogo más amplio con PokéAPI.

Para generar una importación **completa**, desde el repositorio y en un entorno seguro:

```powershell
npm.cmd run data:sync-all
npm.cmd run data:validate-all
node scripts/db/emit-catalog-sql.mjs --full > catalog-import.sql
# Ejecutar el SQL generado en PostgreSQL con un cliente autorizado y verificación ON_ERROR_STOP.
```

- La exportación contiene una transacción y un hash SHA-256; **no** necesita credenciales de Supabase para generarse.
- `--full` **rechaza** conjuntos con menos de 1000 especies. Sin el indicador se registra como muestra.
- No borra especies no incluidas ni tablas privadas, pero actualiza los campos de IDs existentes; usar primero sobre una copia cuando haya datos curados manualmente.
- Si se usa `psql`, ejecutar `psql -X -v ON_ERROR_STOP=1 -f catalog-import.sql` con la conexión configurada fuera del repositorio. No pegar la URL con contraseña en commits, consola compartida o frontend.
- La importación competitiva requiere snapshots Smogon realmente `ready`; los archivos `public/meta/*.json` incluidos en Git son marcadores `unavailable` hasta que el pipeline los actualice. **No crear estadísticas ficticias.**
- Para importaciones automáticas futuras, almacenar credenciales de base o servicio **únicamente** en secretos de servidor; nunca usar `VITE_*` ni publicarlas en GitHub Pages.

## Respaldo y contingencia

Google Drive dedicado: [Pokemon-Adventure-DB-Backups](https://drive.google.com/drive/folders/1zuJuD8I4Na2nc_oxHfxHMljMv3XI4NNE), con `daily/`, `weekly/`, `monthly/`, `manifests/` y `restore-tests/` verificadas.

**Las carpetas no equivalen a copias realizadas.** Pendiente: configurar credenciales de extracción, cifrado local antes de subir, carga automática autenticada a Drive, hash/retención/alertas y comprobar una restauración con PostgreSQL alternativo. No guardar contraseñas en scripts ni en Drive. Los equipos locales del navegador aún no se sincronizan con Supabase.

El sitio seguirá usando JSON y guardados locales hasta que se implemente y pruebe su capa de datos remotos. Véase [plan V2.5](../docs/v2-5-postgres-backup-free.md).

## Consultas de verificación (lectura)

```sql
SELECT COUNT(*) AS species FROM public.pokemon_species;
SELECT COUNT(*) AS forms FROM public.pokemon_forms;
SELECT COUNT(*) AS evolutions FROM public.pokemon_evolutions;
SELECT id, completeness, species_count FROM public.catalog_imports ORDER BY imported_at DESC;
```

Las siguientes fases requieren pruebas separadas para (a) importación completa, (b) backup y restauración, (c) recuperación de la web cuando Supabase no esté disponible.
