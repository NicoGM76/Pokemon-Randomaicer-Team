# Multiregion Collection V1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a hybrid multiregion collection generator that coordinates several selected game teams without repeated species/families and supports optional bonus members, locks, and regional rerolls.

**Architecture:** Keep the existing single-team generator unchanged as the local optimizer. Add a collection coordinator that builds candidate pools per selected game, excludes globally consumed species/families, optionally fills one bonus slot from the wider dataset, and returns collection-level metadata. Add a dedicated React page/component so the feature does not bloat the existing individual generator further.

**Tech Stack:** React, TypeScript, Vite, Vitest, existing generator engine and generated Pokémon data.

**Spec:** `docs/superpowers/specs/2026-10-28-multiregion-collection-v1-design.md`

## Global Constraints
- No repeated Pokémon across generated teams.
- No repeated evolution families across generated teams.
- At most one bonus Pokémon per team.
- Bonus is optional.
- Later evolutions inherit family origin generation via minimum `introducedGeneration` in the family.
- Concrete game selection per collection entry.
- Existing individual generator behavior must remain green.
- V2 competitive features are out of scope.

## Review Focus
- Locked teams must survive full regeneration unchanged.
- Locked members must survive a regional reroll and reserve their family globally.
- A bonus candidate must never duplicate a species/family already used elsewhere.
- A collection with too few legal candidates must return partial teams rather than silently relaxing global rules.
- Existing 38-game smoke tests must remain green.

---

### Task 1: Collection domain model and family-origin helper

**Files:**
- Create: `src/domain/collections/types.ts`
- Create: `src/generator/collection/familyOriginGeneration.ts`
- Test: `src/generator/collection/familyOriginGeneration.test.ts`

**Interfaces:**
- Produces `CollectionEntryConfig`, `CollectionConfig`, `CollectionTeam`, `CollectionResult`.
- Produces `familyOriginGeneration(dataset, familyId): number`.

- [ ] Write failing tests for family origin using a later evolution in an older family.
- [ ] Implement domain types and family origin helper.
- [ ] Run focused tests and commit.

### Task 2: Global collection generator

**Files:**
- Create: `src/generator/collection/generateCollection.ts`
- Test: `src/generator/collection/generateCollection.test.ts`

**Interfaces:**
- Consumes existing `buildCandidates`, `generateAdventureTeam`, `generateRandomTeam`.
- Produces `generateCollection(dataset, config, current?): CollectionResult`.

- [ ] Write failing tests for two teams with no repeated species/families.
- [ ] Add tests for partial result and optional bonus limit.
- [ ] Implement coordinated generation and global reservation sets.
- [ ] Verify tests and commit.

### Task 3: Hybrid locking and regional reroll

**Files:**
- Create: `src/generator/collection/regenerateCollectionTeam.ts`
- Test: `src/generator/collection/regenerateCollectionTeam.test.ts`

**Interfaces:**
- Produces `regenerateCollectionTeam(dataset, config, current, entryId): CollectionResult`.

- [ ] Write failing tests for locked team preservation.
- [ ] Write failing test for locked member preservation during team reroll.
- [ ] Implement reroll by reserving all other teams and locked members first.
- [ ] Verify tests and commit.

### Task 4: Collection UI

**Files:**
- Create: `src/collection/CollectionPage.tsx`
- Modify: `src/App.tsx`
- Modify: `src/styles.css`

**Interfaces:**
- Adds top-level `Equipo individual | Colección` navigation.
- Collection page supports adding/removing 2-9 entries, selecting game/team size, generate, team lock, member lock, reroll team, reroll all.

- [ ] Implement minimal collection setup UI using catalog generations/games.
- [ ] Render summary: teams, total Pokémon, repeated species (must be zero), bonuses used.
- [ ] Render team cards and hybrid controls.
- [ ] Keep individual generator unchanged except top-level switch.
- [ ] Build and commit.

### Task 5: V1 regression gate

**Files:**
- Modify/add tests only as needed.

**Interfaces:**
- Existing `allGames.smoke.test.ts` remains authoritative for individual generation.

- [ ] Run full tests.
- [ ] Run build.
- [ ] Confirm collection tests cover global duplicates, bonus, partial teams, locks and rerolls.
- [ ] Open PR from `feature/multiregion-v1` to `main` with V1 summary.
