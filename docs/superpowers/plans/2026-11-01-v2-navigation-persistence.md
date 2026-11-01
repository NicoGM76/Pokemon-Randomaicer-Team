# V2.0 Navigation and Persistence Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace state-only page switching with real client routing, persist in-progress drafts across reloads, and lazy-load major feature pages so V2 competitive can scale without making the current app monolithic.

**Architecture:** Add React Router with hash routing for GitHub Pages, move global navigation into an app shell, split adventure/collection/saved/competitive into route-level chunks, and persist feature drafts through a small versioned storage abstraction. Keep existing saved-team persistence compatible and add an IndexedDB adapter for future heavier competitive caches without migrating V1 data yet.

**Tech Stack:** React, TypeScript, Vite, React Router DOM, Vitest, localStorage, IndexedDB.

**Spec:** `docs/superpowers/specs/2026-11-01-v2-navigation-persistence-design.md`

## Global Constraints
- GitHub Pages remains the deployment target.
- Use hash routing so refresh/deep navigation works without server rewrites.
- Existing saved teams remain compatible with `LocalStorageTeamRepository`.
- Do not implement the competitive engine in V2.0.
- Corrupt persisted drafts must never prevent the app from rendering.
- Existing generator and collection behavior must remain functional.

## Review Focus
- Reload with malformed JSON in draft storage must fall back to defaults.
- Browser Back/Forward must change routes without resetting unrelated persisted drafts.
- Loading a saved adventure team must navigate back to Adventure and restore that team.
- Collection member/team locks must survive a reload.
- Direct load of `/#/collection` and `/#/competitive` must render without first visiting Adventure.

---

### Task 1: Router dependency and route shell

**Files:**
- Modify: `package.json`
- Create: `src/router/AppRouter.tsx`
- Create: `src/router/AppShell.tsx`
- Modify: `src/main.tsx`
- Retire/Modify: `src/RootApp.tsx`
- Test: `src/router/AppRouter.test.tsx`

**Interfaces:**
- Produces route paths `/`, `/adventure`, `/collection`, `/saved`, `/competitive` under a `HashRouter`.
- Produces `AppShell` containing global navigation links and an `<Outlet />`.

- [ ] Write routing tests for direct route rendering and active navigation.
- [ ] Run the tests and confirm they fail before router implementation.
- [ ] Add `react-router-dom` dependency.
- [ ] Implement `AppRouter` using hash routing and route-level `React.lazy` imports.
- [ ] Implement `AppShell` and move global product navigation there.
- [ ] Update `main.tsx` to render `AppRouter`; remove state-only root switching.
- [ ] Run router tests and build.
- [ ] Commit.

### Task 2: Versioned draft storage

**Files:**
- Create: `src/storage/drafts/types.ts`
- Create: `src/storage/drafts/LocalDraftStore.ts`
- Create: `src/storage/drafts/LocalDraftStore.test.ts`
- Create: `src/storage/indexeddb/IndexedDbKeyValueStore.ts`
- Create: `src/storage/indexeddb/IndexedDbKeyValueStore.test.ts`

**Interfaces:**
- `LocalDraftStore<T>.load(): T | null`
- `LocalDraftStore<T>.save(value: T): void`
- `LocalDraftStore<T>.clear(): void`
- Stored envelope includes exact `version` and `value` fields.
- IndexedDB adapter exposes async `get<T>(key)`, `set<T>(key, value)`, `delete(key)`.

- [ ] Write failing tests for versioned load/save/clear and malformed JSON fallback.
- [ ] Implement `LocalDraftStore` with safe localStorage access and memory-safe failure behavior.
- [ ] Write IndexedDB adapter tests for graceful unavailable-environment behavior and public API shape.
- [ ] Implement the minimal IndexedDB adapter for future V2 competitive caches.
- [ ] Run storage tests.
- [ ] Commit.

### Task 3: Adventure draft persistence and route separation

**Files:**
- Modify: `src/App.tsx`
- Create: `src/adventure/adventureDraft.ts`
- Test: `src/adventure/adventureDraft.test.ts`

**Interfaces:**
- Adventure draft contains `config`, `result`, and `notice`.
- `loadAdventureDraft()` returns a valid draft or `null`.
- `saveAdventureDraft(draft)` persists after relevant state changes.

- [ ] Write tests for restoring config/result and rejecting incompatible draft versions.
- [ ] Extract adventure draft helper using `LocalDraftStore`.
- [ ] Initialize `App` state from the persisted draft where present.
- [ ] Persist config/result/notice changes with an effect that does not write before initialization.
- [ ] Remove internal `page` navigation state from `App`.
- [ ] Replace saved-page buttons with router navigation.
- [ ] Verify generating, locking and reloading keeps the current adventure draft.
- [ ] Commit.

### Task 4: Saved teams as a dedicated route

**Files:**
- Create: `src/saved/SavedTeamsPage.tsx`
- Modify: `src/App.tsx`
- Test: `src/saved/SavedTeamsPage.test.tsx`

**Interfaces:**
- Saved page reads/writes through the existing `LocalStorageTeamRepository`.
- Selecting a saved team writes it to the Adventure draft and navigates to `/adventure`.

- [ ] Write test proving a selected saved team becomes the adventure draft and triggers navigation.
- [ ] Extract saved-team UI from `App.tsx` into `SavedTeamsPage`.
- [ ] Implement load/delete using existing repository behavior.
- [ ] Verify old saved-team records remain readable.
- [ ] Commit.

### Task 5: Collection draft persistence

**Files:**
- Modify: `src/collection/CollectionPage.tsx`
- Create: `src/collection/collectionDraft.ts`
- Test: `src/collection/collectionDraft.test.ts`

**Interfaces:**
- Collection draft contains `config` and `result`.
- Locks inside `CollectionResult` are persisted verbatim.

- [ ] Write tests for config/result restoration and lock survival.
- [ ] Implement collection draft helper using `LocalDraftStore`.
- [ ] Initialize collection state from the draft.
- [ ] Persist config/result changes after initialization.
- [ ] Verify regeneration still respects restored locks.
- [ ] Commit.

### Task 6: Competitive placeholder and route-level lazy loading

**Files:**
- Create: `src/competitive/CompetitiveLandingPage.tsx`
- Test: `src/competitive/CompetitiveLandingPage.test.tsx`
- Modify: `src/router/AppRouter.test.tsx`

**Interfaces:**
- `/competitive` renders a lightweight V2 landing page describing Singles, Dobles/VGC and learning mode as upcoming modules.
- No competitive engine/data imports in V2.0.

- [ ] Write route test for direct competitive landing load.
- [ ] Implement the lightweight landing page matching the V2 visual direction.
- [ ] Confirm route pages are imported via `React.lazy` from the router.
- [ ] Commit.

### Task 7: Styling, responsive navigation and regression verification

**Files:**
- Modify: `src/styles.css`
- Modify: `README.md`

**Interfaces:**
- Global nav remains usable at desktop and mobile widths.
- README documents V2.0 routes, persistence and modular loading.

- [ ] Add responsive styles for shell nav and loading fallback.
- [ ] Update README with V2.0 architecture and route URLs.
- [ ] Run `npm run data:sync-all`.
- [ ] Run `npm run data:validate-all`.
- [ ] Run `npm run test:run` and confirm zero failures.
- [ ] Run `npm run build` and confirm success.
- [ ] Confirm existing 38-game smoke tests remain green.
- [ ] Open PR to `main` only after the full branch is green.
