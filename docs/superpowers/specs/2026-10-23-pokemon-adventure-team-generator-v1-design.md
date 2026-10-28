# Pokémon Adventure Team Generator — Diseño V1

Estado: aprobado.

## Objetivo
Aplicación web pública para generar equipos Pokémon de aventura por juego, etapa, contenido/DLC y reglas de disponibilidad, con modos Full Random, Aventura y Personalizado.

## Arquitectura
- React + TypeScript + Vite.
- Motor de generación independiente de React.
- Dataset local preprocesado y versionado.
- Datos externos importados semiautomáticamente, con revisión humana.
- localStorage detrás de una abstracción TeamRepository.
- Sin backend ni DB remota en V1.
- Vitest para tests.

## Datos
Tres capas:
- `data/generated/`: especies, tipos, stats, formas, generaciones, evoluciones.
- `data/curated/`: disponibilidad por juego/DLC, historia/postgame, exclusividades, HOME, transferencias, tags especiales, reglas curadas.
- `data/compiled/`: dataset final consumido por el motor.

PokéAPI se usa como fuente estructural; fuentes oficiales y comunitarias fiables se usan para disponibilidad, DLC, exclusividades y cambios recientes. Ningún cambio externo entra directo a producción.

## DLC y contenido
Juego base siempre activo. DLC desactivados por defecto hasta que el usuario los habilite.

`stage` y `content packs` son conceptos separados:
- `stage`: `main_story | postgame | all`
- `enabledContentPacks`: lista de contenido habilitado.

Esto permite DLC accesibles durante historia, DLC postgame y dependencias entre expansiones.

## Modelos principales
- Pokemon
- PokemonForm
- EvolutionStep
- EvolutionCondition
- Availability
- GeneratorConfig
- CustomRules
- PokemonCandidate
- TeamSlot
- TeamValidationResult
- GenerationResult
- SavedTeam

## Reglas clave
- Generar 1–6 Pokémon, 6 por defecto.
- Historia = solo historia principal.
- Postgame = solo contenido desbloqueado en postgame.
- Todo = ambos.
- Full Random no balancea.
- Aventura puntúa diversidad, debilidades, resistencias, balance físico/especial y variedad básica de perfiles.
- Personalizado controla filtros y constraints.
- No se relajan reglas silenciosamente.
- Si hay menos candidatos que slots, mostrar `x/y disponibles`.
- Una familia evolutiva no puede repetirse.
- Varias formas jugables de la misma especie no pueden coexistir.
- Formas cosméticas no crean candidatos separados.
- Mostrar la evolución máxima realmente accesible bajo las reglas actuales.
- Evolución por intercambio es distinta de adquisición por intercambio.
- Bloqueos se respetan al regenerar y participan en scoring/constraints.

## Extensibilidad
No codificar límites como “hasta Gen 9”. Nuevas generaciones, especies, formas, categorías, DLC y mecánicas deben añadirse principalmente mediante datos.

## Fuera de alcance V1
- cuentas
- backend
- DB remota
- sincronización
- competitivo completo
- EVs/IVs/naturalezas/sets
- ubicaciones exactas de encuentro
- mapas
