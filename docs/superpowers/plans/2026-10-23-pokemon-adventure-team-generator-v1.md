# Pokémon Adventure Team Generator V1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construir la V1 pública del generador de equipos Pokémon de aventura con soporte de juegos, DLC, disponibilidad, evoluciones, filtros, Full Random, Aventura, Personalizado, bloqueos y guardado local.

**Architecture:** React + TypeScript + Vite con un motor de dominio independiente de React. El motor consume un dataset local compilado a partir de datos generados y curados; la UI solo envía `GeneratorConfig` y renderiza `GenerationResult`. El guardado usa `TeamRepository`, inicialmente implementado con `localStorage`.

**Tech Stack:** React, TypeScript, Vite, Vitest, CSS, JSON/TS local, Git/GitHub.

**Spec:** `docs/superpowers/specs/2026-10-23-pokemon-adventure-team-generator-v1-design.md`

## Global Constraints

- Equipo de 1–6 miembros; 6 por defecto.
- Juego base siempre activo; DLC desactivados por defecto.
- `stage` y `enabledContentPacks` son independientes.
- No backend ni DB remota en V1.
- El motor no depende de React.
- React no decide legalidad Pokémon.
- No relajar filtros silenciosamente.
- `PokemonCandidate` usa `sourcePokemon` y `resolvedPokemon`.
- Familias evolutivas y grupos de especie no pueden duplicarse en un equipo.
- Formas cosméticas no son candidatos separados.
- La V1 debe ser extensible a generaciones futuras sin límites rígidos.

## Review Focus

- DLC habilitado pero bloqueado por prerrequisitos: debe excluir su disponibilidad sin romper el juego base.
- Varias rutas de obtención del mismo Pokémon: debe bastar una ruta válida y no crear duplicados funcionales.
- Evoluciones ramificadas: cada final accesible debe ser candidato independiente, respetando familia y especie.
- Bloqueos que violan constraints actuales: deben producir validación explícita, no regeneración silenciosa.
- Dataset parcialmente curado o con referencias inválidas: `data:validate` debe fallar antes del build.

---

## File Structure

```text
src/
├── app/
│   ├── App.tsx
│   └── routes.tsx
├── components/
│   ├── generator/
│   ├── team/
│   └── saved-teams/
├── pages/
│   ├── GeneratorPage.tsx
│   └── SavedTeamsPage.tsx
├── domain/
│   ├── pokemon/types.ts
│   ├── games/types.ts
│   ├── evolution/types.ts
│   └── teams/types.ts
├── generator/
│   ├── availability/matchesAvailability.ts
│   ├── evolution/canEvolve.ts
│   ├── evolution/resolveReachableEvolutions.ts
│   ├── candidates/buildCandidates.ts
│   ├── filters/passesCandidateFilters.ts
│   ├── constraints/canAddCandidateToTeam.ts
│   ├── validation/validateTeam.ts
│   ├── random/generateRandomTeam.ts
│   ├── adventure/scoreAdventureTeam.ts
│   ├── adventure/generateAdventureTeam.ts
│   └── generateTeam.ts
├── data/
│   ├── generated/
│   ├── curated/
│   ├── compiled/
│   └── loadDataset.ts
├── storage/
│   ├── TeamRepository.ts
│   └── LocalStorageTeamRepository.ts
├── scripts/
│   ├── update-pokemon-data.ts
│   ├── compile-dataset.ts
│   └── validate-data.ts
└── test/
    ├── fixtures/
    └── setup.ts
```

---

### Task 1: Bootstrap del proyecto y tipos de dominio

**Files:**
- Create: `package.json`, `vite.config.ts`, `tsconfig.json`
- Create: `src/domain/pokemon/types.ts`
- Create: `src/domain/games/types.ts`
- Create: `src/domain/evolution/types.ts`
- Create: `src/domain/teams/types.ts`
- Test: `src/domain/domain-types.test.ts`

**Interfaces:**
- Produces: `Pokemon`, `PokemonForm`, `PokemonStats`, `ContentPack`, `Availability`, `EvolutionStep`, `EvolutionCondition`, `GeneratorConfig`, `PokemonCandidate`, `TeamSlot`, `GenerationResult`, `SavedTeam`.

- [ ] **Step 1: Write failing compile-time/runtime fixture tests** for representative Pokémon, DLC, config and candidate objects.
- [ ] **Step 2: Run `npm test -- domain-types` and confirm failure** because project/types do not exist.
- [ ] **Step 3: Scaffold Vite React TypeScript + Vitest** and define the exact domain interfaces from the approved spec.
- [ ] **Step 4: Run `npm test -- domain-types` and `npm run build`**; both must pass.
- [ ] **Step 5: Commit** with `feat: scaffold domain model`.

---

### Task 2: Dataset layout, loader and validation pipeline

**Files:**
- Create: `src/data/generated/*.json`
- Create: `src/data/curated/*.json`
- Create: `src/data/compiled/*.json`
- Create: `src/data/loadDataset.ts`
- Create: `src/scripts/compile-dataset.ts`
- Create: `src/scripts/validate-data.ts`
- Test: `src/data/data-validation.test.ts`

**Interfaces:**
- Produces: `loadDataset(): CompiledDataset`
- Produces CLI scripts: `data:update`, `data:compile`, `data:validate`.

- [ ] **Step 1: Write failing tests** for invalid `gameId`, `contentPackId`, `formId`, evolution references and duplicate keys.
- [ ] **Step 2: Run validation tests and confirm failure.**
- [ ] **Step 3: Implement minimal generated/curated fixture datasets** containing at least one linear evolution, one branch, one form, one DLC and one base-game availability rule.
- [ ] **Step 4: Implement compiler + validator** so invalid references fail fast and compiled output includes metadata `{schemaVersion,datasetVersion,generatedAt}`.
- [ ] **Step 5: Run `npm run data:validate`, `npm test -- data-validation`, `npm run build`.**
- [ ] **Step 6: Commit** with `feat: add versioned dataset pipeline`.

---

### Task 3: Disponibilidad por juego, stage, métodos y DLC

**Files:**
- Create: `src/generator/availability/matchesAvailability.ts`
- Test: `src/generator/availability/matchesAvailability.test.ts`

**Interfaces:**
- Consumes: `Availability`, `GeneratorConfig`, `ContentPack`.
- Produces: `matchesAvailability(rule, config, contentPacks): boolean`.

- [ ] **Step 1: Write failing tests** for base game, disabled DLC, enabled DLC, main_story, postgame, all, allowed methods and DLC prerequisites.
- [ ] **Step 2: Run targeted tests; expect failure.**
- [ ] **Step 3: Implement `matchesAvailability`** with exact-match stage semantics except `all`, mandatory game match, enabled content pack check and allowed method check.
- [ ] **Step 4: Run targeted tests; expect pass.**
- [ ] **Step 5: Commit** with `feat: resolve game and dlc availability`.

---

### Task 4: Evoluciones y formas resolubles

**Files:**
- Create: `src/generator/evolution/canEvolve.ts`
- Create: `src/generator/evolution/resolveReachableEvolutions.ts`
- Test: `src/generator/evolution/evolution.test.ts`

**Interfaces:**
- Produces: `canEvolve(step, config): boolean`
- Produces: `resolveReachableEvolutions(startPokemonId, steps, config): ReachableEvolution[]`.

- [ ] **Step 1: Write failing tests** for Gastly→Haunter→Gengar with/without trade, Eevee branching, multi-depth branch and cycle protection.
- [ ] **Step 2: Run targeted tests; expect failure.**
- [ ] **Step 3: Implement structured condition evaluation** for `level`, `item`, `trade`, `friendship`, `time`, `gender`, `move_known`, `game`, `special`.
- [ ] **Step 4: Implement graph traversal** returning final reachable Pokémon plus `path: EvolutionStep[]`, with visited-set cycle protection.
- [ ] **Step 5: Run tests; expect pass.**
- [ ] **Step 6: Commit** with `feat: resolve accessible evolutions`.

---

### Task 5: Construcción del pool de candidatos

**Files:**
- Create: `src/generator/candidates/buildCandidates.ts`
- Create: `src/generator/filters/passesCandidateFilters.ts`
- Test: `src/generator/candidates/buildCandidates.test.ts`

**Interfaces:**
- Produces: `buildCandidates(dataset, config): PokemonCandidate[]`.

- [ ] **Step 1: Write failing tests** for source/resolved Pokémon, cosmetic forms excluded, regional/gameplay forms split, branch finals split, multiple acquisition routes merged, current-generation filter and special tags.
- [ ] **Step 2: Run targeted tests; expect failure.**
- [ ] **Step 3: Implement candidate construction** using availability first, then form/evolution resolution, then individual filters.
- [ ] **Step 4: Ensure `candidateKey`, `evolutionFamilyId`, `speciesGroupId`, `acquisitionOptions` are stable and deterministic.**
- [ ] **Step 5: Run tests; expect pass.**
- [ ] **Step 6: Commit** with `feat: build legal pokemon candidate pool`.

---

### Task 6: Constraints y validación de equipo

**Files:**
- Create: `src/generator/constraints/canAddCandidateToTeam.ts`
- Create: `src/generator/validation/validateTeam.ts`
- Test: `src/generator/validation/team-validation.test.ts`

**Interfaces:**
- Produces: `canAddCandidateToTeam(candidate, currentTeam, config): boolean`
- Produces: `validateTeam(team, config): TeamValidationResult`.

- [ ] **Step 1: Write failing tests** for duplicate family, duplicate species group, `maxSharedType`, starter exact-one, legendary exact-one and invalid locked-team constraints.
- [ ] **Step 2: Run targeted tests; expect failure.**
- [ ] **Step 3: Implement partial constraints** for candidate insertion.
- [ ] **Step 4: Implement final validation issue codes** defined in the spec.
- [ ] **Step 5: Run tests; expect pass.**
- [ ] **Step 6: Commit** with `feat: enforce team constraints`.

---

### Task 7: Full Random, TeamSlot y regeneración

**Files:**
- Create: `src/generator/random/generateRandomTeam.ts`
- Create: `src/generator/regeneration/regenerateSlot.ts`
- Create: `src/generator/regeneration/regenerateTeam.ts`
- Test: `src/generator/random/random-generation.test.ts`
- Test: `src/generator/regeneration/regeneration.test.ts`

**Interfaces:**
- Produces: `generateRandomTeam(candidates, config, lockedSlots): GenerationResult`
- Produces: `regenerateSlot(team, slotIndex, candidates, config): SlotRegenerationResult`
- Produces: `regenerateTeam(team, candidates, config): GenerationResult`.

- [ ] **Step 1: Write failing tests** for exact team size, incomplete pools, locked slots, same-candidate exclusion on slot regeneration and no-alternative behavior.
- [ ] **Step 2: Run tests; expect failure.**
- [ ] **Step 3: Implement random selection** using constraints and stable lock handling.
- [ ] **Step 4: Implement regeneration** preserving slot indexes and locks.
- [ ] **Step 5: Run tests; expect pass.**
- [ ] **Step 6: Commit** with `feat: add random generation and slot locks`.

---

### Task 8: Modo Aventura

**Files:**
- Create: `src/generator/adventure/typeChart.ts`
- Create: `src/generator/adventure/getDefensiveProfile.ts`
- Create: `src/generator/adventure/getOffensiveProfile.ts`
- Create: `src/generator/adventure/scoreAdventureTeam.ts`
- Create: `src/generator/adventure/generateAdventureTeam.ts`
- Test: `src/generator/adventure/adventure-scoring.test.ts`
- Test: `src/generator/adventure/adventure-generation.test.ts`

**Interfaces:**
- Produces: `scoreAdventureTeam(team, config): AdventureScore`
- Produces: `generateAdventureTeam(candidates, config, lockedSlots): GenerationResult`.

- [ ] **Step 1: Write failing tests** for 4× weaknesses, shared weaknesses, resistances/immunities, physical/special profile and monotype exemption.
- [ ] **Step 2: Run scoring tests; expect failure.**
- [ ] **Step 3: Implement type-effectiveness and team scoring** with named configurable weights.
- [ ] **Step 4: Write failing generation test** proving selection comes from elite-scoring teams and respects locks.
- [ ] **Step 5: Implement ~150-attempt adventure generation** and randomized selection among top candidates.
- [ ] **Step 6: Run adventure tests repeatedly with deterministic seeded RNG in tests.**
- [ ] **Step 7: Commit** with `feat: add adventure team scoring`.

---

### Task 9: Orquestador de modos y Personalizado

**Files:**
- Create: `src/generator/generateTeam.ts`
- Test: `src/generator/generateTeam.test.ts`

**Interfaces:**
- Produces: `generateTeam(dataset, config, currentTeam?): GenerationResult`.

- [ ] **Step 1: Write failing tests** for `random`, `adventure`, `custom`, impossible filters and required starter + required legendary together.
- [ ] **Step 2: Run tests; expect failure.**
- [ ] **Step 3: Implement mode dispatch** so all modes reuse the same candidate pipeline and validation.
- [ ] **Step 4: Ensure no mode silently relaxes config.**
- [ ] **Step 5: Run complete generator test suite.**
- [ ] **Step 6: Commit** with `feat: orchestrate generator modes`.

---

### Task 10: Persistencia local

**Files:**
- Create: `src/storage/TeamRepository.ts`
- Create: `src/storage/LocalStorageTeamRepository.ts`
- Test: `src/storage/LocalStorageTeamRepository.test.ts`

**Interfaces:**
- Produces: `save(team)`, `getAll()`, `delete(id)`.

- [ ] **Step 1: Write failing tests** using a localStorage test shim for save/list/delete and malformed stored data.
- [ ] **Step 2: Run tests; expect failure.**
- [ ] **Step 3: Implement repository** with a versioned storage key and defensive parsing.
- [ ] **Step 4: Run tests; expect pass.**
- [ ] **Step 5: Commit** with `feat: persist saved teams locally`.

---

### Task 11: UI React basada en el Figma aprobado

**Files:**
- Create/Modify: `src/app/App.tsx`
- Create: `src/pages/GeneratorPage.tsx`
- Create: `src/pages/SavedTeamsPage.tsx`
- Create: `src/components/generator/*`
- Create: `src/components/team/*`
- Create: `src/components/saved-teams/*`
- Test: `src/pages/GeneratorPage.test.tsx`

**Interfaces:**
- Consumes: `generateTeam`, `TeamRepository`, `CompiledDataset`.

- [ ] **Step 1: Write failing interaction tests** for generation selector, game selector, DLC default-off behavior, stage, methods, generate action and `x/y disponibles` state.
- [ ] **Step 2: Run tests; expect failure.**
- [ ] **Step 3: Implement desktop generator shell matching approved Figma.**
- [ ] **Step 4: Implement cards, lock, regenerate slot, regenerate team, save, copy and clear locks.**
- [ ] **Step 5: Implement Personalizado controls and contextual hiding of irrelevant categories.**
- [ ] **Step 6: Implement responsive/mobile accordion behavior; after generation collapse config and focus/scroll to result.**
- [ ] **Step 7: Implement Saved Teams page through repository abstraction.**
- [ ] **Step 8: Run UI tests and `npm run build`.**
- [ ] **Step 9: Commit** with `feat: build generator interface`.

---

### Task 12: Importador PokéAPI y actualización semiautomática

**Files:**
- Create: `src/services/pokeapi/client.ts`
- Create: `src/scripts/update-pokemon-data.ts`
- Test: `src/scripts/update-pokemon-data.test.ts`

**Interfaces:**
- Produces: generated dataset updates and a human-readable change report.

- [ ] **Step 1: Write failing fixture-based tests** for new species, new forms, changed evolution chain and unknown condition/tag reporting.
- [ ] **Step 2: Run tests; expect failure.**
- [ ] **Step 3: Implement import normalization** without production runtime dependency on PokéAPI.
- [ ] **Step 4: Generate change report** listing new species/forms/evolution conditions and curated gaps requiring review.
- [ ] **Step 5: Run `data:update` against fixtures, then `data:validate` and tests.**
- [ ] **Step 6: Commit** with `feat: add semi-automatic pokemon data updater`.

---

### Task 13: CI, production build and release gate

**Files:**
- Create: `.github/workflows/ci.yml`
- Modify: `package.json`
- Create: `README.md`

**Interfaces:**
- CI gate: validation → tests → build.

- [ ] **Step 1: Configure CI** to run `npm ci`, `npm run data:validate`, `npm test -- --run`, `npm run build`.
- [ ] **Step 2: Intentionally introduce one invalid data fixture locally and verify validation blocks the pipeline; revert it.**
- [ ] **Step 3: Run full local release gate successfully.**
- [ ] **Step 4: Document local development, data update, validation and release workflow in README.**
- [ ] **Step 5: Commit** with `ci: enforce dataset tests and production build`.

---

## Self-review notes

- Spec coverage: core V1 features, DLC, data pipeline, all three modes, persistence, responsive UI, updating and validation are mapped to tasks.
- Type consistency: candidate model consistently uses `sourcePokemon` / `resolvedPokemon`; content uses `contentPackId` / `enabledContentPacks`.
- Review-focus cases are covered in Tasks 2, 3, 4, 6 and 7.
- Deliberately deferred: accounts, backend, remote DB, exact routes, competitive features.
- Implementation should begin only after this plan is reviewed and an execution approach is chosen.
