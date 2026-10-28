# Catálogo base de datos — Gen I a IX

Esta capa define la columna vertebral del producto. No afirma todavía que todas las especies de cada Pokédex tengan reglas de disponibilidad publicadas.

## Jerarquía

`Generation -> GameFamily -> Game -> ContentPack -> RegionalDex -> Availability`

- **Generation:** agrupación histórica I–IX.
- **GameFamily:** juegos que comparten una base de diseño/datos (RBY, GSC, RSE, etc.).
- **Game:** versión concreta seleccionable por el usuario.
- **ContentPack:** juego base, DLC o actualización que abre contenido.
- **RegionalDex:** catálogo de especies asociado al juego/contenido.
- **Availability:** regla final de obtención en Historia/Postgame y por método.

Las Pokédex y la disponibilidad se mantienen separadas: pertenecer a una Pokédex no implica automáticamente ser obtenible con los filtros actuales.

## Catálogos de especies definidos

| ID | Pokédex | Entradas |
|---|---|---:|
| kanto-classic | Kanto clásica | 151 |
| johto-gsc | Johto GSC | 251 |
| hoenn-rse | Hoenn RSE | 202 |
| sinnoh-dp-bdsp | Sinnoh DP/BDSP | 151 |
| sinnoh-platinum | Sinnoh Platino | 210 |
| johto-hgss | Johto HGSS | 256 |
| unova-bw | Teselia BW | 156 |
| unova-b2w2 | Teselia B2W2 | 301 |
| kalos-xy | Kalos XY | 457 |
| hoenn-oras | Hoenn ORAS | 211 |
| alola-sm | Alola SM | 302 |
| alola-usum | Alola USUM | 403 |
| kanto-lgpe | Kanto Let's Go | 153 |
| galar-base | Galar | 400 |
| galar-armor | Armadura | 211 |
| galar-crown | Corona | 210 |
| hisui | Hisui | 242 |
| paldea-base | Paldea | 400 |
| kitakami | Noroteo | 200 |
| blueberry | Arándano | 243 |
| lumiose | Luminalia | 232 |
| dimensional | Dimensional | 132 |

La MegaDex se almacena aparte en `mechanic-catalogs.json` porque cataloga megaevoluciones, no especies regionales normales.

## Estado de importación

Todos los `RegionalDex.entryStatus` comienzan en `pending`. El siguiente pipeline poblará sus entradas y solo después las reglas de `Availability`.

Estados previstos: `pending -> imported -> reviewed -> published`.

## Importación masiva de todas las generaciones

La columna vertebral no se puebla generación por generación. El proyecto incluye un importador masivo basado en los CSV oficiales del repositorio de PokéAPI.

```powershell
npm.cmd run data:sync-all
npm.cmd run data:validate-all
```

`data:sync-all`:

- descarga y conserva una caché local en `.cache/pokeapi-csv/`;
- recorre las 22 Pokédex regionales configuradas;
- mapea Kanto, Johto, Hoenn, Sinnoh, Teselia, Kalos, Alola, Galar, Hisui, Paldea, Noroteo, Arándano, Luminalia e Hyperspace;
- genera `src/data/generated/regional-dex-entries.json`;
- actualiza `src/data/generated/pokemon.json` con las especies base, tipos y estadísticas estructurales disponibles en PokéAPI;
- genera `src/data/generated/dex-import-report.json` con diferencias de conteo para revisión humana.

Para ignorar la caché y traer nuevamente los CSV:

```powershell
npm.cmd run data:sync-all:refresh
```

La pertenencia a una Pokédex regional **no se convierte automáticamente en disponibilidad de Historia/Postgame**. Ese paso sigue siendo una capa separada, porque requiere reglas por juego, versión, método, exclusividad y progreso.
