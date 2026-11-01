# V2.0 Navigation, Persistence and Modular Loading Design

## Intent
Prepare the V1 application for the competitive V2 without turning it into one oversized React screen. Users must be able to navigate with real browser history, reload without losing an in-progress draft, and load only the feature code they actually visit.

## Current problem
- `RootApp.tsx` switches between individual and collection with component state.
- `App.tsx` switches between generator and saved teams with component state.
- Browser Back/Forward do not represent those transitions.
- Reloading remounts the app and loses unsaved generator/collection state.
- All feature code is imported eagerly from the root.

## Product behavior
Use hash-based client routing so GitHub Pages can support deep links without server rewrites.

Routes:
- `/#/` -> lightweight home/redirect to adventure.
- `/#/adventure` -> individual adventure generator.
- `/#/collection` -> multiregion collection builder.
- `/#/saved` -> saved adventure teams.
- `/#/competitive` -> V2 placeholder/landing route only; the competitive engine itself is not part of V2.0.

Browser Back/Forward must work naturally between these routes.

## Persistence
### Adventure draft
Persist the current `GeneratorConfig`, generated `GenerationResult`, and notice needed to resume the session.

### Collection draft
Persist `CollectionConfig` and `CollectionResult` so team/member locks survive reloads.

### Storage boundaries
- Existing saved teams stay behind `TeamRepository` and `localStorage` for V2.0 compatibility.
- Draft state gets a small versioned storage abstraction. Use localStorage for synchronous UI draft restoration now.
- Add a minimal IndexedDB key-value adapter for future larger competitive snapshots/caches, but do not migrate existing small V1 data to IndexedDB yet.
- Corrupt/incompatible persisted data must fail closed and fall back to defaults, never blank the app.

## Modular loading
Use React lazy imports and Suspense at route boundaries:
- adventure page chunk
- collection page chunk
- saved page chunk
- competitive placeholder chunk

The root shell/router should not eagerly import the collection or future competitive modules.

## App shell
Create a reusable top-level shell with navigation links for Adventure, Collection, Competitive and Saved. Feature pages render within the shell. Individual feature pages no longer own global navigation state.

## URL and GitHub Pages constraint
Use `HashRouter` instead of `BrowserRouter`. GitHub Pages does not provide SPA rewrite rules for arbitrary deep URLs, while hash routes remain fully client-side and support Back/Forward/reload safely.

## Non-goals
- No competitive generation yet.
- No account/cloud sync.
- No migration of saved teams away from localStorage.
- No service worker/offline PWA in V2.0.
- No server database.

## Success criteria
1. Going Adventure -> Collection -> Saved creates real browser history.
2. Reloading Adventure restores the current config and generated team.
3. Reloading Collection restores configuration, results and locks.
4. Corrupt persisted drafts fall back to defaults.
5. Collection and competitive code are lazy-loaded instead of imported by the root bundle.
6. Existing 38-game tests and V1 generator behavior remain green.
