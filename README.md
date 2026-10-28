# Pokémon Adventure Team Generator — V1 funcional

Proyecto React + TypeScript + Vite con el motor de generación separado de la interfaz.

## Ejecutar en Windows PowerShell

```powershell
npm.cmd install
npm.cmd run dev
```

Abre la URL que muestre Vite, normalmente `http://localhost:5173/`.

## Comandos útiles

```powershell
npm.cmd run test:run
npm.cmd run build
```

## Incluido en este ZIP

- Generador Aventura, Full Random y Personalizado.
- Selección de generación, juego, DLC/contenido, etapa y tamaño de equipo.
- Métodos de obtención y evolución por intercambio.
- Reglas de iniciales y legendarios.
- Filtros personalizados básicos.
- Generación mediante el motor TypeScript existente.
- Bloquear miembros, regenerar equipo y regenerar slot.
- Estado de disponibilidad insuficiente sin relajar filtros automáticamente.
- Copiar y guardar equipos.
- Mis equipos con `localStorage`.
- Diseño responsive inspirado en el Figma aprobado.
- Dataset demo de Galar suficiente para probar el flujo de punta a punta.

## Importante sobre los datos

La arquitectura está preparada para el dataset grande y el pipeline semiautomático definidos en la especificación. Este ZIP todavía usa un dataset demostrativo, no la Pokédex completa de todos los juegos. La interfaz y el motor ya consumen la misma estructura que se ampliará posteriormente.

## Cobertura de datos

- El catálogo de juegos incluye las generaciones I-IX y 38 entregas principales/remakes/Let's Go/Legends.
- La disponibilidad de Pokémon se cura por juego. Platinum y Sword incluyen un pool semilla para pruebas; otros juegos pueden mostrar "Datos de disponibilidad pendientes" hasta que se incorporen sus reglas.
- No se inventa disponibilidad aproximada para juegos todavía no curados.

### Preparar un reporte de encuentros desde PokéAPI

Ejemplo:

```powershell
npm.cmd run data:sync-game -- platinum
```

El comando guarda `data-imports/platinum-wild-review.json`. Es un reporte para revisión, no se publica automáticamente porque PokéAPI no distingue por sí sola nuestras reglas Historia/Postgame ni cubre todos los regalos/eventos.

## Catálogo de datos V0.2

La columna vertebral Gen I–IX está definida en:

- `src/data/curated/generations.json`
- `src/data/curated/game-families.json`
- `src/data/curated/games.json`
- `src/data/curated/content-packs.json`
- `src/data/curated/regional-dexes.json`
- `src/data/curated/mechanic-catalogs.json`

Valida sus referencias con:

```powershell
npm.cmd run data:validate-catalog
```

Las entradas completas de cada Pokédex todavía se importarán en la siguiente fase. `entryStatus: "pending"` significa que el catálogo está definido pero sus especies aún no han pasado por importación y revisión.

## Sincronizar todas las generaciones de una vez

No es necesario importar generación por generación. Con Internet disponible:

```powershell
npm.cmd run data:sync-all
npm.cmd run data:validate-all
```

El primer comando descarga una vez los CSV estructurales de PokéAPI, los guarda en `.cache/pokeapi-csv/` y puebla las 22 Pokédex regionales configuradas desde Gen I hasta Gen IX/Legends Z-A. También amplía el catálogo base de especies usado por el proyecto.

Para forzar una descarga nueva:

```powershell
npm.cmd run data:sync-all:refresh
```

Importante: esta sincronización resuelve **pertenencia a Pokédex regional y datos estructurales de especies**. Historia/Postgame, exclusividades por versión y método exacto de obtención continúan en la capa `availability`, que se valida aparte para no inventar disponibilidad.

## Sincronización masiva de availability

Después de instalar dependencias, puedes sincronizar la columna vertebral completa de Pokédex y generar candidatos de disponibilidad para todos los juegos configurados con un único comando:

```powershell
npm.cmd run data:sync-everything
```

Este proceso genera `src/data/generated/availability-candidates.json` y `availability-import-report.json`.

- `confirmed_encounter`: PokéAPI contiene evidencia de encuentro/adquisición para esa versión. El método se normaliza a `wild`, `gift` o `trade`, pero Historia/Postgame queda pendiente de revisión.
- `membership_only`: la especie pertenece a la Pokédex regional/content pack, pero el importador no inventa cómo se obtiene. Requiere curación antes de convertirse en `availability.json` de producción.

Para ejecutar solo esta capa:

```powershell
npm.cmd run data:sync-availability
npm.cmd run data:validate-availability
```
